import type { PrismaClient } from "@prisma/client";
import type { Socket } from "socket.io";
import { readSessionCookie } from "@/lib/auth";
import { validateSession } from "@/server/auth/session.service";

export type SocketIdentity = { userId: string; sessionToken: string };

function sessionTokenFromSocket(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.sessionToken;
  if (typeof authToken === "string" && authToken.length > 0) return authToken;
  return readSessionCookie(socket.handshake.headers.cookie ?? null);
}

export async function authenticateSocket(socket: Socket, db: PrismaClient): Promise<SocketIdentity> {
  const sessionToken = sessionTokenFromSocket(socket);
  if (!sessionToken) throw new Error("UNAUTHORIZED");
  const claims = await validateSession(db, sessionToken);
  if (!claims || claims.accountStatus !== "active") throw new Error("UNAUTHORIZED");
  return { userId: claims.userId, sessionToken };
}
