import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/prisma";
import { formatDate, truncate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description: "Ratgeber, Neuigkeiten, Aktuelles, Sicherheit und Vorschriften rund um die Anhängervermietung.",
};

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  ratgeber: "Ratgeber",
  neuigkeiten: "Neuigkeiten",
  aktuelles: "Aktuelles",
  sicherheit: "Sicherheit",
  vorschriften: "Vorschriften",
};

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <Header />
      <main className="container-page py-12">
        <h1 className="font-display text-3xl font-bold text-graphite-900 sm:text-4xl">Raspon Blog</h1>
        <p className="mt-2 max-w-xl text-graphite-600">
          Ratgeber, Neuigkeiten und Sicherheitsinformationen rund um die Anhängervermietung.
        </p>

        {posts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-graphite-200 py-20 text-center text-graphite-500">
            Bald erscheinen hier die ersten Artikel.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="card overflow-hidden">
                <div className="relative aspect-video bg-graphite-100">
                  {post.coverImageUrl && (
                    <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
                  )}
                </div>
                <div className="p-5">
                  <Badge variant="accent">{categoryLabels[post.category] ?? post.category}</Badge>
                  <h2 className="mt-3 font-semibold text-graphite-900">{post.title}</h2>
                  <p className="mt-2 text-sm text-graphite-600">{truncate(post.excerpt, 120)}</p>
                  <p className="mt-3 text-xs text-graphite-400">
                    {post.publishedAt && formatDate(post.publishedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
