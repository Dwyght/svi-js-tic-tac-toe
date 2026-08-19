import { gameState } from "../state/gameState.js";
import {
  getPlayerNames,
  getScores,
  saveScore,
} from "../services/storageService.js";
import {
  fetchAndParseBoard,
  evaluateBoard,
  submitMove,
  checkGameStillActive,
  restartGameSession,
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
    this.roundScored = false;

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
    this.gameLayout = document.createElement("div");
    this.sidePanel = document.createElement("aside");
    this.gameActions = document.createElement("div");

    // Game information
    this.statusContainer = document.createElement("div");
    this.turnDisplay = document.createElement("h2");
    this.turnCard = new Card({
      content: this.turnDisplay,
      className: "turn-card",
    });
    this.scoreDisplay = document.createElement("p");
    this.scoreCard = new Card({
      content: this.scoreDisplay,
      className: "score-card",
    });
    this.message = document.createElement("p");
    this.boardContainer = document.createElement("div");

    // Game code
    this.gameCodeContainer = document.createElement("div");
    this.gameCodeLabel = document.createElement("span");
    this.gameCodeDisplay = document.createElement("span");
    this.copyCodeButton = new Button({
      label: "Copy",
      className: "button-utility",
      onClick: () => this.copyGameCode(),
    });

    // Game result
    this.resultContent = document.createElement("div");
    this.resultMessage = document.createElement("p");
    this.resultScoreDisplay = document.createElement("p");

    // Quit confirmation
    this.quitContent = document.createElement("div");
    this.quitMessage = document.createElement("p");

    this.resetButton = new Button({
      label: "QUIT GAME",
      className: "button-danger",
      onClick: () => this.openQuitModal(),
    });
    this.resetButton.element.classList.add("reset-button");

    this.leaveButton = new Button({
      label: "LEAVE",
      className: "button-utility",
      onClick: () => this.handleLeave(),
    });
    this.leaveButton.element.classList.add("reset-button");

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
    this.resultLeaveButton = new Button({
      label: "LEAVE",
      className: "button-utility",
      onClick: () => this.handleLeave(),
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
    this.gameLayout.classList.add("game-layout");
    this.sidePanel.classList.add("game-side-panel");
    this.gameActions.classList.add("game-actions");
    this.statusContainer.classList.add("game-status");
    this.scoreDisplay.classList.add("score-display");
    this.scoreDisplay.setAttribute("aria-live", "polite");
    this.message.classList.add("message");
    this.boardContainer.classList.add("board-stage");
    this.gameCodeContainer.classList.add(
      "game-code-container",
      "active-game-code-container",
    );
    this.gameCodeLabel.classList.add("game-code-label");
    this.gameCodeLabel.textContent = "Game Code:";
    this.gameCodeDisplay.classList.add("game-code");
    this.copyCodeButton.element.classList.add("game-code-copy-button");
    this.resultContent.classList.add("modal-form");
    this.resultScoreDisplay.classList.add("result-score");
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
    this.gameCodeContainer.append(this.gameCodeLabel, this.gameCodeDisplay);
    this.copyCodeButton.render(this.gameCodeContainer);
    this.sidePanel.append(this.gameCodeContainer);
    this.scoreCard.render(this.sidePanel);
    this.gameLayout.append(
      this.statusContainer,
      this.sidePanel,
      this.boardContainer,
      this.gameActions,
    );
    this.container.append(this.gameLayout);
    this.resultContent.append(this.resultMessage, this.resultScoreDisplay);
    this.quitContent.append(this.quitMessage);
    this.cancelQuitButton.render(this.quitContent);
    this.confirmQuitButton.render(this.quitContent);
  }

  configureViewerControls() {
    this.resetButton.element.remove();
    this.leaveButton.element.remove();
    this.playAgainButton.element.remove();
    this.resultQuitButton.element.remove();
    this.resultLeaveButton.element.remove();

    if (gameState.isSpectator) {
      this.leaveButton.render(this.gameActions);
      this.resultLeaveButton.render(this.resultContent);
      this.quitModal.dialog.remove();
      return;
    }

    this.resetButton.render(this.gameActions);
    this.playAgainButton.render(this.resultContent);
    this.resultQuitButton.render(this.resultContent);

    if (!this.quitModal.dialog.isConnected) {
      this.quitModal.render(document.body);
    }
  }

  clearBoardForViewer(isSpectator = gameState.isSpectator) {
    this.board.clearBoard();

    if (isSpectator) {
      this.board.disableBoard();
    }
  }

  updateBoardInteraction() {
    if (gameState.isSpectator) {
      this.board.disableBoard();
    } else {
      this.board.enableBoard();
    }
  }

  // ========================================
  // COPY GAME CODE
  // ========================================

  async copyGameCode() {
    try {
      await navigator.clipboard.writeText(this.gameCodeDisplay.textContent);
      this.copyCodeButton.setLabel("Copied!");

      setTimeout(() => {
        this.copyCodeButton.setLabel("Copy");
      }, 1500);
    } catch (error) {
      console.error("Could not copy game code.", error);
      this.copyCodeButton.setLabel("Copy Failed");
    }
  }

  // ========================================
  // START GAME PAGE
  // ========================================

  async startGame() {
    gameState.gameOver = false;
    this.inactiveGameOverRefreshes = 0;
    this.roundScored = false;
    gameState.scores = getScores(gameState.gameCode);
    this.updateScoreDisplays();
    this.gameCodeDisplay.textContent = gameState.gameCode;
    this.copyCodeButton.setLabel("Copy");
    this.resultModal.close();
    this.quitModal.close();
    this.configureViewerControls();
    this.clearBoardForViewer();
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

      const wasSpectator = gameState.isSpectator;

      this.pollingService.stopRefresh();
      gameState.reset();
      this.clearBoardForViewer(wasSpectator);
      this.resultModal.close();
      this.quitModal.close();
      this.onReturnHome(
        wasSpectator
          ? "This game has ended."
          : "The other player has left the game.",
      );
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
      this.message.textContent = "";
      return;
    }

    this.board.displayBoard(board.cells);

    if (gameState.isSpectator) {
      this.board.disableBoard();
    }

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
    if (gameState.isSpectator) {
      this.turnDisplay.textContent = `${turn}'s Turn`;
      this.message.textContent = "";
      return;
    }

    const players = getPlayerNames(gameState.gameCode);
    const playerName = players[turn];

    if (turn === gameState.myTile) {
      this.turnDisplay.textContent = "Your turn.";
    } else {
      this.turnDisplay.textContent = `${playerName}'s turn.`;
    }

    this.message.textContent = "";
  }

  // ========================================
  // MAKE MOVE
  // ========================================

  async makeMove(x, y) {
    if (gameState.isSpectator) {
      return;
    }

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
        this.message.textContent = "";
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

    this.scoreRound(result);
    this.updateScoreDisplays();

    if (!gameState.isSpectator) {
      const canPlayAgain = gameState.myTile === "X";

      this.playAgainButton.element.disabled = !canPlayAgain;
      this.playAgainButton.setLabel(
        canPlayAgain
          ? "PLAY AGAIN"
          : "WAITING FOR PLAYER X TO START A NEW MATCH",
      );
    }

    if (result.status === "draw") {
      this.resultMessage.textContent = "It's a Draw!";
      this.resultModal.open();
      return;
    }

    const players = getPlayerNames(gameState.gameCode);
    const winnerName = players[result.winner];

    if (gameState.isSpectator) {
      this.resultMessage.textContent = `${winnerName} (${result.winner}) won the game.`;
    } else if (result.winner === gameState.myTile) {
      this.resultMessage.textContent = `You Win! ${winnerName} (${result.winner}) won the game.`;
    } else {
      this.resultMessage.textContent = `You Lose! ${winnerName} (${result.winner}) won the game.`;
    }

    this.resultModal.open();
  }

  scoreRound(result) {
    if (this.roundScored) {
      return;
    }

    const scores = {
      ...gameState.scores,
    };

    if (result.status === "draw") {
      scores.draws++;
    } else if (result.winner === "X" || result.winner === "O") {
      scores[result.winner]++;
    }

    gameState.scores = scores;
    saveScore(gameState.gameCode, scores);
    this.roundScored = true;
  }

  updateScoreDisplays() {
    const scores = gameState.scores;
    const scoreText = `X: ${scores.X} · O: ${scores.O} · Draws: ${scores.draws}`;

    this.scoreDisplay.textContent = scoreText;
    this.resultScoreDisplay.textContent = `Series score: ${scoreText}`;
  }

  // ========================================
  // PLAY AGAIN
  // ========================================

  async handlePlayAgain() {
    if (
      gameState.gameCode === null ||
      gameState.isSpectator ||
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
    this.roundScored = false;
    this.resultModal.close();

    if (clearBoard) {
      this.clearBoardForViewer();
    } else {
      this.updateBoardInteraction();
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
  // LEAVE SPECTATOR VIEW
  // ========================================

  handleLeave() {
    if (!gameState.isSpectator) {
      return;
    }

    this.pollingService.stopRefresh();
    this.clearBoardForViewer(true);
    this.resultModal.close();
    this.quitModal.close();
    gameState.reset();
    this.onReturnHome();
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
      this.clearBoardForViewer();
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
