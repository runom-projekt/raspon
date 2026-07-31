import "server-only";
import { randomUUID } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const UPLOAD_URL_EXPIRY_SECONDS = 300;
const PRIVATE_DOWNLOAD_URL_EXPIRY_SECONDS = 60;

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
  );
}

export function isPrivateStorageConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_PRIVATE_BUCKET_NAME &&
      process.env.R2_PRIVATE_BUCKET_NAME !== process.env.R2_BUCKET_NAME
  );
}

function getClient(): S3Client {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function buildImageKey(folder: string, contentType: string): string {
  const ext = ALLOWED_IMAGE_TYPES[contentType] ?? "bin";
  return `${folder}/${randomUUID()}.${ext}`;
}

export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  contentLength: number,
  bucket = process.env.R2_BUCKET_NAME
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return getSignedUrl(getClient(), command, { expiresIn: UPLOAD_URL_EXPIRY_SECONDS });
}

export async function createPrivateDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_PRIVATE_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(getClient(), command, { expiresIn: PRIVATE_DOWNLOAD_URL_EXPIRY_SECONDS });
}

export function publicUrlForKey(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export function isManagedPublicUrl(url: string): boolean {
  const base = process.env.R2_PUBLIC_URL;
  return Boolean(base && url.startsWith(`${base}/`) && !url.includes(".."));
}

export async function deleteObjectByPublicUrl(url: string): Promise<void> {
  const base = process.env.R2_PUBLIC_URL;
  if (!base || !url.startsWith(`${base}/`)) return;
  const key = url.slice(base.length + 1);
  await getClient().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
}
