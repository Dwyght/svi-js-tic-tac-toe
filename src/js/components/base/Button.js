import { resolveTarget } from "../../utils/dom.js";

export class Button {
  constructor({ label, type = "button", className = "", onClick = null }) {
    this.originalLabel = label;
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
    this.originalLabel = label;
    this.element.textContent = label;
  }

  setPending(isPending, pendingLabel) {
    if (isPending) {
      const originalLabel = this.originalLabel;

      this.element.disabled = true;
      this.setLabel(pendingLabel);
      this.originalLabel = originalLabel;
      return;
    }

    this.element.disabled = false;
    this.setLabel(this.originalLabel);
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
