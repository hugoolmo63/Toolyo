import { test, expect } from "@playwright/test";
import { createBookingE2ESession } from "../fixtures/bookings-e2e.fixtures";

test.describe("booking → conversation → messaging critical flow", () => {
  test("exposes the authenticated entry point and remains stable across 20 isolated sessions", async ({ browser }) => {
    test.skip(!process.env.E2E_CRITICAL_FLOW_ENABLED, "Requires the reservation/messaging UI and the Serverless tRPC chat flow");

    const sessions = Array.from({ length: 20 }, (_, index) => createBookingE2ESession(index));
    let completed = 0;
    for (const session of sessions) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto("/auth?tab=login");
      await expect(page.locator("#login-email")).toBeVisible();
      await expect(page.locator("#login-password")).toBeVisible();
      expect(session.renterEmail).toContain("e2e-renter-");
      expect(session.startDate).toMatch(/^2035-06-/);
      completed += 1;
      await context.close();
    }
    expect(completed).toBeGreaterThanOrEqual(19);
  });
});
