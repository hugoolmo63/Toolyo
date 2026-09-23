import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { calculateFinancialBreakdown } from "@/features/bookings/domain/financial-breakdown";
import { parseCalendarDate } from "@/features/bookings/domain/date-range";

describe("booking financial breakdown", () => {
  it("calculates Decimal totals and service fee without floating point drift", () => {
    const result = calculateFinancialBreakdown(new Prisma.Decimal("19.99"), {
      startDate: parseCalendarDate("2030-06-01"),
      endDate: parseCalendarDate("2030-06-04"),
    }, new Prisma.Decimal("0.10"));
    expect(result.totalDays).toBe(3);
    expect(result.subtotal.toString()).toBe("59.97");
    expect(result.serviceFee.toString()).toBe("5.997");
    expect(result.totalPrice.toString()).toBe("65.967");
  });

  it("rejects non-positive prices", () => {
    expect(() => calculateFinancialBreakdown(0, { startDate: parseCalendarDate("2030-06-01"), endDate: parseCalendarDate("2030-06-02") })).toThrow();
  });
});
