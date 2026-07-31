import "server-only";
import { prisma } from "@/lib/prisma";
import type { TrailerCategory } from "@prisma/client";
import type { TrailerCardData, PaginatedResult } from "@/types";

function toCardData(trailer: {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  pricePerHour: unknown;
  currency: string;
  averageRating: number;
  reviewCount: number;
  photos: { url: string }[];
  owner: { firstName: string; lastName: string };
}): TrailerCardData {
  return {
    id: trailer.id,
    slug: trailer.slug,
    title: trailer.title,
    city: trailer.city,
    country: trailer.country,
    latitude: trailer.latitude,
    longitude: trailer.longitude,
    coverPhotoUrl: trailer.photos[0]?.url ?? null,
    pricePerHour: trailer.pricePerHour!.toString(),
    currency: trailer.currency,
    averageRating: trailer.averageRating,
    reviewCount: trailer.reviewCount,
    ownerName: `${trailer.owner.firstName} ${trailer.owner.lastName.charAt(0)}.`,
  };
}

export async function getFeaturedTrailers(limit = 8): Promise<TrailerCardData[]> {
  const trailers = await prisma.trailer.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }],
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      pricePerHour: true,
      currency: true,
      averageRating: true,
      reviewCount: true,
      photos: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      owner: { select: { firstName: true, lastName: true } },
    },
  });

  return trailers.map(toCardData);
}

export interface TrailerSearchParams {
  location?: string;
  category?: TrailerCategory;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export async function searchTrailers(
  params: TrailerSearchParams
): Promise<PaginatedResult<TrailerCardData>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 12;

  const where = {
    status: "PUBLISHED" as const,
    ...(params.category ? { category: params.category } : {}),
    ...(params.location
      ? { city: { contains: params.location, mode: "insensitive" as const } }
      : {}),
    ...(params.minPrice || params.maxPrice
      ? {
          pricePerHour: {
            ...(params.minPrice ? { gte: params.minPrice } : {}),
            ...(params.maxPrice ? { lte: params.maxPrice } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.trailer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        city: true,
        country: true,
        latitude: true,
        longitude: true,
        pricePerHour: true,
        currency: true,
        averageRating: true,
        reviewCount: true,
        photos: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        owner: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.trailer.count({ where }),
  ]);

  return {
    items: items.map(toCardData),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getTrailerBySlug(slug: string) {
  return prisma.trailer.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { position: "asc" } },
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isIdVerified: true,
          createdAt: true,
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { author: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      },
      blockedDates: true,
    },
  });
}
