"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/ui/ImageUploadField";

const categories = [
  { value: "ratgeber", label: "Ratgeber" },
  { value: "neuigkeiten", label: "Neuigkeiten" },
  { value: "aktuelles", label: "Aktuelles" },
  { value: "sicherheit", label: "Sicherheit" },
  { value: "vorschriften", label: "Vorschriften" },
];

export function BlogPostForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "ratgeber",
    coverImageUrl: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitWithStatus(status: "DRAFT" | "PUBLISHED") {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, coverImageUrl: form.coverImageUrl || undefined, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Artikel konnte nicht gespeichert werden");
        return;
      }
      toast.success("Artikel gespeichert");
      router.push("/admin/cms/blog");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="space-y-4 rounded-2xl border border-graphite-100 bg-white p-6"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-graphite-700">Titel</span>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-graphite-700">Kurzbeschreibung</span>
        <textarea
          required
          rows={2}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="input"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-graphite-700">Inhalt</span>
        <textarea
          required
          rows={10}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="input"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-graphite-700">Kategorie</span>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="input appearance-none"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <ImageUploadField
        folder="blog"
        label="Titelbild"
        value={form.coverImageUrl}
        onChange={(coverImageUrl) => setForm({ ...form, coverImageUrl })}
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => submitWithStatus("DRAFT")}
          disabled={isSubmitting}
          className="btn-outline h-11 px-6"
        >
          Als Entwurf speichern
        </button>
        <button
          type="button"
          onClick={() => submitWithStatus("PUBLISHED")}
          disabled={isSubmitting}
          className="btn-primary h-11 px-6"
        >
          Veröffentlichen
        </button>
      </div>
    </form>
  );
}
