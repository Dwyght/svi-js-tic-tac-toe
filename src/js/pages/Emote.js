import { gameState } from "../state/gameState.js";
import {
  saveEmote,
  subscribeToEmotes,
} from "../services/emoteService.js";

export class Emote {
  constructor({ emotePicker, scoreboard, isQuitting }) {
    this.emotePicker = emotePicker;
    this.scoreboard = scoreboard;
    this.isQuitting = isQuitting;
    this.unsubscribeFromEmotes = null;
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

  handleEmoteSelect(emoteId) {
    if (!this.canSendEmotes()) {
      return;
    }

    saveEmote(gameState.gameCode, gameState.myTile, emoteId);
  }

  startEmoteSubscription() {
    this.stopEmoteSubscription();

    if (gameState.gameCode === null || !gameState.gameStarted) {
      return;
    }

    const gameCode = gameState.gameCode;

    this.unsubscribeFromEmotes = subscribeToEmotes(
      gameCode,
      (emoteEntry) => {
        if (
          gameState.gameCode !== gameCode ||
          !this.canDisplayEmotes()
        ) {
          return;
        }

        this.scoreboard.showEmoteBubble(
          emoteEntry.tile,
          emoteEntry.emoteId,
        );
      },
    );
  }

  stopEmoteSubscription() {
    if (this.unsubscribeFromEmotes !== null) {
      this.unsubscribeFromEmotes();
      this.unsubscribeFromEmotes = null;
    }
  }

  clear() {
    this.stopEmoteSubscription();
    this.emotePicker.setEnabled(false);
    this.scoreboard.clearEmoteBubbles();
  }
}
