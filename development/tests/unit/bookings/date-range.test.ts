import { describe, expect, it } from "vitest";
import { assertValidDateRange, parseCalendarDate, rangesOverlap, totalDays } from "@/features/bookings/domain/date-range";

describe("booking date range", () => {
  it("counts calendar days using an exclusive end date", () => {
    const range = { startDate: parseCalendarDate("2030-06-01"), endDate: parseCalendarDate("2030-06-04") };
    expect(totalDays(range)).toBe(3);
  });

  it("allows adjacent ranges but rejects overlapping ranges", () => {
    const first = { startDate: parseCalendarDate("2030-06-01"), endDate: parseCalendarDate("2030-06-04") };
    const adjacent = { startDate: parseCalendarDate("2030-06-04"), endDate: parseCalendarDate("2030-06-06") };
    const overlap = { startDate: parseCalendarDate("2030-06-03"), endDate: parseCalendarDate("2030-06-06") };
    expect(rangesOverlap(first, adjacent)).toBe(false);
    expect(rangesOverlap(first, overlap)).toBe(true);
  });

  it("rejects invalid and past ranges", () => {
    expect(() => parseCalendarDate("2030-02-30")).toThrow();
    expect(() => assertValidDateRange({ startDate: parseCalendarDate("2030-06-04"), endDate: parseCalendarDate("2030-06-04") })).toThrow();
    expect(() => assertValidDateRange({ startDate: parseCalendarDate("2020-06-01"), endDate: parseCalendarDate("2020-06-02") }, parseCalendarDate("2030-01-01"))).toThrow();
  });
});
