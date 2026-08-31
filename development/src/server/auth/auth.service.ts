import type { PrismaClient } from "@prisma/client";
import { ConflictError, ValidationError } from "../lib/errors/domain-errors";
import { normalizeEmail } from "./normalization";
import { hashPassword } from "./password";
import { recordAcceptances } from "./legal-acceptance.service";
import { deriveCapabilities } from "./capabilities.service";
import type { OnboardingStatus } from "@/types/auth";
import { requestOtp } from "./otp-delivery.service";

export async function registerWithPassword(prisma: PrismaClient, input: { email: string; password: string; termsDocumentId: string; privacyDocumentId: string; marketingAccepted?: boolean }): Promise<{ userId: string; accountStatus: string; challengeId: string; challengeExpiresAt: Date }> {
  const emailNormalized = normalizeEmail(input.email);
  if (input.password.length < 12) throw new ValidationError("La contraseña debe tener al menos 12 caracteres");
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { emailNormalized, accountStatus: "pending", passwordCredential: { create: { passwordHash: await hashPassword(input.password) } }, verificationStates: { create: [{ channel: "email", status: "pending" }, { channel: "phone", status: "pending" }] } } });
      await recordAcceptances(tx, { userId: created.id, ...input });
      return created;
    });
    const emailChallenge = await requestOtp(prisma, { userId: user.id, channel: "email", purpose: "registration", destination: emailNormalized });
    return { userId: user.id, accountStatus: user.accountStatus, challengeId: emailChallenge.challengeId, challengeExpiresAt: emailChallenge.expiresAt };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      throw new ConflictError(`El email ${emailNormalized} ya está registrado. Usa otro correo o inicia sesión.`);
    }
    throw error;
  }
}

export async function getOnboardingStatus(prisma: PrismaClient, userId: string): Promise<OnboardingStatus> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { verificationStates: true, identityVerifications: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!user) throw new ValidationError("La cuenta no está disponible");
  const email = user.verificationStates.find((state) => state.channel === "email")?.status ?? "pending";
  const phone = user.verificationStates.find((state) => state.channel === "phone")?.status ?? "pending";
  const identity = user.identityVerifications[0]?.status ?? "not_started";
  const base = { accountStatus: user.accountStatus, email, phone, identity } as OnboardingStatus;
  return { ...base, capabilities: deriveCapabilities(base) };
}
