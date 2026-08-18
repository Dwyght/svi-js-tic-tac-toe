import {
  createGame as createGameApi,
  checkGame,
  resetGame,
} from "../api/tictactoeApi.js";

import { Button } from "../components/Button.js";

import { Modal } from "../components/Modal.js";

import { gameState } from "../state/gameState.js";

import { generateGameCode } from "../game/gameCode.js";

import { savePlayerName } from "../services/storageService.js";

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

    this.createModal = new Modal({
      title: "Create Game",
      content: this.createForm,
    });

    this.joinModal = new Modal({
      title: "Join Game",
      content: this.joinForm,
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
  }

  // ========================================
  // STEP 3
  // ========================================

  appendElements() {
    this.container.append(this.actions, this.message);

    this.openCreateButton.render(this.actions);

    this.openJoinButton.render(this.actions);

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

  openHowToPlayModal() {
    this.howToPlayModal.open();
  }

  // ========================================
  // PASTE GAME CODE
  // ========================================

  async pasteGameCode() {
    try {
      const gameCode = (await navigator.clipboard.readText())
        .trim()
        .toUpperCase();

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

    const gameCode = generateGameCode();

    try {
      const result = await createGameApi(gameCode);

      console.log("Create Game:", result);

      // Creator must receive X.
      if (result !== "X") {
        this.setMessage("Could not create the room. Please try again.");

        return;
      }

      gameState.setSession({
        gameCode: gameCode,

        myTile: "X",

        myName: playerName,

        gameStarted: false,
      });

      savePlayerName(gameCode, "X", playerName);

      this.createModal.close();

      this.screenManager.showWaitingScreen(gameCode, playerName);

      this.waitForPlayerO();
    } catch (error) {
      console.error(error);

      this.setMessage("Could not connect to the server.");
    }
  }

  // ========================================
  // WAIT FOR PLAYER O
  // ========================================

  waitForPlayerO() {
    this.pollingService.startRefresh(async () => {
      const started = await checkGame(gameState.gameCode);

      if (!started) {
        return;
      }

      gameState.gameStarted = true;

      this.pollingService.stopRefresh();

      this.onGameStarted();
    });
  }

  // ========================================
  // JOIN GAME
  // ========================================

  async joinGame() {
    const gameCode = this.joinCodeInput.value.trim().toUpperCase();

    const playerName = this.joinNameInput.value.trim();

    if (gameCode === "") {
      this.setMessage("Please enter a game code.");

      return;
    }

    if (playerName === "") {
      this.setMessage("Please enter your name.");

      return;
    }

    try {
      const result = await createGameApi(gameCode);

      console.log("Join Game:", result);

      // The endpoint also creates rooms.
      //
      // Therefore if joining returns X,
      // the room did not exist.
      if (result === "X") {
        await resetGame(gameCode);

        this.setMessage("Game code does not exist.");

        return;
      }

      if (result !== "O") {
        this.setMessage(result);

        return;
      }

      gameState.setSession({
        gameCode: gameCode,

        myTile: "O",

        myName: playerName,

        gameStarted: true,
      });

      savePlayerName(gameCode, "O", playerName);

      this.joinModal.close();

      this.onGameStarted();
    } catch (error) {
      console.error(error);

      this.setMessage("Could not connect to the server.");
    }
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

    this.message.textContent = message;
  }

  // ========================================
  // RESET FORM
  // ========================================

  resetForm() {
    this.createNameInput.value = "";

    this.joinCodeInput.value = "";

    this.joinNameInput.value = "";

    this.message.textContent = "";

    this.createMessage.textContent = "";

    this.joinMessage.textContent = "";

    this.createModal.close();

    this.joinModal.close();

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

      this.howToPlayModal.render(document.body);
    } else {
      console.error("HomePage target not found.");
    }
  }
}
