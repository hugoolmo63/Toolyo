import { notFound } from "next/navigation";
import { getPublicUserProfile } from "@/features/users/application/public-user-profile.service";
import { NotFoundError } from "@/server/lib/errors/domain-errors";
import { UserProfileHeader } from "@/components/profile/UserProfileHeader";
import { UserProfileTabs } from "@/components/profile/UserProfileTabs";
import { ReputationSummary } from "@/features/reviews/presentation/reputation-summary";
import { getPublishedUserAggregate } from "@/features/reviews/infrastructure/review.repository";
import { prisma } from "@/server/db/client";

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

  const reputation = await getPublishedUserAggregate(prisma, params.id);

  return (
    <main className="user-profile-page">
      <UserProfileHeader profile={profile} />
      <ReputationSummary reputation={reputation} heading="Reputación del usuario" />
      <UserProfileTabs listings={profile.listings} reviews={profile.reviews} />
    </main>
  );
}