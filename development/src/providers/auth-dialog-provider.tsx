"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { LoginDialog } from "@/components/auth/login-dialog";

/**
 * Provider del diálogo de login contextual (007-login-contextual).
 * Estado de UI efímero global: cualquier Client Component puede abrir el
 * diálogo sin navegar a /auth. El diálogo se renderiza aquí, una sola vez.
 */
interface AuthDialogContextValue {
  open(): void;
  close(): void;
  isOpen: boolean;
}

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

export function useAuthDialog(): AuthDialogContextValue {
  const context = useContext(AuthDialogContext);
  if (!context) {
    throw new Error("useAuthDialog debe usarse dentro de <AuthDialogProvider>");
  }
  return context;
}

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AuthDialogContext.Provider value={{ open, close, isOpen }}>
      {children}
      <LoginDialog open={isOpen} onClose={close} />
    </AuthDialogContext.Provider>
  );
}
