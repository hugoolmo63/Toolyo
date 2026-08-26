export type AccountStatus = "pending" | "active" | "suspended" | "deletion_requested" | "deleted";
export type ContactVerificationStatus = "pending" | "verified" | "blocked";
export type IdentityVerificationStatus = "not_started" | "pending" | "verified" | "rejected" | "retry_required";
export type VerificationChannel = "email" | "phone";
export type SsoProvider = "google" | "apple" | "facebook";
export type OtpPurpose = "registration" | "contact_verification" | "credential_change" | "recovery";
export type Capability = "publish_listing" | "request_booking" | "instant_booking" | "platform_insurance";

export interface OnboardingStatus {
  accountStatus: AccountStatus;
  email: ContactVerificationStatus;
  phone: ContactVerificationStatus;
  identity: IdentityVerificationStatus;
  capabilities: Record<Capability, boolean>;
}
