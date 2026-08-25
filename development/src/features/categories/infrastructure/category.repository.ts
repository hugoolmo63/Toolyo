import type { PrismaClient } from "@prisma/client";
import { categorySelect } from "../domain/category";

export async function listActiveCategoryRecords(db: PrismaClient) {
  return db.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: categorySelect,
  });
}

export async function findCategoryBySlug(db: PrismaClient, slug: string) {
  return db.category.findUnique({
    where: { slug },
    select: { id: true },
  });
}

export async function findCategoryById(db: PrismaClient, id: string) {
  return db.category.findUnique({
    where: { id },
    select: { id: true },
  });
}

export async function createCategoryRecord(
  db: PrismaClient,
  data: {
    name: string;
    slug: string;
    showInNav: boolean;
    parentId?: string;
  },
) {
  return db.category.create({
    data,
    select: categorySelect,
  });
}