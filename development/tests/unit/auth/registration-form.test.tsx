// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrationForm } from "@/components/forms/registration-form";
import type { LegalRegistrationDocument } from "@/types/auth";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/lib/trpc-react", () => ({
  api: { auth: { registerWithPassword: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) } } },
}));

const legalDocuments: LegalRegistrationDocument[] = [
  { id: "cmufqcx890015jmwntuewoa77", documentType: "terms", version: "1", language: "es", effectiveAt: new Date() },
  { id: "cmufqcx8b0016jmwn1h3m6wzn", documentType: "privacy", version: "1", language: "es", effectiveAt: new Date() },
];

function fillCredentials() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nuevo@toolyo.test" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "ValidPassword123!" } });
}

describe("RegistrationForm", () => {
  beforeEach(() => mocks.mutate.mockReset());
  afterEach(cleanup);

  it("shows visible errors when legal checkboxes are unchecked and does not submit", async () => {
    const { container } = render(<RegistrationForm legalDocuments={legalDocuments} />);
    fillCredentials();
    fireEvent.submit(container.querySelector("form")!);

    expect(await screen.findByText("Debes aceptar los Términos y Condiciones.")).toBeTruthy();
    expect(await screen.findByText("Debes aceptar la Política de Privacidad.")).toBeTruthy();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it("submits the legal document ids when the checkboxes are checked", async () => {
    const { container } = render(<RegistrationForm legalDocuments={legalDocuments} />);
    fillCredentials();
    fireEvent.click(screen.getByLabelText(/Términos y Condiciones/));
    fireEvent.click(screen.getByLabelText(/Política de Privacidad/));
    fireEvent.click(screen.getByLabelText("No soy un robot"));
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledWith({
      email: "nuevo@toolyo.test",
      password: "ValidPassword123!",
      termsDocumentId: "cmufqcx890015jmwntuewoa77",
      privacyDocumentId: "cmufqcx8b0016jmwn1h3m6wzn",
      marketingAccepted: false,
      botToken: "development-human-check",
    }));
  });

  it("keeps the submit button native so Enter submits the registration form", async () => {
    const { container } = render(<RegistrationForm legalDocuments={legalDocuments} />);
    fillCredentials();
    fireEvent.click(screen.getByLabelText(/Términos y Condiciones/));
    fireEvent.click(screen.getByLabelText(/Política de Privacidad/));
    fireEvent.click(screen.getByLabelText("No soy un robot"));

    const submitButton = screen.getByRole("button", { name: "Crear cuenta" });
    expect(submitButton.getAttribute("type")).toBe("submit");
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalled());
  });
});
