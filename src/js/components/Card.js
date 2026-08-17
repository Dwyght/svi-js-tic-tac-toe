import { resolveTarget } from "../utils/dom.js";

export class Card {
  constructor({ content, className = "" }) {
    this.element = document.createElement("div");
    this.element.classList.add("card");

    if (className !== "") {
      this.element.classList.add(className);
    }

    this.element.append(content);
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.element);
    } else {
      console.error("Card target not found.");
    }
  }
}
