import { describe, expect, it } from "vitest";
import { isAllowedRegistrationEmail, TEMPORARY_EMAIL_ERROR } from "@/lib/email-policy";
import { registerWithPassword } from "@/server/auth/auth.service";
import { ValidationError } from "@/server/lib/errors/domain-errors";

describe("registration email policy", () => {
  it("blocks known disposable mail domains and subdomains", () => {
    for (const email of ["user@10minutemail.com", "hello@guerrillamail.net", "name@mail.tempmail.com"]) {
      expect(isAllowedRegistrationEmail(email)).toBe(false);
    }
    expect(TEMPORARY_EMAIL_ERROR).toBe("No se permiten direcciones de correo temporales o no válidas.");
  });

  it("blocks random high-entropy local parts and allows ordinary addresses", () => {
    expect(isAllowedRegistrationEmail("fkrezbcwvaoisvtrhx@example.com")).toBe(false);
    expect(isAllowedRegistrationEmail("ana.garcia@example.com")).toBe(true);
  });

  it("rejects disposable emails at the registration service boundary", async () => {
    await expect(registerWithPassword({} as never, {
      email: "person@10minutemail.com",
      password: "ValidPassword123!",
      termsDocumentId: "terms",
      privacyDocumentId: "privacy",
    })).rejects.toMatchObject({ name: "ValidationError", message: TEMPORARY_EMAIL_ERROR });
    expect(ValidationError).toBeDefined();
  });
});