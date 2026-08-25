"use client";

export default function CategoriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      style={{
        backgroundColor: "var(--ps-danger-50)",
        borderLeft: "4px solid var(--ps-danger-500)",
        color: "var(--ps-danger-500)",
        padding: "var(--ps-space-4, 16px)",
        borderRadius: "var(--ps-radius-md, 6px)",
      }}
    >
      <h2 style={{ fontSize: "var(--ps-text-lg, 18px)", fontWeight: 600 }}>
        No se pudieron cargar las categorías
      </h2>
      <p style={{ fontSize: "var(--ps-text-sm, 14px)" }}>{error.message}</p>
      <button
        onClick={reset}
        style={{
          marginTop: "var(--ps-space-3, 12px)",
          backgroundColor: "var(--ps-danger-500)",
          color: "#fff",
          border: "none",
          padding: "var(--ps-space-2, 8px) var(--ps-space-4, 16px)",
          borderRadius: "var(--ps-radius-md, 6px)",
          cursor: "pointer",
        }}
      >
        Reintentar
      </button>
    </section>
  );
}