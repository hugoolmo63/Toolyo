import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { disabledKycProvider } from "@/server/integrations/kyc/kyc.provider";

export async function POST(request: Request) {
  const signature = request.headers.get("x-kyc-signature");
  if (!signature) return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  const payload = await request.text();
  try {
    const event = disabledKycProvider.verifyWebhook(payload, signature);
    const existing = await prisma.securityEvent.findFirst({ where: { eventType: `kyc:${event.providerEventId}` } });
    if (!existing) await prisma.securityEvent.create({ data: { eventType: `kyc:${event.providerEventId}`, outcome: "success", metadata: { providerReference: event.providerReference, status: event.status } } });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "invalid_webhook" }, { status: 400 });
  }
}
