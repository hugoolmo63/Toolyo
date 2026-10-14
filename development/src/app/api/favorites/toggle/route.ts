import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { validateSession } from "@/server/auth/session.service";
import { readSessionCookie } from "@/lib/auth";

const bodySchema = z.object({ listId: z.string().min(1), listingId: z.string().min(1) });

async function getUserId(request: Request) {
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!token) return null;
  const session = await validateSession(prisma, token);
  return session?.userId ?? null;
}

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });

  const { listId, listingId } = parsed.data;
  const list = await prisma.favoriteList.findFirst({ where: { id: listId, userId }, select: { id: true } });
  if (!list) return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!listing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  const existing = await prisma.favoriteItem.findUnique({ where: { listId_listingId: { listId, listingId } } });
  if (existing) {
    await prisma.favoriteItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false, listId, listingId });
  }
  await prisma.favoriteItem.create({ data: { listId, listingId } });
  return NextResponse.json({ saved: true, listId, listingId });
}
