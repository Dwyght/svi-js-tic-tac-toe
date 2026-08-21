import { Modal } from "./Modal.js";
import { resolveTarget } from "../utils/dom.js";

export class HowToPlayModal {
  constructor() {
    this.initializeElements();
    this.setAttributes();
    this.appendElements();
  }

  initializeElements() {
    this.content = document.createElement("div");
    this.intro = document.createElement("p");
    this.steps = document.createElement("ol");
    this.modal = new Modal({
      title: "How to Play",
      content: this.content,
    });
  }

  setAttributes() {
    this.content.classList.add("how-to-play-content");
    this.intro.textContent =
      "Play with a friend and be the first to make a row of three.";

    const steps = [
      "Choose Create Game, enter your name, and share the game code.",
      "Your friend chooses Join Game and enters the shared code.",
      "Player X goes first. Take turns choosing an empty square.",
      "Make three matching pieces in a row, column, or diagonal to win.",
    ];

    for (const step of steps) {
      const item = document.createElement("li");

      item.textContent = step;
      this.steps.append(item);
    }
  }

  appendElements() {
    this.content.append(this.intro, this.steps);
  }

  open() {
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
      console.error("HowToPlayModal target not found.");
    }
  }
}
