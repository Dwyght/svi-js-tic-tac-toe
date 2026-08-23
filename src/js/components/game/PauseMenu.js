import { Button } from "../base/Button.js";
import { Modal } from "../base/Modal.js";
import { resolveTarget } from "../../utils/dom.js";

export class PauseMenu {
  constructor({ onCopyGameCode, onOpenQuitModal, onLeave }) {
    this.onCopyGameCode = onCopyGameCode;
    this.onOpenQuitModal = onOpenQuitModal;
    this.onLeave = onLeave;

    this.initializeElements();
    this.setAttributes();
    this.appendElements();
  }

  initializeElements() {
    this.anchor = document.createElement("div");
    this.content = document.createElement("div");
    this.gameCodeContainer = document.createElement("div");
    this.gameCodeLabel = document.createElement("span");
    this.gameCodeDisplay = document.createElement("span");
    this.copyCodeButton = new Button({
      label: "Copy",
      className: "button-utility",
      onClick: () => this.copyGameCode(),
    });
    this.menuButton = new Button({
      label: "",
      className: "button-utility",
      onClick: () => this.modal.open(),
    });
    this.modal = new Modal({
      title: "Pause Menu",
      content: this.content,
    });
    this.resumeButton = new Button({
      label: "RESUME GAME",
      className: "button-confirm",
      onClick: () => this.close(),
    });
    this.quitButton = new Button({
      label: "QUIT GAME",
      className: "button-danger",
      onClick: () => this.onOpenQuitModal(),
    });
    this.leaveButton = new Button({
      label: "LEAVE",
      className: "button-danger",
      onClick: () => this.onLeave(),
    });
  }

  setAttributes() {
    this.anchor.classList.add("pause-menu-anchor");
    this.gameCodeContainer.classList.add(
      "game-code-container",
      "active-game-code-container",
    );
    this.gameCodeLabel.classList.add("game-code-label");
    this.gameCodeLabel.textContent = "Game Code:";
    this.gameCodeDisplay.classList.add("game-code");
    this.copyCodeButton.element.classList.add("game-code-copy-button");
    this.content.classList.add("modal-form", "pause-menu-content");
    this.menuButton.element.classList.add("pause-menu-button");
    this.menuButton.element.setAttribute("aria-label", "Open pause menu");
    this.menuButton.element.setAttribute("aria-haspopup", "dialog");
    this.menuButton.element.title = "Pause menu";
    this.modal.dialog.classList.add("pause-menu-modal");
    this.resumeButton.element.classList.add(
      "pause-menu-resume-button",
    );
    this.quitButton.element.classList.add("pause-menu-exit-button");
    this.leaveButton.element.classList.add("pause-menu-exit-button");
  }

  appendElements() {
    this.gameCodeContainer.append(
      this.gameCodeLabel,
      this.gameCodeDisplay,
    );
    this.copyCodeButton.render(this.gameCodeContainer);
    this.content.append(this.gameCodeContainer);
    this.resumeButton.render(this.content);
    this.menuButton.render(this.anchor);
  }

  async copyGameCode() {
    try {
      await this.onCopyGameCode(this.gameCodeDisplay.textContent);
      this.copyCodeButton.setLabel("Copied!");

      setTimeout(() => {
        this.copyCodeButton.setLabel("Copy");
      }, 1500);
    } catch (error) {
      console.error("Could not copy game code.", error);
      this.copyCodeButton.setLabel("Copy Failed");
    }
  }

  updateGameCode(gameCode) {
    this.gameCodeDisplay.textContent = gameCode;
    this.copyCodeButton.setLabel("Copy");
  }

  configureViewerControls(isSpectator) {
    this.quitButton.element.remove();
    this.leaveButton.element.remove();
    this.resumeButton.setLabel(
      isSpectator ? "RESUME WATCHING" : "RESUME GAME",
    );

    if (isSpectator) {
      this.leaveButton.render(this.content);
    } else {
      this.quitButton.render(this.content);
    }
  }

  close() {
    this.modal.close();
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.anchor);
      this.modal.render(document.body);
    } else {
      console.error("PauseMenu target not found.");
    }
  }
}
