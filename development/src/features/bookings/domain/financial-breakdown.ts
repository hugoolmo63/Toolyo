import { Prisma } from "@prisma/client";
import { ValidationError } from "@/server/lib/errors/domain-errors";
import { totalDays, type DateRange } from "./date-range";

export type FinancialBreakdown = {
  pricePerDay: Prisma.Decimal;
  totalDays: number;
  subtotal: Prisma.Decimal;
  serviceFee: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  currencyCode: "EUR";
};

export function calculateFinancialBreakdown(
  pricePerDayInput: Prisma.Decimal | string | number,
  range: DateRange,
  serviceFeeRate = new Prisma.Decimal("0.10"),
): FinancialBreakdown {
  const pricePerDay = new Prisma.Decimal(pricePerDayInput);
  if (pricePerDay.lessThanOrEqualTo(0)) throw new ValidationError("El precio diario debe ser positivo");
  if (serviceFeeRate.lessThan(0) || serviceFeeRate.greaterThan(1)) throw new ValidationError("La comisión de servicio no es válida");

  const days = totalDays(range);
  const subtotal = pricePerDay.mul(days).toDecimalPlaces(4);
  const serviceFee = subtotal.mul(serviceFeeRate).toDecimalPlaces(4);
  const totalPrice = subtotal.add(serviceFee).toDecimalPlaces(4);

  return { pricePerDay, totalDays: days, subtotal, serviceFee, totalPrice, currencyCode: "EUR" };
}
