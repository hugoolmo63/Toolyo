"use client";

export default function ProductDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="page-message">
      <h1>No se pudo cargar el producto</h1>
      <button type="button" onClick={reset} className="btn btn-primary">Reintentar</button>
    </div>
  );
}
