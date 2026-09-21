import Image from "next/image";
import Link from "next/link";
import type { PublicUserProfileDTO } from "@/features/users/domain/public-user-profile";
import { UserProfileBadges } from "./UserProfileBadges";
import { formatPreferredLocationLabel } from "@/features/users/domain/preferred-location";

export function UserProfileHeader({ profile }: { profile: PublicUserProfileDTO }) {
  const initials = (profile.displayName ?? "Usuario").slice(0, 1).toUpperCase();
  return <section className="user-profile-hero" aria-labelledby="profile-title">
    <div className="user-profile-avatar">{profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="128px" /> : <span aria-hidden="true">{initials}</span>}</div>
    <div className="user-profile-heading">
      <h1 id="profile-title">{profile.displayName ?? "Usuario de Toolyo"}</h1>
      {profile.bio?.trim() && <p className="user-profile-bio">{profile.bio}</p>}
      {formatPreferredLocationLabel(profile.preferredLocation) && <p className="user-profile-location">📍 {formatPreferredLocationLabel(profile.preferredLocation)}</p>}
      <p className="user-profile-joined">Registrado el {new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(profile.createdAt))}</p>
      <div className="user-profile-reputation">
        <strong>★ {profile.ratingAverage?.toFixed(1) ?? "—"}</strong>
        <span>· {profile.transactionCount} transacciones</span>
        <a href="#profile-reviews" className="user-profile-reviews-link">(ver reseñas)</a>
      </div>
      <UserProfileBadges badges={profile.badges} />
    </div>
  </section>;
}