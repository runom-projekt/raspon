import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  const session = await getSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.sub },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      isIdVerified: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-graphite-900">Kontoeinstellungen</h1>
      <div className="mt-6">
        <SettingsForm user={user} />
      </div>
    </div>
  );
}
