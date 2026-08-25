import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/server/db/client";
import { ConflictError, NotFoundError } from "@/server/lib/errors/domain-errors";
import type { CreateCategoryInput } from "../shared/category.schema";
import { slugify } from "../domain/category";
import {
  createCategoryRecord,
  findCategoryById,
  findCategoryBySlug,
  listActiveCategoryRecords,
} from "../infrastructure/category.repository";

/**
 * Lógica de negocio del dominio Category.
 *
 * La capa de aplicación orquesta reglas y usa la infraestructura por inyección
 * de dependencias, manteniendo la lógica testeable y desacoplada.
 */
export async function listActiveCategories(db: PrismaClient = defaultPrisma) {
  return listActiveCategoryRecords(db);
}

export async function createCategory(input: CreateCategoryInput, db: PrismaClient = defaultPrisma) {
  const slug = input.slug ?? slugify(input.name);

  const existing = await findCategoryBySlug(db, slug);
  if (existing) {
    throw new ConflictError("Ya existe una categoría con ese slug");
  }

  if (input.parentId) {
    const parent = await findCategoryById(db, input.parentId);
    if (!parent) {
      throw new NotFoundError("La categoría padre no existe");
    }
  }

  return createCategoryRecord(db, {
    name: input.name,
    slug,
    showInNav: input.showInNav ?? true,
    parentId: input.parentId,
  });
}