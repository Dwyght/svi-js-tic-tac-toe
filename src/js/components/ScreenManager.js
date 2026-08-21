import { resolveTarget } from "../utils/dom.js";

import { Button } from "./base/Button.js";

import { ConveyorBelt } from "./ConveyorBelt.js";

import { Modal } from "./base/Modal.js";

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

    this.gameScreen = document.createElement("section");

    // Waiting elements

    this.waitingContent = document.createElement("div");

    this.waitingText = document.createElement("div");

    this.gameCodeContainer = document.createElement("div");

    this.waitingGameCode = document.createElement("span");

    this.copyCodeButton = new Button({
      label: "Copy",
      className: "button-utility",
      onClick: () => this.copyGameCode(),
    });

    this.waitingDots = document.createElement("span");

    this.waitingDotElements = [];

    for (let dotIndex = 0; dotIndex < 3; dotIndex++) {
      const dot = document.createElement("span");

      this.waitingDotElements.push(dot);
    }

    this.waitingModal = new Modal({
      title: "Waiting for opponent",
      content: this.waitingContent,
      closable: false,
    });

    this.conveyorBelt = new ConveyorBelt();
  }

  // ========================================
  // STEP 2
  // ========================================

  setAttributes() {
    this.container.classList.add("app-container");

    this.homeScreen.id = "home-screen";

    this.homeScreen.classList.add("hidden");

    this.gameScreen.id = "game-screen";

    this.gameScreen.classList.add("hidden");

    this.waitingContent.classList.add("waiting-modal-content");

    this.waitingText.classList.add("waiting-greeting");

    this.waitingModal.dialog.classList.add("waiting-modal");

    this.gameCodeContainer.classList.add("game-code-container");

    this.waitingGameCode.id = "waiting-game-code";

    this.waitingGameCode.classList.add("game-code");

    this.waitingDots.classList.add("waiting-dots");

    this.waitingDots.setAttribute("aria-hidden", "true");

    for (const dot of this.waitingDotElements) {
      dot.classList.add("waiting-dot");

      dot.textContent = ".";
    }
  }

  // ========================================
  // STEP 3
  // ========================================

  appendElements() {
    this.container.append(this.homeScreen, this.gameScreen);

    this.waitingDots.append(...this.waitingDotElements);

    this.waitingModal.title.append(this.waitingDots);

    this.waitingContent.append(
      this.waitingText,
      this.gameCodeContainer,
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

    this.gameScreen.classList.add("hidden");

    this.waitingModal.close();

    this.conveyorBelt.stop();
  }

  // ========================================
  // SHOW WAITING
  // ========================================

  showWaitingScreen(gameCode, playerName) {
    this.homeScreen.classList.add("hidden");

    this.gameScreen.classList.add("hidden");

    this.waitingText.textContent =
      `Hi ${playerName}, share this game code:`;

    this.waitingGameCode.textContent = gameCode;

    this.waitingModal.open();

    this.conveyorBelt.start();
  }

  // ========================================
  // SHOW GAME
  // ========================================

  showGameScreen() {
    this.homeScreen.classList.add("hidden");

    this.gameScreen.classList.remove("hidden");

    this.waitingModal.close();

    this.conveyorBelt.stop();
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

      this.waitingModal.render(document.body);

      this.conveyorBelt.render(this.waitingModal.dialog);
    } else {
      console.error("ScreenManager target not found.");
    }
  }
}
