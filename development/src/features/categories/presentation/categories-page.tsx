import Link from "next/link";
import { createServerApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const api = await createServerApi();
  const categories = await api.category.list();

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--ps-space-6, 24px)",
        }}
      >
        <h1 style={{ fontSize: "var(--ps-text-3xl, 30px)", fontWeight: 700 }}>Categorías</h1>
        <Link
          href="/categories/new"
          style={{
            backgroundColor: "var(--ps-primary-500)",
            color: "#fff",
            padding: "var(--ps-space-3, 12px) var(--ps-space-4, 16px)",
            borderRadius: "var(--ps-radius-md, 6px)",
            fontSize: "var(--ps-text-sm, 14px)",
            fontWeight: 500,
          }}
        >
          Nueva categoría
        </Link>
      </div>

      {categories.length === 0 ? (
        <p style={{ color: "var(--ps-neutral-600)" }}>No hay categorías. Crea la primera.</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            display: "grid",
            gap: "var(--ps-space-4, 16px)",
          }}
        >
          {categories.map((category) => (
            <li
              key={category.id}
              style={{
                backgroundColor: "var(--ps-surface-0)",
                border: "1px solid var(--ps-neutral-200)",
                borderRadius: "var(--ps-radius-lg, 8px)",
                padding: "var(--ps-space-5, 20px)",
                boxShadow: "var(--ps-shadow-md)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong style={{ color: "var(--ps-neutral-800)" }}>{category.name}</strong>
                {category.showInNav ? (
                  <span
                    style={{
                      backgroundColor: "var(--ps-primary-50)",
                      color: "var(--ps-primary-700)",
                      fontSize: "var(--ps-text-xs, 12px)",
                      fontWeight: 600,
                      padding: "var(--ps-space-1, 4px) var(--ps-space-2, 8px)",
                      borderRadius: "var(--ps-radius-full, 9999px)",
                    }}
                  >
                    En navegación
                  </span>
                ) : null}
              </div>
              <p style={{ color: "var(--ps-neutral-500)", fontSize: "var(--ps-text-sm, 14px)" }}>
                /{category.slug}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}