import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { validateSession } from "@/server/auth/session.service";
import { readSessionCookie } from "@/lib/auth";

const bodySchema = z.object({ name: z.string().trim().min(1).max(100) });

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
  if (!parsed.success) return NextResponse.json({ error: "El nombre no es válido" }, { status: 400 });

  const list = await prisma.favoriteList.create({ data: { name: parsed.data.name, userId } });
  return NextResponse.json(list, { status: 201 });
}
