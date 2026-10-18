"use client";

import { useEffect, useRef } from "react";

/**
 * Hook de scroll infinito: observa un elemento centinela con IntersectionObserver
 * y dispara `onLoadMore` cuando entra en el viewport.
 * Devuelve la ref a colocar en el centinela; el centinela solo debe renderizarse
 * mientras existan más elementos por cargar.
 */
interface UseInfiniteScrollOptions {
  /** Observar solo cuando hay más contenido y no hay una carga en curso. */
  enabled: boolean;
  onLoadMore: () => void;
  /** Margen del root para precargar antes de llegar al final (default "200px"). */
  rootMargin?: string;
}

export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  enabled,
  onLoadMore,
  rootMargin = "200px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<T>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!enabled) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return sentinelRef;
}
