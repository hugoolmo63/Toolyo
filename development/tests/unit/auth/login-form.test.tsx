// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/forms/login-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mocks = vi.hoisted(() => ({ login: vi.fn(), requestOtp: vi.fn(), verifyTotp: vi.fn() }));
vi.mock("@/lib/trpc-react", () => ({
  api: {
    useUtils: () => ({ auth: { getSession: { invalidate: vi.fn() } } }),
    auth: {
      loginWithPassword: { useMutation: () => ({ mutate: mocks.login, isPending: false }) },
      requestOtp: { useMutation: () => ({ mutate: mocks.requestOtp, isPending: false }) },
    },
    admin: { verifyTotp: { useMutation: () => ({ mutate: mocks.verifyTotp, isPending: false }) } },
  },
}));

describe("LoginForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("uses native form submission, so Enter can submit login credentials", async () => {
    const { container } = render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.test" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "AnyPassword123!" } });
    fireEvent.click(screen.getByLabelText("No soy un robot"));

    expect(screen.getByRole("button", { name: "Iniciar sesión" }).getAttribute("type")).toBe("submit");
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith(expect.objectContaining({
      email: "user@example.test",
      password: "AnyPassword123!",
      botToken: "development-human-check",
    })));
  });
});