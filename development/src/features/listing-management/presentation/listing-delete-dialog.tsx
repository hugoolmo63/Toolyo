"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";

export function ListingDeleteDialog({ listingId, title }: { listingId: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mutation = api.listingManagement.remove.useMutation({ onSuccess: () => router.push("/dashboard/products") });

  return (
    <>
      <button type="button" className="btn btn-ghost-danger btn-sm" onClick={() => setOpen(true)}>
        Retirar producto
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="remove-title" className="dialog-backdrop">
          <section className="dialog">
            <div className="dialog-body">
              <h2 id="remove-title">Retirar «{title}»</h2>
              <p>Dejará de estar disponible para nuevos alquileres. Esta acción no se puede deshacer desde el panel.</p>
              {mutation.error && <p role="alert" className="form-error">{mutation.error.message}</p>}
            </div>
            <div className="dialog-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
              <button type="button" className="btn btn-danger" disabled={mutation.isPending} onClick={() => mutation.mutate({ listingId, confirmation: true })}>
                Confirmar retirada
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
