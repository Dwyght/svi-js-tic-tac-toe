import { restartGameSession } from "../services/gameFlowService.js";
import {
  getPlayerNames,
  saveScore,
} from "../services/storageService.js";
import { gameState } from "../state/gameState.js";

export class Result {
  constructor(gamePage) {
    this.gamePage = gamePage;
  }

  async finishGame(result) {
    if (this.gamePage.isQuitting) {
      return;
    }

    gameState.gameOver = true;
    this.gamePage.emote.updateEmoteAvailability();
    this.gamePage.inactiveGameOverRefreshes = 0;
    this.gamePage.board.disableBoard();
    this.gamePage.turnDisplay.textContent = "Game Over";

    this.scoreRound(result);
    this.updateScoreDisplays();

    if (!gameState.isSpectator) {
      const canPlayAgain = gameState.myTile === "X";

      if (canPlayAgain) {
        this.gamePage.resultModal.showPlayAgainButton();
      } else {
        const players = getPlayerNames(gameState.gameCode);

        this.gamePage.resultModal.setWaitingPlayerName(players.X);
        this.gamePage.resultModal.showWaitingIndicator();
      }
    }

    if (gameState.isSpectator) {
      await this.gamePage.resultModal.setOutcome("spectator");
    } else if (result.status === "draw") {
      await this.gamePage.resultModal.setOutcome("draw");
    } else if (result.winner === gameState.myTile) {
      await this.gamePage.resultModal.setOutcome("victory");
    } else {
      await this.gamePage.resultModal.setOutcome("defeat");
    }

    if (this.gamePage.isQuitting || gameState.gameCode === null) {
      return;
    }

    this.gamePage.resultModal.open();
  }

  scoreRound(result) {
    if (
      this.gamePage.roundScored ||
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
    this.gamePage.roundScored = true;
  }

  updateScoreDisplays() {
    const scores = gameState.scores;

    this.gamePage.scoreboard.update(scores);
    this.gamePage.resultModal.updateScore(scores);
  }

  async handlePlayAgain() {
    if (
      gameState.gameCode === null ||
      gameState.isSpectator ||
      gameState.myTile !== "X" ||
      !gameState.gameOver
    ) {
      return;
    }

    this.gamePage.resultModal.setPlayAgainPending(true);

    try {
      await restartGameSession(gameState.gameCode);
      this.resumeGame(true);
      await this.gamePage.loadBoard();
    } catch (error) {
      console.error(error);
      this.gamePage.resultModal.setMessage(
        "Could not start a new match.",
      );
      this.gamePage.resultModal.setPlayAgainPending(false);
    }
  }

  resumeGame(clearBoard = false) {
    gameState.gameStarted = true;
    gameState.gameOver = false;
    this.gamePage.emote.updateEmoteAvailability();
    this.gamePage.inactiveGameOverRefreshes = 0;
    this.gamePage.roundScored = false;
    this.gamePage.resultModal.close();
    this.gamePage.resultModal.hideWaitingIndicator();

    if (clearBoard) {
      this.gamePage.clearBoardForViewer();
    } else {
      this.gamePage.updateBoardInteraction();
    }

    this.gamePage.playBoardEntrance();
  }
}
