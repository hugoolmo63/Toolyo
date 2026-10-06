"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUpdateSearchParams } from "@/hooks/use-search-params";

interface ListingSuggestion {
  id: string;
  title: string;
  category: string;
}

/**
 * SearchBar — barra de búsqueda simple.
 * Sincroniza el texto con la URL al enviar.
 * Ver spec.md FR-002 y contracts/search.md.
 */
export function SearchBar({ compact = false }: { compact?: boolean }) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<ListingSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const updateParams = useUpdateSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const searchFor = (query: string) => {
    if (pathname.startsWith("/listings/")) {
      router.push(`/?q=${encodeURIComponent(query)}`);
      return;
    }
    updateParams({ query, page: null });
  };

  useEffect(() => {
    const query = inputValue.trim();
    if (!query) {
      setSuggestions([]);
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
          aria-expanded={isOpen && suggestions.length > 0}
          aria-controls="search-suggestions"
        />
        <button type="submit" className="search-submit" aria-label="Buscar">
          Buscar
        </button>
      </form>
      {isOpen && suggestions.length > 0 && (
        <ul id="search-suggestions" className="search-suggestions" role="listbox">
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
