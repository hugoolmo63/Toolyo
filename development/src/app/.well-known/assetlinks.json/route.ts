import { NextResponse } from "next/server";

export const dynamic = "force-static";

/**
 * Asociación de App Links de Android (contracts/mobile-platform.md §2.2).
 * Los valores se inyectan desde configuración/secretos de build.
 */
export function GET() {
  const packageName = process.env.MOBILE_ANDROID_PACKAGE ?? "com.toolyo.app";
  const fingerprints = (process.env.MOBILE_ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
}
