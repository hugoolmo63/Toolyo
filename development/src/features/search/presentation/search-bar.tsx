"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";
import { useUpdateSearchParams } from "@/hooks/use-search-params";
import type {
  CategorySuggestion,
  LocationSuggestion,
} from "@/features/search/domain/search-result";

interface ListingSuggestion {
  id: string;
  title: string;
  category: string;
}

/**
 * SearchBar — barra de búsqueda con autocompletado diferenciado de ubicaciones,
 * categorías y productos. Sincroniza el estado con la URL al seleccionar o enviar.
 * Ver spec.md FR-002 y contracts/search.md.
 */
export function SearchBar({ compact = false }: { compact?: boolean }) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ListingSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const updateParams = useUpdateSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const suggestQuery = api.search.suggest.useQuery(
    { query: debouncedQuery, type: "all", limit: 4 },
    { enabled: debouncedQuery.length >= 2, staleTime: 30_000 },
  );
  const locationSuggestions = suggestQuery.data?.locations ?? [];
  const categorySuggestions = suggestQuery.data?.categories ?? [];

  const searchFor = (query: string) => {
    if (pathname.startsWith("/listings/")) {
      router.push(`/?q=${encodeURIComponent(query)}`);
      return;
    }
    updateParams({ query, page: null });
  };

  const searchLocation = (location: LocationSuggestion) => {
    if (pathname.startsWith("/listings/")) {
      router.push(
        `/?loc=${encodeURIComponent(location.text)}&lat=${location.lat}&lng=${location.lng}`,
      );
      return;
    }
    updateParams({
      query: null,
      locationText: location.text,
      lat: location.lat,
      lng: location.lng,
      page: null,
    });
  };

  const searchCategory = (category: CategorySuggestion) => {
    if (pathname.startsWith("/listings/")) {
      router.push(`/?cat=${encodeURIComponent(category.id)}`);
      return;
    }
    updateParams({ categoryId: category.id, page: null });
  };

  useEffect(() => {
    const query = inputValue.trim();
    if (!query) {
      setDebouncedQuery("");
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setDebouncedQuery(query);
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;

        const data = (await response.json()) as { suggestions: ListingSuggestion[] };
        setSuggestions(data.suggestions);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [inputValue]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!searchBarRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (inputValue.trim()) {
      searchFor(inputValue.trim());
    }
  };

  const hasSuggestions =
    locationSuggestions.length > 0 ||
    categorySuggestions.length > 0 ||
    suggestions.length > 0;

  return (
    <div className={`search-bar${compact ? " search-bar-compact" : ""}`} ref={searchBarRef}>
      <form role="search" onSubmit={handleSubmit}>
        <label htmlFor="search-input" className="sr-only">
          Buscar productos para alquilar
        </label>
        <input
          id="search-input"
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setSuggestions([]);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (inputValue.trim()) setIsOpen(true);
          }}
          placeholder={compact ? "Buscar productos..." : "Busca por producto, ubicación o categoría..."}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen && hasSuggestions}
          aria-controls="search-suggestions"
        />
        <button type="submit" className="search-submit" aria-label="Buscar">
          Buscar
        </button>
      </form>
      {isOpen && hasSuggestions && (
        <ul id="search-suggestions" className="search-suggestions" role="listbox">
          {locationSuggestions.map((location) => (
            <li key={`loc-${location.text}-${location.lat}-${location.lng}`}>
              <button
                type="button"
                className="suggestion-item"
                role="option"
                aria-selected="false"
                onClick={() => {
                  setInputValue("");
                  setSuggestions([]);
                  setIsOpen(false);
                  searchLocation(location);
                }}
              >
                <span className="suggestion-text">📍 {location.text}</span>
                <span className="suggestion-type">Ubicación</span>
              </button>
            </li>
          ))}
          {categorySuggestions.map((category) => (
            <li key={`cat-${category.id}`}>
              <button
                type="button"
                className="suggestion-item"
                role="option"
                aria-selected="false"
                onClick={() => {
                  setInputValue("");
                  setSuggestions([]);
                  setIsOpen(false);
                  searchCategory(category);
                }}
              >
                <span className="suggestion-text">{category.name}</span>
                <span className="suggestion-type">Categoría</span>
              </button>
            </li>
          ))}
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className="suggestion-item"
                role="option"
                aria-selected="false"
                onClick={() => {
                  setInputValue(suggestion.title);
                  setSuggestions([]);
                  setIsOpen(false);
                  searchFor(suggestion.title);
                }}
              >
                <span className="suggestion-text">{suggestion.title}</span>
                <span className="suggestion-type">{suggestion.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
