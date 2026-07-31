import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Mail, MessageSquare, Bell, Smartphone } from "lucide-react";

export const metadata: Metadata = { title: "Benachrichtigungen | Admin-Panel" };

const channelIcons = { EMAIL: Mail, SMS: MessageSquare, PUSH: Smartphone, IN_APP: Bell };

export default async function AdminNotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-900">Benachrichtigungen</h1>
      <p className="mt-1 text-sm text-graphite-500">
        Verlauf der an Nutzer gesendeten Benachrichtigungen (E-Mail, SMS, Push, In-App).
      </p>

      <div className="mt-6 space-y-3">
        {notifications.map((n) => {
          const Icon = channelIcons[n.channel];
          return (
            <div key={n.id} className="flex items-start gap-4 rounded-2xl border border-graphite-100 bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                <Icon size={18} />
              </span>
              <div>
                <p className="font-semibold text-graphite-900">{n.title}</p>
                <p className="text-sm text-graphite-600">{n.body}</p>
                <p className="mt-1 text-xs text-graphite-400">
                  An: {n.user.firstName} {n.user.lastName} · {formatDate(n.createdAt)}
                  {" · "}{n.deliveryStatus} · Versuche: {n.attempts}
                </p>
              </div>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <p className="rounded-2xl border border-dashed border-graphite-200 bg-white p-8 text-center text-graphite-500">
            Keine Benachrichtigungen.
          </p>
        )}
      </div>
    </div>
  );
}
