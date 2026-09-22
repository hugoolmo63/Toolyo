import { createServerApi } from "@/lib/server-api";
import { redirect } from "next/navigation";
import { UserProfileForm } from "@/features/users/presentation/user-profile-form";

export default async function ProfilePage() {
  const api = await createServerApi();
  try {
    const profile = await api.userProfile.getMe();
    return (
      <main className="user-profile-edit-page">
        <UserProfileForm profile={profile} />
      </main>
    );
  } catch {
    if (process.env.NODE_ENV === "development") {
      try {
        const profile = await api.userProfile.getDevelopmentSeed();
        return (
          <main className="user-profile-edit-page">
            <p className="development-profile-notice">Modo desarrollo: editando el usuario de prueba de la semilla.</p>
            <UserProfileForm profile={profile} developmentFallback />
          </main>
        );
      } catch {
        // Si la semilla no existe, mantener el flujo normal de autenticación.
      }
    }
    redirect("/auth?tab=login&callback=/profile");
  }
}