"use client";

import type { UseFormSetValue } from "react-hook-form";
import type { CreateListingManagementInput } from "../shared/listing-management.schema";

type Photo = { url: string; altText?: string; order: number };

export function ListingPhotoEditor({ photos, setValue }: { photos: Photo[]; setValue: UseFormSetValue<CreateListingManagementInput> }) {
  const addPhoto = () => setValue("photos", [...photos, { url: "", altText: "", order: photos.length }], { shouldDirty: true });
  const removePhoto = (index: number) => setValue("photos", photos.filter((_, current) => current !== index).map((photo, order) => ({ ...photo, order })), { shouldDirty: true });

  return (
    <fieldset className="photo-editor">
      <legend>Imágenes</legend>
      {photos.map((photo, index) => (
        <div key={`${index}-${photo.url}`} className="photo-row">
          <label className="field">
            URL
            <input className="input" value={photo.url} onChange={(event) => setValue("photos", photos.map((item, current) => current === index ? { ...item, url: event.target.value } : item), { shouldDirty: true })} />
          </label>
          <label className="field">
            Texto alternativo
            <input className="input" value={photo.altText ?? ""} onChange={(event) => setValue("photos", photos.map((item, current) => current === index ? { ...item, altText: event.target.value } : item), { shouldDirty: true })} />
          </label>
          <button type="button" className="btn btn-ghost-danger btn-sm" onClick={() => removePhoto(index)} aria-label={`Eliminar imagen ${index + 1}`}>
            Eliminar
          </button>
        </div>
      ))}
      <div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addPhoto} disabled={photos.length >= 10}>
          Añadir imagen
        </button>
      </div>
    </fieldset>
  );
}
