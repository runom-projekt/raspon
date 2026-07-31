import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeReturnTo } from "@/lib/authRedirect";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const returnTo = safeReturnTo((await searchParams).returnTo);
  const registerHref = `/registrieren?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <AuthCard
      title="Willkommen zurück"
      subtitle="Melden Sie sich an, um Buchungen und Anhänger zu verwalten."
      footer={
        <>
          Noch kein Konto?{" "}
          <Link href={registerHref} className="font-semibold text-accent-600 hover:underline">
            Registrieren
          </Link>
        </>
      }
    >
      <LoginForm returnTo={returnTo} />
    </AuthCard>
  );
}
