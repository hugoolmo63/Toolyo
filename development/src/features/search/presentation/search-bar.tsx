"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, Package, Tag, X } from "lucide-react";
import { useUpdateSearchParams } from "@/hooks/use-search-params";

interface ProductSuggestion {
  kind: "product";
  id: string;
  title: string;
  category: string;
}

interface CategorySuggestion {
  kind: "category";
  id: string;
  name: string;
}

interface LocationSuggestion {
  kind: "location";
  text: string;
  lat: number;
  lng: number;
}

type SearchSuggestion = ProductSuggestion | CategorySuggestion | LocationSuggestion;

interface SuggestionGroups {
  locations: Omit<LocationSuggestion, "kind">[];
  categories: Omit<CategorySuggestion, "kind">[];
  products: Omit<ProductSuggestion, "kind">[];
}

const EMPTY_SUGGESTIONS: SuggestionGroups = {
  locations: [],
  categories: [],
  products: [],
};

/**
 * SearchBar — barra de búsqueda simple.
 * Sincroniza el texto con la URL al enviar.
 * Ver spec.md FR-002 y contracts/search.md.
 */
export function SearchBar({ compact = false }: { compact?: boolean }) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionGroups>(EMPTY_SUGGESTIONS);
  const [isOpen, setIsOpen] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const updateParams = useUpdateSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const allSuggestions: SearchSuggestion[] = [
    ...suggestions.locations.map((suggestion) => ({ ...suggestion, kind: "location" as const })),
    ...suggestions.categories.map((suggestion) => ({ ...suggestion, kind: "category" as const })),
    ...suggestions.products.map((suggestion) => ({ ...suggestion, kind: "product" as const })),
  ];
  const hasSuggestions = allSuggestions.length > 0;

  const searchFor = (query: string) => {
    if (pathname.startsWith("/listings/")) {
      router.push(`/?q=${encodeURIComponent(query)}`);
      return;
    }
    updateParams({ query, page: null });
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setInputValue(
      suggestion.kind === "location"
        ? suggestion.text
        : suggestion.kind === "category"
          ? suggestion.name
          : suggestion.title,
    );
    setSuggestions(EMPTY_SUGGESTIONS);
    setIsOpen(false);

    const filters = {
      query: suggestion.kind === "product" ? suggestion.title : null,
      locationText: suggestion.kind === "location" ? suggestion.text : null,
      lat: suggestion.kind === "location" ? suggestion.lat : null,
      lng: suggestion.kind === "location" ? suggestion.lng : null,
      radius: suggestion.kind === "location" ? 50 : null,
      categoryId: suggestion.kind === "category" ? suggestion.id : null,
      page: null,
    };

    if (pathname.startsWith("/listings/")) {
      const params = new URLSearchParams();
      if (filters.query) params.set("q", filters.query);
      if (filters.locationText) {
        params.set("loc", filters.locationText);
        params.set("lat", String(filters.lat));
        params.set("lng", String(filters.lng));
        params.set("radius", "50");
      }
      if (filters.categoryId) params.set("cat", filters.categoryId);
      router.push(`/?${params.toString()}`);
      return;
    }

    updateParams(filters);
  };

  useEffect(() => {
    const query = inputValue.trim();
    if (!query) {
      setSuggestions(EMPTY_SUGGESTIONS);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;

        const data = (await response.json()) as SuggestionGroups;
        setSuggestions({
          locations: data.locations ?? [],
          categories: data.categories ?? [],
          products: data.products ?? [],
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions(EMPTY_SUGGESTIONS);
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

  const submitSearch = () => {
    setIsOpen(false);
    if (inputValue.trim()) {
      const normalizedInput = inputValue.trim().toLocaleLowerCase();
      const matchingSuggestion = allSuggestions.find((suggestion) => {
        const label = suggestion.kind === "location"
          ? suggestion.text
          : suggestion.kind === "category"
            ? suggestion.name
            : suggestion.title;
        return label.toLocaleLowerCase().startsWith(normalizedInput);
      });

      if (matchingSuggestion) {
        selectSuggestion(matchingSuggestion);
      } else {
        searchFor(inputValue.trim());
      }
    }
  };

  return (
    <div className={`search-bar${compact ? " search-bar-compact" : ""}`} ref={searchBarRef}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <label htmlFor="search-input" className="sr-only">
          Buscar productos para alquilar
        </label>
        <input
          id="search-input"
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setSuggestions(EMPTY_SUGGESTIONS);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitSearch();
            }
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
        {inputValue && (
          <button
            type="button"
            className="search-clear"
            aria-label="Limpiar búsqueda"
            onClick={() => {
              setInputValue("");
              setSuggestions(EMPTY_SUGGESTIONS);
              setIsOpen(false);
            }}
          >
            <X aria-hidden="true" size={18} />
          </button>
        )}
      </form>
      {isOpen && hasSuggestions && (
        <div id="search-suggestions" className="search-suggestions" role="listbox" aria-label="Sugerencias de búsqueda">
          {suggestions.locations.length > 0 && (
            <div className="suggestion-group" role="group" aria-label="Ubicaciones">
              <h2 className="suggestion-heading">Ubicaciones</h2>
              {suggestions.locations.map((suggestion) => (
                <button
                  key={`${suggestion.lat},${suggestion.lng}`}
                  type="button"
                  className="suggestion-item"
                  role="option"
                  aria-selected="false"
                  onClick={() => selectSuggestion({ ...suggestion, kind: "location" })}
                >
                  <MapPin className="suggestion-icon" aria-hidden="true" size={18} />
                  <span className="suggestion-text">{suggestion.text}</span>
                  <span className="suggestion-type">Ubicación</span>
                </button>
              ))}
            </div>
          )}
          {suggestions.categories.length > 0 && (
            <div className="suggestion-group" role="group" aria-label="Categorías">
              <h2 className="suggestion-heading">Categorías</h2>
              {suggestions.categories.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="suggestion-item"
                  role="option"
                  aria-selected="false"
                  onClick={() => selectSuggestion({ ...suggestion, kind: "category" })}
                >
                  <Tag className="suggestion-icon" aria-hidden="true" size={18} />
                  <span className="suggestion-text">{suggestion.name}</span>
                  <span className="suggestion-type">Categoría</span>
                </button>
              ))}
            </div>
          )}
          {suggestions.products.length > 0 && (
            <div className="suggestion-group" role="group" aria-label="Productos">
              <h2 className="suggestion-heading">Productos</h2>
              {suggestions.products.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="suggestion-item"
                  role="option"
                  aria-selected="false"
                  onClick={() => selectSuggestion({ ...suggestion, kind: "product" })}
                >
                  <Package className="suggestion-icon" aria-hidden="true" size={18} />
                  <span className="suggestion-text">{suggestion.title}</span>
                  <span className="suggestion-type">Producto</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
