import { Board } from "../game/Board.js";
import { Button } from "../base/Button.js";
import { DEFAULT_SUSHI } from "../../config/constants.js";
import { checkGameResult } from "../../game/boardLogic.js";
import { resolveTarget } from "../../utils/dom.js";
import { resolveSushi } from "../../utils/sushi.js";

const REPLAY_DELAY_MS = 2000;

function normalizeMoves(moves) {
  const occupiedLocations = new Set();

  return moves.map((move) => {
    const rawLocation = String(move.location ?? "").trim();
    const location = Number(rawLocation);

    if (
      (move.symbol !== "X" && move.symbol !== "O") ||
      rawLocation === "" ||
      !Number.isInteger(location) ||
      location < 0 ||
      location > 8 ||
      occupiedLocations.has(location)
    ) {
      throw new Error("Round contains invalid move data.");
    }

    occupiedLocations.add(location);

    return {
      playerId: String(move.playerid ?? ""),
      symbol: move.symbol,
      location,
    };
  });
}

export class HistoryReplay {
  constructor() {
    this.moves = [];
    this.cells = Array(9).fill("");
    this.moveIndex = 0;
    this.timerId = null;

    this.initializeElements();
    this.initializeComponents();
    this.setAttributes();
    this.appendElements();
    this.prepareBoard();
  }

  initializeElements() {
    this.container = document.createElement("div");
    this.title = document.createElement("h3");
    this.status = document.createElement("p");
    this.boardStage = document.createElement("div");
    this.controls = document.createElement("div");
  }

  initializeComponents() {
    this.board = new Board(() => {}, {
      elementId: "history-replay-board",
    });
    this.replayButton = new Button({
      label: "Replay",
      className: "button-confirm",
      onClick: () => this.start(),
    });
  }

  setAttributes() {
    this.container.classList.add("history-replay", "hidden");
    this.title.textContent = "Replay";
    this.status.classList.add("history-replay-status");
    this.status.setAttribute("aria-live", "polite");
    this.boardStage.classList.add(
      "board-stage",
      "history-replay-board-stage",
    );
    this.controls.classList.add("history-replay-controls");
  }

  appendElements() {
    this.board.render(this.boardStage);
    this.replayButton.render(this.controls);
    this.container.append(
      this.title,
      this.status,
      this.boardStage,
      this.controls,
    );
  }

  prepareBoard() {
    this.board.setSushiImages({
      X: resolveSushi("X", DEFAULT_SUSHI.X),
      O: resolveSushi("O", DEFAULT_SUSHI.O),
    });
    this.clearBoard();
    this.replayButton.element.disabled = true;
  }

  setMoves(moves) {
    this.stop();
    this.container.classList.remove("hidden");

    try {
      this.moves = normalizeMoves(moves);
      this.replayButton.element.disabled = this.moves.length === 0;

      if (this.moves.length === 0) {
        this.clearBoard();
        this.status.textContent = "No moves are available to replay.";
        return;
      }

      this.start();
    } catch (error) {
      console.error("Could not prepare round replay.", error);
      this.moves = [];
      this.clearBoard();
      this.replayButton.element.disabled = true;
      this.status.textContent = "Replay unavailable: invalid move data.";
    }
  }

  start() {
    if (this.moves.length === 0) {
      return;
    }

    this.stop();
    this.clearBoard();
    this.status.textContent = "Replay starting...";
    this.scheduleNextMove();
  }

  scheduleNextMove() {
    this.timerId = window.setTimeout(() => {
      this.timerId = null;
      this.showNextMove();
    }, REPLAY_DELAY_MS);
  }

  showNextMove() {
    const move = this.moves[this.moveIndex];

    if (!move) {
      this.finish();
      return;
    }

    this.cells[move.location] = move.symbol;
    this.moveIndex++;
    this.board.displayBoard(this.cells);
    this.board.disableBoard();
    this.status.textContent =
      `Move ${this.moveIndex} of ${this.moves.length}: ` +
      `${move.playerId} placed ${move.symbol}.`;

    if (this.moveIndex < this.moves.length) {
      this.scheduleNextMove();
      return;
    }

    this.finish();
  }

  finish() {
    const result = checkGameResult(this.cells);

    if (result.status === "win") {
      this.status.textContent = `Replay complete: ${result.winner} wins.`;
      return;
    }

    if (result.status === "draw") {
      this.status.textContent = "Replay complete: draw.";
      return;
    }

    this.status.textContent = "Replay complete: round is unfinished.";
  }

  clearBoard() {
    this.cells.fill("");
    this.moveIndex = 0;
    this.board.displayBoard(this.cells);
    this.board.disableBoard();
  }

  stop() {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  reset() {
    this.stop();
    this.moves = [];
    this.clearBoard();
    this.status.textContent = "";
    this.replayButton.element.disabled = true;
    this.container.classList.add("hidden");
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.container);
    } else {
      console.error("HistoryReplay target not found.");
    }
  }
}
