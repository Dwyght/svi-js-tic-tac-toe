import { Button } from "../base/Button.js";
import { Modal } from "../base/Modal.js";
import { PLAYER_NAME_MAX_LENGTH } from "../../config/constants.js";
import { resolveTarget } from "../../utils/dom.js";
import { SushiSelector } from "./SushiSelector.js";

export class CreateGameModal {
  constructor({ onCreateGame }) {
    this.onCreateGame = onCreateGame;

    this.initializeElements();
    this.setAttributes();
    this.appendElements();
    this.bindEvents();
  }

  initializeElements() {
    this.form = document.createElement("form");
    this.nameLabel = document.createElement("label");
    this.nameInput = document.createElement("input");
    this.sushiLabel = document.createElement("p");
    this.sushiSelector = new SushiSelector({ tile: "X" });
    this.message = document.createElement("p");
    this.createButton = new Button({
      label: "CONTINUE",
      type: "submit",
      className: "button-confirm",
    });
    this.modal = new Modal({
      title: "Create Game",
      content: this.form,
    });
  }

  setAttributes() {
    this.form.classList.add("modal-form");
    this.nameLabel.textContent = "Player Name";
    this.nameLabel.htmlFor = "create-player-name";
    this.nameInput.id = "create-player-name";
    this.nameInput.type = "text";
    this.nameInput.placeholder = "Enter your name";
    this.nameInput.autocomplete = "name";
    this.nameInput.maxLength = PLAYER_NAME_MAX_LENGTH;
    this.sushiLabel.textContent = "Choose Sushi";
    this.sushiLabel.classList.add("sushi-selector-label");
    this.message.classList.add("message");
    this.modal.dialog.classList.add("game-entry-modal");
  }

  appendElements() {
    this.form.append(
      this.nameLabel,
      this.nameInput,
      this.sushiLabel,
      this.sushiSelector.element,
      this.message,
    );
    this.createButton.render(this.form);
  }

  bindEvents() {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.onCreateGame();
    });
  }

  getPlayerName() {
    return this.nameInput.value.trim();
  }

  getSushiId() {
    return this.sushiSelector.getSelectedSushiId();
  }

  setMessage(message) {
    this.message.textContent = message;
  }

  setPending(isPending) {
    this.createButton.setPending(isPending, "CREATING...");
    this.nameInput.disabled = isPending;
    this.sushiSelector.setEnabled(!isPending);
    this.modal.setDismissEnabled(!isPending);
  }

  reset() {
    this.setPending(false);
    this.nameInput.value = "";
    this.sushiSelector.reset();
    this.setMessage("");
  }

  open() {
    this.setPending(false);
    this.setMessage("");
    this.modal.open();
    this.nameInput.focus();
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
      console.error("CreateGameModal target not found.");
    }
  }
}
