import { Button } from "../base/Button.js";
import { Modal } from "../base/Modal.js";
import { Scoreboard } from "./Scoreboard.js";
import { resolveTarget } from "../../utils/dom.js";

const OUTCOME_BANNERS = {
  victory: {
    source: "./src/assets/images/victory.png",
    alt: "Victory",
  },
  draw: {
    source: "./src/assets/images/draw.png",
    alt: "Draw",
  },
  defeat: {
    source: "./src/assets/images/defeat.png",
    alt: "Defeat",
  },
};

export class ResultModal {
  constructor({ onPlayAgain, onQuit, onLeave }) {
    this.onPlayAgain = onPlayAgain;
    this.onQuit = onQuit;
    this.onLeave = onLeave;

    this.initializeElements();
    this.setAttributes();
    this.appendElements();
  }

  initializeElements() {
    this.content = document.createElement("div");
    this.outcomeBanner = document.createElement("img");
    this.message = document.createElement("p");
    this.scoreboard = new Scoreboard();
    this.waitingIndicator = document.createElement("div");
    this.waitingSpinner = document.createElement("span");
    this.waitingText = document.createElement("p");
    this.playAgainButton = new Button({
      label: "PLAY AGAIN",
      className: "button-confirm",
      onClick: () => this.onPlayAgain(),
    });
    this.quitButton = new Button({
      label: "QUIT GAME",
      className: "button-danger",
      onClick: () => this.onQuit(),
    });
    this.leaveButton = new Button({
      label: "LEAVE",
      className: "button-utility",
      onClick: () => this.onLeave(),
    });
    this.modal = new Modal({
      title: "Game Over",
      content: this.content,
      closable: false,
    });
  }

  setAttributes() {
    this.content.classList.add("modal-form");
    this.outcomeBanner.classList.add("result-outcome-banner");
    this.message.classList.add("result-message", "hidden");
    this.scoreboard.element.classList.add("result-score");
    this.waitingIndicator.classList.add(
      "result-waiting-indicator",
      "hidden",
    );
    this.waitingIndicator.setAttribute("role", "status");
    this.waitingIndicator.setAttribute("aria-live", "polite");
    this.waitingSpinner.classList.add("loading-spinner");
    this.waitingSpinner.setAttribute("aria-hidden", "true");
    this.waitingText.textContent =
      "Waiting for Player X to start a new match.";
    this.modal.dialog.classList.add("result-modal");
  }

  appendElements() {
    this.modal.dialog.prepend(this.outcomeBanner);
    this.content.append(
      this.message,
      this.scoreboard.element,
      this.waitingIndicator,
    );
    this.waitingIndicator.append(this.waitingSpinner, this.waitingText);
  }

  configureViewerControls({ isSpectator, canPlayAgain }) {
    this.playAgainButton.element.remove();
    this.quitButton.element.remove();
    this.leaveButton.element.remove();
    this.hideWaitingIndicator();

    if (isSpectator) {
      this.leaveButton.render(this.content);
      return;
    }

    if (canPlayAgain) {
      this.playAgainButton.render(this.content);
    }

    this.quitButton.render(this.content);
  }

  setMessage(message) {
    this.message.textContent = message;
    this.message.classList.remove("hidden");
  }

  async setOutcome(outcome) {
    const banner = OUTCOME_BANNERS[outcome];

    if (!banner) {
      console.error(`Unknown result outcome: ${outcome}`);
      return;
    }

    this.outcomeBanner.src = banner.source;
    this.outcomeBanner.alt = banner.alt;
    this.message.textContent = "";
    this.message.classList.add("hidden");

    try {
      await this.outcomeBanner.decode();
    } catch (error) {
      console.error(`Could not decode ${outcome} banner.`, error);
    }
  }

  showPlayAgainButton() {
    if (this.playAgainButton.element.parentElement !== this.content) {
      this.playAgainButton.render(this.content);
    }

    this.setPlayAgainPending(false);
    this.hideWaitingIndicator();
  }

  showWaitingIndicator() {
    this.playAgainButton.element.remove();
    this.waitingIndicator.classList.remove("hidden");
  }

  setWaitingPlayerName(playerName) {
    const displayName = playerName?.trim() || "Player X";

    this.waitingText.textContent =
      `Waiting for ${displayName} to start a new match.`;
  }

  hideWaitingIndicator() {
    this.waitingIndicator.classList.add("hidden");
  }

  setPlayAgainPending(isPending) {
    this.playAgainButton.element.disabled = isPending;
    this.playAgainButton.setLabel(
      isPending ? "STARTING NEW MATCH..." : "PLAY AGAIN",
    );
  }

  updateScore(scores) {
    this.scoreboard.update(scores);
  }

  open() {
    this.modal.open();
  }

  close() {
    this.modal.close();
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      this.modal.render(parent);
    } else {
      console.error("ResultModal target not found.");
    }
  }
}
