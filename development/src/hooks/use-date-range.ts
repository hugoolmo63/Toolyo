"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

/**
 * Hook sobre los query params `start` y `end` (rango de fechas del detalle).
 * Lee y actualiza el rango en la URL sin recargar la página.
 * Fuente de verdad compartible y restaurable. Ver contracts/listing-detail.md.
 */

const START_KEY = "start";
const END_KEY = "end";

export interface UseDateRangeResult {
  start: string | null;
  end: string | null;
  setRange: (start: string, end: string) => void;
  clearRange: () => void;
}

/**
 * Lee el rango de fechas de la URL actual.
 */
export function useDateRange(): UseDateRangeResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const start = searchParams.get(START_KEY);
  const end = searchParams.get(END_KEY);

  const setRange = useCallback(
    (newStart: string, newEnd: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(START_KEY, newStart);
      params.set(END_KEY, newEnd);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const clearRange = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(START_KEY);
    params.delete(END_KEY);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  return useMemo(
    () => ({ start, end, setRange, clearRange }),
    [start, end, setRange, clearRange],
  );
}
