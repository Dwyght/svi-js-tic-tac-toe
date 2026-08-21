import { Button } from "./Button.js";
import { Modal } from "./Modal.js";
import { resolveTarget } from "../utils/dom.js";

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
    this.message = document.createElement("p");
    this.createButton = new Button({
      label: "CREATE GAME",
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
    this.message.classList.add("message");
  }

  appendElements() {
    this.form.append(this.nameLabel, this.nameInput, this.message);
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

  setMessage(message) {
    this.message.textContent = message;
  }

  reset() {
    this.nameInput.value = "";
    this.setMessage("");
  }

  open() {
    this.setMessage("");
    this.modal.open();
    this.nameInput.focus();
  }

  close() {
    this.modal.close();
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
