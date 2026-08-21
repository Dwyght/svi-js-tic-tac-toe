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
import { Card } from "../components/base/Card.js";
import { Board } from "../components/game/Board.js";
import { PauseMenu } from "../components/game/PauseMenu.js";
import { QuitConfirmModal } from "../components/game/QuitConfirmModal.js";
import { ResultModal } from "../components/game/ResultModal.js";
import { Scoreboard } from "../components/game/Scoreboard.js";
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
    this.resultModal = new ResultModal({
      onPlayAgain: () => this.handlePlayAgain(),
      onQuit: () => this.openQuitModal(),
      onLeave: () => this.handleLeave(),
    });

    // Quit confirmation
    this.quitConfirmModal = new QuitConfirmModal({
      onConfirm: () => this.confirmQuit(),
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
  }

  configureViewerControls() {
    this.pauseMenu.configureViewerControls(gameState.isSpectator);
    this.resultModal.configureViewerControls({
      isSpectator: gameState.isSpectator,
      canPlayAgain: gameState.myTile === "X",
    });

    if (gameState.isSpectator) {
      this.quitConfirmModal.remove();
      return;
    }

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
    this.quitConfirmModal.close();
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
      this.quitConfirmModal.close();
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
        this.resultModal.showPlayAgainButton();
      } else {
        this.resultModal.showWaitingIndicator();
      }
    }

    if (result.status === "draw") {
      this.resultModal.setMessage("It's a Draw!");
      this.resultModal.open();
      return;
    }

    const players = getPlayerNames(gameState.gameCode);
    const winnerName = players[result.winner];

    if (gameState.isSpectator) {
      this.resultModal.setMessage(
        `${winnerName} (${result.winner}) won the game.`,
      );
    } else if (result.winner === gameState.myTile) {
      this.resultModal.setMessage(
        `You Win! ${winnerName} (${result.winner}) won the game.`,
      );
    } else {
      this.resultModal.setMessage(
        `You Lose! ${winnerName} (${result.winner}) won the game.`,
      );
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
  // QUIT CONFIRMATION
  // ========================================

  openQuitModal() {
    this.pauseMenu.close();
    this.quitConfirmModal.open();
  }

  async confirmQuit() {
    this.quitConfirmModal.close();
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
    this.quitConfirmModal.close();
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
      this.quitConfirmModal.close();
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
      this.quitConfirmModal.render(document.body);
    } else {
      console.error("GamePage target not found.");
    }
  }
}
