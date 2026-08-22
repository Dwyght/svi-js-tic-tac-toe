import { resetGameSession } from "../services/gameFlowService.js";
import { gameState } from "../state/gameState.js";

export class Quit {
  constructor(gamePage) {
    this.gamePage = gamePage;
  }

  openQuitModal() {
    this.gamePage.pauseMenu.close();
    this.gamePage.quitConfirmModal.open();
  }

  async confirmQuit() {
    if (this.gamePage.isQuitting) {
      return;
    }

    this.gamePage.isQuitting = true;
    this.gamePage.emote.updateEmoteAvailability();
    this.gamePage.quitConfirmModal.setPending(true);
    await this.handleReset();
  }

  openLeaveModal() {
    if (!gameState.isSpectator) {
      return;
    }

    this.gamePage.pauseMenu.close();
    this.gamePage.leaveConfirmModal.open();
  }

  handleLeave() {
    if (!gameState.isSpectator) {
      return;
    }

    this.gamePage.pollingService.stopRefresh();
    this.gamePage.emote.clear();
    this.gamePage.clearBoardForViewer(true);
    this.gamePage.resultModal.close();
    this.gamePage.pauseMenu.close();
    this.gamePage.quitConfirmModal.close();
    this.gamePage.leaveConfirmModal.close();
    gameState.reset();
    this.gamePage.onReturnHome();
  }

  async handleReset() {
    if (gameState.gameCode === null) {
      this.gamePage.emote.clear();
      this.gamePage.isQuitting = false;
      return;
    }

    const oldGameCode = gameState.gameCode;

    try {
      await resetGameSession(oldGameCode);
      this.gamePage.pollingService.stopRefresh();
      this.gamePage.emote.clear();
      this.gamePage.clearBoardForViewer();
      this.gamePage.resultModal.close();
      this.gamePage.pauseMenu.close();
      this.gamePage.quitConfirmModal.close();
      this.gamePage.leaveConfirmModal.close();
      this.gamePage.onReturnHome();
    } catch (error) {
      this.gamePage.isQuitting = false;
      this.gamePage.emote.updateEmoteAvailability();
      this.gamePage.quitConfirmModal.setPending(false);
      console.error(error);
      this.gamePage.message.textContent = "Could not reset game.";
    }
  }
}
