import { Button } from "../base/Button.js";
import { Modal } from "../base/Modal.js";
import { resolveTarget } from "../../utils/dom.js";

export class SpectateModal {
  constructor({ onSpectateGame, onPasteGameCode }) {
    this.onSpectateGame = onSpectateGame;
    this.onPasteGameCode = onPasteGameCode;

    this.initializeElements();
    this.setAttributes();
    this.appendElements();
    this.bindEvents();
  }

  initializeElements() {
    this.form = document.createElement("form");
    this.codeLabel = document.createElement("label");
    this.codeField = document.createElement("div");
    this.codeInput = document.createElement("input");
    this.message = document.createElement("p");
    this.pasteButton = new Button({
      label: "PASTE",
      className: "button-utility",
      onClick: () => this.onPasteGameCode(),
    });
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
    this.codeInput.placeholder = "Enter or paste game code";
    this.codeInput.autocomplete = "off";
    this.codeInput.spellcheck = false;
    this.codeField.classList.add("game-code-field");
    this.message.classList.add("message");
  }

  appendElements() {
    this.form.append(this.codeLabel, this.codeField, this.message);
    this.codeField.append(this.codeInput);
    this.pasteButton.render(this.codeField);
    this.spectateButton.render(this.form);
  }

  bindEvents() {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.onSpectateGame();
    });
  }

  getGameCode() {
    return this.codeInput.value.trim().toUpperCase();
  }

  setGameCode(gameCode) {
    this.codeInput.value = gameCode;
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
