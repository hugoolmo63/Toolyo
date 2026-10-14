import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { validateSession } from "@/server/auth/session.service";
import { readSessionCookie } from "@/lib/auth";

async function getUserId(request: Request) {
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!token) return null;
  const session = await validateSession(prisma, token);
  return session?.userId ?? null;
}

export async function GET(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const lists = await prisma.favoriteList.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            select: {
              id: true, slug: true, title: true, pricePerDay: true, city: true,
              photos: { where: { deletedAt: null }, orderBy: { order: "asc" }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(lists);
}
