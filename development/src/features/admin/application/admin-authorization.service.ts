import { AdminForbiddenError } from "../domain/admin-errors";
import type { AdminRole } from "@/server/api/trpc";

export function assertAdminRole(role: "user" | AdminRole): asserts role is AdminRole {
  if (role !== "ADMIN" && role !== "MODERATOR") throw new AdminForbiddenError();
}

export function canModerateReviews(role: "user" | AdminRole): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}

export function canReadAudit(role: "user" | AdminRole): boolean {
  return role === "ADMIN";
}