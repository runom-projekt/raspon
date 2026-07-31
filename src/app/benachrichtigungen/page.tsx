import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/anmelden?returnTo=%2Fbenachrichtigungen");
  const notifications = await prisma.notification.findMany({ where: { userId: session.sub, channel: "IN_APP" }, orderBy: { createdAt: "desc" }, take: 50 });
  return <><Header /><main className="container-page max-w-3xl py-10"><h1 className="font-display text-2xl font-bold text-graphite-900">Benachrichtigungen</h1><div className="mt-6"><NotificationCenter initialItems={notifications} /></div></main><Footer /></>;
}
