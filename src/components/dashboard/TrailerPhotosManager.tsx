"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/components/ui/ImageUploadField";

interface Photo {
  id: string;
  url: string;
}

interface TrailerPhotosManagerProps {
  trailerId: string;
  initialPhotos: Photo[];
  maxFiles?: number;
}

export function TrailerPhotosManager({ trailerId, initialPhotos, maxFiles = 10 }: TrailerPhotosManagerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initialPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = maxFiles - photos.length;
    if (remaining <= 0) {
      toast.error(`Maximal ${maxFiles} Fotos möglich`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setIsUploading(true);
    try {
      for (const file of selected) {
        try {
          const url = await uploadFile(file, "trailers");
          const res = await fetch(`/api/trailers/${trailerId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          if (!res.ok) throw new Error("Foto konnte nicht gespeichert werden");
          const { photo } = await res.json();
          setPhotos((prev) => [...prev, { id: photo.id, url: photo.url }]);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `${file.name}: Upload fehlgeschlagen`);
        }
      }
      router.refresh();
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removePhoto(photoId: string) {
    setBusyId(photoId);
    try {
      const res = await fetch(`/api/trailers/${trailerId}/photos/${photoId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Foto konnte nicht gelöscht werden");
        return;
      }
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function persistOrder(next: Photo[]) {
    setPhotos(next);
    const res = await fetch(`/api/trailers/${trailerId}/photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((p) => p.id) }),
    });
    if (!res.ok) toast.error("Reihenfolge konnte nicht gespeichert werden");
    router.refresh();
  }

  function moveAt(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target]!, next[index]!];
    persistOrder(next);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-wrap gap-3">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative h-28 w-28 overflow-hidden rounded-lg border border-graphite-200">
            <Image src={photo.url} alt="" fill sizes="112px" className="object-cover" />
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded bg-graphite-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Titelbild
              </span>
            )}
            <button
              type="button"
              disabled={busyId === photo.id}
              onClick={() => removePhoto(photo.id)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 disabled:opacity-50"
            >
              {busyId === photo.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </button>
            <div className="absolute bottom-1 left-1 flex gap-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveAt(index, -1)}
                className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80 disabled:opacity-30"
              >
                <ArrowLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={index === photos.length - 1}
                onClick={() => moveAt(index, 1)}
                className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80 disabled:opacity-30"
              >
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {photos.length < maxFiles && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-graphite-300 text-graphite-500 hover:border-graphite-400 hover:text-graphite-700",
              isUploading && "pointer-events-none opacity-60"
            )}
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span className="text-xs">Foto hinzufügen</span>
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-graphite-400">
        Erstes Foto wird als Titelbild verwendet. JPG, PNG oder WebP, max. 8 MB pro Datei.
      </p>
    </div>
  );
}
