import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const demoPhotos = [
  "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200",
  "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1200",
  "https://images.unsplash.com/photo-1533395427226-788cee25cc7d?w=1200",
];

async function main() {
  const passwordHash = await bcrypt.hash("Passwort123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@raspon.de" },
    update: {},
    create: {
      email: "admin@raspon.de",
      passwordHash,
      firstName: "Anna",
      lastName: "Admin",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      isIdVerified: true,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "vermieter@raspon.de" },
    update: {},
    create: {
      email: "vermieter@raspon.de",
      passwordHash,
      firstName: "Markus",
      lastName: "Weber",
      role: "OWNER",
      status: "ACTIVE",
      emailVerified: new Date(),
      isIdVerified: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "kunde@raspon.de" },
    update: {},
    create: {
      email: "kunde@raspon.de",
      passwordHash,
      firstName: "Julia",
      lastName: "Neumann",
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const trailersData = [
    {
      title: "Lastenanhänger 750kg mit Plane",
      category: "CARGO" as const,
      city: "Berlin",
      pricePerHour: 5,
      pricePerDay: 35,
      lat: 52.52,
      lng: 13.405,
    },
    {
      title: "Autotransporter für PKW",
      category: "CAR_TRANSPORTER" as const,
      city: "München",
      pricePerHour: 9,
      pricePerDay: 65,
      lat: 48.1351,
      lng: 11.582,
    },
    {
      title: "Einachsiger Motorradanhänger",
      category: "MOTORCYCLE" as const,
      city: "Hamburg",
      pricePerHour: 4,
      pricePerDay: 28,
      lat: 53.5511,
      lng: 9.9937,
    },
    {
      title: "Wohnwagen für 4 Personen",
      category: "CAMPING" as const,
      city: "Köln",
      pricePerHour: 12,
      pricePerDay: 89,
      lat: 50.9375,
      lng: 6.9603,
    },
  ];

  for (const t of trailersData) {
    const slug = t.title
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    await prisma.trailer.upsert({
      where: { slug },
      update: {},
      create: {
        ownerId: owner.id,
        slug,
        title: t.title,
        description:
          "Solider, gut gepflegter Anhänger, regelmäßig gewartet. Ideal für kurze und lange Strecken. Abholung und Rückgabe flexibel nach vorheriger Absprache.",
        category: t.category,
        manufacturer: "Böckmann",
        productionYear: 2022,
        weightKg: 320,
        grossWeightKg: 750,
        payloadKg: 430,
        lengthCm: 250,
        widthCm: 150,
        heightCm: 180,
        pricePerHour: t.pricePerHour,
        pricePerDay: t.pricePerDay,
        depositAmount: 100,
        city: t.city,
        country: "DE",
        latitude: t.lat,
        longitude: t.lng,
        equipment: ["auflaufbremse", "plane", "led-beleuchtung"],
        status: "PUBLISHED",
        publishedAt: new Date(),
        averageRating: 4.7,
        reviewCount: 12,
        photos: {
          create: demoPhotos.map((url, i) => ({ url, position: i })),
        },
      },
    });
  }

  await prisma.blogPost.upsert({
    where: { slug: "wie-man-sicher-einen-anhaenger-mietet" },
    update: {},
    create: {
      slug: "wie-man-sicher-einen-anhaenger-mietet",
      title: "Wie mietet man sicher einen Anhänger?",
      excerpt: "Lernen Sie die wichtigsten Regeln für die sichere Anhängervermietung auf Raspon kennen.",
      content:
        "Prüfen Sie vor der Abholung des Anhängers immer den technischen Zustand, die Dokumente und die Beleuchtung. Machen Sie Fotos vor und nach der Vermietung, um Missverständnisse bezüglich möglicher Schäden zu vermeiden...",
      category: "sicherheit",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  console.log("Seed erfolgreich abgeschlossen.");
  console.log({ admin: admin.email, owner: owner.email, customer: customer.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
