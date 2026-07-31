import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BecomeOwnerButton } from "@/components/owner/BecomeOwnerButton";
import { getSession } from "@/lib/auth";

export default async function ActivateOwnerPage() {
  const session = await getSession();
  if (!session) redirect("/anmelden?returnTo=%2Fvermieterkonto-aktivieren");
  if (session.role === "OWNER" || session.role === "ADMIN") redirect("/dashboard/anhaenger/neu");
  return <><Header /><main className="container-page max-w-xl py-16 text-center"><h1 className="font-display text-3xl font-bold text-graphite-900">Vermieterkonto aktivieren</h1><p className="mt-4 text-graphite-600">Aktivieren Sie kostenlos die Vermieterfunktionen. Danach können Sie Ihren Anhänger einstellen, Buchungen verwalten und Auszahlungen anfordern.</p><div className="mt-8 flex justify-center"><BecomeOwnerButton /></div></main><Footer /></>;
}
