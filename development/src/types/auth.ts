export type AccountStatus = "pending" | "active" | "suspended" | "deletion_requested" | "deleted";
export type ContactVerificationStatus = "pending" | "verified" | "blocked";
export type IdentityVerificationStatus = "not_started" | "pending" | "verified" | "rejected" | "retry_required";
export type VerificationChannel = "email" | "phone";
export type SsoProvider = "google" | "apple" | "facebook";
export type OtpPurpose = "registration" | "contact_verification" | "credential_change" | "recovery";
export type Capability = "publish_listing" | "request_booking" | "instant_booking" | "platform_insurance";
export type AdminRole = "ADMIN" | "MODERATOR";
export type SessionState = "AUTHENTICATED" | "PENDING_2FA";

export interface LegalRegistrationDocument {
  id: string;
  documentType: "terms" | "privacy";
  version: string;
  language: string;
  effectiveAt: Date;
}

export interface OnboardingStatus {
  accountStatus: AccountStatus;
  email: ContactVerificationStatus;
  phone: ContactVerificationStatus;
  identity: IdentityVerificationStatus;
  capabilities: Record<Capability, boolean>;
}

export interface SessionClaims {
  userId: string;
  email: string;
  accountStatus: AccountStatus;
  emailVerificationStatus: ContactVerificationStatus;
  capabilities: Record<Capability, boolean>;
}

export interface LoginResult {
  userId: string;
  accountStatus: AccountStatus;
  emailVerificationStatus: ContactVerificationStatus;
  redirectTo: string;
  sessionState?: SessionState;
  challengeId?: string;
  role?: AdminRole;
}
