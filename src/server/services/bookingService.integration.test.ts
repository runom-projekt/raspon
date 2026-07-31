import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { rateLimit } from "../../lib/rate-limit";
import { BookingConflictError, createBooking } from "./bookingService";
import { processNotificationBatch } from "./notificationDeliveryService";
import { appendAuditLog } from "./auditService";
import { expirePendingBooking } from "./bookingExpiryService";
import { cancelBookingByRenter } from "./bookingCancellationService";
import { accrueCompletedBookingPayouts } from "./payoutService";
import { BookingLifecycleError, transitionBookingLifecycle } from "./bookingLifecycleService";
import { processPaymentGatewayEvent } from "./paymentGatewayEventService";
import { createTotp, encryptTotpSecret, hashRecoveryCode } from "../../lib/totp";
import { verifyAndConsumeSecondFactor } from "./twoFactorService";
import { isSessionVersionValid } from "../../lib/sessionVersion";
import { createBookingReview, ReviewError } from "./reviewService";
import { getOrCreateBookingConversation, readConversation, sendConversationMessage } from "./conversationService";
import { activateOwnerAccount } from "./ownerOnboardingService";
import { moderateTrailer, TrailerModerationError } from "./trailerModerationService";
import { processStorageDeletionBatch } from "./storageDeletionService";
import { createTrailerReport, ReportWorkflowError, resolveReport } from "./reportService";
import { getOperationalQueueHealth } from "./operationalHealthService";
import { applyTechnicalDataRetention } from "./dataRetentionService";
import { enqueuePasswordReset, processPasswordResetEmailBatch } from "./passwordResetDeliveryService";

const prisma = new PrismaClient();

let ownerId: string;
let renterId: string;
let trailerId: string;

before(async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const owner = await prisma.user.create({
    data: {
      email: `owner-${suffix}@example.test`,
      passwordHash: "integration-test-only",
      firstName: "Integration",
      lastName: "Owner",
      role: "OWNER",
      status: "ACTIVE",
    },
  });
  ownerId = owner.id;

  const renter = await prisma.user.create({
    data: {
      email: `renter-${suffix}@example.test`,
      passwordHash: "integration-test-only",
      firstName: "Integration",
      lastName: "Renter",
      role: "CUSTOMER",
      status: "ACTIVE",
    },
  });
  renterId = renter.id;

  const trailer = await prisma.trailer.create({
    data: {
      ownerId,
      slug: `concurrency-${suffix}`,
      category: "CARGO",
      status: "PUBLISHED",
      title: "Concurrency test trailer",
      description: "Disposable integration-test fixture",
      pricePerHour: 5,
      pricePerDay: 35,
      depositAmount: 100,
      commissionPct: 15,
      city: "Berlin",
      country: "DE",
      latitude: 52.52,
      longitude: 13.405,
      publishedAt: new Date(),
    },
  });
  trailerId = trailer.id;
});

after(async () => {
  await prisma.$disconnect();
});

test("two concurrent requests cannot double-book the same trailer and dates", async () => {
  const startDate = new Date("2030-06-10T10:00:00.000Z");
  const endDate = new Date("2030-06-12T10:00:00.000Z");
  const attempt = () => createBooking({ trailerId, renterId, startDate, endDate });

  const results = await Promise.allSettled([attempt(), attempt()]);
  const fulfilled = results.filter(
    (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof createBooking>>> =>
      result.status === "fulfilled"
  );
  const rejected = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );

  assert.equal(fulfilled.length, 1, "exactly one booking request must succeed");
  assert.equal(rejected.length, 1, "exactly one booking request must be rejected");
  assert.ok(
    rejected[0]?.reason instanceof BookingConflictError,
    "the losing request must fail with BookingConflictError"
  );

  const [bookingCount, paymentCount] = await Promise.all([
    prisma.booking.count({ where: { trailerId, startDate, endDate } }),
    prisma.payment.count({
      where: { booking: { trailerId, startDate, endDate } },
    }),
  ]);

  assert.equal(bookingCount, 1);
  assert.equal(paymentCount, 1);
});

test("a payment webhook event can only be claimed once", async () => {
  const event = {
    provider: "REVOLUT" as const,
    eventType: "ORDER_COMPLETED",
    providerOrderId: "00000000-0000-4000-8000-000000000001",
    payloadHash: "a".repeat(64),
  };

  const claims = await Promise.all([
    prisma.paymentWebhookEvent.createMany({ data: [event], skipDuplicates: true }),
    prisma.paymentWebhookEvent.createMany({ data: [event], skipDuplicates: true }),
  ]);

  assert.deepEqual(
    claims.map((claim) => claim.count).sort(),
    [0, 1]
  );
  assert.equal(
    await prisma.paymentWebhookEvent.count({
      where: {
        provider: event.provider,
        eventType: event.eventType,
        providerOrderId: event.providerOrderId,
      },
    }),
    1
  );
});

test("shared rate limiter atomically admits only the configured number of requests", async () => {
  const key = `integration:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const limit = 5;
  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      rateLimit(key, { limit, windowMs: 60_000 })
    )
  );

  assert.equal(results.filter((result) => result.success).length, limit);
  assert.equal(results.filter((result) => !result.success).length, 5);

  const bucket = await prisma.rateLimitBucket.findUniqueOrThrow({
    where: { key },
  });
  assert.equal(bucket.count, limit + 1, "rejected requests remain safely clamped");
});

test("notification worker atomically delivers an in-app notification once", async () => {
  await prisma.notification.updateMany({
    where: { deliveryStatus: { in: ["PENDING", "RETRY"] } },
    data: { deliveryStatus: "SKIPPED" },
  });
  const notification = await prisma.notification.create({
    data: {
      userId: renterId,
      channel: "IN_APP",
      title: "Integration test",
      body: "Delivery queue",
    },
  });
  const now = new Date();
  const dependencies = {
    now: () => now,
    emailConfigured: () => false,
    smsConfigured: () => false,
    sendEmail: async () => {
      throw new Error("email must not be called");
    },
    sendSms: async () => {
      throw new Error("sms must not be called");
    },
  };

  const results = await Promise.all([
    processNotificationBatch(1, dependencies),
    processNotificationBatch(1, dependencies),
  ]);
  assert.equal(results.reduce((sum, result) => sum + result.sent, 0), 1);

  const delivered = await prisma.notification.findUniqueOrThrow({
    where: { id: notification.id },
  });
  assert.equal(delivered.deliveryStatus, "SENT");
  assert.equal(delivered.attempts, 1);
  assert.equal(delivered.deliveredAt?.toISOString(), now.toISOString());
});

test("audit log is written transactionally and cannot be changed or deleted", async () => {
  const requestId = crypto.randomUUID();
  const entry = await prisma.$transaction((tx) =>
    appendAuditLog(tx, {
      actor: {
        sub: renterId,
        email: "integration-auditor@example.test",
        role: "ADMIN",
      },
      requestId,
      action: "INTEGRATION_TEST",
      entityType: "Trailer",
      entityId: trailerId,
      changes: { status: { from: "PENDING_REVIEW", to: "PUBLISHED" } },
    })
  );

  assert.equal(entry.requestId, requestId);
  await assert.rejects(
    prisma.auditLog.update({
      where: { id: entry.id },
      data: { outcome: "ALTERED" },
    }),
    /AuditLog is append-only/
  );
  await assert.rejects(
    prisma.auditLog.delete({ where: { id: entry.id } }),
    /AuditLog is append-only/
  );
});

test("an expired unpaid booking is released exactly once and the dates become bookable", async () => {
  const startDate = new Date("2031-07-10T10:00:00.000Z");
  const endDate = new Date("2031-07-12T10:00:00.000Z");
  const code = `EXP-${Date.now()}-${Math.random().toString(36).slice(2)}`.toUpperCase();
  const discount = await prisma.discountCode.create({
    data: {
      code,
      percentOff: 10,
      validFrom: new Date("2020-01-01T00:00:00.000Z"),
      validTo: new Date("2040-01-01T00:00:00.000Z"),
      maxUses: 1,
    },
  });
  const booking = await createBooking({
    trailerId,
    renterId,
    startDate,
    endDate,
    discountCode: code,
  });
  assert.equal(
    (await prisma.discountCode.findUniqueOrThrow({ where: { id: discount.id } })).usedCount,
    1
  );
  const expiredAt = new Date("2020-01-01T00:00:00.000Z");
  await prisma.booking.update({
    where: { id: booking.id },
    data: { expiresAt: expiredAt },
  });

  const results = await Promise.all([
    expirePendingBooking(booking.id, new Date()),
    expirePendingBooking(booking.id, new Date()),
  ]);
  assert.deepEqual(results.sort(), [false, true]);

  const expired = await prisma.booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: { payment: true },
  });
  assert.equal(expired.status, "CANCELLED");
  assert.equal(expired.payment?.status, "FAILED");
  assert.equal(
    (await prisma.discountCode.findUniqueOrThrow({ where: { id: discount.id } })).usedCount,
    0
  );
  assert.equal(
    await prisma.auditLog.count({
      where: { entityId: booking.id, action: "BOOKING_PAYMENT_EXPIRED" },
    }),
    1
  );
  assert.equal(
    await prisma.notification.count({
      where: { body: { contains: booking.code } },
    }),
    4
  );

  const replacement = await createBooking({ trailerId, renterId, startDate, endDate });
  assert.equal(replacement.status, "PENDING");
});

test("an expired booking linked to a provider payment is never auto-cancelled", async () => {
  const booking = await createBooking({
    trailerId,
    renterId,
    startDate: new Date("2032-08-10T10:00:00.000Z"),
    endDate: new Date("2032-08-12T10:00:00.000Z"),
  });
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
      payment: {
        update: { providerPaymentId: "00000000-0000-4000-8000-000000000099" },
      },
    },
  });

  assert.equal(await expirePendingBooking(booking.id, new Date()), false);
  assert.equal(
    (await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).status,
    "PENDING"
  );
});

test("renter cancellation atomically restores an unpaid discount and releases the dates", async () => {
  const code = `CAN-${Date.now()}-${Math.random().toString(36).slice(2)}`.toUpperCase();
  const discount = await prisma.discountCode.create({ data: { code, percentOff: 10, validFrom: new Date("2020-01-01T00:00:00Z"), validTo: new Date("2040-01-01T00:00:00Z"), maxUses: 1 } });
  const startDate = new Date("2033-09-10T10:00:00Z");
  const endDate = new Date("2033-09-12T10:00:00Z");
  const booking = await createBooking({ trailerId, renterId, startDate, endDate, discountCode: code });
  const actor = { sub: renterId, email: "renter@example.test", role: "CUSTOMER" as const };
  await cancelBookingByRenter({ bookingId: booking.id, actor, requestId: crypto.randomUUID() });
  const cancelled = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id }, include: { payment: true } });
  assert.equal(cancelled.status, "CANCELLED");
  assert.equal(cancelled.payment?.status, "FAILED");
  assert.equal((await prisma.discountCode.findUniqueOrThrow({ where: { id: discount.id } })).usedCount, 0);
  assert.equal(await prisma.auditLog.count({ where: { entityId: booking.id, action: "BOOKING_CANCELLED_BY_RENTER" } }), 1);
  assert.equal((await createBooking({ trailerId, renterId, startDate, endDate })).status, "PENDING");
});

test("concurrent cancellation of a paid booking queues exactly one full refund", async () => {
  const booking = await createBooking({ trailerId, renterId, startDate: new Date("2034-10-10T10:00:00Z"), endDate: new Date("2034-10-12T10:00:00Z") });
  await prisma.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED", payment: { update: { status: "PAID", providerPaymentId: "00000000-0000-4000-8000-000000000777" } } } });
  const actor = { sub: renterId, email: "renter@example.test", role: "CUSTOMER" as const };
  const [first, second] = await Promise.all([
    cancelBookingByRenter({ bookingId: booking.id, actor, requestId: crypto.randomUUID() }),
    cancelBookingByRenter({ bookingId: booking.id, actor, requestId: crypto.randomUUID() }),
  ]);
  assert.equal(first?.id, second?.id);
  const reversals = await prisma.paymentReversal.findMany({ where: { bookingId: booking.id } });
  assert.equal(reversals.length, 1);
  assert.equal(reversals[0]?.type, "FULL_REFUND");
  assert.equal(reversals[0]?.status, "QUEUED");
  assert.equal((await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).status, "CANCELLED");
});

test("a paid booking cannot unlock earnings before its scheduled return", async () => {
  const startDate = new Date("2036-12-10T10:00:00Z");
  const endDate = new Date("2036-12-12T10:00:00Z");
  const booking = await createBooking({ trailerId, renterId, startDate, endDate });
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", payment: { update: { status: "PAID" } } },
  });
  const actor = { sub: ownerId, email: "owner@example.test", role: "OWNER" as const };
  await transitionBookingLifecycle({ bookingId: booking.id, targetStatus: "ACTIVE", actor, requestId: crypto.randomUUID(), now: startDate });

  await assert.rejects(
    transitionBookingLifecycle({ bookingId: booking.id, targetStatus: "COMPLETED", actor, requestId: crypto.randomUUID(), now: new Date(endDate.getTime() - 1) }),
    (error: unknown) => error instanceof BookingLifecycleError && error.code === "RETURN_TOO_EARLY"
  );
  await transitionBookingLifecycle({ bookingId: booking.id, targetStatus: "COMPLETED", actor, requestId: crypto.randomUUID(), now: endDate });

  assert.equal((await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).status, "COMPLETED");
  assert.equal(await prisma.auditLog.count({ where: { entityId: booking.id, action: "BOOKING_STATUS_CHANGED" } }), 2);
  assert.equal(await prisma.notification.count({ where: { body: { contains: booking.code } } }), 6);
});

test("a payment arriving after booking closure is atomically queued for full refund", async () => {
  const booking = await createBooking({
    trailerId,
    renterId,
    startDate: new Date("2037-01-10T10:00:00Z"),
    endDate: new Date("2037-01-12T10:00:00Z"),
  });
  const closed = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "DECLINED" },
    include: { payment: true },
  });
  assert.ok(closed.payment);

  const providerOrderId = crypto.randomUUID();
  const gatewayEvent = {
    eventId: `late-${crypto.randomUUID()}`,
    event: "PAYMENT_COMPLETED" as const,
    paymentId: closed.payment.id,
    providerOrderId,
    amountMinor: closed.payment.amount.mul(100).toDecimalPlaces(0).toNumber(),
    currency: closed.payment.currency,
  };
  const result = await processPaymentGatewayEvent({ event: gatewayEvent, payloadHash: "b".repeat(64), requestId: crypto.randomUUID() });
  assert.equal(result.confirmed, false);

  const [payment, reversal, storedEvent] = await Promise.all([
    prisma.payment.findUniqueOrThrow({ where: { id: closed.payment.id } }),
    prisma.paymentReversal.findUniqueOrThrow({ where: { bookingId: booking.id } }),
    prisma.paymentWebhookEvent.findFirstOrThrow({ where: { providerOrderId } }),
  ]);
  assert.equal(payment.status, "PAID");
  assert.equal(reversal.type, "FULL_REFUND");
  assert.equal(reversal.status, "QUEUED");
  assert.equal(storedEvent.outcome, "LATE_PAYMENT_REFUND_QUEUED");
  assert.equal(await prisma.auditLog.count({ where: { entityId: reversal.id, action: "LATE_PAYMENT_REFUND_QUEUED" } }), 1);
});

test("a TOTP step and a recovery code can each be consumed only once", async () => {
  const encryptionKey = Buffer.alloc(32, 9).toString("base64");
  process.env.TWO_FACTOR_ENCRYPTION_KEY = encryptionKey;
  const secret = "JBSWY3DPEHPK3PXP";
  const encrypted = encryptTotpSecret(secret, encryptionKey);
  await prisma.user.update({
    where: { id: ownerId },
    data: { twoFactorEnabled: true, twoFactorSecret: encrypted, twoFactorLastUsedStep: null },
  });
  const step = BigInt(Math.floor(Date.now() / 1000 / 30));
  const code = createTotp(secret, step);
  const attempts = await Promise.all([
    verifyAndConsumeSecondFactor(ownerId, encrypted, code),
    verifyAndConsumeSecondFactor(ownerId, encrypted, code),
  ]);
  assert.deepEqual(attempts.sort(), [false, true]);

  const recoveryCode = "ABCD1234-EFGH5678";
  await prisma.twoFactorRecoveryCode.create({
    data: { userId: ownerId, codeHash: hashRecoveryCode(ownerId, recoveryCode) },
  });
  assert.equal(await verifyAndConsumeSecondFactor(ownerId, encrypted, recoveryCode), true);
  assert.equal(await verifyAndConsumeSecondFactor(ownerId, encrypted, recoveryCode), false);
});

test("incrementing the account session version invalidates every older JWT version", async () => {
  const before = await prisma.user.findUniqueOrThrow({ where: { id: renterId }, select: { sessionVersion: true } });
  const afterReset = await prisma.user.update({
    where: { id: renterId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  assert.equal(isSessionVersionValid(before.sessionVersion, afterReset.sessionVersion), false);
  assert.equal(isSessionVersionValid(afterReset.sessionVersion, afterReset.sessionVersion), true);
});

test("concurrent paid-booking reviews keep the trailer rating aggregate consistent", async () => {
  const actor = { sub: renterId, email: "integration-renter@example.test", role: "CUSTOMER" as const };
  const bookings = await Promise.all([
    createBooking({
      trailerId,
      renterId,
      startDate: new Date("2038-01-10T10:00:00Z"),
      endDate: new Date("2038-01-12T10:00:00Z"),
    }),
    createBooking({
      trailerId,
      renterId,
      startDate: new Date("2038-02-10T10:00:00Z"),
      endDate: new Date("2038-02-12T10:00:00Z"),
    }),
  ]);
  await Promise.all(
    bookings.map((booking) =>
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: "COMPLETED", payment: { update: { status: "PAID" } } },
      })
    )
  );

  const reviews = await Promise.all([
    createBookingReview({ bookingId: bookings[0].id, rating: 2, actor, requestId: crypto.randomUUID() }),
    createBookingReview({ bookingId: bookings[1].id, rating: 4, actor, requestId: crypto.randomUUID() }),
  ]);
  const trailer = await prisma.trailer.findUniqueOrThrow({ where: { id: trailerId } });
  assert.equal(reviews.length, 2);
  assert.equal(trailer.reviewCount, 2);
  assert.equal(trailer.averageRating, 3);
  assert.equal(await prisma.auditLog.count({ where: { action: "REVIEW_CREATED", entityId: { in: reviews.map((review) => review.id) } } }), 2);
  assert.equal(await prisma.notification.count({ where: { userId: ownerId, title: "Neue Bewertung" } }), 2);

  await assert.rejects(
    createBookingReview({ bookingId: bookings[0].id, rating: 5, actor, requestId: crypto.randomUUID() }),
    (error) => error instanceof ReviewError && error.code === "ALREADY_REVIEWED"
  );
});

test("booking conversations are idempotent, audited and notify the recipient atomically", async () => {
  const booking = await createBooking({
    trailerId,
    renterId,
    startDate: new Date("2039-01-10T10:00:00Z"),
    endDate: new Date("2039-01-12T10:00:00Z"),
  });
  const renter = { sub: renterId, email: "integration-renter@example.test", role: "CUSTOMER" as const };
  const owner = { sub: ownerId, email: "integration-owner@example.test", role: "OWNER" as const };
  const attempts = await Promise.all([
    getOrCreateBookingConversation({ bookingId: booking.id, recipientId: ownerId, actor: renter, requestId: crypto.randomUUID() }),
    getOrCreateBookingConversation({ bookingId: booking.id, recipientId: ownerId, actor: renter, requestId: crypto.randomUUID() }),
  ]);
  assert.equal(attempts[0].id, attempts[1].id);
  assert.equal(await prisma.conversation.count({ where: { bookingId: booking.id } }), 1);
  assert.equal(await prisma.auditLog.count({ where: { action: "CONVERSATION_CREATED", entityId: attempts[0].id } }), 1);

  const message = await sendConversationMessage({ conversationId: attempts[0].id, body: "Test message", actor: renter, requestId: crypto.randomUUID() });
  assert.equal(await prisma.notification.count({ where: { userId: ownerId, title: "Neue Nachricht" } }), 1);
  assert.equal(await prisma.auditLog.count({ where: { action: "MESSAGE_SENT", entityId: message.id } }), 1);
  const messages = await readConversation(attempts[0].id, owner);
  assert.equal(messages.length, 1);
  const firstMessage = messages[0];
  assert.ok(firstMessage);
  assert.ok(firstMessage.readAt);
});

test("owner activation is idempotent and audited exactly once", async () => {
  const actor = { sub: renterId, email: "integration-renter@example.test", role: "CUSTOMER" as const };
  const activated = await Promise.all([
    activateOwnerAccount(actor, crypto.randomUUID()),
    activateOwnerAccount(actor, crypto.randomUUID()),
  ]);
  assert.equal(activated[0].role, "OWNER");
  assert.equal(activated[1].role, "OWNER");
  assert.equal(await prisma.auditLog.count({ where: { entityId: renterId, action: "OWNER_ACCOUNT_ACTIVATED" } }), 1);
  assert.equal(await prisma.notification.count({ where: { userId: renterId, title: "Vermieterkonto aktiviert" } }), 1);
  await prisma.user.update({ where: { id: renterId }, data: { role: "CUSTOMER" } });
});

test("trailer publication requires managed evidence and remains idempotent", async () => {
  process.env.R2_PUBLIC_URL = "https://media.example.test";
  const candidate = await prisma.trailer.create({
    data: {
      ownerId,
      slug: `moderation-${crypto.randomUUID()}`,
      category: "CARGO",
      status: "PENDING_REVIEW",
      title: "Moderation candidate",
      description: "Integration moderation fixture",
      pricePerHour: 5,
      pricePerDay: 35,
      depositAmount: 100,
      commissionPct: 15,
      city: "Berlin",
      country: "DE",
      latitude: 52.52,
      longitude: 13.405,
    },
  });
  const admin = { sub: ownerId, email: "integration-admin@example.test", role: "ADMIN" as const };
  await assert.rejects(
    moderateTrailer({ trailerId: candidate.id, targetStatus: "PUBLISHED", actor: admin, requestId: crypto.randomUUID() }),
    (error) => error instanceof TrailerModerationError && error.code === "NOT_READY"
  );
  await prisma.trailer.update({
    where: { id: candidate.id },
    data: {
      photos: { create: { url: "https://media.example.test/trailers/moderation.jpg", position: 0 } },
      documents: { create: { type: "REGISTRATION", url: `registration/${ownerId}/${crypto.randomUUID()}.jpg` } },
    },
  });
  const results = await Promise.all([
    moderateTrailer({ trailerId: candidate.id, targetStatus: "PUBLISHED", actor: admin, requestId: crypto.randomUUID() }),
    moderateTrailer({ trailerId: candidate.id, targetStatus: "PUBLISHED", actor: admin, requestId: crypto.randomUUID() }),
  ]);
  assert.equal(results[0].status, "PUBLISHED");
  assert.equal(results[1].status, "PUBLISHED");
  assert.equal(await prisma.auditLog.count({ where: { entityId: candidate.id, action: "TRAILER_STATUS_CHANGED" } }), 1);
  assert.equal(await prisma.notification.count({ where: { userId: ownerId, title: "Anzeigenstatus geändert", body: { contains: candidate.title } } }), 1);
});

test("storage deletion outbox removes an object exactly once under concurrent workers", async () => {
  const deletion = await prisma.storageObjectDeletion.create({ data: { publicUrl: `https://media.example.test/trailers/${crypto.randomUUID()}.jpg` } });
  let calls = 0;
  const remove = async () => { calls++; };
  await Promise.all([processStorageDeletionBatch(1, remove), processStorageDeletionBatch(1, remove)]);
  const stored = await prisma.storageObjectDeletion.findUniqueOrThrow({ where: { id: deletion.id } });
  assert.equal(calls, 1);
  assert.equal(stored.status, "COMPLETED");
  assert.equal(stored.attempts, 1);
  assert.ok(stored.completedAt);
});

test("trailer reports are deduplicated and resolved exactly once under concurrency", async () => {
  const candidate = await prisma.trailer.create({ data: { ownerId, slug: `report-${crypto.randomUUID()}`, category: "CARGO", status: "PUBLISHED", title: "Report workflow fixture", description: "Disposable report integration fixture", pricePerHour: 5, pricePerDay: 35, depositAmount: 100, commissionPct: 15, city: "Berlin", country: "DE", latitude: 52.52, longitude: 13.405, publishedAt: new Date() } });
  const reporter = { sub: renterId, email: "integration-renter@example.test", role: "CUSTOMER" as const };
  const admin = { sub: ownerId, email: "integration-admin@example.test", role: "ADMIN" as const };
  const attempts = await Promise.allSettled([
    createTrailerReport({ trailerId: candidate.id, reason: "UNSAFE", actor: reporter, requestId: crypto.randomUUID() }),
    createTrailerReport({ trailerId: candidate.id, reason: "UNSAFE", actor: reporter, requestId: crypto.randomUUID() }),
  ]);
  const fulfilled = attempts.filter((attempt): attempt is PromiseFulfilledResult<Awaited<ReturnType<typeof createTrailerReport>>> => attempt.status === "fulfilled");
  const rejected = attempts.filter((attempt): attempt is PromiseRejectedResult => attempt.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.ok(rejected[0]?.reason instanceof ReportWorkflowError);
  assert.equal(rejected[0]?.reason.code, "ALREADY_REPORTED");
  const report = fulfilled[0]?.value;
  assert.ok(report);
  assert.equal(await prisma.report.count({ where: { authorId: renterId, trailerId: candidate.id } }), 1);
  assert.equal(await prisma.auditLog.count({ where: { action: "REPORT_CREATED", entityId: report.id } }), 1);
  await Promise.all([
    resolveReport({ reportId: report.id, targetStatus: "RESOLVED", resolutionNote: "Confirmed safety issue", suspendTrailer: true, actor: admin, requestId: crypto.randomUUID() }),
    resolveReport({ reportId: report.id, targetStatus: "RESOLVED", resolutionNote: "Confirmed safety issue", suspendTrailer: true, actor: admin, requestId: crypto.randomUUID() }),
  ]);
  assert.equal((await prisma.trailer.findUniqueOrThrow({ where: { id: candidate.id } })).status, "SUSPENDED");
  assert.equal(await prisma.auditLog.count({ where: { action: "REPORT_STATUS_CHANGED", entityId: report.id } }), 1);
  assert.equal(await prisma.auditLog.count({ where: { action: "TRAILER_SUSPENDED_FROM_REPORT", entityId: candidate.id } }), 1);
  assert.equal(await prisma.notification.count({ where: { userId: renterId, title: "Meldung bearbeitet" } }), 1);
  assert.equal(await prisma.notification.count({ where: { userId: ownerId, title: "Anzeige gesperrt", body: { contains: candidate.title } } }), 1);
});

test("operational health detects terminal queue failures", async () => {
  const deletion = await prisma.storageObjectDeletion.create({
    data: { publicUrl: `https://media.example.test/trailers/failed-${crypto.randomUUID()}.jpg`, status: "FAILED", attempts: 8, lastError: "integration fixture" },
  });
  const health = await getOperationalQueueHealth();
  assert.equal(health.status, "degraded");
  assert.ok(health.queues.storageFailures >= 1);
  await prisma.storageObjectDeletion.delete({ where: { id: deletion.id } });
});

test("technical retention removes only records beyond their safety windows", async () => {
  const old = new Date("2020-01-01T00:00:00Z");
  const fresh = new Date("2040-01-01T00:00:00Z");
  const suffix = crypto.randomUUID();
  await Promise.all([
    prisma.rateLimitBucket.create({ data: { key: `expired:${suffix}`, count: 1, resetAt: old } }),
    prisma.rateLimitBucket.create({ data: { key: `fresh:${suffix}`, count: 1, resetAt: fresh } }),
    prisma.emailVerificationToken.create({ data: { userId: renterId, tokenHash: `email-${suffix}`, expiresAt: old } }),
    prisma.passwordResetToken.create({ data: { userId: renterId, tokenHash: `password-${suffix}`, expiresAt: old } }),
    prisma.refreshToken.create({ data: { userId: renterId, tokenHash: `refresh-${suffix}`, expiresAt: old } }),
    prisma.storageObjectDeletion.create({ data: { publicUrl: `https://media.example.test/retention-${suffix}.jpg`, status: "COMPLETED", completedAt: old } }),
  ]);
  const result = await applyTechnicalDataRetention(new Date("2030-01-01T00:00:00Z"));
  assert.ok(result.rateLimits >= 1);
  assert.ok(result.emailTokens >= 1);
  assert.ok(result.passwordTokens >= 1);
  assert.ok(result.refreshTokens >= 1);
  assert.ok(result.storageDeletions >= 1);
  assert.equal(await prisma.rateLimitBucket.count({ where: { key: `expired:${suffix}` } }), 0);
  assert.equal(await prisma.rateLimitBucket.count({ where: { key: `fresh:${suffix}` } }), 1);
  await prisma.rateLimitBucket.delete({ where: { key: `fresh:${suffix}` } });
});

test("completed paid bookings accrue exactly one owner payout under concurrent workers", async () => {
  await prisma.user.update({ where: { id: ownerId }, data: { isIdVerified: true, status: "ACTIVE" } });
  const booking = await createBooking({
    trailerId,
    renterId,
    startDate: new Date("2041-01-10T10:00:00Z"),
    endDate: new Date("2041-01-12T10:00:00Z"),
  });
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "COMPLETED", payment: { update: { status: "PAID" } } },
  });

  await Promise.all([accrueCompletedBookingPayouts(), accrueCompletedBookingPayouts()]);
  const payouts = await prisma.payout.findMany({ where: { bookingId: booking.id } });
  assert.equal(payouts.length, 1);
  assert.equal(Number(payouts[0]?.amount), Number(booking.subtotal) - Number(booking.commissionAmt));
  assert.equal(await prisma.auditLog.count({ where: { entityId: payouts[0]?.id, action: "PAYOUT_AUTOMATICALLY_ACCRUED" } }), 1);
  assert.equal(await prisma.notification.count({ where: { userId: ownerId, title: "Auszahlung vorgemerkt", body: { contains: booking.code } } }), 1);
});

test("password reset delivery remains queued without email configuration and is delivered exactly once", async () => {
  const raw = `reset-${crypto.randomUUID()}`;
  const queued = await enqueuePasswordReset(renterId, `hash-${crypto.randomUUID()}`, raw, new Date(Date.now() + 60_000));
  let sends = 0;
  const unavailable = await processPasswordResetEmailBatch(10, { now: () => new Date(), configured: () => false, send: async () => { sends++; } });
  assert.equal(unavailable.retried, 1);
  assert.equal(sends, 0);
  const retry = await prisma.passwordResetToken.update({ where: { id: queued.id }, data: { nextAttemptAt: new Date(0) } });
  assert.equal(retry.deliveryStatus, "RETRY");
  await Promise.all([
    processPasswordResetEmailBatch(10, { now: () => new Date(), configured: () => true, send: async (_to, _name, url) => { assert.ok(url.includes(encodeURIComponent(raw))); sends++; } }),
    processPasswordResetEmailBatch(10, { now: () => new Date(), configured: () => true, send: async () => { sends++; } }),
  ]);
  const delivered = await prisma.passwordResetToken.findUniqueOrThrow({ where: { id: queued.id } });
  assert.equal(sends, 1);
  assert.equal(delivered.deliveryStatus, "SENT");
  assert.equal(delivered.tokenCiphertext, null);
});
