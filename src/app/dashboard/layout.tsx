import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { VerificationBanner } from "@/components/dashboard/VerificationBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/anmelden");
  if (session.role !== "OWNER" && session.role !== "ADMIN") redirect("/");

  let showVerificationBanner = false;
  if (isEmailConfigured()) {
    const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { emailVerified: true } });
    showVerificationBanner = !user?.emailVerified;
  }

  return (
    <div className="flex min-h-screen flex-col bg-graphite-50 md:flex-row">
      <DashboardSidebar />
      <main className="flex-1 overflow-x-hidden p-6 lg:p-10">
        {showVerificationBanner && <VerificationBanner />}
        {children}
      </main>
    </div>
  );
}
