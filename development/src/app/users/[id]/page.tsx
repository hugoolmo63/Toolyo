import { notFound } from "next/navigation";
import { getPublicUserProfile } from "@/features/users/application/public-user-profile.service";
import { NotFoundError } from "@/server/lib/errors/domain-errors";
import { UserProfileHeader } from "@/components/profile/UserProfileHeader";
import { UserProfileTabs } from "@/components/profile/UserProfileTabs";

export default async function PublicUserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  let profile;
  try {
    profile = await getPublicUserProfile(params.id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <main className="user-profile-page">
      <UserProfileHeader profile={profile} />
      <UserProfileTabs listings={profile.listings} reviews={profile.reviews} />
    </main>
  );
}