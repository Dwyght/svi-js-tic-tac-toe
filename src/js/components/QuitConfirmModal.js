import { Button } from "./Button.js";
import { Modal } from "./Modal.js";
import { resolveTarget } from "../utils/dom.js";

export class QuitConfirmModal {
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
      label: "YES, QUIT",
      className: "button-danger",
      onClick: () => this.onConfirm(),
    });
    this.modal = new Modal({
      title: "Quit Game",
      content: this.content,
    });
  }

  setAttributes() {
    this.content.classList.add("modal-form");
    this.message.textContent =
      "Are you sure you want to quit? This will end the game for both players.";
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
      console.error("QuitConfirmModal target not found.");
    }
  }
}
