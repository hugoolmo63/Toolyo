import { describe, expect, it } from "vitest";
import { RegistrationSchema } from "@/lib/validations/auth";

describe("RegistrationSchema", () => {
  it("accepts valid credentials and legal document ids", () => {
    expect(RegistrationSchema.safeParse({ email: "person@example.com", password: "ValidPassword123!", termsDocumentId: "cmj4gq7g8000001l4f8p3f2q1", privacyDocumentId: "cmj4gq7g8000001l4f8p3f2q2" }).success).toBe(true);
  });

  it("rejects short passwords and missing legal documents", () => {
    const result = RegistrationSchema.safeParse({ email: "person@example.com", password: "Aa1!abc", termsDocumentId: "", privacyDocumentId: "" });
    expect(result.success).toBe(false);
  });

  it("accepts an eight-character password with all required character classes", () => {
    expect(RegistrationSchema.shape.password.safeParse("Aa1!bcde").success).toBe(true);
  });

  it("rejects passwords missing any required character class", () => {
    for (const password of ["lowercase1!", "UPPERCASE1!", "NoNumber!!", "NoSymbol123"]) {
      expect(RegistrationSchema.shape.password.safeParse(password).success).toBe(false);
    }
  });
});
