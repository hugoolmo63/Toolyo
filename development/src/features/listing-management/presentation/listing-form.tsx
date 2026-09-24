"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";
import { CreateListingManagementSchema, type CreateListingManagementInput } from "../shared/listing-management.schema";
import { ListingPhotoEditor } from "./listing-photo-editor";

type Category = { id: string; name: string };
type InitialListing = { id: string; title: string; description: string | null; category: { id: string }; pricePerDay: string; location: { city: string | null; lat: number | null; lng: number | null; addressText: string | null }; photos: Array<{ url: string; altText: string | null; order: number }> };

export function ListingForm({ categories, initialListing }: { categories: Category[]; initialListing?: InitialListing }) {
  const router = useRouter();
  const form = useForm<CreateListingManagementInput>({ resolver: zodResolver(CreateListingManagementSchema), defaultValues: { title: initialListing?.title ?? "", description: initialListing?.description ?? "", categoryId: initialListing?.category.id ?? "", pricePerDay: initialListing?.pricePerDay ?? "", city: initialListing?.location.city ?? "", lat: initialListing?.location.lat, lng: initialListing?.location.lng, addressText: initialListing?.location.addressText ?? "", photos: initialListing?.photos.map((photo) => ({ url: photo.url, altText: photo.altText ?? "", order: photo.order })) ?? [], publish: false } });
  const createMutation = api.listingManagement.create.useMutation({ onSuccess: (result) => router.push(`/dashboard/products/${result.listingId}`) });
  const updateMutation = api.listingManagement.update.useMutation({ onSuccess: (result) => router.push(`/dashboard/products/${result.id}`) });
  const photos = form.watch("photos") ?? [];
  useEffect(() => { if (initialListing) form.reset({ title: initialListing.title, description: initialListing.description ?? "", categoryId: initialListing.category.id, pricePerDay: initialListing.pricePerDay, city: initialListing.location.city ?? "", lat: initialListing.location.lat, lng: initialListing.location.lng, addressText: initialListing.location.addressText ?? "", photos: initialListing.photos.map((photo) => ({ url: photo.url, altText: photo.altText ?? "", order: photo.order })), publish: false }); }, [initialListing, form]);
  const onSubmit = (values: CreateListingManagementInput) => { if (initialListing) { const { publish: _publish, ...updateValues } = values; updateMutation.mutate({ listingId: initialListing.id, ...updateValues }); } else createMutation.mutate(values); };
  const errorMessage = createMutation.error?.message ?? updateMutation.error?.message;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="listing-form" noValidate>
      <h1>{initialListing ? "Editar producto" : "Crear producto"}</h1>
      <label className="field">
        Título
        <input className="input" {...form.register("title")} aria-invalid={!!form.formState.errors.title} />
        {form.formState.errors.title && <span role="alert" className="field-error">{form.formState.errors.title.message}</span>}
      </label>
      <label className="field">
        Descripción
        <textarea className="input" {...form.register("description")} rows={5} />
      </label>
      <label className="field">
        Categoría
        <select className="input" {...form.register("categoryId")} aria-invalid={!!form.formState.errors.categoryId}>
          <option value="">Selecciona una categoría</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        {form.formState.errors.categoryId && <span role="alert" className="field-error">{form.formState.errors.categoryId.message}</span>}
      </label>
      <label className="field">
        Precio por día (€)
        <input className="input" type="text" inputMode="decimal" {...form.register("pricePerDay")} aria-invalid={!!form.formState.errors.pricePerDay} />
        {form.formState.errors.pricePerDay && <span role="alert" className="field-error">{form.formState.errors.pricePerDay.message}</span>}
      </label>
      <label className="field">
        Ciudad
        <input className="input" {...form.register("city")} />
      </label>
      <label className="field">
        Dirección aproximada
        <input className="input" {...form.register("addressText")} />
      </label>
      <div className="form-grid-2">
        <label className="field">
          Latitud
          <input className="input" type="number" step="any" {...form.register("lat", { setValueAs: (value) => value === "" ? null : Number(value) })} />
        </label>
        <label className="field">
          Longitud
          <input className="input" type="number" step="any" {...form.register("lng", { setValueAs: (value) => value === "" ? null : Number(value) })} />
        </label>
      </div>
      <ListingPhotoEditor photos={photos} setValue={form.setValue} errors={form.formState.errors.photos} />
      {errorMessage && <p role="alert" className="form-error">{errorMessage}</p>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {initialListing ? "Guardar cambios" : "Guardar borrador"}
        </button>
        {!initialListing && (
          <button type="submit" className="btn btn-secondary" onClick={() => form.setValue("publish", true, { shouldDirty: true })} disabled={isPending}>
            Publicar al crear
          </button>
        )}
      </div>
    </form>
  );
}
