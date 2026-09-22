import Link from "next/link";
import { createServerApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const api = await createServerApi();
  const categories = await api.category.list();

  return (
    <section>
      <div className="page-header">
        <h1 className="page-title">Categorías</h1>
        <Link href="/categories/new" className="btn btn-primary">
          Nueva categoría
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="page-subtitle">No hay categorías. Crea la primera.</p>
      ) : (
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.id} className="card">
              <div className="category-card-header">
                <strong className="category-name">{category.name}</strong>
                {category.showInNav ? (
                  <span className="badge badge-primary">En navegación</span>
                ) : null}
              </div>
              <p className="category-slug">/{category.slug}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
