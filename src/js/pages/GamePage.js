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
import { PauseMenu } from "../components/PauseMenu.js";
import { Scoreboard } from "../components/Scoreboard.js";
import { resolveTarget } from "../utils/dom.js";

const GAME_OVER_INACTIVE_GRACE_REFRESHES = 3;

export class GamePage {
  constructor({ screenManager, pollingService, onReturnHome }) {
    this.screenManager = screenManager;
    this.pollingService = pollingService;
    this.onReturnHome = onReturnHome;
    this.inactiveGameOverRefreshes = 0;
    this.roundScored = false;
    this.isSubmittingMove = false;

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
    this.scoreRegion = document.createElement("div");

    // Game information
    this.statusContainer = document.createElement("div");
    this.turnDisplay = document.createElement("h2");
    this.turnCard = new Card({
      content: this.turnDisplay,
      className: "turn-card",
    });
    this.scoreboard = new Scoreboard();
    this.scoreCard = new Card({
      content: this.scoreboard.element,
      className: "score-card",
    });
    this.message = document.createElement("p");
    this.boardContainer = document.createElement("div");

    // Pause menu
    this.pauseMenu = new PauseMenu({
      onCopyGameCode: (gameCode) => this.copyGameCode(gameCode),
      onOpenQuitModal: () => this.openQuitModal(),
      onLeave: () => this.handleLeave(),
    });

    // Game result
    this.resultContent = document.createElement("div");
    this.resultMessage = document.createElement("p");
    this.resultScoreLabel = document.createElement("p");
    this.resultScoreboard = new Scoreboard();
    this.resultWaitingIndicator = document.createElement("div");
    this.resultWaitingSpinner = document.createElement("span");
    this.resultWaitingText = document.createElement("p");

    // Quit confirmation
    this.quitContent = document.createElement("div");
    this.quitMessage = document.createElement("p");

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
    this.scoreRegion.classList.add("game-score-region");
    this.statusContainer.classList.add("game-status");
    this.scoreboard.element.setAttribute("aria-live", "polite");
    this.message.classList.add("message");
    this.boardContainer.classList.add("board-stage");
    this.resultContent.classList.add("modal-form");
    this.resultScoreboard.element.classList.add("result-score");
    this.resultScoreLabel.classList.add("result-score-label");
    this.resultScoreLabel.textContent = "Series score";
    this.resultWaitingIndicator.classList.add(
      "result-waiting-indicator",
      "hidden",
    );
    this.resultWaitingIndicator.setAttribute("role", "status");
    this.resultWaitingIndicator.setAttribute("aria-live", "polite");
    this.resultWaitingSpinner.classList.add("loading-spinner");
    this.resultWaitingSpinner.setAttribute("aria-hidden", "true");
    this.resultWaitingText.textContent =
      "Waiting for Player X to start a new match.";
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
    this.scoreCard.render(this.scoreRegion);
    this.gameLayout.append(
      this.statusContainer,
      this.boardContainer,
      this.scoreRegion,
    );
    this.container.append(this.gameLayout);
    this.resultContent.append(
      this.resultMessage,
      this.resultScoreLabel,
      this.resultScoreboard.element,
      this.resultWaitingIndicator,
    );
    this.resultWaitingIndicator.append(
      this.resultWaitingSpinner,
      this.resultWaitingText,
    );
    this.quitContent.append(this.quitMessage);
    this.cancelQuitButton.render(this.quitContent);
    this.confirmQuitButton.render(this.quitContent);
  }

  configureViewerControls() {
    this.pauseMenu.configureViewerControls(gameState.isSpectator);
    this.playAgainButton.element.remove();
    this.resultQuitButton.element.remove();
    this.resultLeaveButton.element.remove();
    this.resultWaitingIndicator.classList.add("hidden");

    if (gameState.isSpectator) {
      this.resultLeaveButton.render(this.resultContent);
      this.quitModal.dialog.remove();
      return;
    }

    if (gameState.myTile === "X") {
      this.playAgainButton.render(this.resultContent);
    }

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
    if (
      gameState.isSpectator ||
      gameState.gameOver ||
      this.isSubmittingMove
    ) {
      this.board.disableBoard();
    } else {
      this.board.enableBoard();
    }
  }

  // ========================================
  // COPY GAME CODE
  // ========================================

  async copyGameCode(gameCode) {
    await navigator.clipboard.writeText(gameCode);
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
    this.pauseMenu.updateGameCode(gameState.gameCode);
    this.resultModal.close();
    this.pauseMenu.close();
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
      this.pauseMenu.close();
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
      this.board.disableBoard();
      return;
    }

    const players = getPlayerNames(gameState.gameCode);
    const playerName = players[turn];

    if (turn === gameState.myTile) {
      this.turnDisplay.textContent = "Your turn.";

      if (this.isSubmittingMove) {
        this.board.disableBoard();
      } else {
        this.board.enableBoard();
      }
    } else {
      this.turnDisplay.textContent = `${playerName}'s turn.`;
      this.board.disableBoard();
    }

    this.message.textContent = "";
  }

  // ========================================
  // MAKE MOVE
  // ========================================

  async makeMove(x, y) {
    if (this.isSubmittingMove) {
      return;
    }

    this.isSubmittingMove = true;
    this.board.disableBoard();

    try {
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
    } finally {
      this.isSubmittingMove = false;
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

      if (canPlayAgain) {
        this.playAgainButton.element.disabled = false;
        this.playAgainButton.setLabel("PLAY AGAIN");
        this.resultWaitingIndicator.classList.add("hidden");
      } else {
        this.playAgainButton.element.remove();
        this.resultWaitingIndicator.classList.remove("hidden");
      }
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

    this.scoreboard.update(scores);
    this.resultScoreboard.update(scores);
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
    this.resultWaitingIndicator.classList.add("hidden");

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
    this.pauseMenu.close();
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
    this.pauseMenu.close();
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
      this.pauseMenu.close();
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
      this.pauseMenu.render(this.container);
      this.quitModal.render(document.body);
    } else {
      console.error("GamePage target not found.");
    }
  }
}
