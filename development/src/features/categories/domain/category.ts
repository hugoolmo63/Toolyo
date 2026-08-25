export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  showInNav: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const categorySelect = {
  id: true,
  name: true,
  slug: true,
  showInNav: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Deriva un slug kebab-case a partir del nombre. */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 160);
}