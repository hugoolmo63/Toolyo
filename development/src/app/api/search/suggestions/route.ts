import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";

/** Devuelve hasta cinco listings públicos cuyo título coincide con la consulta. */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ suggestions: [] });
  }

  const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const [prefixMatches, accentInsensitiveMatches] = await Promise.all([
    prisma.listing.findMany({
      where: {
        title: { startsWith: query, mode: "insensitive" },
        status: "published",
        deletedAt: null,
        owner: { accountStatus: "active", deletedAt: null },
      },
      take: 5,
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        category: { select: { name: true } },
      },
    }),
    prisma.$queryRaw<Array<{ id: string; title: string; category: string }>>`
      SELECT listing."id", listing."title", category."name" AS "category"
      FROM "Listing" AS listing
      INNER JOIN "Category" AS category ON category."id" = listing."categoryId"
      INNER JOIN "User" AS owner ON owner."id" = listing."ownerId"
      WHERE listing."status" = 'published'
        AND listing."deletedAt" IS NULL
        AND owner."accountStatus" = 'active'
        AND owner."deletedAt" IS NULL
        AND LEFT(
          TRANSLATE(LOWER(listing."title"), 'áàäâãåéèëêíìïîóòöôõúùüûñçýÿ', 'aaaaaaeeeeiiiiooooouuuuncyy'),
          CHAR_LENGTH(${normalizedQuery})
        ) = ${normalizedQuery}
      ORDER BY listing."title" ASC
      LIMIT 5
    `,
  ]);

  const suggestions = new Map<string, { id: string; title: string; category: string }>();
  for (const listing of prefixMatches) {
    suggestions.set(listing.id, { id: listing.id, title: listing.title, category: listing.category.name });
  }
  for (const listing of accentInsensitiveMatches) {
    suggestions.set(listing.id, listing);
  }

  return NextResponse.json({
    suggestions: Array.from(suggestions.values())
      .sort((left, right) => left.title.localeCompare(right.title))
      .slice(0, 5),
  });
}