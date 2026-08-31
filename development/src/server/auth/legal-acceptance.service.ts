import type { LegalAcceptancePurpose, LegalDocumentType, Prisma, PrismaClient } from "@prisma/client";
import { ValidationError } from "../lib/errors/domain-errors";
import type { LegalRegistrationDocument } from "@/types/auth";

export async function assertCurrentDocument(prisma: PrismaClient | Prisma.TransactionClient, id: string, type: LegalDocumentType) {
  const document = await prisma.legalDocument.findFirst({ where: { id, documentType: type, effectiveAt: { lte: new Date() }, retiredAt: null } });
  if (!document) throw new ValidationError(`El documento ${type} no está vigente`);
  return document;
}

export async function recordAcceptances(prisma: PrismaClient | Prisma.TransactionClient, input: { userId: string; termsDocumentId: string; privacyDocumentId: string; marketingAccepted?: boolean }) {
  const [terms, privacy] = await Promise.all([
    assertCurrentDocument(prisma, input.termsDocumentId, "terms"),
    assertCurrentDocument(prisma, input.privacyDocumentId, "privacy"),
  ]);
  const acceptedAt = new Date();
  const data = [
    { userId: input.userId, legalDocumentId: terms.id, purpose: "account_terms" as LegalAcceptancePurpose, acceptedAt },
    { userId: input.userId, legalDocumentId: privacy.id, purpose: "privacy_notice" as LegalAcceptancePurpose, acceptedAt },
  ];
  if (input.marketingAccepted) {
    const marketing = await prisma.legalDocument.findFirst({ where: { documentType: "marketing", effectiveAt: { lte: acceptedAt }, retiredAt: null }, orderBy: { effectiveAt: "desc" } });
    if (marketing) data.push({ userId: input.userId, legalDocumentId: marketing.id, purpose: "marketing", acceptedAt });
  }
  await prisma.legalAcceptance.createMany({ data });
}

export async function getRegistrationLegalDocuments(prisma: PrismaClient | Prisma.TransactionClient): Promise<LegalRegistrationDocument[]> {
  const documents = await prisma.legalDocument.findMany({
    where: { documentType: { in: ["terms", "privacy"] }, effectiveAt: { lte: new Date() }, retiredAt: null },
    orderBy: [{ documentType: "asc" }, { effectiveAt: "desc" }],
    select: { id: true, documentType: true, version: true, language: true, effectiveAt: true },
  });

  const terms = documents.find((document) => document.documentType === "terms");
  const privacy = documents.find((document) => document.documentType === "privacy");
  if (!terms || !privacy) throw new ValidationError("No hay documentos legales vigentes para el registro");

  return [
    { id: terms.id, documentType: "terms", version: terms.version, language: terms.language, effectiveAt: terms.effectiveAt },
    { id: privacy.id, documentType: "privacy", version: privacy.version, language: privacy.language, effectiveAt: privacy.effectiveAt },
  ];
}
