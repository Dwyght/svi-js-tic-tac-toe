import { Button } from "../base/Button.js";
import { Modal } from "../base/Modal.js";
import { resolveTarget } from "../../utils/dom.js";
import { getSushiOptions } from "../../utils/sushi.js";

export class SushiPickerModal {
  constructor() {
    this.onConfirm = null;
    this.selectedSushiId = null;
    this.optionElements = [];

    this.initializeElements();
    this.setAttributes();
    this.appendElements();
  }

  initializeElements() {
    this.content = document.createElement("div");
    this.grid = document.createElement("div");
    this.confirmButton = new Button({
      label: "CONFIRM SUSHI",
      className: "button-confirm",
      onClick: () => this.confirmSelection(),
    });
    this.modal = new Modal({
      title: "Pick your Sushi!",
      content: this.content,
      closable: false,
    });
  }

  setAttributes() {
    this.content.classList.add("sushi-picker-content");
    this.grid.classList.add("sushi-picker-grid");
    this.grid.setAttribute("role", "radiogroup");
    this.grid.setAttribute("aria-label", "Sushi choices");
    this.confirmButton.element.classList.add("sushi-picker-confirm");
    this.modal.dialog.classList.add("sushi-picker-modal");
  }

  appendElements() {
    this.content.append(this.grid);
    this.confirmButton.render(this.content);
  }

  createOption(sushi) {
    const button = document.createElement("button");
    const image = document.createElement("img");

    button.type = "button";
    button.classList.add("sushi-picker-option");
    button.dataset.sushiId = sushi.id;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-label", sushi.alt);
    button.addEventListener("click", () => this.selectSushi(sushi.id));

    image.classList.add("sushi-picker-image");
    image.src = sushi.src;
    image.alt = sushi.alt;
    image.draggable = false;

    button.append(image);

    return button;
  }

  renderOptions(options) {
    this.optionElements = options.map((sushi) =>
      this.createOption(sushi),
    );

    this.grid.replaceChildren(...this.optionElements);
  }

  selectSushi(sushiId) {
    this.selectedSushiId = sushiId;

    for (const option of this.optionElements) {
      const isSelected = option.dataset.sushiId === sushiId;

      option.classList.toggle("sushi-picker-option-selected", isSelected);
      option.setAttribute("aria-checked", String(isSelected));
    }
  }

  confirmSelection() {
    if (this.selectedSushiId === null) {
      return;
    }

    const selectedSushiId = this.selectedSushiId;
    const onConfirm = this.onConfirm;

    this.onConfirm = null;
    this.close();

    if (onConfirm !== null) {
      onConfirm(selectedSushiId);
    }
  }

  open(tile, onConfirm) {
    const options = getSushiOptions(tile);

    if (options.length === 0 || typeof onConfirm !== "function") {
      console.error(`No sushi options found for Player ${tile}.`);
      return;
    }

    this.onConfirm = onConfirm;
    this.confirmButton.setLabel(
      tile === "X" ? "CREATE GAME" : "JOIN GAME",
    );
    this.renderOptions(options);
    this.selectSushi(options[0].id);
    this.modal.open();
    this.optionElements[0].focus();
  }

  reset() {
    this.onConfirm = null;
    this.selectedSushiId = null;
    this.optionElements = [];
    this.grid.replaceChildren();
  }

  close() {
    this.modal.close();
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      this.modal.render(parent);
    } else {
      console.error("SushiPickerModal target not found.");
    }
  }
}
