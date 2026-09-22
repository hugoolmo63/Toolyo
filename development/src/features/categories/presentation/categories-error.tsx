"use client";

export default function CategoriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="alert alert-danger" role="alert">
      <h2 className="alert-title">No se pudieron cargar las categorías</h2>
      <p>{error.message}</p>
      <div className="form-actions">
        <button type="button" onClick={reset} className="btn btn-danger btn-sm">
          Reintentar
        </button>
      </div>
    </section>
  );
}
