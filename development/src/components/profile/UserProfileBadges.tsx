import type { PublicUserProfileDTO } from "@/features/users/domain/public-user-profile";

export function UserProfileBadges({ badges }: { badges: PublicUserProfileDTO["badges"] }) {
  return <div className="user-profile-badges" aria-label="Insignias del usuario">
    {badges.registered && <span className="user-profile-badge registered">✓ Registrado</span>}
    {badges.verified && <span className="user-profile-badge verified">✓ Verificado</span>}
    {badges.superLessor && <span className="user-profile-badge super-lessor">★ Superarrendador</span>}
  </div>;
}