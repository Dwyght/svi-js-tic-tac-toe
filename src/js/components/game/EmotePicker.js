import { EMOTES } from "../../config/constants.js";
import { resolveTarget } from "../../utils/dom.js";
import { Button } from "../base/Button.js";

const EMOTE_TOGGLE_IMAGE = "./src/assets/images/emote/emoticon.png";

export class EmotePicker {
  constructor({ onSelect }) {
    this.onSelect = onSelect;

    this.initializeElements();
    this.setAttributes();
    this.appendElements();
    this.addEventListeners();
  }

  initializeElements() {
    this.element = document.createElement("div");
    this.toggleButton = new Button({
      label: "",
      className: "emote-picker-toggle",
      onClick: () => this.toggle(),
    });
    this.toggleImage = document.createElement("img");
    this.panel = document.createElement("div");
    this.emoteButtons = EMOTES.map((emote) =>
      this.createEmoteButton(emote),
    );
  }

  createEmoteButton(emote) {
    const button = document.createElement("button");
    const image = document.createElement("img");

    button.type = "button";
    button.classList.add("emote-option");
    button.setAttribute("aria-label", emote.alt);
    button.addEventListener("click", () => {
      this.close();
      this.onSelect(emote.id);
    });

    image.classList.add("emote-option-image");
    image.src = emote.src;
    image.alt = emote.alt;

    button.append(image);

    return button;
  }

  setAttributes() {
    this.element.classList.add("emote-picker", "hidden");
    this.toggleButton.element.setAttribute("aria-label", "Open emotes");
    this.toggleButton.element.setAttribute("aria-haspopup", "true");
    this.toggleButton.element.setAttribute("aria-expanded", "false");
    this.toggleImage.classList.add("emote-picker-toggle-image");
    this.toggleImage.src = EMOTE_TOGGLE_IMAGE;
    this.toggleImage.alt = "";
    this.toggleImage.draggable = false;
    this.panel.classList.add("emote-picker-panel", "hidden");
  }

  appendElements() {
    this.toggleButton.element.append(this.toggleImage);
    this.toggleButton.render(this.element);
    this.panel.append(...this.emoteButtons);
    this.element.append(this.panel);
  }

  addEventListeners() {
    document.addEventListener("click", (event) => {
      if (!this.element.contains(event.target)) {
        this.close();
      }
    });
  }

  open() {
    if (this.toggleButton.element.disabled) {
      return;
    }

    this.panel.classList.remove("hidden");
    this.toggleButton.element.setAttribute("aria-expanded", "true");
  }

  close() {
    this.panel.classList.add("hidden");
    this.toggleButton.element.setAttribute("aria-expanded", "false");
  }

  toggle() {
    if (this.panel.classList.contains("hidden")) {
      this.open();
    } else {
      this.close();
    }
  }

  setEnabled(isEnabled) {
    this.toggleButton.element.disabled = !isEnabled;
    this.element.classList.toggle("hidden", !isEnabled);

    if (!isEnabled) {
      this.close();
    }
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.element);
    } else {
      console.error("EmotePicker target not found.");
    }
  }
}
