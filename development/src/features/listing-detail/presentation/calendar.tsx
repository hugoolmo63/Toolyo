"use client";

import { useDateRange } from "@/hooks/use-date-range";
import type { PriceTierDTO } from "@/types/listing-detail";
import { calculatePriceEstimate } from "../domain/price-tiers";

/**
 * Calendar — calendario de disponibilidad interactivo con selección de rango.
 * Marca fechas bloqueadas, permite seleccionar recogida y devolución, sincroniza
 * con la URL vía nuqs (?start=...&end=...). Ver spec.md FR-005.
 *
 * Placeholder mínimo: la implementación completa está en US2 (T033).
 */
interface CalendarProps {
  availability: string[];
  pricePerDay: number;
}

export function Calendar({ availability, pricePerDay }: CalendarProps) {
  const { start, end, setRange, clearRange } = useDateRange();

  const blockedSet = new Set(availability);

  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && (!end || value < end)) {
      setRange(value, end ?? value);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && (!start || value > start)) {
      setRange(start ?? value, value);
    }
  };

  const estimate =
    start && end
      ? calculatePriceEstimate(pricePerDay, start, end, availability)
      : null;

  return (
    <div className="calendar">
      <div className="calendar-inputs">
        <label htmlFor="calendar-start">Recogida</label>
        <input
          id="calendar-start"
          type="date"
          value={start ?? ""}
          min={todayISO}
          onChange={handleStartChange}
          aria-label="Fecha de recogida"
        />
        <label htmlFor="calendar-end">Devolución</label>
        <input
          id="calendar-end"
          type="date"
          value={end ?? ""}
          min={start ?? todayISO}
          onChange={handleEndChange}
          aria-label="Fecha de devolución"
        />
      </div>

      {start && end && (
        <div className="calendar-summary">
          <p>
            {estimate?.days ?? 0} día{(estimate?.days ?? 0) !== 1 ? "s" : ""}
          </p>
          {estimate && !estimate.isValid && (
            <p className="calendar-warning" role="alert">
              El rango incluye {estimate.blockedDatesInRange.length} fecha(s) bloqueada(s).
            </p>
          )}
          <button type="button" onClick={clearRange} className="calendar-clear-btn">
            Limpiar selección
          </button>
        </div>
      )}

      {availability.length > 0 && (
        <p className="calendar-blocked-info">
          Hay {availability.length} fecha(s) no disponible(s) en el futuro.
        </p>
      )}
    </div>
  );
}

// Re-export para evitar import no usado en este placeholder
export type { PriceTierDTO };
