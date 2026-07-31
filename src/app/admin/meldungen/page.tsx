import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ReportActions } from "@/components/admin/ReportActions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Meldungen | Admin-Panel" };

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { firstName: true, lastName: true } },
      trailer: { select: { title: true, slug: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-900">Meldungen</h1>

      <div className="mt-6 space-y-4">
        {reports.length === 0 && (
          <p className="rounded-2xl border border-dashed border-graphite-200 bg-white p-8 text-center text-graphite-500">
            Keine Meldungen.
          </p>
        )}
        {reports.map((r) => (
          <div key={r.id} className="rounded-2xl border border-graphite-100 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-graphite-900">{r.reason}</p>
                <p className="mt-1 text-sm text-graphite-500">
                  Gemeldet von {r.author.firstName} {r.author.lastName} · {formatDate(r.createdAt)}
                  {r.trailer && ` · betrifft: ${r.trailer.title}`}
                </p>
                {r.details && <p className="mt-2 text-sm text-graphite-700">{r.details}</p>}
              </div>
              <span className="shrink-0 rounded-full bg-graphite-100 px-2.5 py-1 text-xs font-semibold">
                {r.status}
              </span>
            </div>
            {r.resolutionNote && <p className="mt-3 rounded-lg bg-graphite-50 p-3 text-sm text-graphite-700">Entscheidung: {r.resolutionNote}</p>}
            {(r.status === "OPEN" || r.status === "IN_REVIEW") && <ReportActions reportId={r.id} hasTrailer={Boolean(r.trailer)} />}
          </div>
        ))}
      </div>
    </div>
  );
}
