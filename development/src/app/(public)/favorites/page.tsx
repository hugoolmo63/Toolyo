"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/hooks/use-session";
import { useAuthDialog } from "@/providers/auth-dialog-provider";
import type { FavoriteListDTO } from "@/features/favorites/presentation/favorite-picker";

export default function FavoritesPage() {
  const { isLoading, isAuthenticated } = useSession();
  const { open: openLogin } = useAuthDialog();
  const [lists, setLists] = useState<FavoriteListDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/favorites")
      .then(async (response) => {
        if (!response.ok) throw new Error("No se han podido cargar tus favoritos.");
        setLists(await response.json());
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Error al cargar favoritos."));
  }, [isAuthenticated]);

  async function remove(listId: string, listingId: string) {
    const response = await fetch("/api/favorites/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId, listingId }),
    });
    if (!response.ok) {
      setError("No se ha podido eliminar el producto.");
      return;
    }

    setLists((current) => current.map((list) => list.id === listId ? { ...list, items: list.items.filter((item) => item.listingId !== listingId) } : list));
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
    setLists((current) => [...current, { ...list, items: [] }]);
    setNewName("");
  }

  if (isLoading) return <div className="favorites-page"><p>Cargando favoritos...</p></div>;
  if (!isAuthenticated) {
    return <div className="favorites-page"><h1>Mis favoritos</h1><p>Inicia sesión para gestionar tus listas.</p><button className="btn btn-primary" type="button" onClick={() => openLogin()}>Iniciar sesión</button></div>;
  }

  return (
    <div className="favorites-page">
      <h1>Mis favoritos</h1>
      {error && <p className="favorite-error" role="alert">{error}</p>}
      <form className="favorite-new-list-form favorites-create-list" onSubmit={createList}>
        <input className="input" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Nombre de nueva lista" maxLength={100} />
        <button type="submit" className="btn btn-secondary">Crear lista</button>
      </form>
      {lists.length === 0 && <p>Aún no tienes listas. Guarda un producto para crear tu primera lista.</p>}
      <div className="favorites-lists">
        {lists.map((list) => (
          <section key={list.id} className="favorites-list card">
            <h2>{list.name}</h2>
            {list.items.length === 0 ? <p>Esta lista está vacía.</p> : (
              <div className="favorites-items">
                {list.items.map((item) => item.listing && (
                  <article key={item.id} className="favorite-item">
                    <Link href={`/listings/${item.listing.slug}`} className="favorite-item-link">
                      {item.listing.photos[0] ? <Image src={item.listing.photos[0].url} alt="" width={96} height={72} unoptimized /> : <div className="favorite-item-placeholder" />}
                      <span><strong>{item.listing.title}</strong><small>{item.listing.pricePerDay} €/día{item.listing.city ? ` · ${item.listing.city}` : ""}</small></span>
                    </Link>
                    <button type="button" className="btn btn-ghost-danger btn-sm" onClick={() => void remove(list.id, item.listingId)}>Quitar</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
