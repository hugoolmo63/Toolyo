import { ValidationError } from "@/server/lib/errors/domain-errors";

export type DateRange = { startDate: Date; endDate: Date };

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseCalendarDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError("La fecha debe tener el formato YYYY-MM-DD");
  }

  const parts = value.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (year === undefined || month === undefined || day === undefined) {
    throw new ValidationError("La fecha no es válida");
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new ValidationError("La fecha no es válida");
  }
  return date;
}

export function assertValidDateRange(range: DateRange, today = startOfUtcDay(new Date())): void {
  if (range.endDate <= range.startDate) {
    throw new ValidationError("endDate debe ser posterior a startDate");
  }
  if (range.startDate < today) {
    throw new ValidationError("No se pueden solicitar reservas en fechas pasadas");
  }
}

export function totalDays(range: DateRange): number {
  const days = Math.round((startOfUtcDay(range.endDate).getTime() - startOfUtcDay(range.startDate).getTime()) / DAY_MS);
  if (days < 1) throw new ValidationError("La reserva debe tener al menos un día");
  return days;
}

/** Intervalos semiabiertos: [startDate, endDate). */
export function rangesOverlap(left: DateRange, right: DateRange): boolean {
  return left.startDate < right.endDate && right.startDate < left.endDate;
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
