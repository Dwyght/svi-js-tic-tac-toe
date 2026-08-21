import { EMOTES } from "../../config/constants.js";
import { resolveTarget } from "../../utils/dom.js";

const EMOTE_DISPLAY_DURATION = 3000;

export class Scoreboard {
  constructor() {
    this.initializeElements();
    this.setAttributes();
    this.appendElements();
  }

  initializeElements() {
    this.element = document.createElement("div");
    this.emoteTimeouts = {
      X: null,
      O: null,
    };
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
      emoteBubble: document.createElement("span"),
      emoteImage: document.createElement("img"),
    };
  }

  setAttributes() {
    this.element.classList.add("score-display");

    this.setEntryAttributes(this.entries.X, {
      label: "Player X sushi",
    });
    this.setEntryAttributes(this.entries.O, {
      label: "Player O sushi",
    });
  }

  setEntryAttributes(entry, { label }) {
    entry.entry.classList.add("score-entry");
    entry.separator.classList.add("score-separator");
    entry.separator.textContent = ":";
    entry.value.classList.add("score-value");
    entry.label.classList.add("score-piece-image");
    entry.label.alt = label;
    entry.emoteBubble.classList.add("emote-bubble", "hidden");
    entry.emoteBubble.setAttribute("role", "status");
    entry.emoteImage.classList.add("emote-bubble-image");
  }

  appendElements() {
    for (const key of ["X", "O"]) {
      const entry = this.entries[key];

      entry.emoteBubble.append(entry.emoteImage);
      entry.entry.append(
        entry.label,
        entry.separator,
        entry.value,
        entry.emoteBubble,
      );
      this.element.append(entry.entry);
    }
  }

  update({ X, O }) {
    this.values.X.textContent = X;
    this.values.O.textContent = O;
  }

  setSushiImages({ X, O }) {
    this.entries.X.label.src = X.src;
    this.entries.X.label.alt = X.alt;
    this.entries.O.label.src = O.src;
    this.entries.O.label.alt = O.alt;
  }

  showEmoteBubble(tile, emoteId) {
    const entry = this.entries[tile];
    const emote = EMOTES.find((candidate) => candidate.id === emoteId);

    if (!entry || !emote) {
      return;
    }

    if (this.emoteTimeouts[tile] !== null) {
      clearTimeout(this.emoteTimeouts[tile]);
    }

    entry.emoteImage.src = emote.src;
    entry.emoteImage.alt = emote.alt;
    entry.emoteBubble.classList.remove("hidden");

    this.emoteTimeouts[tile] = setTimeout(() => {
      entry.emoteBubble.classList.add("hidden");
      this.emoteTimeouts[tile] = null;
    }, EMOTE_DISPLAY_DURATION);
  }

  clearEmoteBubbles() {
    for (const tile of ["X", "O"]) {
      if (this.emoteTimeouts[tile] !== null) {
        clearTimeout(this.emoteTimeouts[tile]);
        this.emoteTimeouts[tile] = null;
      }

      this.entries[tile].emoteBubble.classList.add("hidden");
    }
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
