"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { LoginForm } from "@/components/forms/login-form";

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="login-dialog"
      aria-labelledby="login-dialog-title"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      {open && (
        <>
          <button
            type="button"
            className="login-dialog-close"
            onClick={onClose}
            aria-label="Cerrar diálogo de inicio de sesión"
          >
            ✕
          </button>
          <LoginForm variant="dialog" onSuccess={onClose} />
        </>
      )}
    </dialog>
  );
}
