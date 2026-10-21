import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "@prisma/client";
import { deleteOwnAccount, getPublicProfileById, updateProfile } from "@/features/users/application/user.service";
import { NotFoundError, UnauthorizedError } from "@/server/lib/errors/domain-errors";
import {
  findPublicUserProfile,
  updateUserProfile,
} from "@/features/users/infrastructure/user.repository";

vi.mock("@/features/users/infrastructure/user.repository", () => ({
  findPublicUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
}));

const db = {} as PrismaClient;

const publicProfileRecord = {
  id: "user-1",
  displayName: "Ana García",
  avatarUrl: "https://example.com/avatar.jpg",
  bio: "Alquilo material fotográfico",
  preferredLocation: "Madrid",
  ratingAverage: new Prisma.Decimal("4.8"),
  transactionCount: 12,
  responseTimeHours: 4,
  verificationStates: [{ id: "verification-1" }],
  listings: [
    {
      id: "listing-1",
      slug: "camara-pro",
      title: "Cámara Pro",
      pricePerDay: new Prisma.Decimal("25.50"),
      city: "Madrid",
      photos: [{ url: "https://example.com/listing.jpg" }],
    },
  ],
} satisfies NonNullable<Awaited<ReturnType<typeof findPublicUserProfile>>>;

describe("user.service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve los datos públicos, badges derivados y listings activos", async () => {
    vi.mocked(findPublicUserProfile).mockResolvedValue(publicProfileRecord);

    const result = await getPublicProfileById("user-1", db);

    expect(result).toEqual({
      id: "user-1",
      displayName: "Ana García",
      avatarUrl: "https://example.com/avatar.jpg",
      bio: "Alquilo material fotográfico",
      preferredLocation: "Madrid",
      ratingAverage: 4.8,
      transactionCount: 12,
      badges: { verified: true, quickResponse: true },
      listings: [
        {
          id: "listing-1",
          slug: "camara-pro",
          title: "Cámara Pro",
          coverImageUrl: "https://example.com/listing.jpg",
          pricePerDay: 25.5,
          city: "Madrid",
        },
      ],
    });
  });

  it("rechaza un perfil público inexistente", async () => {
    vi.mocked(findPublicUserProfile).mockResolvedValue(null);

    await expect(getPublicProfileById("missing-user", db)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("bloquea una actualización cuando el actor no coincide con el usuario objetivo", async () => {
    await expect(
      updateProfile("user-1", { displayName: "Intruso" }, "user-2", db),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(updateUserProfile).not.toHaveBeenCalled();
  });

  it("bloquea una actualización sin autenticación", async () => {
    await expect(
      updateProfile("user-1", { bio: "Sin sesión" }, null, db),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(updateUserProfile).not.toHaveBeenCalled();
  });

  it("valida y persiste los campos editables del usuario autenticado", async () => {
    const updated = {
      id: "user-1",
      displayName: "Ana",
      avatarUrl: null,
      bio: "Nueva bio",
      preferredLocation: "Madrid",
    } as Awaited<ReturnType<typeof updateUserProfile>>;
    vi.mocked(updateUserProfile).mockResolvedValue(updated);

    const result = await updateProfile(
      "user-1",
      {
        displayName: "  Ana  ",
        bio: "Nueva bio",
        preferredLocation: "Madrid",
      },
      "user-1",
      db,
    );

    expect(updateUserProfile).toHaveBeenCalledWith(
      db,
      "user-1",
      expect.objectContaining({ displayName: "Ana" }),
    );
    expect(result).toEqual(updated);
  });

  it("anonymizes account data, revokes sessions and pauses its published products", async () => {
    const transaction = {
      user: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      session: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      passwordCredential: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      oAuthAccount: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      devicePushToken: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      listing: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
    };
    const transactionalDb = {
      $transaction: vi.fn(async (callback: (tx: typeof transaction) => Promise<void>) => callback(transaction)),
    } as unknown as PrismaClient;

    await deleteOwnAccount("user-1", transactionalDb);

    expect(transaction.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "user-1", accountStatus: "active", deletedAt: null },
      data: expect.objectContaining({
        accountStatus: "deleted",
        emailNormalized: "deleted+user-1@deleted.invalid",
        displayName: null,
        preferredLocation: null,
      }),
    }));
    expect(transaction.session.updateMany).toHaveBeenCalled();
    expect(transaction.passwordCredential.deleteMany).toHaveBeenCalled();
    expect(transaction.listing.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "paused" } }));
  });
});