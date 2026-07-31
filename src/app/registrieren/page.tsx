import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { safeReturnTo } from "@/lib/authRedirect";

export const metadata: Metadata = { title: "Konto erstellen" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[]; role?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const initialRole = params.role === "OWNER" ? "OWNER" : "CUSTOMER";
  const loginHref = `/anmelden?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <AuthCard
      title="Werden Sie Teil von Raspon"
      subtitle="Mieten Sie Anhänger oder verdienen Sie Geld, indem Sie Ihren eigenen vermieten."
      footer={
        <>
          Bereits ein Konto?{" "}
          <Link href={loginHref} className="font-semibold text-accent-600 hover:underline">
            Anmelden
          </Link>
        </>
      }
    >
      <RegisterForm returnTo={returnTo} initialRole={initialRole} />
    </AuthCard>
  );
}
