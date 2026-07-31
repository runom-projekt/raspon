import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { StatusToggleButton } from "@/components/admin/StatusToggleButton";
import { formatCurrency } from "@/lib/utils";
import { TRAILER_CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = { title: "Anhänger | Admin-Panel" };

export default async function AdminTrailersPage() {
  const trailers = await prisma.trailer.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      owner: { select: { firstName: true, lastName: true } },
      documents: { where: { type: "REGISTRATION" }, take: 1 },
      photos: { select: { id: true }, take: 1 },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-900">Anhänger-Moderation</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-graphite-100 bg-white">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead>
            <tr className="border-b border-graphite-100 text-graphite-500">
              <th className="p-4 font-medium">Titel</th>
              <th className="p-4 font-medium">Vermieter</th>
              <th className="p-4 font-medium">Kategorie</th>
              <th className="p-4 font-medium">Preis/Tag</th>
              <th className="p-4 font-medium">Kfz-Brief</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Prüfung</th>
              <th className="p-4 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {trailers.map((t) => (
              <tr key={t.id} className="border-b border-graphite-50">
                <td className="p-4 font-medium text-graphite-900">{t.title}</td>
                <td className="p-4">{t.owner.firstName} {t.owner.lastName}</td>
                <td className="p-4 text-graphite-600">{TRAILER_CATEGORIES[t.category].label}</td>
                <td className="p-4">{formatCurrency(t.pricePerDay.toString(), t.currency)}</td>
                <td className="p-4">
                  {t.documents[0] ? (
                    <a
                      href={`/api/admin/trailers/${t.id}/registration-document`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-accent-600 underline"
                    >
                      Ansehen
                    </a>
                  ) : (
                    <span className="text-graphite-400">Fehlt</span>
                  )}
                </td>
                <td className="p-4">
                  <span className="rounded-full bg-graphite-100 px-2.5 py-1 text-xs font-semibold">{t.status}</span>
                </td>
                <td className="p-4 text-xs font-semibold">
                  {t.photos.length > 0 && t.documents[0]?.url.startsWith(`registration/${t.ownerId}/`) ? <span className="text-emerald-700">Bereit</span> : <span className="text-amber-700">Unvollständig</span>}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {t.status !== "PUBLISHED" && (
                      <StatusToggleButton
                        endpoint={`/api/admin/trailers/${t.id}/status`}
                        targetStatus="PUBLISHED"
                        label="Genehmigen"
                      />
                    )}
                    {t.status !== "SUSPENDED" && (
                      <StatusToggleButton
                        endpoint={`/api/admin/trailers/${t.id}/status`}
                        targetStatus="SUSPENDED"
                        label="Sperren"
                        variant="danger"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
