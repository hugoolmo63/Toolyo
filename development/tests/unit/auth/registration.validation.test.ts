import { describe, expect, it } from "vitest";
import { RegistrationSchema } from "@/lib/validations/auth";

describe("RegistrationSchema", () => {
  it("accepts valid credentials and legal document ids", () => {
    expect(RegistrationSchema.safeParse({ email: "person@example.com", password: "a secure password with 12", termsDocumentId: "cmj4gq7g8000001l4f8p3f2q1", privacyDocumentId: "cmj4gq7g8000001l4f8p3f2q2" }).success).toBe(true);
  });

  it("rejects short passwords and missing legal documents", () => {
    const result = RegistrationSchema.safeParse({ email: "person@example.com", password: "short", termsDocumentId: "", privacyDocumentId: "" });
    expect(result.success).toBe(false);
  });
});
