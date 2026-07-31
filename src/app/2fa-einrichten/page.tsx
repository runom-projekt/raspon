import type { Metadata } from "next";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";

export const metadata: Metadata = { title: "Zwei-Faktor-Authentifizierung einrichten" };

export default function TwoFactorSetupPage() {
  return (
    <main className="container-page flex min-h-screen items-center justify-center py-12">
      <TwoFactorSetup />
    </main>
  );
}
