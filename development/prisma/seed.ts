import { PrismaClient } from "@prisma/client";

/**
 * Semilla mínima y determinista (TESTING.md §6).
 * No depende de datos reales ni de red; idempotente en contenido.
 */
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Electrónica", slug: "electronica", showInNav: true },
    { name: "Herramientas", slug: "herramientas", showInNav: true },
    { name: "Deporte y aire libre", slug: "deporte-aire-libre", showInNav: true },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const documents = [
    { documentType: "terms" as const, version: "2026-08", language: "es", contentHash: "seed-terms-2026-08" },
    { documentType: "privacy" as const, version: "2026-08", language: "es", contentHash: "seed-privacy-2026-08" },
    { documentType: "marketing" as const, version: "2026-08", language: "es", contentHash: "seed-marketing-2026-08" },
  ];
  for (const document of documents) {
    await prisma.legalDocument.upsert({
      where: { documentType_version_language: { documentType: document.documentType, version: document.version, language: document.language } },
      update: { retiredAt: null },
      create: { ...document, effectiveAt: new Date("2026-01-01T00:00:00.000Z") },
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seed completada: categorías de ejemplo creadas.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });