import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { appendAuditLog } from "@/server/services/auditService";

const schema = z.object({
  title: z.string().min(5).optional(),
  excerpt: z.string().min(10).optional(),
  content: z.string().min(20).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const post = await prisma.$transaction(async (tx) => {
    const current = await tx.blogPost.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });
    const updated = await tx.blogPost.update({
      where: { id },
      data: {
        ...parsed.data,
        publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : undefined,
      },
    });
    await appendAuditLog(tx, {
      actor: session,
      requestId: req.headers.get("x-request-id"),
      action: "BLOG_POST_UPDATED",
      entityType: "BlogPost",
      entityId: id,
      changes: { status: { from: current.status, to: updated.status } },
    });
    return updated;
  });

  return NextResponse.json({ post });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });

  const { id } = await params;
  await prisma.$transaction(async (tx) => {
    await tx.blogPost.delete({ where: { id } });
    await appendAuditLog(tx, {
      actor: session,
      requestId: req.headers.get("x-request-id"),
      action: "BLOG_POST_DELETED",
      entityType: "BlogPost",
      entityId: id,
    });
  });
  return NextResponse.json({ success: true });
}
