import type { PrismaClient } from "@prisma/client";
import { UnauthorizedError, ValidationError } from "../lib/errors/domain-errors";
import { deriveCapabilities } from "./capabilities.service";
import type { OnboardingStatus } from "@/types/auth";
import type { KycProvider } from "../integrations/kyc/kyc.provider";

export async function startIdentityVerification(prisma: PrismaClient, provider: KycProvider, userId: string, termsVersion: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { verificationStates: true } });
  if (!user) throw new ValidationError("La cuenta no está disponible");
  const contactable = user.verificationStates.some((item) => item.channel === "email" && item.status === "verified") && user.verificationStates.some((item) => item.channel === "phone" && item.status === "verified");
  if (!contactable) throw new UnauthorizedError("Completa la verificación de email y teléfono antes de iniciar KYC");
  const reference = `toolyo-${userId}-${Date.now()}`;
  const session = await provider.createSession({ userId, reference });
  const verification = await prisma.identityVerification.create({ data: { userId, provider: "configured", providerReference: session.providerReference, status: "pending", termsVersion, startedAt: new Date() } });
  return { verificationId: verification.id, redirectUrl: session.redirectUrl, status: verification.status };
}

export function canUseIdentityCapabilities(status: Pick<OnboardingStatus, "accountStatus" | "email" | "phone" | "identity">) {
  return deriveCapabilities(status).platform_insurance && deriveCapabilities(status).instant_booking;
}
