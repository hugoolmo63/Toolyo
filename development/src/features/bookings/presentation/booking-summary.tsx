/**
 * BookingSummary — desglose financiero de previsualización (008-modulo-reservas, §4.3).
 * Replica la regla del servidor (pricePerDay × días + 10% service fee) solo para
 * mostrar el estimado; el backend recalcula y congela el snapshot real.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const SERVICE_FEE_RATE = 0.1;

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function formatEur(amount: number | string): string {
  return eur.format(Number(amount));
}

function parseDay(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

interface BookingSummaryProps {
  pricePerDay: number;
  /** ISO date YYYY-MM-DD */
  startDate: string;
  /** ISO date YYYY-MM-DD */
  endDate: string;
}

export function BookingSummary({ pricePerDay, startDate, endDate }: BookingSummaryProps) {
  const days = Math.round((parseDay(endDate) - parseDay(startDate)) / DAY_MS);
  if (!Number.isFinite(days) || days < 1) {
    return <p className="form-error">El rango de fechas no es válido.</p>;
  }

  const subtotal = pricePerDay * days;
  const serviceFee = subtotal * SERVICE_FEE_RATE;

  return (
    <dl className="booking-summary">
      <div className="booking-summary-row">
        <dt>
          {days} {days === 1 ? "día" : "días"} × {formatEur(pricePerDay)}
        </dt>
        <dd>{formatEur(subtotal)}</dd>
      </div>
      <div className="booking-summary-row">
        <dt>Comisión de servicio</dt>
        <dd>{formatEur(serviceFee)}</dd>
      </div>
      <div className="booking-summary-row booking-summary-total">
        <dt>Total</dt>
        <dd>{formatEur(subtotal + serviceFee)}</dd>
      </div>
    </dl>
  );
}
