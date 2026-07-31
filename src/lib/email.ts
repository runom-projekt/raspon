import "server-only";
import { Resend } from "resend";
import nodemailer from "nodemailer";

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function smtpPort(): number | null {
  const port = Number(process.env.SMTP_PORT);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
}

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    !/[\r\n]/.test(process.env.SMTP_HOST) &&
    smtpPort() &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM_EMAIL
  );
}

export function isEmailConfigured(): boolean {
  return isResendConfigured() || isSmtpConfigured();
}

function getClient(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendEmail({ to, subject, html, idempotencyKey }: { to: string; subject: string; html: string; idempotencyKey?: string }) {
  if (isResendConfigured()) {
    const { error } = await getClient().emails.send(
      { from: `Raspon <${process.env.RESEND_FROM_EMAIL}>`, to, subject, html },
      idempotencyKey ? { idempotencyKey } : undefined
    );
    if (error) throw new Error(`E-Mail konnte nicht gesendet werden: ${error.message}`);
    return;
  }
  if (!isSmtpConfigured()) throw new Error("Email provider configuration unavailable");
  const port = smtpPort()!;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    requireTLS: port !== 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    tls: { minVersion: "TLSv1.2" },
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  await transport.sendMail({
    from: `Raspon <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html,
    ...(idempotencyKey ? { messageId: `<${idempotencyKey.replaceAll("/", ".")}@raspon.de>` } : {}),
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendVerificationEmail(to: string, firstName: string, verifyUrl: string): Promise<void> {
  const safeFirstName = escapeHtml(firstName);
  const safeVerifyUrl = escapeHtml(verifyUrl);
  await sendEmail({
    to,
    subject: "Bestätigen Sie Ihre E-Mail-Adresse",
    html: `
      <p>Hallo ${safeFirstName},</p>
      <p>willkommen bei Raspon! Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren:</p>
      <p><a href="${safeVerifyUrl}">${safeVerifyUrl}</a></p>
      <p>Der Link ist 24 Stunden gültig. Falls Sie dieses Konto nicht erstellt haben, können Sie diese E-Mail ignorieren.</p>
      <p>Ihr Raspon-Team</p>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string
): Promise<void> {
  const safeFirstName = escapeHtml(firstName);
  const safeResetUrl = escapeHtml(resetUrl);
  await sendEmail({
    to,
    subject: "Raspon-Passwort zurücksetzen",
    html: `
      <p>Hallo ${safeFirstName},</p>
      <p>Über den folgenden Link können Sie ein neues Passwort für Ihr Raspon-Konto festlegen:</p>
      <p><a href="${safeResetUrl}">Passwort zurücksetzen</a></p>
      <p>Der Link ist eine Stunde gültig und kann nur einmal verwendet werden.</p>
      <p>Falls Sie diese Änderung nicht angefordert haben, ignorieren Sie diese E-Mail.</p>
      <p>Ihr Raspon-Team</p>
    `,
  });
}

export async function sendQueuedEmail({
  id,
  to,
  subject,
  body,
}: {
  id: string;
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  await sendEmail({
    to,
    subject,
    html: `<p>${escapeHtml(body).replaceAll("\n", "<br>")}</p>`,
    idempotencyKey: `notification/${id}`,
  });
}
