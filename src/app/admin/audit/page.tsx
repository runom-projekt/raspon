import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit-Log | Admin-Panel" };

export default async function AdminAuditPage() {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-900">Audit-Log</h1>
      <p className="mt-1 text-sm text-graphite-500">
        Unveränderbarer Verlauf administrativer Änderungen.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-graphite-100 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-graphite-100 bg-graphite-50 text-graphite-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Zeit</th>
              <th className="px-4 py-3 font-semibold">Administrator</th>
              <th className="px-4 py-3 font-semibold">Aktion</th>
              <th className="px-4 py-3 font-semibold">Objekt</th>
              <th className="px-4 py-3 font-semibold">Änderung</th>
              <th className="px-4 py-3 font-semibold">Request ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite-100">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(entry.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className="block">{entry.actorEmail ?? "—"}</span>
                  <span className="font-mono text-xs text-graphite-400">{entry.actorId}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium">{entry.action}</td>
                <td className="px-4 py-3">
                  {entry.entityType}
                  <span className="ml-1 font-mono text-xs text-graphite-400">
                    {entry.entityId}
                  </span>
                </td>
                <td className="max-w-sm px-4 py-3 font-mono text-xs">
                  {entry.changes ? JSON.stringify(entry.changes) : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-graphite-500">
                  {entry.requestId ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="p-8 text-center text-graphite-500">Keine Audit-Einträge.</p>
        )}
      </div>
    </div>
  );
}
