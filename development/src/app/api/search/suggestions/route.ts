import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { searchLocationsNominatim } from "@/features/search/infrastructure/geocoding.repository";
import { matchesSearchTokens, tokenizeSearchText } from "@/features/search/application/search-tokenization";

/** Devuelve sugerencias tipadas de ubicaciones, categorías y productos públicos. */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ locations: [], categories: [], products: [] });
  }

  const queryTokens = tokenizeSearchText(query);
  const [locations, allCategories, listings] = await Promise.all([
    searchLocationsNominatim(query, 5),
    prisma.category.findMany({
      where: {
        showInNav: true,
        deletedAt: null,
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.listing.findMany({
      where: {
        status: "published",
        deletedAt: null,
        owner: { accountStatus: "active", deletedAt: null },
      },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const categories = allCategories
    .filter((category) => matchesSearchTokens(queryTokens, category.name))
    .slice(0, 5);
  const products = listings
    .filter((listing) => matchesSearchTokens(queryTokens, listing.title, listing.description, listing.category.name))
    .slice(0, 5)
    .map((listing) => ({ id: listing.id, title: listing.title, category: listing.category.name }));

  return NextResponse.json({
    locations,
    categories,
    products,
  });
}