export type IntegrationState = "configured" | "unavailable";

export interface IntegrationReadiness {
  payments: IntegrationState;
  email: IntegrationState;
  sms: IntegrationState;
  privateStorage: IntegrationState;
  twoFactorSecurity: IntegrationState;
}

export function getIntegrationReadiness(
  env: Record<string, string | undefined> = process.env
): IntegrationReadiness {
  const smtpPort = Number(env.SMTP_PORT);
  const smtpConfigured = Boolean(
    env.SMTP_HOST &&
    !/[\r\n]/.test(env.SMTP_HOST) &&
    Number.isInteger(smtpPort) &&
    smtpPort > 0 &&
    smtpPort <= 65535 &&
    env.SMTP_USER &&
    env.SMTP_PASSWORD &&
    env.SMTP_FROM_EMAIL
  );
  return {
    payments:
      env.PAYMENT_GATEWAY_URL && env.PAYMENT_GATEWAY_SECRET
        ? "configured"
        : "unavailable",
    email:
      (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) ||
      smtpConfigured
        ? "configured"
        : "unavailable",
    sms: env.MESSAGEBIRD_API_KEY ? "configured" : "unavailable",
    privateStorage:
      env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_PRIVATE_BUCKET_NAME
        ? "configured"
        : "unavailable",
    twoFactorSecurity:
      (() => {
        if (!env.TWO_FACTOR_ENCRYPTION_KEY) return "unavailable";
        try { return Buffer.from(env.TWO_FACTOR_ENCRYPTION_KEY, "base64").length === 32 ? "configured" : "unavailable"; }
        catch { return "unavailable"; }
      })(),
  };
}

export function hasCriticalIntegrations(
  readiness: IntegrationReadiness
): boolean {
  return (
    readiness.payments === "configured" &&
    readiness.email === "configured" &&
    readiness.privateStorage === "configured" &&
    readiness.twoFactorSecurity === "configured"
  );
}
