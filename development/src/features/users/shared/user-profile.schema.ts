import { z } from "zod";

const optionalNullableString = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .nullable()
    .optional();

/** Datos que un usuario puede modificar de su propio perfil. */
export const UpdateUserProfileSchema = z.object({
  displayName: optionalNullableString(100, "El nombre visible no puede superar 100 caracteres"),
  bio: optionalNullableString(1000, "La biografía no puede superar 1000 caracteres"),
  avatarUrl: z
    .string()
    .trim()
    .max(512, "La URL del avatar no puede superar 512 caracteres")
    .url("El avatar debe ser una URL válida")
    .refine((value) => value.startsWith("https://") || value.startsWith("http://"), {
      message: "El avatar debe usar http o https",
    })
    .nullable()
    .optional(),
  preferredLocation: optionalNullableString(
    160,
    "La ubicación preferida no puede superar 160 caracteres",
  ),
});

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;