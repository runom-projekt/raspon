import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Passwort zurücksetzen" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return (
    <AuthCard
      title="Neues Passwort"
      subtitle="Legen Sie ein neues, nur für Raspon verwendetes Passwort fest."
      footer={
        <Link href="/anmelden" className="font-semibold text-accent-600 hover:underline">
          Zurück zur Anmeldung
        </Link>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
