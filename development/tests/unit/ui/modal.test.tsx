// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Modal } from "@/components/ui/modal";

// jsdom no implementa aún showModal()/close() de <dialog>.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

const dialogRect = {
  left: 100,
  right: 500,
  top: 100,
  bottom: 400,
  width: 400,
  height: 300,
  x: 100,
  y: 100,
  toJSON: () => ({}),
} as DOMRect;

function renderModal(onClose = vi.fn()) {
  const utils = render(
    <Modal open onClose={onClose} ariaLabel="Diálogo de prueba">
      <form onSubmit={(event) => event.preventDefault()}>
        <input aria-label="Email" name="email" />
        <button type="submit">Enviar</button>
      </form>
    </Modal>,
  );
  const dialog = utils.container.querySelector("dialog")!;
  vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue(dialogRect);
  return { dialog, onClose, ...utils };
}

describe("Modal", () => {
  afterEach(cleanup);

  it("does not close when a child button is activated (Enter implicit submission clicks at 0,0)", () => {
    const onClose = vi.fn();
    const { dialog } = renderModal(onClose);

    // Al pulsar Enter en un input, el navegador genera un click sintético en el
    // botón submit con coordenadas (0,0) que burbujea hasta el <dialog>.
    fireEvent.click(dialog.querySelector("button[type='submit']")!);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when clicking the backdrop outside the dialog bounds", () => {
    const onClose = vi.fn();
    const { dialog } = renderModal(onClose);

    fireEvent.click(dialog, { clientX: 10, clientY: 10 });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside the dialog bounds", () => {
    const onClose = vi.fn();
    const { dialog } = renderModal(onClose);

    fireEvent.click(dialog, { clientX: 200, clientY: 200 });

    expect(onClose).not.toHaveBeenCalled();
  });
});
