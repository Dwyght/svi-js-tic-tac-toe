import { checkGame, getBoard, move, resetGame } from "../api/tictactoeApi.js";

import { gameState } from "../state/gameState.js";

import {
  parseBoard,
  getCurrentTurn,
  checkGameResult,
} from "../game/boardLogic.js";

import {
  getPlayerNames,
  clearPlayerNames,
} from "../services/storageService.js";

import { Board } from "../components/Board.js";

import { Button } from "../components/Button.js";

import { Card } from "../components/Card.js";

import { resolveTarget } from "../utils/dom.js";

export class GamePage {
  constructor({ screenManager, pollingService, onReturnHome }) {
    this.screenManager = screenManager;

    this.pollingService = pollingService;

    this.onReturnHome = onReturnHome;

    this.initializeElements();

    this.setAttributes();

    this.appendElements();

    this.board = new Board((x, y) => {
      this.makeMove(x, y);
    });

    this.board.render(this.boardContainer);
  }

  // ========================================
  // STEP 1
  // ========================================

  initializeElements() {
    this.container = document.createElement("div");

    // Game information

    this.turnDisplay = document.createElement("h2");

    this.turnCard = new Card({
      content: this.turnDisplay,
      className: "turn-card",
    });

    this.message = document.createElement("p");

    this.boardContainer = document.createElement("div");

    this.resetButton = new Button({
      label: "Reset Game",
      className: "button-danger",
      onClick: () => this.handleReset(),
    });

    this.resetButton.element.classList.add("reset-button");
  }

  // ========================================
  // STEP 2
  // ========================================

  setAttributes() {
    this.container.classList.add("game-page");

    this.message.classList.add("message");

    this.boardContainer.classList.add("board-stage");
  }

  // ========================================
  // STEP 3
  // ========================================

  appendElements() {
    this.turnCard.render(this.container);

    this.container.append(this.message, this.boardContainer);

    this.resetButton.render(this.container);
  }

  // ========================================
  // START GAME PAGE
  // ========================================

  async startGame() {
    gameState.gameOver = false;

    this.board.clearBoard();

    this.board.setPlayerTile(gameState.myTile);

    this.screenManager.showGameScreen();

    this.playBoardEntrance();

    await this.loadBoard();

    this.pollingService.startRefresh(async () => {
      await this.refreshGame();
    });
  }

  playBoardEntrance() {
    this.boardContainer.classList.remove("board-stage-enter");

    // Restart the entrance animation for every newly started match.
    void this.boardContainer.offsetWidth;

    this.boardContainer.classList.add("board-stage-enter");
  }

  // ========================================
  // REFRESH
  // ========================================

  async refreshGame() {
    if (gameState.gameCode === null) {
      return;
    }

    const started = await checkGame(gameState.gameCode);

    // Someone reset/removed room
    if (!started) {
      this.pollingService.stopRefresh();

      gameState.reset();

      this.board.clearBoard();

      this.onReturnHome("The game room was removed.");

      return;
    }

    if (!gameState.gameOver) {
      await this.loadBoard();
    }
  }

  // ========================================
  // LOAD BOARD
  // ========================================

  async loadBoard() {
    const boardData = await getBoard(gameState.gameCode);

    if (boardData === "[GAME NOT YET STARTED]") {
      this.message.textContent = "Waiting for another player.";

      return;
    }

    const cells = parseBoard(boardData);

    this.board.displayBoard(cells);

    const result = checkGameResult(cells);

    if (result.status !== "playing") {
      this.finishGame(result);

      return;
    }

    const turn = getCurrentTurn(cells);

    this.updateTurn(turn);
  }

  // ========================================
  // TURN
  // ========================================

  updateTurn(turn) {
    const players = getPlayerNames(gameState.gameCode);

    const playerName = players[turn];

    this.turnDisplay.textContent = `${playerName}'s Turn (${turn})`;

    if (turn === gameState.myTile) {
      this.message.textContent = "Your turn.";
    } else {
      this.message.textContent = "Waiting for the other player.";
    }
  }

  // ========================================
  // MAKE MOVE
  // ========================================

  async makeMove(x, y) {
    if (gameState.gameOver) {
      return;
    }

    if (!gameState.gameStarted) {
      this.message.textContent = "Game has not started.";

      return;
    }

    try {
      // Always get latest board
      // before submitting a move.

      const boardData = await getBoard(gameState.gameCode);

      if (boardData === "[GAME NOT YET STARTED]") {
        this.message.textContent = "Waiting for another player.";

        return;
      }

      const cells = parseBoard(boardData);

      // -------------------------
      // CHECK GAME ALREADY ENDED
      // -------------------------

      const result = checkGameResult(cells);

      if (result.status !== "playing") {
        this.finishGame(result);

        return;
      }

      // -------------------------
      // WHOSE TURN?
      // -------------------------

      const currentTurn = getCurrentTurn(cells);

      // X/O must alternate.
      //
      // Also prevents O from
      // submitting an X turn.
      if (currentTurn !== gameState.myTile) {
        this.message.textContent = `It is Player ${currentTurn}'s turn.`;

        return;
      }

      // -------------------------
      // CHECK CELL
      // -------------------------

      const index = y * 3 + x;

      if (cells[index] === "X" || cells[index] === "O") {
        this.message.textContent = "That square is already taken.";

        return;
      }

      // -------------------------
      // SEND MOVE
      // -------------------------

      const moveResult = await move(
        gameState.gameCode,

        // Player cannot choose this.
        // The server assigned it.
        gameState.myTile,

        y,

        x,
      );

      if (moveResult === "[TAKEN]") {
        this.message.textContent = "That square is already taken.";

        await this.loadBoard();

        return;
      }

      await this.loadBoard();
    } catch (error) {
      console.error(error);

      this.message.textContent = "Could not send move.";
    }
  }

  // ========================================
  // FINISH GAME
  // ========================================

  finishGame(result) {
    gameState.gameOver = true;

    this.board.disableBoard();

    this.turnDisplay.textContent = "Game Over";

    if (result.status === "draw") {
      this.message.textContent = "The game is a draw!";

      return;
    }

    const players = getPlayerNames(gameState.gameCode);

    const winnerName = players[result.winner];

    if (result.winner === gameState.myTile) {
      this.message.textContent = `You win! ${winnerName} (${result.winner}) won the game.`;
    } else {
      this.message.textContent = `${winnerName} (${result.winner}) won the game.`;
    }
  }

  // ========================================
  // RESET
  // ========================================

  async handleReset() {
    if (gameState.gameCode === null) {
      return;
    }

    const oldGameCode = gameState.gameCode;

    try {
      await resetGame(oldGameCode);

      clearPlayerNames(oldGameCode);

      this.pollingService.stopRefresh();

      gameState.reset();

      this.board.clearBoard();

      this.onReturnHome("Game reset.");
    } catch (error) {
      console.error(error);

      this.message.textContent = "Could not reset game.";
    }
  }

  // ========================================
  // RENDER
  // ========================================

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.container);
    } else {
      console.error("GamePage target not found.");
    }
  }
}
