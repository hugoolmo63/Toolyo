/**
 * Toolyo — import-data.ts
 * Importador genérico de datos desde un documento JSON.
 * Pensado para entornos de prueba aislados (scripts/deploy-test.sh --seed datos.json).
 *
 * Formato del documento JSON:
 * {
 *   "ModelName": [
 *     { "campo": "valor", ... },
 *     ...
 *   ],
 *   "OtroModel": [ ... ]
 * }
 *
 * Las claves del objeto raíz deben coincidir con nombres de modelos Prisma
 * (ej: "Category", "Listing", "User"). Los registros se insertan en orden
 * con createMany + skipDuplicates, así que se puede re-ejecutar sin errores.
 *
 * Uso:  tsx import-data.ts <archivo.json>
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();

type DataDocument = Record<string, Record<string, unknown>[]>;

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Uso: tsx import-data.ts <archivo.json>");
    process.exit(1);
  }

  console.log(`[import-data] Leyendo ${file}...`);
  const raw = readFileSync(file, "utf-8");

  let data: DataDocument;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`[import-data] JSON inválido: ${(e as Error).message}`);
    process.exit(1);
  }

  const models = Object.keys(data);
  if (models.length === 0) {
    console.warn("[import-data] El documento no contiene ningún modelo. Nada que importar.");
    return;
  }

  console.log(`[import-data] Modelos a importar: ${models.join(", ")}`);

  for (const modelName of models) {
    const records = data[modelName];
    const delegate = (prisma as unknown as Record<string, unknown>)[modelName] as
      | { createMany: (args: { data: Record<string, unknown>[]; skipDuplicates: boolean }) => Promise<{ count: number }> }
      | undefined;

    if (!delegate || typeof delegate.createMany !== "function") {
      console.warn(`[import-data] Modelo "${modelName}" no encontrado en Prisma Client — saltando.`);
      continue;
    }

    if (!Array.isArray(records)) {
      console.warn(`[import-data] "${modelName}" debe ser un array de registros — saltando.`);
      continue;
    }

    if (records.length === 0) {
      console.log(`[import-data] ${modelName}: 0 registros — nada que hacer.`);
      continue;
    }

    try {
      const result = await delegate.createMany({
        data: records,
        skipDuplicates: true,
      });
      console.log(`[import-data] ${modelName}: ${result.count} registro(s) insertado(s) (de ${records.length}).`);
    } catch (e) {
      console.error(`[import-data] Error insertando en "${modelName}": ${(e as Error).message}`);
      // Continuamos con el siguiente modelo en lugar de abortar todo
    }
  }

  console.log("[import-data] Importación completada.");
}

main()
  .catch((e) => {
    console.error("[import-data] Error fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
