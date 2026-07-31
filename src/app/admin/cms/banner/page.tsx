import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ActionButton } from "@/components/admin/ActionButton";
import { NewBannerForm } from "@/components/admin/NewBannerForm";

export const metadata: Metadata = { title: "Banner | CMS" };

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-graphite-900">Banner</h1>
      <NewBannerForm />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-2xl border border-graphite-100 bg-white">
            <div className="relative aspect-[16/6] bg-graphite-100">
              <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-graphite-900">{b.title}</p>
                <p className="text-xs text-graphite-500">{b.active ? "Aktiv" : "Deaktiviert"}</p>
              </div>
              <div className="flex gap-2">
                <ActionButton
                  endpoint={`/api/admin/banners/${b.id}`}
                  body={{ active: !b.active }}
                  label={b.active ? "Deaktivieren" : "Aktivieren"}
                />
                <ActionButton
                  endpoint={`/api/admin/banners/${b.id}`}
                  method="DELETE"
                  label="Löschen"
                  variant="danger"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
