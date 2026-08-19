import { Button } from "../components/Button.js";

import { Modal } from "../components/Modal.js";

import {
  createGame as createGameService,
  joinGame as joinGameService,
  spectateGame as spectateGameService,
  waitForPlayerO as waitForPlayerOService,
} from "../services/gameFlowService.js";

import { readClipboardText } from "../utils/clipboard.js";

import { resolveTarget } from "../utils/dom.js";

export class HomePage {
  constructor({ screenManager, pollingService, onGameStarted }) {
    this.screenManager = screenManager;

    this.pollingService = pollingService;

    this.onGameStarted = onGameStarted;

    this.initializeElements();

    this.initializeComponents();

    this.setAttributes();

    this.appendElements();

    this.bindEvents();
  }

  // ========================================
  // STEP 1
  // ========================================

  initializeElements() {
    this.container = document.createElement("div");

    this.banner = document.createElement("div");

    this.bannerImage = document.createElement("img");

    this.actions = document.createElement("div");

    this.message = document.createElement("p");

    // HOW TO PLAY

    this.howToPlayContent = document.createElement("div");

    this.howToPlayIntro = document.createElement("p");

    this.howToPlaySteps = document.createElement("ol");

    // CREATE FORM

    this.createForm = document.createElement("form");

    this.createNameLabel = document.createElement("label");

    this.createNameInput = document.createElement("input");

    this.createMessage = document.createElement("p");

    // JOIN FORM

    this.joinForm = document.createElement("form");

    this.joinCodeLabel = document.createElement("label");

    this.joinCodeField = document.createElement("div");

    this.joinCodeInput = document.createElement("input");

    this.joinNameLabel = document.createElement("label");

    this.joinNameInput = document.createElement("input");

    this.joinMessage = document.createElement("p");

    // SPECTATE FORM

    this.spectateForm = document.createElement("form");

    this.spectateCodeLabel = document.createElement("label");

    this.spectateCodeInput = document.createElement("input");

    this.spectateMessage = document.createElement("p");
  }

  // ========================================
  // COMPONENTS
  // ========================================

  initializeComponents() {
    this.openCreateButton = new Button({
      label: "CREATE GAME",
      className: "home-action-button",
      onClick: () => this.openCreateModal(),
    });

    this.openJoinButton = new Button({
      label: "JOIN GAME",
      className: "home-action-button",
      onClick: () => this.openJoinModal(),
    });

    this.openSpectateButton = new Button({
      label: "SPECTATE GAME",
      className: "home-action-button",
      onClick: () => this.openSpectateModal(),
    });

    this.howToPlayButton = new Button({
      label: "HOW TO PLAY",
      className: "home-action-button",
      onClick: () => this.openHowToPlayModal(),
    });

    this.howToPlayButton.element.classList.add("button-utility");

    this.createButton = new Button({
      label: "CREATE GAME",
      type: "submit",
      className: "button-confirm",
    });

    this.pasteButton = new Button({
      label: "PASTE",
      className: "button-utility",
      onClick: () => this.pasteGameCode(),
    });

    this.joinButton = new Button({
      label: "JOIN GAME",
      type: "submit",
      className: "button-confirm",
    });

    this.spectateButton = new Button({
      label: "SPECTATE GAME",
      type: "submit",
      className: "button-confirm",
    });

    this.createModal = new Modal({
      title: "Create Game",
      content: this.createForm,
    });

    this.joinModal = new Modal({
      title: "Join Game",
      content: this.joinForm,
    });

    this.spectateModal = new Modal({
      title: "Spectate Game",
      content: this.spectateForm,
    });

    this.howToPlayModal = new Modal({
      title: "How to Play",
      content: this.howToPlayContent,
    });
  }

  // ========================================
  // STEP 2
  // ========================================

  setAttributes() {
    this.container.classList.add("home-page");

    this.banner.classList.add("home-banner");

    this.bannerImage.src = "./src/assets/images/banner.png";

    this.bannerImage.alt = "Tic Tac Toe";

    this.actions.classList.add("home-actions");

    this.message.classList.add("message");

    // HOW TO PLAY

    this.howToPlayContent.classList.add("how-to-play-content");

    this.howToPlayIntro.textContent =
      "Play with a friend and be the first to make a row of three.";

    const steps = [
      "Choose Create Game, enter your name, and share the game code.",
      "Your friend chooses Join Game and enters the shared code.",
      "Player X goes first. Take turns choosing an empty square.",
      "Make three matching pieces in a row, column, or diagonal to win.",
    ];

    for (const step of steps) {
      const item = document.createElement("li");

      item.textContent = step;

      this.howToPlaySteps.append(item);
    }

    // CREATE

    this.createForm.classList.add("modal-form");

    this.createNameLabel.textContent = "Player Name";

    this.createNameLabel.htmlFor = "create-player-name";

    this.createNameInput.id = "create-player-name";

    this.createNameInput.type = "text";

    this.createNameInput.placeholder = "Enter your name";

    this.createNameInput.autocomplete = "name";

    this.createMessage.classList.add("message");

    // JOIN

    this.joinForm.classList.add("modal-form");

    this.joinCodeLabel.textContent = "Game Code";

    this.joinCodeLabel.htmlFor = "join-game-code";

    this.joinCodeInput.id = "join-game-code";

    this.joinCodeInput.type = "text";

    this.joinCodeInput.placeholder = "Enter or paste game code";

    this.joinCodeInput.autocomplete = "off";

    this.joinCodeInput.spellcheck = false;

    this.joinCodeField.classList.add("join-code-field");

    this.joinNameLabel.textContent = "Player Name";

    this.joinNameLabel.htmlFor = "join-player-name";

    this.joinNameInput.id = "join-player-name";

    this.joinNameInput.type = "text";

    this.joinNameInput.placeholder = "Enter Player O's name";

    this.joinNameInput.autocomplete = "name";

    this.joinMessage.classList.add("message");

    // SPECTATE

    this.spectateForm.classList.add("modal-form");

    this.spectateCodeLabel.textContent = "Game Code";

    this.spectateCodeLabel.htmlFor = "spectate-game-code";

    this.spectateCodeInput.id = "spectate-game-code";

    this.spectateCodeInput.type = "text";

    this.spectateCodeInput.placeholder = "Enter game code";

    this.spectateCodeInput.autocomplete = "off";

    this.spectateCodeInput.spellcheck = false;

    this.spectateMessage.classList.add("message");
  }

  // ========================================
  // STEP 3
  // ========================================

  appendElements() {
    this.banner.append(this.bannerImage);

    this.container.append(this.banner);

    this.container.append(this.actions);

    this.container.append(this.message);

    this.openCreateButton.render(this.actions);

    this.openJoinButton.render(this.actions);

    this.openSpectateButton.render(this.actions);

    this.howToPlayButton.render(this.actions);

    this.howToPlayContent.append(this.howToPlayIntro, this.howToPlaySteps);

    this.createForm.append(
      this.createNameLabel,
      this.createNameInput,
      this.createMessage,
    );

    this.createButton.render(this.createForm);

    this.joinForm.append(
      this.joinCodeLabel,
      this.joinCodeField,
      this.joinNameLabel,
      this.joinNameInput,
      this.joinMessage,
    );

    this.joinCodeField.append(this.joinCodeInput);

    this.pasteButton.render(this.joinCodeField);

    this.joinButton.render(this.joinForm);

    this.spectateForm.append(
      this.spectateCodeLabel,
      this.spectateCodeInput,
      this.spectateMessage,
    );

    this.spectateButton.render(this.spectateForm);
  }

  // ========================================
  // EVENTS
  // ========================================

  bindEvents() {
    this.createForm.addEventListener("submit", (event) => {
      event.preventDefault();

      this.createGame();
    });

    this.joinForm.addEventListener("submit", (event) => {
      event.preventDefault();

      this.joinGame();
    });

    this.spectateForm.addEventListener("submit", (event) => {
      event.preventDefault();

      this.spectateGame();
    });
  }

  // ========================================
  // MODALS
  // ========================================

  openCreateModal() {
    this.createMessage.textContent = "";

    this.createModal.open();

    this.createNameInput.focus();
  }

  openJoinModal() {
    this.joinMessage.textContent = "";

    this.joinModal.open();

    this.joinCodeInput.focus();
  }

  openSpectateModal() {
    this.spectateMessage.textContent = "";

    this.spectateModal.open();

    this.spectateCodeInput.focus();
  }

  openHowToPlayModal() {
    this.howToPlayModal.open();
  }

  // ========================================
  // PASTE GAME CODE
  // ========================================

  async pasteGameCode() {
    try {
      const gameCode = await readClipboardText();

      if (gameCode === "") {
        this.setMessage("The clipboard does not contain a game code.");

        return;
      }

      this.joinCodeInput.value = gameCode;

      this.joinNameInput.focus();
    } catch (error) {
      console.error("Could not read the clipboard.", error);

      this.setMessage("Could not paste the game code.");
    }
  }

  // ========================================
  // CREATE GAME
  // ========================================

  async createGame() {
    const playerName = this.createNameInput.value.trim();

    if (playerName === "") {
      this.setMessage("Please enter your name.");

      return;
    }

    const result = await createGameService(playerName);

    if (!result.ok) {
      this.setMessage(result.message);

      return;
    }

    this.createModal.close();

    this.screenManager.showWaitingScreen(result.gameCode, playerName);

    this.waitForPlayerO(result.gameCode);
  }

  // ========================================
  // WAIT FOR PLAYER O
  // ========================================

  waitForPlayerO(gameCode) {
    this.pollingService.startRefresh(async () => {
      const result = await waitForPlayerOService(gameCode);

      if (!result.started) {
        return;
      }

      this.pollingService.stopRefresh();

      this.onGameStarted();
    });
  }

  // ========================================
  // JOIN GAME
  // ========================================

  async joinGame() {
    const gameCode = this.joinCodeInput.value.trim();
    // .toUpperCase();

    const playerName = this.joinNameInput.value.trim();

    if (gameCode === "") {
      this.setMessage("Please enter a game code.");

      return;
    }

    if (playerName === "") {
      this.setMessage("Please enter your name.");

      return;
    }

    const result = await joinGameService(gameCode, playerName);

    if (!result.ok) {
      this.setMessage(result.message);

      return;
    }

    this.joinModal.close();

    this.onGameStarted();
  }

  // ========================================
  // SPECTATE GAME
  // ========================================

  async spectateGame() {
    const gameCode = this.spectateCodeInput.value.trim();

    if (gameCode === "") {
      this.setMessage("Please enter a game code.");

      return;
    }

    const result = await spectateGameService(gameCode);

    if (!result.ok) {
      this.setMessage(result.message);

      return;
    }

    this.spectateModal.close();

    this.onGameStarted();
  }

  // ========================================
  // MESSAGE
  // ========================================

  setMessage(message) {
    if (this.createModal.isOpen()) {
      this.createMessage.textContent = message;

      return;
    }

    if (this.joinModal.isOpen()) {
      this.joinMessage.textContent = message;

      return;
    }

    if (this.spectateModal.isOpen()) {
      this.spectateMessage.textContent = message;

      return;
    }

    this.message.textContent = message;
  }

  // ========================================
  // RESET FORM
  // ========================================

  resetForm() {
    this.createNameInput.value = "";

    this.joinCodeInput.value = "";

    this.joinNameInput.value = "";

    this.spectateCodeInput.value = "";

    this.message.textContent = "";

    this.createMessage.textContent = "";

    this.joinMessage.textContent = "";

    this.spectateMessage.textContent = "";

    this.createModal.close();

    this.joinModal.close();

    this.spectateModal.close();

    this.howToPlayModal.close();
  }

  // ========================================
  // RENDER
  // ========================================

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.container);

      this.createModal.render(document.body);

      this.joinModal.render(document.body);

      this.spectateModal.render(document.body);

      this.howToPlayModal.render(document.body);
    } else {
      console.error("HomePage target not found.");
    }
  }
}
