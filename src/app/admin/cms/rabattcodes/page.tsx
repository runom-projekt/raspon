import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { NewDiscountCodeForm } from "@/components/admin/NewDiscountCodeForm";
import { ActionButton } from "@/components/admin/ActionButton";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Rabattcodes | CMS" };

export default async function AdminDiscountCodesPage() {
  const codes = await prisma.discountCode.findMany({ orderBy: { validFrom: "desc" } });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-graphite-900">Rabattcodes</h1>
      <NewDiscountCodeForm />

      <div className="mt-6 overflow-x-auto rounded-2xl border border-graphite-100 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-graphite-100 text-graphite-500">
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Rabatt</th>
              <th className="p-4 font-medium">Gültigkeit</th>
              <th className="p-4 font-medium">Nutzungen</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b border-graphite-50">
                <td className="p-4 font-mono font-semibold">{c.code}</td>
                <td className="p-4">{c.percentOff ? `${c.percentOff}%` : c.amountOff ? `${c.amountOff} €` : "—"}</td>
                <td className="p-4 text-graphite-600">
                  {formatDate(c.validFrom)} – {formatDate(c.validTo)}
                </td>
                <td className="p-4">
                  {c.usedCount}
                  {c.maxUses ? ` / ${c.maxUses}` : ""}
                </td>
                <td className="p-4">
                  <span className="rounded-full bg-graphite-100 px-2.5 py-1 text-xs font-semibold">
                    {c.active ? "Aktiv" : "Deaktiviert"}
                  </span>
                </td>
                <td className="p-4">
                  <ActionButton
                    endpoint={`/api/admin/discount-codes/${c.id}`}
                    body={{ active: !c.active }}
                    label={c.active ? "Deaktivieren" : "Aktivieren"}
                  />
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-graphite-500">
                  Keine Rabattcodes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
