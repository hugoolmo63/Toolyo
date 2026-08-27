import { describe, expect, it, vi } from "vitest";

const createOtpChallengeMock = vi.hoisted(() => vi.fn());

vi.mock("@/env.mjs", () => ({
  env: {
    SMS_OTP_ENABLED: false,
  },
}));

vi.mock("@/server/auth/otp.service", () => ({
  createOtpChallenge: createOtpChallengeMock,
}));

import { requestOtp } from "@/server/auth/otp-delivery.service";

describe("requestOtp", () => {
  it("blocks SMS OTP when the channel is disabled by environment", async () => {
    await expect(
      requestOtp({} as never, {
        channel: "phone",
        purpose: "registration",
        destination: "+34600123456",
      }),
    ).rejects.toMatchObject({ code: "validation_error", statusCode: 400 });

    expect(createOtpChallengeMock).not.toHaveBeenCalled();
  });
});