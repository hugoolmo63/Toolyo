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
    <form
      onSubmit={onSubmit}
      style={{
        backgroundColor: "var(--ps-surface-0)",
        border: "1px solid var(--ps-neutral-200)",
        borderRadius: "var(--ps-radius-lg, 8px)",
        padding: "var(--ps-space-6, 24px)",
        boxShadow: "var(--ps-shadow-md)",
        display: "grid",
        gap: "var(--ps-space-4, 16px)",
        maxWidth: 480,
      }}
    >
      <h1 style={{ fontSize: "var(--ps-text-2xl, 24px)", fontWeight: 700, margin: 0 }}>
        Nueva categoría
      </h1>

      <label
        style={{
          display: "grid",
          gap: "var(--ps-space-1, 4px)",
          fontSize: "var(--ps-text-sm, 14px)",
          fontWeight: 500,
          color: "var(--ps-neutral-700)",
        }}
      >
        Nombre
        <input
          {...register("name")}
          style={inputStyle(!!errors.name)}
          placeholder="p. ej. Electrónica"
        />
        {errors.name && <span style={{ color: "var(--ps-danger-500)" }}>{errors.name.message}</span>}
      </label>

      <label
        style={{
          display: "grid",
          gap: "var(--ps-space-1, 4px)",
          fontSize: "var(--ps-text-sm, 14px)",
          fontWeight: 500,
          color: "var(--ps-neutral-700)",
        }}
      >
        Slug
        <input
          {...register("slug")}
          style={inputStyle(!!errors.slug)}
          placeholder="p. ej. electronica"
        />
        {errors.slug && <span style={{ color: "var(--ps-danger-500)" }}>{errors.slug.message}</span>}
      </label>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--ps-space-2, 8px)",
          fontSize: "var(--ps-text-sm, 14px)",
          color: "var(--ps-neutral-700)",
        }}
      >
        <input type="checkbox" {...register("showInNav")} />
        Mostrar en navegación
      </label>

      {submitError && (
        <p style={{ color: "var(--ps-danger-500)", fontSize: "var(--ps-text-sm, 14px)" }}>
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          backgroundColor: "var(--ps-primary-500)",
          color: "#fff",
          border: "none",
          padding: "var(--ps-space-3, 12px) var(--ps-space-4, 16px)",
          borderRadius: "var(--ps-radius-md, 6px)",
          fontSize: "var(--ps-text-base, 16px)",
          fontWeight: 500,
          cursor: isSubmitting ? "not-allowed" : "pointer",
          opacity: isSubmitting ? 0.5 : 1,
        }}
      >
        {isSubmitting ? "Creando…" : "Crear categoría"}
      </button>
    </form>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    height: 40,
    padding: "0 var(--ps-space-3, 12px)",
    border: `1px solid ${hasError ? "var(--ps-danger-500)" : "var(--ps-neutral-300)"}`,
    borderRadius: "var(--ps-radius-sm, 4px)",
    fontSize: "var(--ps-text-base, 16px)",
    backgroundColor: "var(--ps-surface-0)",
  };
}