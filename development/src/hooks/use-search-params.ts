"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { z } from "zod";

/**
 * Hook sobre los query params de búsqueda usando next/navigation.
 * Lee y actualiza el estado de búsqueda en la URL sin recargar la página.
 * Ver contracts/search.md (Estado de búsqueda en URL).
 */

export const SEARCH_PARAMS_KEYS = {
  query: "q",
  locationText: "loc",
  lat: "lat",
  lng: "lng",
  categoryId: "cat",
  dateStart: "dateStart",
  dateEnd: "dateEnd",
  maxPrice: "maxPrice",
  maxDist: "maxDist",
  radius: "radius",
  minRating: "minRating",
  verified: "verified",
  sort: "sort",
  view: "view",
  page: "page",
  seed: "seed",
} as const;

export interface SearchUrlParams {
  query: string;
  locationText: string;
  lat: number | null;
  lng: number | null;
  categoryId: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  maxPrice: number | null;
  maxDist: number | null;
  radius: 5 | 10 | 20 | 50;
  minRating: number | null;
  verified: boolean;
  sort: string;
  view: "grid" | "list";
  page: number;
  seed: number | null;
}

function parseNumber(val: string | null): number | null {
  if (val === null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function parseBoolean(val: string | null): boolean {
  return val === "true" || val === "1";
}

/**
 * Lee los parámetros de búsqueda de la URL actual.
 */
export function useSearchParamsState(): SearchUrlParams {
  const searchParams = useSearchParams();

  return useMemo(
    () => ({
      query: searchParams.get(SEARCH_PARAMS_KEYS.query) ?? "",
      locationText: searchParams.get(SEARCH_PARAMS_KEYS.locationText) ?? "",
      lat: parseNumber(searchParams.get(SEARCH_PARAMS_KEYS.lat)),
      lng: parseNumber(searchParams.get(SEARCH_PARAMS_KEYS.lng)),
      categoryId: searchParams.get(SEARCH_PARAMS_KEYS.categoryId),
      dateStart: searchParams.get(SEARCH_PARAMS_KEYS.dateStart),
      dateEnd: searchParams.get(SEARCH_PARAMS_KEYS.dateEnd),
      maxPrice: parseNumber(searchParams.get(SEARCH_PARAMS_KEYS.maxPrice)),
      maxDist: parseNumber(searchParams.get(SEARCH_PARAMS_KEYS.maxDist)),
      radius: ([5, 10, 20, 50] as const).includes(Number(searchParams.get(SEARCH_PARAMS_KEYS.radius)) as 5 | 10 | 20 | 50)
        ? Number(searchParams.get(SEARCH_PARAMS_KEYS.radius)) as 5 | 10 | 20 | 50
        : 50,
      minRating: parseNumber(searchParams.get(SEARCH_PARAMS_KEYS.minRating)),
      verified: parseBoolean(searchParams.get(SEARCH_PARAMS_KEYS.verified)),
      sort: searchParams.get(SEARCH_PARAMS_KEYS.sort) ?? "relevance",
      view: (searchParams.get(SEARCH_PARAMS_KEYS.view) as "grid" | "list") ?? "grid",
      page: parseNumber(searchParams.get(SEARCH_PARAMS_KEYS.page)) ?? 1,
      seed: parseNumber(searchParams.get(SEARCH_PARAMS_KEYS.seed)),
    }),
    [searchParams],
  );
}

/**
 * Actualiza uno o más parámetros de búsqueda en la URL sin recargar.
 */
export function useUpdateSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (updates: Partial<Record<keyof typeof SEARCH_PARAMS_KEYS, string | number | boolean | null>>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        const urlKey = SEARCH_PARAMS_KEYS[key as keyof typeof SEARCH_PARAMS_KEYS];
        if (value === null || value === undefined || value === "" || value === false) {
          params.delete(urlKey);
        } else if (value === true) {
          params.set(urlKey, "true");
        } else {
          params.set(urlKey, String(value));
        }
      }
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );
}

/**
 * Limpia todos los filtros de búsqueda (resetea la URL).
 */
export function useClearSearchParams() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);
}
