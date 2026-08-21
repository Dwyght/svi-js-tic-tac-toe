import { Button } from "../base/Button.js";
import { Modal } from "../base/Modal.js";
import { resolveTarget } from "../../utils/dom.js";

export class LeaveConfirmModal {
  constructor({ onConfirm }) {
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
      label: "YES, LEAVE",
      className: "button-danger",
      onClick: () => this.onConfirm(),
    });
    this.modal = new Modal({
      title: "Leave Game",
      content: this.content,
    });
  }

  setAttributes() {
    this.content.classList.add("modal-form");
    this.message.textContent =
      "Are you sure you want to stop spectating and return home?";
  }

  appendElements() {
    this.content.append(this.message);
    this.cancelButton.render(this.content);
    this.confirmButton.render(this.content);
  }

  open() {
    this.modal.open();
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
      console.error("LeaveConfirmModal target not found.");
    }
  }
}
