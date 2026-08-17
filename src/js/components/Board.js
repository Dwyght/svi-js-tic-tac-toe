import { resolveTarget } from "../utils/dom.js";

export class Board {
  constructor(onCellClick) {
    this.onCellClick = onCellClick;

    this.initializeElements();

    this.setAttributes();

    this.appendElements();

    this.bindEvents();
  }

  // ========================================
  // STEP 1: CREATE ELEMENTS
  // ========================================

  initializeElements() {
    this.container = document.createElement("div");

    this.cells = [];

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const cell = document.createElement("button");

        this.cells.push({
          element: cell,
          x: x,
          y: y,
        });
      }
    }
  }

  // ========================================
  // STEP 2: ATTRIBUTES
  // ========================================

  setAttributes() {
    this.container.id = "board";

    this.container.classList.add("board");

    for (const cell of this.cells) {
      cell.element.classList.add("cell");

      cell.element.type = "button";

      cell.element.dataset.x = cell.x;

      cell.element.dataset.y = cell.y;

      this.clearCell(cell.element, cell.x, cell.y);
    }
  }

  // ========================================
  // STEP 3: APPEND
  // ========================================

  appendElements() {
    for (const cell of this.cells) {
      this.container.append(cell.element);
    }
  }

  // ========================================
  // EVENTS
  // ========================================

  bindEvents() {
    for (const cell of this.cells) {
      cell.element.addEventListener("click", () => {
        this.onCellClick(cell.x, cell.y);
      });
    }
  }

  // ========================================
  // DISPLAY BOARD
  // ========================================

  displayBoard(values) {
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];

      const value = values[i] || "";

      cell.element.dataset.value = value;

      cell.element.setAttribute(
        "aria-label",
        this.getCellLabel(value, cell.x, cell.y),
      );
    }
  }

  // ========================================
  // PLAYER PREVIEW
  // ========================================

  setPlayerTile(tile) {
    this.container.classList.toggle("player-x", tile === "X");

    this.container.classList.toggle("player-o", tile === "O");
  }

  // ========================================
  // DISABLE BOARD
  // ========================================

  disableBoard() {
    for (const cell of this.cells) {
      cell.element.disabled = true;

      cell.element.classList.add("disabled");
    }
  }

  // ========================================
  // ENABLE BOARD
  // ========================================

  enableBoard() {
    for (const cell of this.cells) {
      cell.element.disabled = false;

      cell.element.classList.remove("disabled");
    }
  }

  // ========================================
  // CLEAR BOARD
  // ========================================

  clearBoard() {
    for (const cell of this.cells) {
      this.clearCell(cell.element, cell.x, cell.y);
    }

    this.enableBoard();
  }

  clearCell(element, x, y) {
    element.dataset.value = "";

    element.setAttribute("aria-label", this.getCellLabel("", x, y));
  }

  getCellLabel(value, x, y) {
    const position = `Row ${y + 1}, column ${x + 1}`;

    if (value === "X") {
      return `${position}: Super Mushroom`;
    }

    if (value === "O") {
      return `${position}: Gold Coin`;
    }

    return `${position}: Empty`;
  }

  // ========================================
  // RENDER
  // ========================================

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.container);
    } else {
      console.error("Board target not found.");
    }
  }
}
