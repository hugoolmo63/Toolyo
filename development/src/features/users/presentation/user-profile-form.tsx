"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateUserProfileSchema, type UpdateUserProfileInput } from "../shared/user-profile.schema";
import { api } from "@/lib/trpc-react";
import { PreferredLocationMap } from "./preferred-location-map";

type EditableProfile = {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  preferredLocation: string | null;
};

export function UserProfileForm({ profile, developmentFallback = false }: { profile: EditableProfile; developmentFallback?: boolean }) {
  const form = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(UpdateUserProfileSchema),
    defaultValues: {
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      avatarUrl: profile.avatarUrl ?? "",
      preferredLocation: profile.preferredLocation ?? "",
    },
  });
  const updateAuthenticated = api.userProfile.update.useMutation({
    onSuccess: () => {
      form.clearErrors();
      form.setError("root", { type: "success", message: "Perfil actualizado correctamente." });
    },
    onError: (error) => form.setError("root", { message: error.message || "No se pudo actualizar el perfil." }),
  });
  const updateDevelopment = api.userProfile.updateDevelopmentSeed.useMutation({
    onSuccess: () => {
      form.clearErrors();
      form.setError("root", { type: "success", message: "Perfil actualizado correctamente." });
    },
    onError: (error) => form.setError("root", { message: error.message || "No se pudo actualizar el perfil." }),
  });

  function submit(values: UpdateUserProfileInput) {
    const input = {
      ...values,
      displayName: values.displayName || null,
      bio: values.bio || null,
      avatarUrl: values.avatarUrl || null,
      preferredLocation: values.preferredLocation || null,
    };
    if (developmentFallback) updateDevelopment.mutate(input);
    else updateAuthenticated.mutate(input);
  }

  return (
    <section className="user-profile-form-shell" aria-labelledby="edit-profile-title">
      <div className="user-profile-form-intro">
        <p className="form-kicker">Tu cuenta</p>
        <h1 id="edit-profile-title">Edita tu perfil</h1>
        <p>Actualiza la información que otros usuarios verán en tu perfil.</p>
      </div>
      <form className="user-profile-form" onSubmit={form.handleSubmit(submit)} noValidate>
        <label htmlFor="profile-display-name">Nombre visible</label>
        <input id="profile-display-name" {...form.register("displayName")} aria-invalid={Boolean(form.formState.errors.displayName)} />
        {form.formState.errors.displayName && <p className="field-error">{form.formState.errors.displayName.message}</p>}
        <label htmlFor="profile-avatar-url">URL del avatar</label>
        <input id="profile-avatar-url" type="url" placeholder="https://..." {...form.register("avatarUrl")} aria-invalid={Boolean(form.formState.errors.avatarUrl)} />
        {form.formState.errors.avatarUrl && <p className="field-error">{form.formState.errors.avatarUrl.message}</p>}
        <label htmlFor="profile-location">Ubicación preferida</label>
        <input id="profile-location" {...form.register("preferredLocation")} placeholder="latitud,longitud" />
        <PreferredLocationMap
          value={form.watch("preferredLocation")}
          onChange={(value) => form.setValue("preferredLocation", value, { shouldDirty: true, shouldValidate: true })}
        />
        <label htmlFor="profile-bio">Biografía</label>
        <textarea id="profile-bio" rows={6} {...form.register("bio")} aria-invalid={Boolean(form.formState.errors.bio)} />
        {form.formState.errors.bio && <p className="field-error">{form.formState.errors.bio.message}</p>}
        {form.formState.errors.root && (
          <p className={form.formState.errors.root.type === "success" ? "form-success" : "form-error"} role="status">
            {form.formState.errors.root.message}
          </p>
        )}
        <button className="auth-submit" type="submit" disabled={updateAuthenticated.isPending || updateDevelopment.isPending}>
          {updateAuthenticated.isPending || updateDevelopment.isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </section>
  );
}