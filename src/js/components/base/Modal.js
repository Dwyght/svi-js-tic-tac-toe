import { Button } from "./Button.js";
import { resolveTarget } from "../../utils/dom.js";

export const MODAL_EVENTS = Object.freeze({
  opened: "app-modal-opened",
  closed: "app-modal-closed",
});

export class Modal {
  constructor({ title, content, closable = true }) {
    this.dialog = document.createElement("dialog");
    this.header = document.createElement("header");
    this.title = document.createElement("h2");
    this.body = document.createElement("div");
    this.closable = closable;

    if (this.closable) {
      this.closeButton = new Button({
        label: "",
        className: "modal-close-button",
        onClick: () => this.close(),
      });

      this.closeButton.element.setAttribute("aria-label", "Close");
    }

    this.dialog.classList.add("modal");
    this.header.classList.add("modal-header");
    this.body.classList.add("modal-body");
    this.title.textContent = title;

    this.dialog.append(this.header, this.body);
    this.header.append(this.title);

    if (this.closable) {
      this.closeButton.render(this.header);
    }

    this.body.append(content);

    this.dialog.addEventListener("click", (event) => {
      if (this.closable && event.target === this.dialog) {
        this.close();
      }
    });

    this.dialog.addEventListener("cancel", (event) => {
      if (!this.closable) {
        event.preventDefault();
      }
    });

    this.dialog.addEventListener("close", () => {
      this.dialog.dispatchEvent(
        new Event(MODAL_EVENTS.closed, { bubbles: true }),
      );
    });
  }

  open() {
    if (!this.dialog.open) {
      this.dialog.showModal();
      this.dialog.dispatchEvent(
        new Event(MODAL_EVENTS.opened, { bubbles: true }),
      );
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

  setTitle(title) {
    this.title.textContent = title;
  }

  setDismissEnabled(isEnabled) {
    if (!this.closeButton) {
      return;
    }

    this.closable = isEnabled;
    this.closeButton.element.disabled = !isEnabled;
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
