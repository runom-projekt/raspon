"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadFile } from "./ImageUploadField";

interface MultiImageUploaderProps {
  folder: "trailers" | "banners" | "blog";
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function MultiImageUploader({ folder, value, onChange, maxFiles = 10 }: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      toast.error(`Maximal ${maxFiles} Fotos möglich`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setIsUploading(true);
    const uploaded = [...value];
    const CONCURRENCY = 3;
    let nextIndex = 0;

    async function worker() {
      while (nextIndex < selected.length) {
        const file = selected[nextIndex++]!;
        try {
          const url = await uploadFile(file, folder);
          uploaded.push(url);
          onChange([...uploaded]);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `${file.name}: Upload fehlgeschlagen`);
        }
      }
    }

    try {
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, worker));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function moveAt(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
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
        {value.map((url, index) => (
          <div key={url} className="relative h-28 w-28 overflow-hidden rounded-lg border border-graphite-200">
            <Image src={url} alt="" fill sizes="112px" className="object-cover" />
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded bg-graphite-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Titelbild
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            >
              <X className="h-3 w-3" />
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
                disabled={index === value.length - 1}
                onClick={() => moveAt(index, 1)}
                className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80 disabled:opacity-30"
              >
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {value.length < maxFiles && (
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
