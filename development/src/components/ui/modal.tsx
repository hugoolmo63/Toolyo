"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { Button } from "./button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
}

export function Modal({ open, onClose, title, ariaLabel = "Diálogo", children, className, closeLabel = "Cerrar diálogo" }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      requestAnimationFrame(() => dialog.querySelector<HTMLElement>("[data-autofocus], input, button")?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    return () => previousFocusRef.current?.focus();
  }, []);

  function handleClose() {
    onClose();
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = dialogRef.current;
    if (!dialog || event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) handleClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={className ?? "dialog"}
      aria-labelledby={title ? "ui-modal-title" : undefined}
      aria-label={title ? undefined : ariaLabel}
      onClose={handleClose}
      onClick={handleBackdropClick}
    >
      {open && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="modal-close"
            onClick={handleClose}
            aria-label={closeLabel}
          >
            ✕
          </Button>
          <div className="dialog-body">
            {title && <h2 id="ui-modal-title">{title}</h2>}
            {children}
          </div>
        </>
      )}
    </dialog>
  );
}

export { Modal as Dialog };