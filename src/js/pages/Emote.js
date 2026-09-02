import { gameState } from "../state/gameState.js";
import { sendRuntimeEmote } from "../services/gameFlowService.js";

export class Emote {
  constructor({ emotePicker, scoreboard, isQuitting, onError }) {
    this.emotePicker = emotePicker;
    this.scoreboard = scoreboard;
    this.isQuitting = isQuitting;
    this.onError = onError;
    this.lastEventIds = {
      X: 0,
      O: 0,
    };
  }

  canDisplayEmotes() {
    return (
      gameState.gameCode !== null &&
      gameState.gameStarted &&
      !gameState.gameOver &&
      !this.isQuitting()
    );
  }

  canSendEmotes() {
    return (
      this.canDisplayEmotes() &&
      !gameState.isSpectator &&
      (gameState.myTile === "X" || gameState.myTile === "O")
    );
  }

  updateEmoteAvailability() {
    this.emotePicker.setEnabled(this.canSendEmotes());
  }

  async handleEmoteSelect(emoteId) {
    if (!this.canSendEmotes()) {
      return;
    }

    try {
      await sendRuntimeEmote(
        gameState.gameCode,
        gameState.myTile,
        emoteId,
      );
    } catch (error) {
      console.error("Could not send emote.", error);
      this.onError?.(error);
    }
  }

  startEmoteSynchronization(session) {
    this.lastEventIds = {
      X: this.getEventId(session?.xemoteeventid),
      O: this.getEventId(session?.oemoteeventid),
    };
  }

  syncEmotes(session) {
    this.syncEmote(
      "X",
      session?.xemoteid,
      this.getEventId(session?.xemoteeventid),
    );
    this.syncEmote(
      "O",
      session?.oemoteid,
      this.getEventId(session?.oemoteeventid),
    );
  }

  syncEmote(tile, emoteId, eventId) {
    if (eventId <= this.lastEventIds[tile]) {
      return;
    }

    this.lastEventIds[tile] = eventId;

    if (typeof emoteId === "string" && this.canDisplayEmotes()) {
      this.scoreboard.showEmoteBubble(tile, emoteId);
    }
  }

  getEventId(eventId) {
    return Number.isInteger(eventId) && eventId >= 0 ? eventId : 0;
  }

  clear() {
    this.emotePicker.setEnabled(false);
    this.scoreboard.clearEmoteBubbles();
    this.lastEventIds = {
      X: 0,
      O: 0,
    };
  }
}
