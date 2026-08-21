import { resolveTarget } from "../../utils/dom.js";

export class Scoreboard {
  constructor() {
    this.initializeElements();
    this.setAttributes();
    this.appendElements();
  }

  initializeElements() {
    this.element = document.createElement("div");
    this.entries = {
      X: this.createEntryElements(),
      O: this.createEntryElements(),
    };
    this.values = {
      X: this.entries.X.value,
      O: this.entries.O.value,
    };
  }

  createEntryElements() {
    return {
      entry: document.createElement("span"),
      label: document.createElement("img"),
      separator: document.createElement("span"),
      value: document.createElement("span"),
    };
  }

  setAttributes() {
    this.element.classList.add("score-display");

    this.setEntryAttributes(this.entries.X, {
      label: "Player X",
      imageSource: "./src/assets/images/mushroom.png",
    });
    this.setEntryAttributes(this.entries.O, {
      label: "Player O",
      imageSource: "./src/assets/images/coin.png",
    });
  }

  setEntryAttributes(entry, { label, imageSource }) {
    entry.entry.classList.add("score-entry");
    entry.separator.classList.add("score-separator");
    entry.separator.textContent = ":";
    entry.value.classList.add("score-value");
    entry.label.classList.add("score-piece-image");
    entry.label.src = imageSource;
    entry.label.alt = label;
  }

  appendElements() {
    for (const key of ["X", "O"]) {
      const entry = this.entries[key];

      entry.entry.append(entry.label, entry.separator, entry.value);
      this.element.append(entry.entry);
    }
  }

  update({ X, O }) {
    this.values.X.textContent = X;
    this.values.O.textContent = O;
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.element);
    } else {
      console.error("Scoreboard target not found.");
    }
  }
}
