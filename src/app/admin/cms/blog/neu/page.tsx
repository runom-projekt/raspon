import type { Metadata } from "next";
import { BlogPostForm } from "@/components/admin/BlogPostForm";

export const metadata: Metadata = { title: "Neuer Artikel | CMS" };

export default function NewBlogPostPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-graphite-900">Neuer Artikel</h1>
      <BlogPostForm />
    </div>
  );
}
