import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trailerCreateSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { isEmailConfigured } from "@/lib/email";
import { isManagedPublicUrl } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  if (isEmailConfigured()) {
    const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { emailVerified: true } });
    if (!user?.emailVerified) {
      return NextResponse.json(
        { error: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse, bevor Sie einen Anhänger hinzufügen" },
        { status: 403 }
      );
    }
  }

  const body = await req.json().catch(() => null);
  const parsed = trailerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Daten", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (!data.photos.every(isManagedPublicUrl) || !data.registrationDocumentUrl.startsWith(`registration/${session.sub}/`)) {
    return NextResponse.json({ error: "Ungültige oder nicht autorisierte Dateien" }, { status: 403 });
  }
  const baseSlug = slugify(`${data.title}-${data.city}`);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.trailer.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const trailer = await prisma.trailer.create({
    data: {
      ownerId: session.sub,
      slug,
      title: data.title,
      description: data.description,
      category: data.category,
      manufacturer: data.manufacturer,
      model: data.model,
      productionYear: data.productionYear,
      weightKg: data.weightKg,
      grossWeightKg: data.grossWeightKg,
      payloadKg: data.payloadKg,
      lengthCm: data.lengthCm,
      widthCm: data.widthCm,
      heightCm: data.heightCm,
      vin: data.vin,
      pricePerHour: data.pricePerHour,
      pricePerDay: data.pricePerDay,
      pricePerWeek: data.pricePerWeek,
      depositAmount: data.depositAmount,
      addressLine: data.addressLine,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      equipment: data.equipment,
      status: "PENDING_REVIEW",
      photos: {
        create: data.photos.map((url, position) => ({ url, position })),
      },
      documents: {
        create: [{ type: "REGISTRATION", url: data.registrationDocumentUrl }],
      },
    },
  });

  return NextResponse.json({ trailer });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const mine = req.nextUrl.searchParams.get("mine");
  if (mine) {
    const trailers = await prisma.trailer.findMany({
      where: { ownerId: session.sub },
      orderBy: { createdAt: "desc" },
      include: { photos: { take: 1, orderBy: { position: "asc" } } },
    });
    return NextResponse.json({ trailers });
  }

  return NextResponse.json({ error: "Parameter fehlt" }, { status: 400 });
}
