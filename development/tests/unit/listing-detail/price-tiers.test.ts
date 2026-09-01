import { describe, expect, it } from "vitest";
import {
  derivePriceTiers,
  getApplicableTier,
  daysBetween,
  calculatePriceEstimate,
  PRICE_TIERS,
} from "@/features/listing-detail/domain/price-tiers";

describe("price-tiers", () => {
  describe("derivePriceTiers", () => {
    it("devuelve 3 tramos (1d, 3d, 7d) con descuentos 0%, 5%, 10%", () => {
      const tiers = derivePriceTiers(100);
      expect(tiers).toHaveLength(3);
      expect(tiers[0]!.days).toBe(1);
      expect(tiers[0]!.discountPercent).toBe(0);
      expect(tiers[1]!.days).toBe(3);
      expect(tiers[1]!.discountPercent).toBe(5);
      expect(tiers[2]!.days).toBe(7);
      expect(tiers[2]!.discountPercent).toBe(10);
    });

    it("calcula precio/día y total correctos para cada tramo", () => {
      const tiers = derivePriceTiers(100);
      // 1d: 100 × 1.0 = 100/día, total 100
      expect(tiers[0]!.pricePerDay).toBe(100);
      expect(tiers[0]!.total).toBe(100);
      // 3d: 100 × 0.95 = 95/día, total 285
      expect(tiers[1]!.pricePerDay).toBe(95);
      expect(tiers[1]!.total).toBe(285);
      // 7d: 100 × 0.90 = 90/día, total 630
      expect(tiers[2]!.pricePerDay).toBe(90);
      expect(tiers[2]!.total).toBe(630);
    });

    it("incluye labels legibles", () => {
      const tiers = derivePriceTiers(50);
      expect(tiers[0]!.label).toBe("1 día");
      expect(tiers[1]!.label).toBe("3 días");
      expect(tiers[2]!.label).toBe("7 días");
    });

    it("redondea a 2 decimales", () => {
      // 33.33 × 0.95 = 31.6635 → 31.66
      const tiers = derivePriceTiers(33.33);
      expect(tiers[1]!.pricePerDay).toBe(31.66);
      expect(tiers[1]!.total).toBe(94.98);
    });

    it("PRICE_TIERS constante tiene 3 entradas", () => {
      expect(PRICE_TIERS).toHaveLength(3);
    });
  });

  describe("getApplicableTier", () => {
    const tiers = derivePriceTiers(100);

    it("N=1 → tramo 1 día (0% descuento)", () => {
      const t = getApplicableTier(1, tiers);
      expect(t.days).toBe(1);
      expect(t.discountPercent).toBe(0);
    });

    it("N=2 → tramo 3 días (5% descuento)", () => {
      const t = getApplicableTier(2, tiers);
      expect(t.days).toBe(3);
      expect(t.discountPercent).toBe(5);
    });

    it("N=3 → tramo 3 días (5% descuento)", () => {
      const t = getApplicableTier(3, tiers);
      expect(t.days).toBe(3);
      expect(t.discountPercent).toBe(5);
    });

    it("N=4 → tramo 7 días (10% descuento)", () => {
      const t = getApplicableTier(4, tiers);
      expect(t.days).toBe(7);
      expect(t.discountPercent).toBe(10);
    });

    it("N=7 → tramo 7 días (10% descuento)", () => {
      const t = getApplicableTier(7, tiers);
      expect(t.days).toBe(7);
      expect(t.discountPercent).toBe(10);
    });

    it("N=10 → tramo 7 días (10% descuento)", () => {
      const t = getApplicableTier(10, tiers);
      expect(t.days).toBe(7);
      expect(t.discountPercent).toBe(10);
    });
  });

  describe("daysBetween", () => {
    it("calcula días entre dos fechas", () => {
      expect(daysBetween("2026-09-01", "2026-09-04")).toBe(3);
    });

    it("devuelve 0 para fechas iguales", () => {
      expect(daysBetween("2026-09-01", "2026-09-01")).toBe(0);
    });

    it("devuelve 0 para end < start", () => {
      expect(daysBetween("2026-09-05", "2026-09-01")).toBe(0);
    });

    it("devuelve 0 para fechas inválidas", () => {
      expect(daysBetween("invalid", "2026-09-01")).toBe(0);
    });

    it("maneja cambio de mes", () => {
      expect(daysBetween("2026-09-28", "2026-10-02")).toBe(4);
    });
  });

  describe("calculatePriceEstimate", () => {
    it("calcula total para 1 día con tramo 1d (sin descuento)", () => {
      const est = calculatePriceEstimate(100, "2026-09-01", "2026-09-02", []);
      expect(est.days).toBe(1);
      expect(est.applicableTier.days).toBe(1);
      expect(est.pricePerDay).toBe(100);
      expect(est.total).toBe(100);
      expect(est.isValid).toBe(true);
      expect(est.blockedDatesInRange).toEqual([]);
    });

    it("calcula total para 3 días con tramo 3d (5% descuento)", () => {
      const est = calculatePriceEstimate(100, "2026-09-01", "2026-09-04", []);
      expect(est.days).toBe(3);
      expect(est.applicableTier.days).toBe(3);
      expect(est.pricePerDay).toBe(95);
      expect(est.total).toBe(285);
      expect(est.isValid).toBe(true);
    });

    it("calcula total para 5 días con tramo 7d (10% descuento)", () => {
      const est = calculatePriceEstimate(100, "2026-09-01", "2026-09-06", []);
      expect(est.days).toBe(5);
      expect(est.applicableTier.days).toBe(7);
      expect(est.pricePerDay).toBe(90);
      expect(est.total).toBe(450);
      expect(est.isValid).toBe(true);
    });

    it("calcula total para 7 días con tramo 7d (10% descuento)", () => {
      const est = calculatePriceEstimate(100, "2026-09-01", "2026-09-08", []);
      expect(est.days).toBe(7);
      expect(est.applicableTier.days).toBe(7);
      expect(est.pricePerDay).toBe(90);
      expect(est.total).toBe(630);
      expect(est.isValid).toBe(true);
    });

    it("marca isValid=false cuando el rango incluye fechas bloqueadas", () => {
      const est = calculatePriceEstimate(
        100,
        "2026-09-01",
        "2026-09-04",
        ["2026-09-02", "2026-09-10"],
      );
      expect(est.isValid).toBe(false);
      expect(est.blockedDatesInRange).toEqual(["2026-09-02"]);
    });

    it("devuelve blockedDatesInRange vacío si no hay bloqueos en el rango", () => {
      const est = calculatePriceEstimate(
        100,
        "2026-09-01",
        "2026-09-04",
        ["2026-09-10", "2026-09-15"],
      );
      expect(est.isValid).toBe(true);
      expect(est.blockedDatesInRange).toEqual([]);
    });

    it("rango vacío (mismo día) devuelve isValid=false y total 0", () => {
      const est = calculatePriceEstimate(100, "2026-09-01", "2026-09-01", []);
      expect(est.days).toBe(0);
      expect(est.total).toBe(0);
      expect(est.isValid).toBe(false);
    });

    it("rango inválido (end < start) devuelve isValid=false y total 0", () => {
      const est = calculatePriceEstimate(100, "2026-09-05", "2026-09-01", []);
      expect(est.days).toBe(0);
      expect(est.total).toBe(0);
      expect(est.isValid).toBe(false);
    });
  });
});
