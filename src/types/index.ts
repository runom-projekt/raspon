import type { Trailer, TrailerPhoto, User, Review } from "@prisma/client";

export type TrailerWithRelations = Trailer & {
  photos: TrailerPhoto[];
  owner: Pick<User, "id" | "firstName" | "lastName" | "avatarUrl" | "isIdVerified">;
};

export type ReviewWithAuthor = Review & {
  author: Pick<User, "firstName" | "lastName" | "avatarUrl">;
};

export interface TrailerCardData {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  coverPhotoUrl: string | null;
  pricePerHour: string;
  currency: string;
  averageRating: number;
  reviewCount: number;
  ownerName: string;
}

export interface SessionUser {
  id: string;
  email: string;
  role: "CUSTOMER" | "OWNER" | "ADMIN";
  firstName: string;
  lastName: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
