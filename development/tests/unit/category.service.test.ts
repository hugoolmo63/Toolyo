import { describe, it, expect } from "vitest";
import { slugify } from "@/server/services/category.service";

// Lógica pura: slugify no toca la base de datos.
describe("slugify", () => {
  it("convierte a kebab-case minúsculas", () => {
    expect(slugify("Electrónica y Más")).toBe("electronica-y-mas");
  });

  it("elimina acentos", () => {
    expect(slugify("Herramientas de CAÑA")).toBe("herramientas-de-cana");
  });

  it("reduce espacios y guiones múltiples", () => {
    expect(slugify("  Deporte   Aire Libre  ")).toBe("deporte-aire-libre");
  });

  it("devuelve string vacío para entrada vacía", () => {
    expect(slugify("   ")).toBe("");
  });

  it("respeta la longitud máxima", () => {
    const long = "a".repeat(400);
    expect(slugify(long).length).toBeLessThanOrEqual(160);
  });
});

// Detectar errores de validación en el servicio se cubre en el test de integración
// (requiere base de datos); aquí verificamos únicamente la lógica pura.
describe("validación de longitud de name", () => {
  it("slugify nunca supera 160 caracteres", () => {
    expect(slugify("palabra".repeat(100)).length).toBeLessThanOrEqual(160);
  });
});