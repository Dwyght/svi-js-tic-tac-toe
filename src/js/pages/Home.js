import { Button } from "../components/base/Button.js";
import { Modal } from "../components/base/Modal.js";
import { CreateGameModal } from "../components/game/CreateGameModal.js";
import { HowToPlayModal } from "../components/game/HowToPlayModal.js";
import { JoinGameModal } from "../components/game/JoinGameModal.js";
import { SpectateModal } from "../components/game/SpectateModal.js";
import {
  PLAYER_NAME_MAX_LENGTH,
  PLAYER_NAME_PATTERN,
} from "../config/constants.js";
import {
  createGame as createGameService,
  joinGame as joinGameService,
  spectateGame as spectateGameService,
} from "../services/gameFlowService.js";
import { WaitingRoomFlow } from "../services/waitingRoomFlow.js";
import { readClipboardText } from "../utils/clipboard.js";
import { resolveTarget } from "../utils/dom.js";

export class HomePage {
  constructor({
    screenManager,
    pollingService,
    onGameStarted,
    onOpenHistory,
  }) {
    this.screenManager = screenManager;
    this.pollingService = pollingService;
    this.onGameStarted = onGameStarted;
    this.onOpenHistory = onOpenHistory;
    this.waitingRoomFlow = new WaitingRoomFlow({
      pollingService: this.pollingService,
      screenManager: this.screenManager,
      onGameStarted: this.onGameStarted,
    });

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
    this.historyLink = document.createElement("a");

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
      onPasteGameCode: () =>
        this.pasteCodeInto((code) => {
          this.joinGameModal.setGameCode(code);
          this.joinGameModal.focusPlayerName();
        }),
    });

    this.spectateModal = new SpectateModal({
      onSpectateGame: () => this.spectateGame(),
      onPasteGameCode: () =>
        this.pasteCodeInto((code) => {
          this.spectateModal.setGameCode(code);
        }),
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
    this.historyLink.classList.add("home-history-link");
    this.historyLink.href = "#history";
    this.historyLink.textContent = "History";
    this.howToPlayButton.element.setAttribute("aria-label", "How to play");
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
    this.container.append(this.historyLink);
    this.openCreateButton.render(this.actions);
    this.openJoinButton.render(this.actions);
    this.openSpectateButton.render(this.actions);
    this.howToPlayButton.render(this.container);

    this.noticeContent.append(this.noticeMessage);
    this.noticeButton.render(this.noticeContent);
  }

  bindEvents() {
    this.historyLink.addEventListener("click", (event) => {
      event.preventDefault();
      this.onOpenHistory();
    });
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

  showNotice(message, title = "Game Update") {
    this.noticeModal.setTitle(title);
    this.noticeMessage.textContent = message;
    this.noticeModal.open();
  }

  // ========================================
  // PASTE GAME CODE
  // ========================================

  async pasteCodeInto(applyCode) {
    try {
      const gameCode = await readClipboardText();

      if (gameCode === "") {
        this.setMessage("The clipboard does not contain a game code.");
        return;
      }

      applyCode(gameCode);
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
    const sushiId = this.createGameModal.getSushiId();

    if (playerName === "") {
      this.setMessage("Please enter your name.");
      return;
    }

    if (playerName.length > PLAYER_NAME_MAX_LENGTH) {
      this.setMessage("Player name must be 10 characters or fewer.");
      return;
    }

    if (!PLAYER_NAME_PATTERN.test(playerName)) {
      this.setMessage(
        "Name must be 1–10 letters, numbers, underscores, or hyphens.",
      );
      return;
    }

    this.createGameModal.setMessage("");
    this.createGameModal.setPending(true);

    try {
      const result = await createGameService(playerName, sushiId);

      if (!result.ok) {
        this.createGameModal.setMessage(result.message);
        return;
      }

      this.createGameModal.close();
      this.waitingRoomFlow.start(result.gameCode, playerName);
    } finally {
      this.createGameModal.setPending(false);
    }
  }

  // ========================================
  // JOIN GAME
  // ========================================

  async joinGame() {
    const gameCode = this.joinGameModal.getGameCode();
    const playerName = this.joinGameModal.getPlayerName();
    const sushiId = this.joinGameModal.getSushiId();

    if (gameCode === "") {
      this.setMessage("Please enter a game code.");
      return;
    }

    if (playerName === "") {
      this.setMessage("Please enter your name.");
      return;
    }

    if (playerName.length > PLAYER_NAME_MAX_LENGTH) {
      this.setMessage("Player name must be 10 characters or fewer.");
      return;
    }

    if (!PLAYER_NAME_PATTERN.test(playerName)) {
      this.setMessage(
        "Name must be 1–10 letters, numbers, underscores, or hyphens.",
      );
      return;
    }

    this.joinGameModal.setMessage("");
    this.joinGameModal.setPending(true);

    try {
      const result = await joinGameService(gameCode, playerName, sushiId);

      if (!result.ok) {
        this.joinGameModal.setMessage(result.message);
        return;
      }

      this.joinGameModal.close();
      this.onGameStarted();
    } finally {
      this.joinGameModal.setPending(false);
    }
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
