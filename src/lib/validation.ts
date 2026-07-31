import { z } from "zod";
import { normalizePhone } from "@/lib/utils";

export const passwordSchema = z
  .string()
  .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein")
  .regex(/[A-Z]/, "Das Passwort muss einen Großbuchstaben enthalten")
  .regex(/[0-9]/, "Das Passwort muss eine Ziffer enthalten");

function toOptionalNumber(v: unknown) {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}
const optionalNumber = (schema: z.ZodNumber) => z.preprocess(toOptionalNumber, schema.optional());

const emptyToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v);

function trimOrUndefined(v: unknown) {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

export const registerSchema = z
  .object({
    firstName: z.string().min(2, "Bitte Vornamen angeben").max(60),
    lastName: z.string().min(2, "Bitte Nachnamen angeben").max(60),
    email: z.preprocess(
      trimOrUndefined,
      z
        .string()
        .email("Ungültige E-Mail-Adresse")
        .transform((v) => v.toLowerCase())
        .optional()
    ),
    phone: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .transform(normalizePhone)
        .refine((v) => /^\+?[0-9]{6,15}$/.test(v), "Ungültige Telefonnummer")
        .optional()
    ),
    password: passwordSchema,
    role: z.enum(["CUSTOMER", "OWNER"]).default("CUSTOMER"),
  })
  .refine((data) => Boolean(data.email) || Boolean(data.phone), {
    message: "Bitte E-Mail-Adresse oder Telefonnummer angeben",
    path: ["email"],
  });

export const loginSchema = z.object({
  identifier: z.string().min(3, "Bitte E-Mail-Adresse oder Telefonnummer eingeben"),
  password: z.string().min(1, "Bitte Passwort eingeben"),
  twoFactorCode: z.string().trim().min(6).max(17).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Ungültige E-Mail-Adresse").transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordSchema,
});

export const trailerSearchSchema = z.object({
  location: z.string().optional(),
  category: z.string().optional(),
  pickupDate: z.string().optional(),
  returnDate: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
});

export const trailerCreateSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20),
  category: z.enum([
    "CARGO",
    "CAR_TRANSPORTER",
    "MOTORCYCLE",
    "HORSE",
    "CAMPING",
    "TIPPER",
    "FLATBED",
    "SPECIALIZED",
    "OTHER",
  ]),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  productionYear: optionalNumber(z.number().int().min(1970).max(new Date().getFullYear())),
  weightKg: optionalNumber(z.number().int().positive()),
  grossWeightKg: optionalNumber(z.number().int().positive()),
  payloadKg: optionalNumber(z.number().int().positive()),
  lengthCm: optionalNumber(z.number().int().positive()),
  widthCm: optionalNumber(z.number().int().positive()),
  heightCm: optionalNumber(z.number().int().positive()),
  vin: z.string().optional(),
  pricePerHour: z.coerce.number().positive(),
  pricePerDay: z.coerce.number().positive(),
  pricePerWeek: optionalNumber(z.number().positive()),
  depositAmount: z.coerce.number().min(0).default(0),
  addressLine: z.string().optional(),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  country: z.string().default("DE"),
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  equipment: z.array(z.string()).default([]),
  photos: z.array(z.string().url()).default([]),
  registrationDocumentUrl: z.string().regex(
    /^registration\/[a-z0-9]+\/[0-9a-f-]+\.(jpg|png|webp)$/,
    "Bitte Fahrzeugschein / Kfz-Brief hochladen"
  ),
});

export const identityDocumentSchema = z.object({
  documentUrl: z.string().regex(
    /^identity\/[a-z0-9]+\/[0-9a-f-]+\.(jpg|png|webp)$/,
    "Bitte ein gültiges Dokument hochladen"
  ),
});

export const bookingCreateSchema = z
  .object({
    trailerId: z.string().cuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    discountCode: z.string().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Das Rückgabedatum muss nach dem Abholdatum liegen",
    path: ["endDate"],
  });

export const reviewCreateSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const messageCreateSchema = z.object({
  conversationId: z.string().cuid(),
  body: z.string().trim().min(1).max(4000),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TrailerSearchInput = z.infer<typeof trailerSearchSchema>;
export type TrailerCreateInput = z.infer<typeof trailerCreateSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
