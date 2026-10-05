"use client";

import { useEffect, useState } from "react";
import type { FieldErrors, UseFormSetValue } from "react-hook-form";
import { CameraUnavailableError, pickPhoto } from "@/lib/native/camera";
import { isNativeShell } from "@/lib/native/platform";
import { PermissionState } from "@/components/native/permission-state";
import type { CreateListingManagementInput } from "../shared/listing-management.schema";

type Photo = { url: string; altText?: string; order: number };
type PhotoErrors = FieldErrors<CreateListingManagementInput>["photos"];

// Límite defensivo: hasta que exista un endpoint de subida dedicado, la captura
// nativa se guarda como data URL y no debe superar este tamaño.
const MAX_DATA_URL_BYTES = 1_500_000;

export function ListingPhotoEditor({ photos, setValue, errors }: { photos: Photo[]; setValue: UseFormSetValue<CreateListingManagementInput>; errors?: PhotoErrors }) {
  const [native, setNative] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    setNative(isNativeShell());
  }, []);

  const addPhoto = () => setValue("photos", [...photos, { url: "", altText: "", order: photos.length }], { shouldDirty: true });
  const removePhoto = (index: number) => setValue("photos", photos.filter((_, current) => current !== index).map((photo, order) => ({ ...photo, order })), { shouldDirty: true });

  const capturePhoto = async (source: "camera" | "gallery") => {
    setCameraError(null);
    try {
      const picked = await pickPhoto(source);
      if (!picked) return;
      if (picked.dataUrl.length > MAX_DATA_URL_BYTES) {
        setCameraError("La imagen es demasiado grande. Prueba con otra o reduce su resolución.");
        return;
      }
      setValue("photos", [...photos, { url: picked.dataUrl, altText: "", order: photos.length }], { shouldDirty: true });
    } catch (err) {
      setCameraError(
        err instanceof CameraUnavailableError
          ? err.message
          : "No se pudo acceder a la cámara o galería. Revisa los permisos en los ajustes del dispositivo.",
      );
    }
  };

  return (
    <fieldset className="photo-editor">
      <legend>Imágenes</legend>
      {photos.map((photo, index) => (
        <div key={`${index}-${photo.url}`} className="photo-row">
          <label className="field">
            URL
            <input className="input" value={photo.url} onChange={(event) => setValue("photos", photos.map((item, current) => current === index ? { ...item, url: event.target.value } : item), { shouldDirty: true })} />
            {errors?.[index]?.url && <span role="alert" className="field-error">{errors[index]?.url?.message}</span>}
          </label>
          <label className="field">
            Texto alternativo
            <input className="input" value={photo.altText ?? ""} onChange={(event) => setValue("photos", photos.map((item, current) => current === index ? { ...item, altText: event.target.value } : item), { shouldDirty: true })} />
            {errors?.[index]?.altText && <span role="alert" className="field-error">{errors[index]?.altText?.message}</span>}
          </label>
          <button type="button" className="btn btn-ghost-danger btn-sm" onClick={() => removePhoto(index)} aria-label={`Eliminar imagen ${index + 1}`}>
            Eliminar
          </button>
        </div>
      ))}
      {errors?.message && <p role="alert" className="field-error">{errors.message}</p>}
      {cameraError && <PermissionState kind="camera">{cameraError}</PermissionState>}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={addPhoto} disabled={photos.length >= 10}>
          Añadir imagen
        </button>
        {native && (
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => capturePhoto("camera")} disabled={photos.length >= 10}>
              Tomar foto
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => capturePhoto("gallery")} disabled={photos.length >= 10}>
              Elegir de galería
            </button>
          </>
        )}
      </div>
    </fieldset>
  );
}
