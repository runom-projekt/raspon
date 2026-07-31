import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";
import { appendAuditLog } from "@/server/services/auditService";

const schema = z.object({
  title: z.string().min(5),
  excerpt: z.string().min(10),
  content: z.string().min(20),
  category: z.enum(["ratgeber", "neuigkeiten", "aktuelles", "sicherheit", "vorschriften"]),
  coverImageUrl: z.string().url().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const baseSlug = slugify(parsed.data.title);
  let slug = baseSlug;
  let i = 1;
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.blogPost.create({
      data: {
        ...parsed.data,
        slug,
        publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
      },
    });
    await appendAuditLog(tx, {
      actor: session,
      requestId: req.headers.get("x-request-id"),
      action: "BLOG_POST_CREATED",
      entityType: "BlogPost",
      entityId: created.id,
      changes: { status: { to: created.status } },
    });
    return created;
  });

  return NextResponse.json({ post });
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });

  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ posts });
}
