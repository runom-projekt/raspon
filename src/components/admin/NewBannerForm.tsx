"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/ui/ImageUploadField";

export function NewBannerForm() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "", position: "home_top" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl) {
      toast.error("Bitte ein Bild hochladen");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Banner konnte nicht hinzugefügt werden");
        return;
      }
      toast.success("Banner hinzugefügt");
      setForm({ title: "", imageUrl: "", linkUrl: "", position: "home_top" });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-2xl border border-graphite-100 bg-white p-5">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-graphite-700">Titel</span>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input h-10 w-48 text-sm"
        />
      </label>
      <ImageUploadField
        folder="banners"
        label="Bild"
        value={form.imageUrl}
        onChange={(imageUrl) => setForm({ ...form, imageUrl })}
      />
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-graphite-700">Ziel-Link</span>
        <input
          type="url"
          value={form.linkUrl}
          onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
          className="input h-10 w-48 text-sm"
        />
      </label>
      <button type="submit" disabled={isSubmitting} className="btn-secondary h-10 px-5 text-sm">
        Banner hinzufügen
      </button>
    </form>
  );
}
