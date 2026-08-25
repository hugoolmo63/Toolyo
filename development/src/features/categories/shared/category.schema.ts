import { z } from "zod";

/**
 * Schemas Zod compartidos del dominio Category.
 * Única fuente de verdad para front y back.
 */
export const CreateCategorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(80, "Máximo 80 caracteres"),
  slug: z
    .string()
    .min(1, "El slug es obligatorio")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe ser kebab-case (minúsculas y guiones)"),
  parentId: z.string().cuid("parentId debe ser un identificador válido").optional(),
  showInNav: z.boolean().optional().default(true),
});

export const CategoryParamsSchema = z.object({
  id: z.string().cuid(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;