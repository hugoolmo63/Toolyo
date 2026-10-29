import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readSessionCookie } from "@/lib/auth";
import { validateSession } from "@/server/auth/session.service";
import { prisma } from "@/server/db/client";
import { getListingVideoExtension, MAX_LISTING_VIDEO_BYTES } from "@/features/listing-management/shared/listing-video.schema";

export const runtime = "nodejs";

const MAX_MULTIPART_SIZE = MAX_LISTING_VIDEO_BYTES + 1024 * 1024;

async function readMultipartBody(request: Request, maxBytes: number) {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBytes) {
      await reader.cancel();
      throw new RangeError("El vídeo no puede superar los 50 MB");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function hasExpectedSignature(file: File) {
  return file.arrayBuffer().then((arrayBuffer) => {
    const bytes = new Uint8Array(arrayBuffer, 0, Math.min(arrayBuffer.byteLength, 12));
    if (file.type === "video/webm") return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    if (file.type === "video/quicktime") return bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70 && bytes[8] === 0x71 && bytes[9] === 0x74;
    return bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
  });
}

export async function POST(request: Request) {
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!token || !(await validateSession(prisma, token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_SIZE) {
    return NextResponse.json({ error: "El vídeo no puede superar los 50 MB" }, { status: 413 });
  }

  let formData: FormData;
  try {
    const body = await readMultipartBody(request, MAX_MULTIPART_SIZE);
    const boundedRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body,
    });
    formData = await boundedRequest.formData();
  } catch (error) {
    if (error instanceof RangeError) return NextResponse.json({ error: error.message }, { status: 413 });
    return NextResponse.json({ error: "Solicitud de archivo no válida" }, { status: 400 });
  }

  const files = formData.getAll("file");
  if (files.length !== 1 || !(files[0] instanceof File)) {
    return NextResponse.json({ error: "Adjunta un único vídeo" }, { status: 400 });
  }

  const file = files[0];
  const extension = getListingVideoExtension(file);
  if (!extension) {
    return NextResponse.json({ error: "El vídeo debe pesar como máximo 50 MB" }, { status: 413 });
  }
  if (!(await hasExpectedSignature(file))) {
    return NextResponse.json({ error: "El contenido del archivo no coincide con su formato de vídeo" }, { status: 415 });
  }

  const filename = `${randomUUID()}${extension}`;
  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "listing-videos");
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, filename), Buffer.from(await file.arrayBuffer()), { flag: "wx" });

  return NextResponse.json({ url: `/uploads/listing-videos/${filename}` }, { status: 201 });
}