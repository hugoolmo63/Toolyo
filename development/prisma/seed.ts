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