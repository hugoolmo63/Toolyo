"use client";

import { Heart, X } from "lucide-react";
import { useState } from "react";
import { useAuthDialog } from "@/providers/auth-dialog-provider";
import { useSession } from "@/lib/hooks/use-session";

export interface FavoriteListDTO {
  id: string;
  name: string;
  items: Array<{ id: string; listingId: string; listing?: FavoriteListingDTO }>;
}

export interface FavoriteListingDTO {
  id: string;
  slug: string;
  title: string;
  pricePerDay: string | number;
  city: string | null;
  photos: Array<{ url: string }>;
}

interface FavoritePickerProps {
  listingId: string;
  onSavedChange?: (saved: boolean) => void;
}

export function FavoritePicker({ listingId, onSavedChange }: FavoritePickerProps) {
  const { isAuthenticated } = useSession();
  const { open: openLogin } = useAuthDialog();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<FavoriteListDTO[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const saved = lists.some((list) => list.items.some((item) => item.listingId === listingId));

  async function loadLists() {
    const response = await fetch("/api/favorites");
    if (!response.ok) throw new Error("No se han podido cargar tus listas.");
    setLists(await response.json());
  }

  async function handleOpen() {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    setError(null);
    try {
      await loadLists();
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se han podido cargar tus listas.");
    }
  }

  async function toggle(listId: string) {
    const response = await fetch("/api/favorites/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId, listingId }),
    });
    if (!response.ok) {
      setError("No se ha podido actualizar la lista.");
      return;
    }
    const result: { saved: boolean } = await response.json();
    setLists((current) =>
      current.map((list) =>
        list.id !== listId
          ? list
          : {
              ...list,
              items: result.saved
                ? [...list.items, { id: `${listId}-${listingId}`, listingId }]
                : list.items.filter((item) => item.listingId !== listingId),
            },
      ),
    );
    onSavedChange?.(result.saved || lists.some((list) => list.id !== listId && list.items.some((item) => item.listingId === listingId)));
  }

  async function createList(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/favorites/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (!response.ok) {
      setError("Escribe un nombre válido para la lista.");
      return;
    }
    const list = await response.json();
    const toggleResponse = await fetch("/api/favorites/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId: list.id, listingId }),
    });
    if (!toggleResponse.ok) {
      setError("La lista se creó, pero no se ha podido guardar el producto.");
      return;
    }
    setLists((current) => [...current, { ...list, items: [{ id: `${list.id}-${listingId}`, listingId }] }]);
    setNewName("");
  }

  return (
    <>
      <button
        type="button"
        className={`favorite-floating-button${saved ? " is-saved" : ""}`}
        onClick={handleOpen}
        aria-label={saved ? "Gestionar producto guardado" : "Guardar producto en favoritos"}
        aria-pressed={saved}
      >
        <Heart size={24} fill={saved ? "currentColor" : "none"} />
      </button>
      {open && (
        <div className="favorite-picker-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <section className="favorite-picker" role="dialog" aria-modal="true" aria-labelledby="favorite-picker-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="favorite-picker-close" onClick={() => setOpen(false)} aria-label="Cerrar">
              <X size={20} />
            </button>
            <h2 id="favorite-picker-title">Guardar en favoritos</h2>
            <p>Elige una lista para este producto:</p>
            <div className="favorite-list-options">
              {lists.map((list) => (
                <label key={list.id} className="favorite-list-option">
                  <input type="checkbox" checked={list.items.some((item) => item.listingId === listingId)} onChange={() => void toggle(list.id)} />
                  <span>{list.name}</span>
                </label>
              ))}
            </div>
            <form className="favorite-new-list-form" onSubmit={createList}>
              <input className="input" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Nueva lista" maxLength={100} />
              <button type="submit" className="btn btn-secondary">Crear</button>
            </form>
            {error && <p className="favorite-error" role="alert">{error}</p>}
          </section>
        </div>
      )}
    </>
  );
}
