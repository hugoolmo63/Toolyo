import { NextResponse } from "next/server";

/**
 * Healthcheck ligero para orquestación de contenedores (Docker HEALTHCHECK,
 * post-deploy verification en GitHub Actions). Ver docs/09 §4.1.
 *
 * No consulta la BD ni servicios externos para ser rápido y no acoplarse
 * a dependencias que pueden estar temporalmente no disponibles. La
 * verificación profunda de dependencias corresponde a un endpoint de
 * "readiness" futuro si se necesita.
 */
export function GET() {
  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { status: 200 },
  );
}
