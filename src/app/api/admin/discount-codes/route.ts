import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { appendAuditLog } from "@/server/services/auditService";

const schema = z
  .object({
    code: z.string().min(3).toUpperCase(),
    percentOff: z.coerce.number().int().min(1).max(100).optional(),
    amountOff: z.coerce.number().positive().optional(),
    validFrom: z.coerce.date(),
    validTo: z.coerce.date(),
    maxUses: z.coerce.number().int().positive().optional(),
  })
  .refine((d) => d.percentOff || d.amountOff, { message: "Podaj rabat procentowy lub kwotowy" });

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  const codes = await prisma.discountCode.findMany({ orderBy: { validFrom: "desc" } });
  return NextResponse.json({ codes });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten", issues: parsed.error.flatten() }, { status: 400 });
  }

  const code = await prisma.$transaction(async (tx) => {
    const created = await tx.discountCode.create({ data: parsed.data });
    await appendAuditLog(tx, {
      actor: session,
      requestId: req.headers.get("x-request-id"),
      action: "DISCOUNT_CODE_CREATED",
      entityType: "DiscountCode",
      entityId: created.id,
    });
    return created;
  });
  return NextResponse.json({ code });
}
