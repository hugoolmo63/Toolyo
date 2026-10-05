import { NextResponse } from "next/server";

export const dynamic = "force-static";

/**
 * Asociación de Universal Links de iOS (contracts/mobile-platform.md §2.3).
 * El Team ID y el bundle se inyectan desde configuración/secretos de build.
 */
export function GET() {
  const teamId = process.env.MOBILE_IOS_TEAM_ID ?? "";
  const bundleId = process.env.MOBILE_IOS_BUNDLE_ID ?? "com.toolyo.app";

  return NextResponse.json({
    applinks: {
      apps: [],
      details: [
        {
          appIDs: [teamId ? `${teamId}.${bundleId}` : bundleId],
          components: [
            { "/": "/listings/*" },
            { "/": "/users/*" },
            { "/": "/messages/*" },
          ],
        },
      ],
    },
  });
}
