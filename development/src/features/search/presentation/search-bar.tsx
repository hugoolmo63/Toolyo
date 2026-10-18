"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useUpdateSearchParams } from "@/hooks/use-search-params";

/**
 * SearchBar — barra de búsqueda simple.
 * Sincroniza el texto con la URL al enviar (Enter o submit del formulario).
 * Sin type-as-you-search: la búsqueda tokenizada solo se lanza al enviar.
 * Ver spec.md y contracts/search.md.
 */
export function SearchBar({ compact = false }: { compact?: boolean }) {
  const [inputValue, setInputValue] = useState("");
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

  const submitSearch = () => {
    const query = inputValue.trim();
    if (query) searchFor(query);
  };

  return (
    <div className={`search-bar${compact ? " search-bar-compact" : ""}`}>
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
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitSearch();
            }
          }}
          placeholder={compact ? "Buscar productos..." : "Busca por producto, ubicación o categoría..."}
          autoComplete="off"
        />
        {inputValue && (
          <button
            type="button"
            className="search-clear"
            aria-label="Limpiar búsqueda"
            onClick={() => setInputValue("")}
          >
            <X aria-hidden="true" size={18} />
          </button>
        )}
      </form>
    </div>
  );
}
