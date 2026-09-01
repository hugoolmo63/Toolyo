"use client";

import { useState } from "react";
import { useUpdateSearchParams } from "@/hooks/use-search-params";

/**
 * SearchBar — barra de búsqueda simple.
 * Sincroniza el texto con la URL al enviar.
 * Ver spec.md FR-002 y contracts/search.md.
 */
export function SearchBar() {
  const [inputValue, setInputValue] = useState("");
  const updateParams = useUpdateSearchParams();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      updateParams({ query: inputValue.trim(), page: null });
    }
  };

  return (
    <div className="search-bar">
      <form role="search" onSubmit={handleSubmit}>
        <label htmlFor="search-input" className="sr-only">
          Buscar productos para alquilar
        </label>
        <input
          id="search-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Busca por producto, ubicación o categoría..."
          autoComplete="off"
        />
        <button type="submit" className="search-submit" aria-label="Buscar">
          Buscar
        </button>
      </form>
    </div>
  );
}
