import "server-only";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/server/services/auditService";

export class ConversationError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "FORBIDDEN" | "INVALID_RECIPIENT") { super(code); }
}

export async function getOrCreateBookingConversation({ bookingId, recipientId, actor, requestId }: { bookingId: string; recipientId: string; actor: SessionPayload; requestId: string | null }) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`conversation:${bookingId}`}))`;
    const booking = await tx.booking.findUnique({ where: { id: bookingId }, select: { renterId: true, trailer: { select: { ownerId: true } } } });
    if (!booking) throw new ConversationError("NOT_FOUND");
    const participants = [booking.renterId, booking.trailer.ownerId];
    if (!participants.includes(actor.sub)) throw new ConversationError("FORBIDDEN");
    const expectedRecipient = participants.find((id) => id !== actor.sub);
    if (!expectedRecipient || recipientId !== expectedRecipient) throw new ConversationError("INVALID_RECIPIENT");
    const existing = await tx.conversation.findUnique({ where: { bookingId } });
    if (existing) return existing;
    const conversation = await tx.conversation.create({ data: { bookingId, participantAId: actor.sub, participantBId: recipientId } });
    await appendAuditLog(tx, { actor, requestId, action: "CONVERSATION_CREATED", entityType: "Conversation", entityId: conversation.id, changes: { bookingId } });
    return conversation;
  });
}

export async function readConversation(conversationId: string, actor: SessionPayload) {
  return prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new ConversationError("NOT_FOUND");
    if (conversation.participantAId !== actor.sub && conversation.participantBId !== actor.sub) throw new ConversationError("FORBIDDEN");
    await tx.message.updateMany({ where: { conversationId, senderId: { not: actor.sub }, readAt: null }, data: { readAt: new Date() } });
    return tx.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" }, include: { sender: { select: { firstName: true, lastName: true, avatarUrl: true } } } });
  });
}

export async function sendConversationMessage({ conversationId, body, actor, requestId }: { conversationId: string; body: string; actor: SessionPayload; requestId: string | null }) {
  return prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new ConversationError("NOT_FOUND");
    if (conversation.participantAId !== actor.sub && conversation.participantBId !== actor.sub) throw new ConversationError("FORBIDDEN");
    const recipientId = conversation.participantAId === actor.sub ? conversation.participantBId : conversation.participantAId;
    const message = await tx.message.create({ data: { conversationId, senderId: actor.sub, body } });
    await tx.notification.create({ data: { userId: recipientId, channel: "IN_APP", title: "Neue Nachricht", body: "Sie haben eine neue Nachricht erhalten." } });
    await appendAuditLog(tx, { actor, requestId, action: "MESSAGE_SENT", entityType: "Message", entityId: message.id, changes: { conversationId, recipientId } });
    return message;
  });
}
