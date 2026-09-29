"use client";

import { LoginForm } from "@/components/forms/login-form";
import { Modal } from "@/components/ui";

interface LoginDialogProps {
  open: boolean;
  onClose(): void;
}

/**
 * Diálogo de login contextual (007-login-contextual).
 * Usa <dialog> nativo con showModal(): focus trap, cierre con Escape y
 * top-layer sin lógica adicional (FR-013, FRONTEND.md §8).
 */
export function LoginDialog({ open, onClose }: LoginDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Inicia sesión."
      className="login-dialog"
      closeLabel="Cerrar diálogo de inicio de sesión"
    >
      <LoginForm variant="dialog" onSuccess={onClose} />
    </Modal>
  );
}
