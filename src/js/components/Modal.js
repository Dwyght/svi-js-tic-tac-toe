import { Button } from "./Button.js";
import { resolveTarget } from "../utils/dom.js";

export class Modal {
  constructor({ title, content }) {
    this.dialog = document.createElement("dialog");
    this.header = document.createElement("header");
    this.title = document.createElement("h2");
    this.body = document.createElement("div");

    this.closeButton = new Button({
      label: "Close",
      className: "modal-close-button",
      onClick: () => this.close(),
    });

    this.dialog.classList.add("modal");
    this.header.classList.add("modal-header");
    this.body.classList.add("modal-body");
    this.title.textContent = title;

    this.dialog.append(this.header, this.body);
    this.header.append(this.title);
    this.closeButton.render(this.header);
    this.body.append(content);

    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog) {
        this.close();
      }
    });
  }

  open() {
    if (!this.dialog.open) {
      this.dialog.showModal();
    }
  }

  close() {
    if (this.dialog.open) {
      this.dialog.close();
    }
  }

  isOpen() {
    return this.dialog.open;
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.dialog);
    } else {
      console.error("Modal target not found.");
    }
  }
}
