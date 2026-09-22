"use client";

import { useDateRange } from "@/hooks/use-date-range";
import type { PriceTierDTO } from "@/types/listing-detail";
import { calculatePriceEstimate } from "../domain/price-tiers";

/**
 * PriceTable — tabla de tramos derivados + total estimado según rango seleccionado.
 * Recalcula sin recargar al cambiar el rango. Ver spec.md FR-006.
 *
 * Placeholder mínimo: la implementación completa está en US2 (T034).
 */
interface PriceTableProps {
  pricePerDay: number;
  priceTiers: PriceTierDTO[];
  availability: string[];
}

export function PriceTable({ pricePerDay, priceTiers, availability }: PriceTableProps) {
  const { start, end } = useDateRange();

  const estimate =
    start && end
      ? calculatePriceEstimate(pricePerDay, start, end, availability)
      : null;

  return (
    <section className="price-table" aria-labelledby="price-heading">
      <h2 id="price-heading">Precios</h2>
      <table className="price-tiers-table">
        <thead>
          <tr>
            <th scope="col">Tramo</th>
            <th scope="col">Descuento</th>
            <th scope="col">Precio/día</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {priceTiers.map((tier) => {
            const isApplicable = estimate?.applicableTier.days === tier.days;
            return (
              <tr
                key={tier.days}
                className={`price-tier-row ${isApplicable ? "price-tier-active" : ""}`}
              >
                <td>{tier.label}</td>
                <td>{tier.discountPercent}%</td>
                <td>{tier.pricePerDay} €</td>
                <td>{tier.total} €</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {estimate && estimate.days > 0 && (
        <div className="price-estimate" aria-live="polite">
          <p className="price-estimate-days">
            Total estimado para {estimate.days} día{estimate.days !== 1 ? "s" : ""}:
          </p>
          <p className="price-estimate-total">{estimate.total} €</p>
          {!estimate.isValid && (
            <p className="price-estimate-warning" role="alert">
              El rango seleccionado incluye fechas bloqueadas.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
