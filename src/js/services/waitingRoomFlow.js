import { waitForPlayerO } from "./gameFlowService.js";

export class WaitingRoomFlow {
  constructor({ pollingService, screenManager, onGameStarted }) {
    this.pollingService = pollingService;
    this.screenManager = screenManager;
    this.onGameStarted = onGameStarted;
  }

  start(gameCode, playerName) {
    this.screenManager.showWaitingScreen(gameCode, playerName);
    this.pollingService.startRefresh(async () => {
      const result = await waitForPlayerO(gameCode);

      if (!result.started) {
        return;
      }

      this.pollingService.stopRefresh();
      this.onGameStarted();
    });
  }
}
