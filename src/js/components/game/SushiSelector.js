import { getSushiOptions } from "../../utils/sushi.js";

export class SushiSelector {
  constructor({ tile }) {
    this.options = getSushiOptions(tile);
    this.selectedSushiId = null;
    this.optionElements = [];

    this.initializeElements();
    this.setAttributes();
    this.renderOptions();
    this.reset();
  }

  initializeElements() {
    this.element = document.createElement("div");
  }

  setAttributes() {
    this.element.classList.add("sushi-selector-grid");
    this.element.setAttribute("role", "radiogroup");
    this.element.setAttribute("aria-label", "Sushi choices");
  }

  createOption(sushi) {
    const button = document.createElement("button");
    const image = document.createElement("img");

    button.type = "button";
    button.classList.add("sushi-selector-option");
    button.dataset.sushiId = sushi.id;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-label", sushi.alt);
    button.addEventListener("click", () => this.selectSushi(sushi.id));

    image.classList.add("sushi-selector-image");
    image.src = sushi.src;
    image.alt = sushi.alt;
    image.draggable = false;

    button.append(image);

    return button;
  }

  renderOptions() {
    this.optionElements = this.options.map((sushi) =>
      this.createOption(sushi),
    );
    this.element.replaceChildren(...this.optionElements);
  }

  selectSushi(sushiId) {
    this.selectedSushiId = sushiId;

    for (const option of this.optionElements) {
      const isSelected = option.dataset.sushiId === sushiId;

      option.classList.toggle(
        "sushi-selector-option-selected",
        isSelected,
      );
      option.setAttribute("aria-checked", String(isSelected));
    }
  }

  getSelectedSushiId() {
    return this.selectedSushiId;
  }

  reset() {
    if (this.options.length === 0) {
      this.selectedSushiId = null;
      return;
    }

    this.selectSushi(this.options[0].id);
  }

  setEnabled(isEnabled) {
    for (const option of this.optionElements) {
      option.disabled = !isEnabled;
      option.setAttribute("aria-disabled", String(!isEnabled));
    }
  }
}
