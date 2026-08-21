import { Button } from "../components/base/Button.js";
import { Modal } from "../components/base/Modal.js";
import { CreateGameModal } from "../components/game/CreateGameModal.js";
import { HowToPlayModal } from "../components/game/HowToPlayModal.js";
import { JoinGameModal } from "../components/game/JoinGameModal.js";
import { SpectateModal } from "../components/game/SpectateModal.js";
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
  }

  // ========================================
  // STEP 1
  // ========================================

  initializeElements() {
    this.container = document.createElement("div");
    this.banner = document.createElement("div");
    this.bannerImage = document.createElement("img");
    this.actions = document.createElement("div");

    // NOTICE
    this.noticeContent = document.createElement("div");
    this.noticeMessage = document.createElement("p");
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
      label: "?",
      className: "button-utility",
      onClick: () => this.openHowToPlayModal(),
    });

    this.howToPlayButton.element.classList.add("how-to-play-button");

    this.createGameModal = new CreateGameModal({
      onCreateGame: () => this.createGame(),
    });

    this.joinGameModal = new JoinGameModal({
      onJoinGame: () => this.joinGame(),
      onPasteGameCode: () => this.pasteGameCode(),
    });

    this.spectateModal = new SpectateModal({
      onSpectateGame: () => this.spectateGame(),
    });

    this.noticeButton = new Button({
      label: "OK",
      className: "button-confirm",
      onClick: () => this.noticeModal.close(),
    });

    this.noticeModal = new Modal({
      title: "Game Update",
      content: this.noticeContent,
      closable: false,
    });

    this.howToPlayModal = new HowToPlayModal();
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
    this.howToPlayButton.element.setAttribute(
      "aria-label",
      "How to play",
    );
    this.howToPlayButton.element.title = "How to play";

    // NOTICE
    this.noticeContent.classList.add("modal-form");
  }

  // ========================================
  // STEP 3
  // ========================================

  appendElements() {
    this.banner.append(this.bannerImage);
    this.container.append(this.banner);
    this.container.append(this.actions);
    this.openCreateButton.render(this.actions);
    this.openJoinButton.render(this.actions);
    this.openSpectateButton.render(this.actions);
    this.howToPlayButton.render(this.container);

    this.noticeContent.append(this.noticeMessage);
    this.noticeButton.render(this.noticeContent);
  }

  // ========================================
  // MODALS
  // ========================================

  openCreateModal() {
    this.createGameModal.open();
  }

  openJoinModal() {
    this.joinGameModal.open();
  }

  openSpectateModal() {
    this.spectateModal.open();
  }

  openHowToPlayModal() {
    this.howToPlayModal.open();
  }

  showNotice(message) {
    this.noticeMessage.textContent = message;
    this.noticeModal.open();
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

      this.joinGameModal.setGameCode(gameCode);
      this.joinGameModal.focusPlayerName();
    } catch (error) {
      console.error("Could not read the clipboard.", error);
      this.setMessage("Could not paste the game code.");
    }
  }

  // ========================================
  // CREATE GAME
  // ========================================

  async createGame() {
    const playerName = this.createGameModal.getPlayerName();

    if (playerName === "") {
      this.setMessage("Please enter your name.");
      return;
    }

    const result = await createGameService(playerName);

    if (!result.ok) {
      this.setMessage(result.message);
      return;
    }

    this.createGameModal.close();
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
    const gameCode = this.joinGameModal.getGameCode();
    // .toUpperCase();

    const playerName = this.joinGameModal.getPlayerName();

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

    this.joinGameModal.close();
    this.onGameStarted();
  }

  // ========================================
  // SPECTATE GAME
  // ========================================

  async spectateGame() {
    const gameCode = this.spectateModal.getGameCode();

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
    if (this.createGameModal.isOpen()) {
      this.createGameModal.setMessage(message);
      return;
    }

    if (this.joinGameModal.isOpen()) {
      this.joinGameModal.setMessage(message);
      return;
    }

    if (this.spectateModal.isOpen()) {
      this.spectateModal.setMessage(message);
      return;
    }

    this.showNotice(message);
  }

  // ========================================
  // RESET FORM
  // ========================================

  resetForm() {
    this.createGameModal.reset();
    this.joinGameModal.reset();
    this.spectateModal.reset();
    this.createGameModal.close();
    this.joinGameModal.close();
    this.spectateModal.close();
    this.noticeModal.close();
    this.howToPlayModal.close();
  }

  // ========================================
  // RENDER
  // ========================================

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.container);
      this.createGameModal.render(document.body);
      this.joinGameModal.render(document.body);
      this.spectateModal.render(document.body);
      this.noticeModal.render(document.body);
      this.howToPlayModal.render(document.body);
    } else {
      console.error("HomePage target not found.");
    }
  }
}
