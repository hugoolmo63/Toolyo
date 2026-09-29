import { describe, expect, it } from "vitest";
import { assertKycDocumentAccess } from "@/features/admin/application/admin-kyc.service";
import { toKycProjection } from "@/features/admin/application/admin-projections";

describe("admin KYC service", () => {
  it("allows restricted KYC documents only to ADMIN", () => {
    expect(() => assertKycDocumentAccess("ADMIN")).not.toThrow();
    expect(() => assertKycDocumentAccess("MODERATOR")).toThrow();
  });

  it("maps KYC data without document fields", () => {
    const result = toKycProjection({ id: "kyc-1", userId: "user-1", provider: "test", status: "pending", resultCode: null, reviewedById: null, reviewedAt: null, reviewReason: null, createdAt: new Date(), updatedAt: new Date() });
    expect(result).not.toHaveProperty("documents");
    expect(result.status).toBe("pending");
  });
});