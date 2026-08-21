import { Button } from "./Button.js";
import { Modal } from "./Modal.js";
import { resolveTarget } from "../utils/dom.js";

export class SpectateModal {
  constructor({ onSpectateGame }) {
    this.onSpectateGame = onSpectateGame;

    this.initializeElements();
    this.setAttributes();
    this.appendElements();
    this.bindEvents();
  }

  initializeElements() {
    this.form = document.createElement("form");
    this.codeLabel = document.createElement("label");
    this.codeInput = document.createElement("input");
    this.message = document.createElement("p");
    this.spectateButton = new Button({
      label: "SPECTATE GAME",
      type: "submit",
      className: "button-confirm",
    });
    this.modal = new Modal({
      title: "Spectate Game",
      content: this.form,
    });
  }

  setAttributes() {
    this.form.classList.add("modal-form");
    this.codeLabel.textContent = "Game Code";
    this.codeLabel.htmlFor = "spectate-game-code";
    this.codeInput.id = "spectate-game-code";
    this.codeInput.type = "text";
    this.codeInput.placeholder = "Enter game code";
    this.codeInput.autocomplete = "off";
    this.codeInput.spellcheck = false;
    this.message.classList.add("message");
  }

  appendElements() {
    this.form.append(this.codeLabel, this.codeInput, this.message);
    this.spectateButton.render(this.form);
  }

  bindEvents() {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.onSpectateGame();
    });
  }

  getGameCode() {
    return this.codeInput.value.trim();
  }

  setMessage(message) {
    this.message.textContent = message;
  }

  reset() {
    this.codeInput.value = "";
    this.setMessage("");
  }

  open() {
    this.setMessage("");
    this.modal.open();
    this.codeInput.focus();
  }

  close() {
    this.modal.close();
  }

  isOpen() {
    return this.modal.isOpen();
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      this.modal.render(parent);
    } else {
      console.error("SpectateModal target not found.");
    }
  }
}
