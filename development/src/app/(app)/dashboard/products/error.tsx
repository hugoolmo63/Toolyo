"use client";

export default function ProductsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="page-message">
      <h1>No se pudo cargar el panel</h1>
      <p>Inténtalo de nuevo.</p>
      <button type="button" onClick={reset} className="btn btn-primary">Reintentar</button>
    </div>
  );
}
