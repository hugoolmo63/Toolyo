import type { AccountStatus, Capability, ContactVerificationStatus, IdentityVerificationStatus, OnboardingStatus } from "@/types/auth";

export function deriveCapabilities(status: Pick<OnboardingStatus, "accountStatus" | "email" | "phone" | "identity">): Record<Capability, boolean> {
  const active = status.accountStatus === "active" || status.accountStatus === "pending";
  const contactable = status.email === "verified" && status.phone === "verified";
  const identified = status.identity === "verified";
  return {
    publish_listing: active,
    request_booking: active,
    instant_booking: active && contactable && identified,
    platform_insurance: active && contactable && identified,
  };
}

export function emptyOnboardingStatus(): OnboardingStatus {
  const base: Pick<OnboardingStatus, "accountStatus" | "email" | "phone" | "identity"> = {
    accountStatus: "pending" as AccountStatus,
    email: "pending" as ContactVerificationStatus,
    phone: "pending" as ContactVerificationStatus,
    identity: "not_started" as IdentityVerificationStatus,
  };
  return { ...base, capabilities: deriveCapabilities(base) };
}
