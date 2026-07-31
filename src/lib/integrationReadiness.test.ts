import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getIntegrationReadiness,
  hasCriticalIntegrations,
} from "./integrationReadiness";

describe("integration readiness", () => {
  test("reports missing integrations without exposing configuration values", () => {
    const readiness = getIntegrationReadiness({});
    assert.deepEqual(readiness, {
      payments: "unavailable",
      email: "unavailable",
      sms: "unavailable",
      privateStorage: "unavailable",
      twoFactorSecurity: "unavailable",
    });
    assert.equal(hasCriticalIntegrations(readiness), false);
  });

  test("requires both payment credentials and all private storage credentials", () => {
    const readiness = getIntegrationReadiness({
      PAYMENT_GATEWAY_URL: "https://hms-runo.de/raspon/pay/",
      RESEND_API_KEY: "secret",
      RESEND_FROM_EMAIL: "noreply@example.test",
      R2_ACCOUNT_ID: "account",
      R2_ACCESS_KEY_ID: "key",
      R2_SECRET_ACCESS_KEY: "secret",
      R2_PRIVATE_BUCKET_NAME: "private",
      TWO_FACTOR_ENCRYPTION_KEY: Buffer.alloc(32).toString("base64"),
    });
    assert.equal(readiness.payments, "unavailable");
    assert.equal(readiness.privateStorage, "configured");
    assert.equal(hasCriticalIntegrations(readiness), false);
  });

  test("marks the portal ready when critical integrations are complete", () => {
    const readiness = getIntegrationReadiness({
      PAYMENT_GATEWAY_URL: "https://hms-runo.de/raspon/pay/",
      PAYMENT_GATEWAY_SECRET: "s".repeat(32),
      RESEND_API_KEY: "secret",
      RESEND_FROM_EMAIL: "noreply@example.test",
      R2_ACCOUNT_ID: "account",
      R2_ACCESS_KEY_ID: "key",
      R2_SECRET_ACCESS_KEY: "secret",
      R2_PRIVATE_BUCKET_NAME: "private",
      TWO_FACTOR_ENCRYPTION_KEY: Buffer.alloc(32).toString("base64"),
    });
    assert.equal(hasCriticalIntegrations(readiness), true);
    assert.equal(readiness.sms, "unavailable");
  });

  test("accepts a complete SMTP configuration as the email provider", () => {
    const readiness = getIntegrationReadiness({
      SMTP_HOST: "smtp.example.test",
      SMTP_PORT: "465",
      SMTP_USER: "noreply@example.test",
      SMTP_PASSWORD: "secret",
      SMTP_FROM_EMAIL: "noreply@example.test",
    });
    assert.equal(readiness.email, "configured");
  });

  test("rejects incomplete SMTP configuration", () => {
    assert.equal(getIntegrationReadiness({ SMTP_HOST: "smtp.example.test", SMTP_PORT: "465" }).email, "unavailable");
  });
});
