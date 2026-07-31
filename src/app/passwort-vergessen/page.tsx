import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Passwort vergessen?"
      subtitle="Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen sicheren Link zum Zurücksetzen."
      footer={
        <Link href="/anmelden" className="font-semibold text-accent-600 hover:underline">
          Zurück zur Anmeldung
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
