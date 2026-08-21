import { Button } from "../base/Button.js";
import { Modal } from "../base/Modal.js";
import { resolveTarget } from "../../utils/dom.js";

export class ResumeGameModal {
  constructor({ onResume, onQuit }) {
    this.onResume = onResume;
    this.onQuit = onQuit;

    this.initializeElements();
    this.setAttributes();
    this.appendElements();
  }

  initializeElements() {
    this.content = document.createElement("div");
    this.message = document.createElement("p");
    this.resumeButton = new Button({
      label: "RESUME",
      className: "button-confirm",
      onClick: () => this.onResume(),
    });
    this.quitButton = new Button({
      label: "QUIT GAME",
      className: "button-danger",
      onClick: () => this.onQuit(),
    });
    this.modal = new Modal({
      title: "Resume Game",
      content: this.content,
      closable: false,
    });
  }

  setAttributes() {
    this.content.classList.add("modal-form");
  }

  appendElements() {
    this.content.append(this.message);
    this.resumeButton.render(this.content);
    this.quitButton.render(this.content);
  }

  setSession({ name, tile }) {
    this.message.textContent =
      `Resume your game as ${name} (Player ${tile})?`;
  }

  setResumePending(isPending) {
    this.resumeButton.element.disabled = isPending;
    this.quitButton.element.disabled = isPending;
    this.resumeButton.setLabel(isPending ? "RESUMING..." : "RESUME");
  }

  open() {
    this.setResumePending(false);
    this.modal.open();
  }

  close() {
    this.modal.close();
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      this.modal.render(parent);
    } else {
      console.error("ResumeGameModal target not found.");
    }
  }
}
