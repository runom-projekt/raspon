import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ALLOWED_IMAGE_TYPES,
  buildImageKey,
  createPresignedUploadUrl,
  isPrivateStorageConfigured,
  isStorageConfigured,
  publicUrlForKey,
} from "@/lib/storage";
import { z } from "zod";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

const schema = z.object({
  folder: z.enum(["trailers", "banners", "blog", "identity", "registration"]),
  contentType: z.string(),
  fileSize: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const { folder, contentType, fileSize } = parsed.data;

  if ((folder === "trailers" || folder === "identity" || folder === "registration") && session.role !== "OWNER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }
  if ((folder === "banners" || folder === "blog") && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  if (!(contentType in ALLOWED_IMAGE_TYPES)) {
    return NextResponse.json({ error: "Nicht unterstütztes Bildformat" }, { status: 400 });
  }
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Datei ist zu groß (max. 8 MB)" }, { status: 400 });
  }

  const isPrivate = folder === "identity" || folder === "registration";
  if (isPrivate ? !isPrivateStorageConfigured() : !isStorageConfigured()) {
    return NextResponse.json({ error: "Bild-Upload ist derzeit nicht verfügbar" }, { status: 503 });
  }

  const key = buildImageKey(
    isPrivate ? `${folder}/${session.sub}` : folder,
    contentType
  );
  const uploadUrl = await createPresignedUploadUrl(
    key,
    contentType,
    fileSize,
    isPrivate ? process.env.R2_PRIVATE_BUCKET_NAME : process.env.R2_BUCKET_NAME
  );

  return NextResponse.json({
    uploadUrl,
    fileReference: isPrivate ? key : publicUrlForKey(key),
  });
}
