import { Prisma } from "@prisma/client";

export function publicProfileRecord() {
  return {
    id: "cuid-user-profile-1",
    displayName: "Ana García",
    avatarUrl: "https://example.com/avatar.jpg",
    bio: "Perfil público de prueba",
    preferredLocation: "40.416800,-3.703800",
    createdAt: new Date("2025-01-10T00:00:00Z"),
    ratingAverage: new Prisma.Decimal("4.8"),
    transactionCount: 12,
    responseTimeHours: 3,
    verificationStates: [{ id: "verification-1" }],
    listings: [{
      id: "listing-1", slug: "camara-pro", title: "Cámara Pro", status: "published",
      pricePerDay: new Prisma.Decimal("25.5"), city: "Madrid",
      ratingAverage: new Prisma.Decimal("4.7"), reviewCount: 4,
      photos: [{ url: "https://example.com/listing.jpg" }],
      reviews: [],
    }],
  };
}