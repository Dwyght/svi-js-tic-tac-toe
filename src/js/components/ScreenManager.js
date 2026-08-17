import { resolveTarget } from "../utils/dom.js";

import { Button } from "./Button.js";

export class ScreenManager {
  constructor() {
    this.initializeElements();

    this.setAttributes();

    this.appendElements();
  }

  // ========================================
  // STEP 1
  // ========================================

  initializeElements() {
    this.container = document.createElement("main");

    this.homeScreen = document.createElement("section");

    this.waitingScreen = document.createElement("section");

    this.gameScreen = document.createElement("section");

    // Waiting elements

    this.waitingTitle = document.createElement("h2");

    this.waitingText = document.createElement("p");

    this.gameCodeContainer = document.createElement("div");

    this.waitingGameCode = document.createElement("span");

    this.copyCodeButton = new Button({
      label: "Copy",
      className: "button-utility",
      onClick: () => this.copyGameCode(),
    });

    this.waitingPlayer = document.createElement("p");

    this.waitingHint = document.createElement("p");
  }

  // ========================================
  // STEP 2
  // ========================================

  setAttributes() {
    this.container.classList.add("app-container");

    this.homeScreen.id = "home-screen";

    this.waitingScreen.id = "waiting-screen";

    this.gameScreen.id = "game-screen";

    this.waitingScreen.classList.add("hidden");

    this.gameScreen.classList.add("hidden");

    this.waitingTitle.textContent = "Waiting for another player...";

    this.waitingText.textContent = "Share this game code:";

    this.gameCodeContainer.classList.add("game-code-container");

    this.waitingGameCode.id = "waiting-game-code";

    this.waitingHint.classList.add("hint");

    this.waitingHint.textContent =
      "Duplicate this tab, choose Join Game, paste the code, and enter the second player's name.";
  }

  // ========================================
  // STEP 3
  // ========================================

  appendElements() {
    this.container.append(this.homeScreen, this.waitingScreen, this.gameScreen);

    this.waitingScreen.append(
      this.waitingTitle,
      this.waitingText,
      this.gameCodeContainer,
      this.waitingPlayer,
      this.waitingHint,
    );

    this.gameCodeContainer.append(this.waitingGameCode);

    this.copyCodeButton.render(this.gameCodeContainer);
  }

  // ========================================
  // COPY
  // ========================================

  async copyGameCode() {
    const code = this.waitingGameCode.textContent;

    try {
      await navigator.clipboard.writeText(code);

      this.copyCodeButton.setLabel("Copied!");

      setTimeout(() => {
        this.copyCodeButton.setLabel("Copy");
      }, 1500);
    } catch (error) {
      console.error("Could not copy game code.", error);

      this.copyCodeButton.setLabel("Copy Failed");
    }
  }

  // ========================================
  // SHOW HOME
  // ========================================

  showHomeScreen() {
    this.homeScreen.classList.remove("hidden");

    this.waitingScreen.classList.add("hidden");

    this.gameScreen.classList.add("hidden");
  }

  // ========================================
  // SHOW WAITING
  // ========================================

  showWaitingScreen(gameCode, playerName) {
    this.homeScreen.classList.add("hidden");

    this.gameScreen.classList.add("hidden");

    this.waitingScreen.classList.remove("hidden");

    this.waitingGameCode.textContent = gameCode;

    this.waitingPlayer.textContent = `${playerName}, you are Player X`;
  }

  // ========================================
  // SHOW GAME
  // ========================================

  showGameScreen() {
    this.homeScreen.classList.add("hidden");

    this.waitingScreen.classList.add("hidden");

    this.gameScreen.classList.remove("hidden");
  }

  // ========================================
  // RETURN HOME
  // ========================================

  returnToHome() {
    this.showHomeScreen();
  }

  // ========================================
  // TARGET GETTERS
  // ========================================

  getHomeTarget() {
    return this.homeScreen;
  }

  getGameTarget() {
    return this.gameScreen;
  }

  // ========================================
  // RENDER
  // ========================================

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.container);
    } else {
      console.error("ScreenManager target not found.");
    }
  }
}
