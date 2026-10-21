// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TermsPage from "@/app/(public)/terms/page";
import PrivacyPage from "@/app/(public)/privacy/page";
import { PublicFooter } from "@/components/public-footer";

vi.mock("next/link", () => ({
  default: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props} />,
}));

describe("public legal pages", () => {
  afterEach(cleanup);

  it("publishes terms for a P2P intermediary, including cancellations and user obligations", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { name: "Términos y Condiciones del Servicio" })).toBeTruthy();
    expect(screen.getByText(/intermediación/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /cancelaciones/ })).toBeTruthy();
  });

  it("explains GDPR rights and approximate location privacy", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { name: "Política de Privacidad" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Geolocalización/ })).toBeTruthy();
    expect(screen.getByText(/acceso, rectificación, supresión/)).toBeTruthy();
  });

  it("links the footer to both legal routes", () => {
    render(<PublicFooter />);
    expect(screen.getByRole("link", { name: "Términos y Condiciones" }).getAttribute("href")).toBe("/terms");
    expect(screen.getByRole("link", { name: "Política de Privacidad" }).getAttribute("href")).toBe("/privacy");
  });
});