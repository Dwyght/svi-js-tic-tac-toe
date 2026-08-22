import { Button } from "../base/Button.js";
import { Modal } from "../base/Modal.js";
import { resolveTarget } from "../../utils/dom.js";
import { SushiSelector } from "./SushiSelector.js";

export class JoinGameModal {
  constructor({ onJoinGame, onPasteGameCode }) {
    this.onJoinGame = onJoinGame;
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
    this.nameLabel = document.createElement("label");
    this.nameInput = document.createElement("input");
    this.sushiLabel = document.createElement("p");
    this.sushiSelector = new SushiSelector({ tile: "O" });
    this.message = document.createElement("p");
    this.pasteButton = new Button({
      label: "PASTE",
      className: "button-utility",
      onClick: () => this.onPasteGameCode(),
    });
    this.joinButton = new Button({
      label: "CONTINUE",
      type: "submit",
      className: "button-confirm",
    });
    this.modal = new Modal({
      title: "Join Game",
      content: this.form,
    });
  }

  setAttributes() {
    this.form.classList.add("modal-form");
    this.codeLabel.textContent = "Game Code";
    this.codeLabel.htmlFor = "join-game-code";
    this.codeInput.id = "join-game-code";
    this.codeInput.type = "text";
    this.codeInput.placeholder = "Enter or paste game code";
    this.codeInput.autocomplete = "off";
    this.codeInput.spellcheck = false;
    this.codeField.classList.add("game-code-field");
    this.nameLabel.textContent = "Player Name";
    this.nameLabel.htmlFor = "join-player-name";
    this.nameInput.id = "join-player-name";
    this.nameInput.type = "text";
    this.nameInput.placeholder = "Enter Player O's name";
    this.nameInput.autocomplete = "name";
    this.sushiLabel.textContent = "Choose Sushi";
    this.sushiLabel.classList.add("sushi-selector-label");
    this.message.classList.add("message");
    this.modal.dialog.classList.add("game-entry-modal");
  }

  appendElements() {
    this.form.append(
      this.codeLabel,
      this.codeField,
      this.nameLabel,
      this.nameInput,
      this.sushiLabel,
      this.sushiSelector.element,
      this.message,
    );
    this.codeField.append(this.codeInput);
    this.pasteButton.render(this.codeField);
    this.joinButton.render(this.form);
  }

  bindEvents() {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.onJoinGame();
    });
  }

  getGameCode() {
    return this.codeInput.value.trim().toUpperCase();
  }

  getPlayerName() {
    return this.nameInput.value.trim();
  }

  getSushiId() {
    return this.sushiSelector.getSelectedSushiId();
  }

  setGameCode(gameCode) {
    this.codeInput.value = gameCode;
  }

  focusPlayerName() {
    this.nameInput.focus();
  }

  setMessage(message) {
    this.message.textContent = message;
  }

  setPending(isPending) {
    this.joinButton.setPending(isPending, "JOINING...");
    this.codeInput.disabled = isPending;
    this.nameInput.disabled = isPending;
    this.pasteButton.element.disabled = isPending;
    this.sushiSelector.setEnabled(!isPending);
    this.modal.setDismissEnabled(!isPending);
  }

  reset() {
    this.setPending(false);
    this.codeInput.value = "";
    this.nameInput.value = "";
    this.sushiSelector.reset();
    this.setMessage("");
  }

  open() {
    this.setPending(false);
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
      console.error("JoinGameModal target not found.");
    }
  }
}
