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
      X: this.createEntryElements("img"),
      O: this.createEntryElements("img"),
      draws: this.createEntryElements("span"),
    };
    this.values = {
      X: this.entries.X.value,
      O: this.entries.O.value,
      draws: this.entries.draws.value,
    };
  }

  createEntryElements(labelElementName) {
    return {
      entry: document.createElement("span"),
      label: document.createElement(labelElementName),
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
    this.setEntryAttributes(this.entries.draws, { label: "Draws" });
  }

  setEntryAttributes(entry, { label, imageSource = "" }) {
    entry.entry.classList.add("score-entry");
    entry.separator.classList.add("score-separator");
    entry.separator.textContent = ":";
    entry.value.classList.add("score-value");

    if (imageSource === "") {
      entry.label.classList.add("score-label");
      entry.label.textContent = label;
    } else {
      entry.label.classList.add("score-piece-image");
      entry.label.src = imageSource;
      entry.label.alt = label;
    }
  }

  appendElements() {
    for (const key of ["X", "O", "draws"]) {
      const entry = this.entries[key];

      entry.entry.append(entry.label, entry.separator, entry.value);
      this.element.append(entry.entry);
    }
  }

  update({ X, O, draws }) {
    this.values.X.textContent = X;
    this.values.O.textContent = O;
    this.values.draws.textContent = draws;
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
