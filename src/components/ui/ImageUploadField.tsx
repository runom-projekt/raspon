"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const UPLOAD_TIMEOUT_MS = 30000;

function isHeicFile(file: File): boolean {
  return file.type === "image/heic" || file.type === "image/heif" || /\.hei[cf]$/i.test(file.name);
}

// iPhones speichern Kamerafotos standardmäßig als HEIC, das der Server nicht
// annimmt (kein zuverlässiges Rendering in anderen Browsern) — hier serverseitig
// akzeptables JPEG erzeugen, statt den Nutzer die Kamera umstellen zu lassen.
async function convertHeicToJpeg(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas wird nicht unterstützt");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Konvertierung fehlgeschlagen");
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}

async function uploadFile(file: File, folder: "trailers" | "banners" | "blog" | "identity" | "registration"): Promise<string> {
  let uploadable = file;
  if (isHeicFile(file)) {
    try {
      uploadable = await convertHeicToJpeg(file);
    } catch {
      throw new Error(
        `${file.name}: HEIC-Fotos konnten nicht konvertiert werden. Bitte in den Kameraeinstellungen "Am kompatibelsten" (JPEG) wählen oder das Foto als JPG exportieren.`
      );
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const presignRes = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder, contentType: uploadable.type, fileSize: uploadable.size }),
      signal: controller.signal,
    });
    if (!presignRes.ok) {
      const data = await presignRes.json().catch(() => null);
      throw new Error(data?.error ?? "Upload-URL konnte nicht erstellt werden");
    }
    const { uploadUrl, fileReference } = await presignRes.json();

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": uploadable.type },
      body: uploadable,
      signal: controller.signal,
    });
    if (!putRes.ok) {
      throw new Error(`Datei konnte nicht hochgeladen werden (Fehler ${putRes.status})`);
    }

    return fileReference as string;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`${file.name}: Zeitüberschreitung beim Hochladen`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

interface ImageUploadFieldProps {
  folder: "trailers" | "banners" | "blog" | "identity" | "registration";
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUploadField({ folder, value, onChange, label, className }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setIsUploading(true);
    try {
      const publicUrl = await uploadFile(file, folder);
      onChange(publicUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      {label && <span className="mb-1.5 block text-xs font-medium text-graphite-700">{label}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value && folder !== "identity" ? (
        <div className="relative h-32 w-48 overflow-hidden rounded-lg border border-graphite-200">
          <Image src={value} alt="" fill sizes="192px" className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : value ? (
        <div className="flex h-32 w-48 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-center text-xs font-medium text-emerald-700">
          Dokument sicher hochgeladen
        </div>
      ) : (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-32 w-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-graphite-300 text-graphite-500 hover:border-graphite-400 hover:text-graphite-700",
            isUploading && "pointer-events-none opacity-60"
          )}
        >
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-xs">{isUploading ? "Wird hochgeladen…" : "Bild hochladen"}</span>
        </button>
      )}
    </div>
  );
}

export { uploadFile };
