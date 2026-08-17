import { resolveTarget } from "../utils/dom.js";

export class Button {
  constructor({ label, type = "button", className = "", onClick = null }) {
    this.element = document.createElement("button");
    this.element.type = type;
    this.element.classList.add("button");

    if (className !== "") {
      this.element.classList.add(className);
    }

    this.setLabel(label);

    if (onClick !== null) {
      this.element.addEventListener("click", onClick);
    }
  }

  setLabel(label) {
    this.element.textContent = label;
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.element);
    } else {
      console.error("Button target not found.");
    }
  }
}
