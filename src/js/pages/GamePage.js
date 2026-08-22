import { gameState } from "../state/gameState.js";
import {
  getPlayerNames,
  getPlayerSushi,
  getScores,
  saveScore,
} from "../services/storageService.js";
import {
  fetchAndParseBoard,
  evaluateBoard,
  submitMove,
  checkGameStillActive,
  restartGameSession,
} from "../services/gameFlowService.js";
import { Card } from "../components/base/Card.js";
import { Board } from "../components/game/Board.js";
import { EmotePicker } from "../components/game/EmotePicker.js";
import { LeaveConfirmModal } from "../components/game/LeaveConfirmModal.js";
import { PauseMenu } from "../components/game/PauseMenu.js";
import { QuitConfirmModal } from "../components/game/QuitConfirmModal.js";
import { ResultModal } from "../components/game/ResultModal.js";
import { Scoreboard } from "../components/game/Scoreboard.js";
import { resolveTarget } from "../utils/dom.js";
import { resolveSushi } from "../utils/sushi.js";
import { Emote } from "./Emote.js";
import { Quit } from "./Quit.js";

const GAME_OVER_INACTIVE_GRACE_REFRESHES = 3;

export class GamePage {
  constructor({ screenManager, pollingService, onReturnHome }) {
    this.screenManager = screenManager;
    this.pollingService = pollingService;
    this.onReturnHome = onReturnHome;
    this.inactiveGameOverRefreshes = 0;
    this.roundScored = false;
    this.isSubmittingMove = false;
    this.isQuitting = false;

    this.initializeElements();
    this.emote = new Emote({
      emotePicker: this.emotePicker,
      scoreboard: this.scoreboard,
      isQuitting: () => this.isQuitting,
    });
    this.quit = new Quit(this);
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
    this.statusHeader = document.createElement("div");
    this.turnDisplay = document.createElement("h2");
    this.turnCard = new Card({
      content: this.turnDisplay,
      className: "turn-card",
    });
    this.emotePicker = new EmotePicker({
      onSelect: (emoteId) =>
        this.emote.handleEmoteSelect(emoteId),
    });
    this.emotePicker.setEnabled(false);
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
      onOpenQuitModal: () => this.quit.openQuitModal(),
      onLeave: () => this.quit.openLeaveModal(),
    });

    // Game result
    this.resultModal = new ResultModal({
      onPlayAgain: () => this.handlePlayAgain(),
      onQuit: () => this.quit.openQuitModal(),
      onLeave: () => this.quit.openLeaveModal(),
    });

    // Quit confirmation
    this.quitConfirmModal = new QuitConfirmModal({
      onConfirm: () => this.quit.confirmQuit(),
    });

    // Spectator leave confirmation
    this.leaveConfirmModal = new LeaveConfirmModal({
      onConfirm: () => this.quit.handleLeave(),
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
    this.statusHeader.classList.add("game-status-header");
    this.scoreboard.element.setAttribute("aria-live", "polite");
    this.message.classList.add("message");
    this.boardContainer.classList.add("board-stage");
  }

  // ========================================
  // STEP 3
  // ========================================

  appendElements() {
    this.turnCard.render(this.statusHeader);
    this.emotePicker.render(this.statusHeader);
    this.statusContainer.append(this.statusHeader, this.message);
    this.scoreCard.render(this.scoreRegion);
    this.gameLayout.append(
      this.statusContainer,
      this.boardContainer,
      this.scoreRegion,
    );
    this.container.append(this.gameLayout);
  }

  configureViewerControls() {
    this.statusHeader.classList.toggle(
      "game-status-header-spectator",
      gameState.isSpectator,
    );
    this.pauseMenu.configureViewerControls(gameState.isSpectator);
    this.resultModal.configureViewerControls({
      isSpectator: gameState.isSpectator,
      canPlayAgain: gameState.myTile === "X",
    });

    if (gameState.isSpectator) {
      this.quitConfirmModal.remove();
      this.leaveConfirmModal.render(document.body);
      return;
    }

    this.leaveConfirmModal.remove();
    this.quitConfirmModal.render(document.body);
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
  // SUSHI DISPLAY
  // ========================================

  updateSushiDisplays() {
    const sushiImages = {
      X: resolveSushi(
        "X",
        getPlayerSushi(gameState.gameCode, "X"),
      ),
      O: resolveSushi(
        "O",
        getPlayerSushi(gameState.gameCode, "O"),
      ),
    };

    this.board.setSushiImages(sushiImages);
    this.scoreboard.setSushiImages(sushiImages);
    this.resultModal.setSushiImages(sushiImages);

    if (gameState.myTile === "X" || gameState.myTile === "O") {
      gameState.mySushi = sushiImages[gameState.myTile].id;
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
    this.emote.clear();
    this.isQuitting = false;
    gameState.gameOver = false;
    this.inactiveGameOverRefreshes = 0;
    this.roundScored = false;
    gameState.scores = getScores(gameState.gameCode);
    this.updateSushiDisplays();
    this.updateScoreDisplays();
    this.pauseMenu.updateGameCode(gameState.gameCode);
    this.resultModal.close();
    this.pauseMenu.close();
    this.quitConfirmModal.close();
    this.leaveConfirmModal.close();
    this.configureViewerControls();
    this.clearBoardForViewer();
    this.board.setPlayerTile(gameState.myTile);
    this.screenManager.showGameScreen();
    this.playBoardEntrance();

    await this.loadBoard();

    this.emote.startEmoteSubscription();
    this.emote.updateEmoteAvailability();

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
    if (gameState.gameCode === null || this.isQuitting) {
      return;
    }

    const gameCode = gameState.gameCode;
    const started = await checkGameStillActive(gameCode);

    if (this.isQuitting || gameState.gameCode !== gameCode) {
      return;
    }

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
      this.emote.clear();
      gameState.reset();
      this.clearBoardForViewer(wasSpectator);
      this.resultModal.close();
      this.pauseMenu.close();
      this.quitConfirmModal.close();
      this.leaveConfirmModal.close();
      if (wasSpectator) {
        this.onReturnHome(
          "A player has left the game.",
          "Oopsies!",
        );
      } else {
        this.onReturnHome(
          "The other player has left the game.",
          "Oopsies!",
        );
      }

      return;
    }

    this.inactiveGameOverRefreshes = 0;
    await this.loadBoard();
  }

  // ========================================
  // LOAD BOARD
  // ========================================

  async loadBoard() {
    if (gameState.gameCode === null || this.isQuitting) {
      return;
    }

    const gameCode = gameState.gameCode;
    const board = await fetchAndParseBoard(gameCode);

    if (this.isQuitting || gameState.gameCode !== gameCode) {
      return;
    }

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
        await this.finishGame(boardState.result);
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
      this.turnDisplay.textContent = "It's your turn.";

      if (this.isSubmittingMove) {
        this.board.disableBoard();
      } else {
        this.board.enableBoard();
      }
    } else {
      this.turnDisplay.textContent = `It's ${playerName}'s turn.`;
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

      if (this.isQuitting) {
        return;
      }

      if (result.reason === "waiting") {
        this.message.textContent = "";
        return;
      }

      if (result.reason === "game_over") {
        await this.finishGame(result.result);
        return;
      }

      if (result.reason === "not_your_turn") {
        this.message.textContent = "";
        return;
      }

      if (result.reason === "cell_taken") {
        this.message.textContent = "";

        if (result.refreshBoard) {
          await this.loadBoard();
        }

        return;
      }

      await this.loadBoard();
    } catch (error) {
      console.error(error);

      if (!this.isQuitting) {
        this.message.textContent = "Could not send move.";
      }
    } finally {
      this.isSubmittingMove = false;
    }
  }

  // ========================================
  // FINISH GAME
  // ========================================

  async finishGame(result) {
    if (this.isQuitting) {
      return;
    }

    gameState.gameOver = true;
    this.emote.updateEmoteAvailability();
    this.inactiveGameOverRefreshes = 0;
    this.board.disableBoard();
    this.turnDisplay.textContent = "Game Over";

    this.scoreRound(result);
    this.updateScoreDisplays();

    if (!gameState.isSpectator) {
      const canPlayAgain = gameState.myTile === "X";

      if (canPlayAgain) {
        this.resultModal.showPlayAgainButton();
      } else {
        const players = getPlayerNames(gameState.gameCode);

        this.resultModal.setWaitingPlayerName(players.X);
        this.resultModal.showWaitingIndicator();
      }
    }

    if (gameState.isSpectator) {
      await this.resultModal.setOutcome("spectator");
    } else if (result.status === "draw") {
      await this.resultModal.setOutcome("draw");
    } else if (result.winner === gameState.myTile) {
      await this.resultModal.setOutcome("victory");
    } else {
      await this.resultModal.setOutcome("defeat");
    }

    if (this.isQuitting || gameState.gameCode === null) {
      return;
    }

    this.resultModal.open();
  }

  scoreRound(result) {
    if (
      this.roundScored ||
      (result.winner !== "X" && result.winner !== "O")
    ) {
      return;
    }

    const scores = {
      ...gameState.scores,
    };

    scores[result.winner]++;

    gameState.scores = scores;
    saveScore(gameState.gameCode, scores);
    this.roundScored = true;
  }

  updateScoreDisplays() {
    const scores = gameState.scores;

    this.scoreboard.update(scores);
    this.resultModal.updateScore(scores);
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

    this.resultModal.setPlayAgainPending(true);

    try {
      await restartGameSession(gameState.gameCode);
      this.resumeGame(true);
      await this.loadBoard();
    } catch (error) {
      console.error(error);
      this.resultModal.setMessage("Could not start a new match.");
      this.resultModal.setPlayAgainPending(false);
    }
  }

  resumeGame(clearBoard = false) {
    gameState.gameStarted = true;
    gameState.gameOver = false;
    this.emote.updateEmoteAvailability();
    this.inactiveGameOverRefreshes = 0;
    this.roundScored = false;
    this.resultModal.close();
    this.resultModal.hideWaitingIndicator();

    if (clearBoard) {
      this.clearBoardForViewer();
    } else {
      this.updateBoardInteraction();
    }

    this.playBoardEntrance();
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
      this.quitConfirmModal.render(document.body);
      this.leaveConfirmModal.render(document.body);
    } else {
      console.error("GamePage target not found.");
    }
  }
}
