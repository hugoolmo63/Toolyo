import {
  Camera,
  CameraResultType,
  CameraSource,
  type Photo,
} from "@capacitor/camera";
import { isNativeShell } from "./platform";

export interface PickedPhoto {
  /** Imagen como data URL, lista para previsualizar o enviar. */
  dataUrl: string;
  format: string;
}

export class CameraUnavailableError extends Error {}

/**
 * Captura una foto con la cámara o la elige de la galería (FR-008).
 * En navegador devuelve `null`: la UI usa `<input type="file">`.
 */
export async function pickPhoto(
  source: "camera" | "gallery",
): Promise<PickedPhoto | null> {
  if (!isNativeShell()) {
    return null;
  }

  const photo: Photo = await Camera.getPhoto({
    resultType: CameraResultType.DataUrl,
    source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
    quality: 85,
    allowEditing: false,
  });

  if (!photo.dataUrl) {
    throw new CameraUnavailableError("No se pudo obtener la imagen.");
  }

  return { dataUrl: photo.dataUrl, format: photo.format };
}
