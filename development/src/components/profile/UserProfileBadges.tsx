import type { PublicUserProfileDTO } from "@/features/users/domain/public-user-profile";

export function UserProfileBadges({ badges }: { badges: PublicUserProfileDTO["badges"] }) {
  if (!badges.superLessor) return null;
  return <div className="user-profile-badges" aria-label="Insignias del usuario">
    <span className="user-profile-badge super-lessor">★ Superarrendador</span>
  </div>;
}