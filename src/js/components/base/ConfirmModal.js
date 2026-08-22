import { Button } from "./Button.js";
import { Modal } from "./Modal.js";
import { resolveTarget } from "../../utils/dom.js";

export class ConfirmModal {
  constructor({
    title,
    message,
    confirmLabel,
    pendingLabel = null,
    onConfirm,
  }) {
    this.title = title;
    this.messageText = message;
    this.confirmLabel = confirmLabel;
    this.pendingLabel = pendingLabel;
    this.onConfirm = onConfirm;

    this.initializeElements();
    this.setAttributes();
    this.appendElements();
  }

  initializeElements() {
    this.content = document.createElement("div");
    this.message = document.createElement("p");
    this.cancelButton = new Button({
      label: "CANCEL",
      className: "button-utility",
      onClick: () => this.close(),
    });
    this.confirmButton = new Button({
      label: this.confirmLabel,
      className: "button-danger",
      onClick: () => this.onConfirm(),
    });
    this.modal = new Modal({
      title: this.title,
      content: this.content,
    });
  }

  setAttributes() {
    this.content.classList.add("modal-form");
    this.message.textContent = this.messageText;
  }

  appendElements() {
    this.content.append(this.message);
    this.cancelButton.render(this.content);
    this.confirmButton.render(this.content);
  }

  open() {
    if (this.pendingLabel !== null) {
      this.setPending(false);
    }

    this.modal.open();
  }

  setPending(isPending) {
    if (this.pendingLabel === null) {
      return;
    }

    this.cancelButton.element.disabled = isPending;
    this.confirmButton.setPending(isPending, this.pendingLabel);
  }

  close() {
    this.modal.close();
  }

  remove() {
    this.modal.dialog.remove();
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      if (!this.modal.dialog.isConnected) {
        this.modal.render(parent);
      }
    } else {
      console.error("ConfirmModal target not found.");
    }
  }
}
