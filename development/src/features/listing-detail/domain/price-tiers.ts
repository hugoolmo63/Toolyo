import type { PriceTierDTO, PriceEstimate } from "./listing-detail";

/**
 * Lógica pura de tramos de precios derivados desde pricePerDay (005-listing-detail).
 * Sin persistencia: los tramos se calculan desde pricePerDay con descuentos automáticos
 * crecientes por tramo (más días, menor precio/día). Ver research.md (Q1: opción C).
 *
 * Los porcentajes son defaults razonables alineados con prácticas comunes de alquiler;
 * se definen como constantes configurables para poder ajustarlos sin tocar la lógica.
 * Cuando la feature de listings §2 introduzca ListingPriceTier persistido, el servicio
 * podrá preferir tramos persistidos y caer a los derivados si no existen.
 */

interface TierConfig {
  days: number;
  discountPercent: number;
}

/** Tramos derivados por defecto: 1d (0%), 3d (5%), 7d (10%). */
export const PRICE_TIERS: readonly TierConfig[] = [
  { days: 1, discountPercent: 0 },
  { days: 3, discountPercent: 5 },
  { days: 7, discountPercent: 10 },
] as const;

const DAY_LABELS: Record<number, string> = {
  1: "1 día",
  3: "3 días",
  7: "7 días",
};

/** Redondea a 2 decimales (centavos). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Devuelve los 3 tramos derivados (1d, 3d, 7d) con precio/día y total calculados.
 */
export function derivePriceTiers(pricePerDay: number): PriceTierDTO[] {
  return PRICE_TIERS.map((tier) => {
    const effectivePerDay = round2(pricePerDay * (1 - tier.discountPercent / 100));
    return {
      days: tier.days,
      discountPercent: tier.discountPercent,
      pricePerDay: effectivePerDay,
      total: round2(effectivePerDay * tier.days),
      label: DAY_LABELS[tier.days] ?? `${tier.days} días`,
    };
  });
}

/**
 * Devuelve el tramo aplicable para N días:
 * - N ≤ 1 → tramo 1 día (0% descuento)
 * - 2 ≤ N ≤ 3 → tramo 3 días (5% descuento)
 * - N ≥ 4 → tramo 7 días (10% descuento)
 */
export function getApplicableTier(days: number, tiers: PriceTierDTO[]): PriceTierDTO {
  if (days <= 1) {
    return tiers.find((t) => t.days === 1) ?? tiers[0]!;
  }
  if (days <= 3) {
    return tiers.find((t) => t.days === 3) ?? tiers[1] ?? tiers[0]!;
  }
  return tiers.find((t) => t.days === 7) ?? tiers[2] ?? tiers[tiers.length - 1]!;
}

/**
 * Calcula el número de días entre dos fechas ISO (YYYY-MM-DD), inclusive.
 * Devuelve 0 si las fechas son iguales o inválidas.
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calcula el precio estimado para un rango seleccionado.
 * Valida contra fechas bloqueadas y devuelve isValid=false con blockedDatesInRange
 * si el rango incluye bloqueos.
 */
export function calculatePriceEstimate(
  pricePerDay: number,
  startDate: string,
  endDate: string,
  blockedDates: string[],
): PriceEstimate {
  const tiers = derivePriceTiers(pricePerDay);
  const days = daysBetween(startDate, endDate);

  // Rango inválido o vacío
  if (days <= 0) {
    return {
      days: 0,
      applicableTier: tiers[0]!,
      pricePerDay: round2(pricePerDay),
      total: 0,
      isValid: false,
      blockedDatesInRange: [],
    };
  }

  const applicableTier = getApplicableTier(days, tiers);

  // Fechas bloqueadas dentro del rango
  const blockedInRange = blockedDates.filter((d) => d >= startDate && d <= endDate);

  return {
    days,
    applicableTier,
    pricePerDay: applicableTier.pricePerDay,
    total: round2(applicableTier.pricePerDay * days),
    isValid: blockedInRange.length === 0,
    blockedDatesInRange: blockedInRange,
  };
}
