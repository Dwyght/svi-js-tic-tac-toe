import { REFRESH_INTERVAL_MS } from "../config/constants.js";

export class PollingService {
  constructor() {
    this.intervalId = null;

    this.refreshCallback = null;

    this.isRefreshing = false;
  }

  // ========================================
  // START
  // ========================================

  startRefresh(refreshCallback) {
    this.stopRefresh();

    this.refreshCallback = refreshCallback;

    // Run immediately once
    this.refreshGame();

    this.intervalId = setInterval(() => {
      this.refreshGame();
    }, REFRESH_INTERVAL_MS);
  }

  // ========================================
  // REFRESH
  // ========================================

  async refreshGame() {
    if (this.isRefreshing || this.refreshCallback === null) {
      return;
    }

    this.isRefreshing = true;

    try {
      await this.refreshCallback();
    } catch (error) {
      console.error("Polling error:", error);
    } finally {
      this.isRefreshing = false;
    }
  }

  // ========================================
  // STOP
  // ========================================

  stopRefresh() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }

    this.intervalId = null;

    this.refreshCallback = null;

    this.isRefreshing = false;
  }
}
