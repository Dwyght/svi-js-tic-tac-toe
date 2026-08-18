import { gameState } from "../state/gameState.js";

import { getPlayerNames } from "../services/storageService.js";

import {
  fetchAndParseBoard,
  evaluateBoard,
  submitMove,
  checkGameStillActive,
  resetGameSession,
} from "../services/gameFlowService.js";

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

    this.statusContainer = document.createElement("div");

    this.turnDisplay = document.createElement("h2");

    this.turnCard = new Card({
      content: this.turnDisplay,
      className: "turn-card",
    });

    this.message = document.createElement("p");

    this.boardContainer = document.createElement("div");

    this.resetButton = new Button({
      label: "QUIT GAME",
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

    this.statusContainer.classList.add("game-status");

    this.message.classList.add("message");

    this.boardContainer.classList.add("board-stage");
  }

  // ========================================
  // STEP 3
  // ========================================

  appendElements() {
    this.turnCard.render(this.statusContainer);

    this.statusContainer.append(this.message);

    this.container.append(this.statusContainer, this.boardContainer);

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

    const started = await checkGameStillActive(gameState.gameCode);

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
    const board = await fetchAndParseBoard(gameState.gameCode);

    if (board.status === "waiting") {
      this.message.textContent = "Waiting for another player.";

      return;
    }

    this.board.displayBoard(board.cells);

    const boardState = evaluateBoard(board.cells);

    if (boardState.status === "finished") {
      this.finishGame(boardState.result);

      return;
    }

    this.updateTurn(boardState.turn);
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
      const result = await submitMove(
        gameState.gameCode,

        gameState.myTile,

        x,

        y,
      );

      if (result.reason === "waiting") {
        this.message.textContent = "Waiting for another player.";

        return;
      }

      if (result.reason === "game_over") {
        this.finishGame(result.result);

        return;
      }

      if (result.reason === "not_your_turn") {
        this.message.textContent = `It is Player ${result.currentTurn}'s turn.`;

        return;
      }

      if (result.reason === "cell_taken") {
        this.message.textContent = "That square is already taken.";

        if (result.refreshBoard) {
          await this.loadBoard();
        }

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
      await resetGameSession(oldGameCode);

      this.pollingService.stopRefresh();

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
