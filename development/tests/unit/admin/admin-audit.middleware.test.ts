import { describe, expect, it } from "vitest";
import { toAuditProjection } from "@/features/admin/application/admin-projections";

describe("admin audit projections", () => {
  it("keeps only safe audit metadata", () => {
    const result = toAuditProjection({ id: "audit-1", actorId: "admin-1", actorRole: "ADMIN", procedure: "admin.test", action: "read", resourceType: "User", resourceId: "user-1", outcome: "success", reason: "ok", requestId: "req-1", createdAt: new Date() });
    expect(result).not.toHaveProperty("secretCiphertext");
    expect(result).not.toHaveProperty("metadata");
  });
});