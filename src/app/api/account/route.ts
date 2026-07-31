import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z
      .string()
      .transform(normalizePhone)
      .refine((v) => /^\+?[0-9]{6,15}$/.test(v), "Ungültige Telefonnummer")
      .optional()
  ),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.sub },
      data: { ...parsed.data, phone: parsed.data.phone ?? null },
    });

    return NextResponse.json({
      user: { firstName: user.firstName, lastName: user.lastName, phone: user.phone },
    });
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "Diese Telefonnummer wird bereits verwendet" }, { status: 409 });
    }
    throw err;
  }
}
