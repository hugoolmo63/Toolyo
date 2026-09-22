"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createApiClient } from "@/lib/trpc-client";
import {
  CreateCategorySchema,
  type CreateCategoryInput,
} from "../shared/category.schema";
import { useState } from "react";

/**
 * Formulario de creación de categoría (Client Component).
 */
export default function CategoryForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: { showInNav: true },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      const client = createApiClient();
      await client.category.create.mutate(data);
      router.push("/categories");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setSubmitError(message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="form-card">
      <h1 className="form-title">Nueva categoría</h1>

      <label className="field">
        Nombre
        <input
          {...register("name")}
          className="input"
          aria-invalid={!!errors.name}
          placeholder="p. ej. Electrónica"
        />
        {errors.name && (
          <span className="field-error" role="alert">{errors.name.message}</span>
        )}
      </label>

      <label className="field">
        Slug
        <input
          {...register("slug")}
          className="input"
          aria-invalid={!!errors.slug}
          placeholder="p. ej. electronica"
        />
        {errors.slug && (
          <span className="field-error" role="alert">{errors.slug.message}</span>
        )}
      </label>

      <label className="check-field">
        <input type="checkbox" {...register("showInNav")} />
        Mostrar en navegación
      </label>

      {submitError && (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Creando…" : "Crear categoría"}
      </button>
    </form>
  );
}
