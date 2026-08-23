import { Modal } from "../base/Modal.js";
import { resolveTarget } from "../../utils/dom.js";

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
      "Create, join, or spectate a game using a shared code.";

    const steps = [
      "Create a game: enter your name, choose an X sushi, and share the code.",
      "Join a game: enter the code and your name, then choose an O sushi.",
      "X goes first. Take turns placing sushi; make three in a row to score.",
      "After a round, X can play again. Spectators can watch an active code but cannot move.",
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
