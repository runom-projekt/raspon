import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusToggleButton } from "@/components/admin/StatusToggleButton";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Blog | CMS" };

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-graphite-900">Blog</h1>
        <Button href="/admin/cms/blog/neu" size="sm">Neuer Artikel</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-graphite-100 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-graphite-100 text-graphite-500">
              <th className="p-4 font-medium">Titel</th>
              <th className="p-4 font-medium">Kategorie</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Erstellt</th>
              <th className="p-4 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-graphite-50">
                <td className="p-4 font-medium text-graphite-900">{p.title}</td>
                <td className="p-4 text-graphite-600">{p.category}</td>
                <td className="p-4">
                  <span className="rounded-full bg-graphite-100 px-2.5 py-1 text-xs font-semibold">{p.status}</span>
                </td>
                <td className="p-4 text-graphite-500">{formatDate(p.createdAt)}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {p.status === "DRAFT" ? (
                      <StatusToggleButton
                        endpoint={`/api/admin/blog/${p.id}`}
                        targetStatus="PUBLISHED"
                        label="Veröffentlichen"
                      />
                    ) : (
                      <StatusToggleButton
                        endpoint={`/api/admin/blog/${p.id}`}
                        targetStatus="DRAFT"
                        label="Zurückziehen"
                      />
                    )}
                    <Link href={`/blog/${p.slug}`} className="text-xs font-semibold text-accent-600 underline">
                      Vorschau
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-graphite-500">
                  Keine Artikel.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
