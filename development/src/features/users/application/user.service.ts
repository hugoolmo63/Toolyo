import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/server/db/client";
import { NotFoundError, UnauthorizedError } from "@/server/lib/errors/domain-errors";
import {
  QUICK_RESPONSE_MAX_HOURS,
  type PublicUserProfile,
} from "../domain/user-profile";
import {
  findPublicUserProfile,
  findEditableUserProfile,
  updateUserProfile,
  type PublicUserProfileRecord,
} from "../infrastructure/user.repository";
import {
  UpdateUserProfileSchema,
  type UpdateUserProfileInput,
} from "../shared/user-profile.schema";
import { DEVELOPMENT_PROFILE_USER_ID } from "../domain/preferred-location";

export const developmentProfileUserId = DEVELOPMENT_PROFILE_USER_ID;

function mapPublicProfile(record: NonNullable<PublicUserProfileRecord>): PublicUserProfile {
  return {
    id: record.id,
    displayName: record.displayName,
    avatarUrl: record.avatarUrl,
    bio: record.bio,
    preferredLocation: record.preferredLocation,
    ratingAverage: record.ratingAverage === null ? null : Number(record.ratingAverage),
    transactionCount: record.transactionCount ?? 0,
    badges: {
      verified: record.verificationStates.length > 0,
      quickResponse:
        record.responseTimeHours !== null && record.responseTimeHours <= QUICK_RESPONSE_MAX_HOURS,
    },
    listings: record.listings.map((listing) => ({
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      pricePerDay: Number(listing.pricePerDay),
      city: listing.city,
      coverImageUrl: listing.photos?.[0]?.url ?? null,
    })),
  };
}

/** Devuelve únicamente la proyección pública de un usuario activo. */
export async function getPublicProfileById(
  userId: string,
  db: PrismaClient = defaultPrisma,
): Promise<PublicUserProfile> {
  const record = await findPublicUserProfile(db, userId);
  if (!record) {
    throw new NotFoundError("El perfil no está disponible");
  }
  return mapPublicProfile(record);
}

export async function getEditableProfileById(
  userId: string,
  db: PrismaClient = defaultPrisma,
) {
  const record = await findEditableUserProfile(db, userId);
  if (!record) throw new NotFoundError("El perfil no está disponible");
  return record;
}

/**
 * Actualiza el perfil propio. El actor se recibe desde la sesión del servidor;
 * nunca se confía en un identificador enviado por el formulario.
 */
export async function updateProfile(
  userId: string,
  data: UpdateUserProfileInput,
  authenticatedUserId: string | null,
  db: PrismaClient = defaultPrisma,
) {
  if (!authenticatedUserId || authenticatedUserId !== userId) {
    throw new UnauthorizedError("No tienes permiso para editar este perfil");
  }

  const input = UpdateUserProfileSchema.parse(data);
  return updateUserProfile(db, userId, input);
}

/** Desactiva y anonimiza la cuenta preservando registros sujetos a retención legal. */
export async function deleteOwnAccount(userId: string, db: PrismaClient = defaultPrisma): Promise<void> {
  await db.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id: userId, accountStatus: "active", deletedAt: null },
      data: {
        accountStatus: "deleted",
        deletedAt: new Date(),
        emailNormalized: `deleted+${userId}@deleted.invalid`,
        phoneE164: null,
        displayName: null,
        avatarUrl: null,
        bio: null,
        preferredLocation: null,
      },
    });
    if (result.count !== 1) throw new NotFoundError("La cuenta no está disponible");

    await Promise.all([
      tx.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      tx.passwordCredential.deleteMany({ where: { userId } }),
      tx.oAuthAccount.deleteMany({ where: { userId } }),
      tx.devicePushToken.deleteMany({ where: { userId } }),
      tx.listing.updateMany({ where: { ownerId: userId, status: "published", deletedAt: null }, data: { status: "paused" } }),
    ]);
  });
}