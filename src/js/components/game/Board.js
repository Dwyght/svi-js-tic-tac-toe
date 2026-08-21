import { resolveTarget } from "../../utils/dom.js";

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

    this.sushiLabels = {
      X: "Player X sushi",
      O: "Player O sushi",
    };

    this.separators = [
      this.createSeparator("vertical", "first"),
      this.createSeparator("vertical", "second"),
      this.createSeparator("horizontal", "first"),
      this.createSeparator("horizontal", "second"),
    ];

    this.cells = [];

    for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
      for (let columnIndex = 0; columnIndex < 3; columnIndex++) {
        const cell = document.createElement("button");

        this.cells.push({
          element: cell,
          x: columnIndex,
          y: rowIndex,
        });
      }
    }
  }

  createSeparator(orientation, position) {
    return {
      element: document.createElement("span"),
      orientation,
      position,
    };
  }

  // ========================================
  // STEP 2: ATTRIBUTES
  // ========================================

  setAttributes() {
    this.container.id = "board";

    this.container.classList.add("board");

    for (const separator of this.separators) {
      separator.element.classList.add(
        "board-separator",
        `board-separator-${separator.orientation}`,
        `board-separator-${separator.position}`,
      );

      separator.element.setAttribute("aria-hidden", "true");
    }

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
    this.container.append(
      ...this.separators.map((separator) => separator.element),
    );

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
    for (let cellIndex = 0; cellIndex < this.cells.length; cellIndex++) {
      const cell = this.cells[cellIndex];

      const value = values[cellIndex] || "";

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

  setSushiImages({ X, O }) {
    const xImageUrl = new URL(X.src, document.baseURI).href;
    const oImageUrl = new URL(O.src, document.baseURI).href;

    this.container.style.setProperty(
      "--sushi-x-image",
      `url("${xImageUrl}")`,
    );
    this.container.style.setProperty(
      "--sushi-o-image",
      `url("${oImageUrl}")`,
    );

    this.sushiLabels.X = X.alt;
    this.sushiLabels.O = O.alt;

    for (const cell of this.cells) {
      const value = cell.element.dataset.value;

      cell.element.setAttribute(
        "aria-label",
        this.getCellLabel(value, cell.x, cell.y),
      );
    }
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
      return `${position}: ${this.sushiLabels.X}`;
    }

    if (value === "O") {
      return `${position}: ${this.sushiLabels.O}`;
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
