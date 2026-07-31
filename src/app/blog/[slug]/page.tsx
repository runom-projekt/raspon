import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { SITE_URL } from "@/lib/constants";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return {};

  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    author: { "@type": "Organization", name: post.authorName },
    datePublished: post.publishedAt?.toISOString(),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="container-page max-w-3xl py-12">
        <Badge variant="accent">{post.category}</Badge>
        <h1 className="mt-4 font-display text-3xl font-bold text-graphite-900 sm:text-4xl">{post.title}</h1>
        <p className="mt-2 text-sm text-graphite-500">
          {post.authorName} · {post.publishedAt && formatDate(post.publishedAt)}
        </p>

        {post.coverImageUrl && (
          <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl bg-graphite-100">
            <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
          </div>
        )}

        <div className="prose mt-8 max-w-none whitespace-pre-line">{post.content}</div>
      </main>
      <Footer />
    </>
  );
}
