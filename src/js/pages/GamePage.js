import { gameState } from "../state/gameState.js";
import { getPlayerNames } from "../services/storageService.js";
import {
  fetchAndParseBoard,
  evaluateBoard,
  submitMove,
  checkGameStillActive,
  restartGameSession,
  notifyGameSessionLeaving,
  resetGameSession,
} from "../services/gameFlowService.js";
import { Board } from "../components/Board.js";
import { Button } from "../components/Button.js";
import { Card } from "../components/Card.js";
import { Modal } from "../components/Modal.js";
import { resolveTarget } from "../utils/dom.js";

const GAME_OVER_INACTIVE_GRACE_REFRESHES = 3;

export class GamePage {
  constructor({ screenManager, pollingService, onReturnHome }) {
    this.screenManager = screenManager;
    this.pollingService = pollingService;
    this.onReturnHome = onReturnHome;
    this.inactiveGameOverRefreshes = 0;

    this.initializeElements();
    this.setAttributes();
    this.appendElements();
    this.bindEvents();

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

    // Game result
    this.resultContent = document.createElement("div");
    this.resultMessage = document.createElement("p");

    // Quit confirmation
    this.quitContent = document.createElement("div");
    this.quitMessage = document.createElement("p");

    this.resetButton = new Button({
      label: "QUIT GAME",
      className: "button-danger",
      onClick: () => this.openQuitModal(),
    });
    this.resetButton.element.classList.add("reset-button");

    this.playAgainButton = new Button({
      label: "PLAY AGAIN",
      className: "button-confirm",
      onClick: () => this.handlePlayAgain(),
    });
    this.resultQuitButton = new Button({
      label: "QUIT GAME",
      className: "button-danger",
      onClick: () => this.openQuitModal(),
    });
    this.resultModal = new Modal({
      title: "Game Over",
      content: this.resultContent,
      closable: false,
    });

    this.cancelQuitButton = new Button({
      label: "CANCEL",
      className: "button-utility",
      onClick: () => this.quitModal.close(),
    });
    this.confirmQuitButton = new Button({
      label: "YES, QUIT",
      className: "button-danger",
      onClick: () => this.confirmQuit(),
    });
    this.quitModal = new Modal({
      title: "Quit Game",
      content: this.quitContent,
    });
  }

  // ========================================
  // STEP 2
  // ========================================

  setAttributes() {
    this.container.classList.add("game-page");
    this.statusContainer.classList.add("game-status");
    this.message.classList.add("message");
    this.boardContainer.classList.add("board-stage");
    this.resultContent.classList.add("modal-form");
    this.quitContent.classList.add("modal-form");
    this.quitMessage.textContent =
      "Are you sure you want to quit? This will end the game for both players.";
  }

  // ========================================
  // STEP 3
  // ========================================

  appendElements() {
    this.turnCard.render(this.statusContainer);
    this.statusContainer.append(this.message);
    this.container.append(this.statusContainer, this.boardContainer);
    this.resetButton.render(this.container);
    this.resultContent.append(this.resultMessage);
    this.playAgainButton.render(this.resultContent);
    this.resultQuitButton.render(this.resultContent);
    this.quitContent.append(this.quitMessage);
    this.cancelQuitButton.render(this.quitContent);
    this.confirmQuitButton.render(this.quitContent);
  }

  // ========================================
  // EVENTS
  // ========================================

  bindEvents() {
    window.addEventListener("beforeunload", () => {
      this.notifyPlayerLeaving();
    });
  }

  notifyPlayerLeaving() {
    if (gameState.gameCode === null) {
      return;
    }

    // Unload handlers cannot safely wait for asynchronous work. The
    // keepalive request is allowed to continue after the page is discarded.
    notifyGameSessionLeaving(gameState.gameCode).catch(() => {});
  }

  // ========================================
  // START GAME PAGE
  // ========================================

  async startGame() {
    gameState.gameOver = false;
    this.inactiveGameOverRefreshes = 0;
    this.resultModal.close();
    this.quitModal.close();
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
      if (
        gameState.gameOver &&
        this.inactiveGameOverRefreshes < GAME_OVER_INACTIVE_GRACE_REFRESHES
      ) {
        this.inactiveGameOverRefreshes++;
        return;
      }

      this.pollingService.stopRefresh();
      gameState.reset();
      this.board.clearBoard();
      this.resultModal.close();
      this.quitModal.close();
      this.onReturnHome("The other player has left the game.");
      return;
    }

    this.inactiveGameOverRefreshes = 0;
    await this.loadBoard();
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
      if (!gameState.gameOver) {
        this.finishGame(boardState.result);
      }

      return;
    }

    if (gameState.gameOver) {
      this.resumeGame();
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
    this.inactiveGameOverRefreshes = 0;
    this.board.disableBoard();
    this.turnDisplay.textContent = "Game Over";

    const canPlayAgain = gameState.myTile === "X";

    this.playAgainButton.element.disabled = !canPlayAgain;
    this.playAgainButton.setLabel(
      canPlayAgain
        ? "PLAY AGAIN"
        : "WAITING FOR PLAYER X TO START A NEW MATCH",
    );

    if (result.status === "draw") {
      this.resultMessage.textContent = "It's a Draw!";
      this.resultModal.open();
      return;
    }

    const players = getPlayerNames(gameState.gameCode);
    const winnerName = players[result.winner];

    if (result.winner === gameState.myTile) {
      this.resultMessage.textContent = `You Win! ${winnerName} (${result.winner}) won the game.`;
    } else {
      this.resultMessage.textContent = `You Lose! ${winnerName} (${result.winner}) won the game.`;
    }

    this.resultModal.open();
  }

  // ========================================
  // PLAY AGAIN
  // ========================================

  async handlePlayAgain() {
    if (
      gameState.gameCode === null ||
      gameState.myTile !== "X" ||
      !gameState.gameOver
    ) {
      return;
    }

    this.playAgainButton.element.disabled = true;
    this.playAgainButton.setLabel("STARTING NEW MATCH...");

    try {
      await restartGameSession(gameState.gameCode);
      this.resumeGame(true);
      await this.loadBoard();
    } catch (error) {
      console.error(error);
      this.resultMessage.textContent = "Could not start a new match.";
      this.playAgainButton.element.disabled = false;
      this.playAgainButton.setLabel("PLAY AGAIN");
    }
  }

  resumeGame(clearBoard = false) {
    gameState.gameStarted = true;
    gameState.gameOver = false;
    this.inactiveGameOverRefreshes = 0;
    this.resultModal.close();

    if (clearBoard) {
      this.board.clearBoard();
    } else {
      this.board.enableBoard();
    }

    this.playBoardEntrance();
  }

  // ========================================
  // QUIT CONFIRMATION
  // ========================================

  openQuitModal() {
    this.quitModal.open();
  }

  async confirmQuit() {
    this.quitModal.close();
    await this.handleReset();
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
      this.resultModal.close();
      this.quitModal.close();
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
      this.resultModal.render(document.body);
      this.quitModal.render(document.body);
    } else {
      console.error("GamePage target not found.");
    }
  }
}
