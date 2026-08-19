import { ScreenManager } from "./components/ScreenManager.js";

import { Button } from "./components/Button.js";

import { Modal } from "./components/Modal.js";

import { HomePage } from "./pages/HomePage.js";

import { GamePage } from "./pages/GamePage.js";

import { PollingService } from "./services/pollingService.js";

import { checkGameStillActive } from "./services/gameFlowService.js";

import {
  getSession,
  clearSession,
} from "./services/storageService.js";

import { gameState } from "./state/gameState.js";

// ========================================
// CREATE CORE SERVICES
// ========================================

const screenManager = new ScreenManager();

const pollingService = new PollingService();

// ========================================
// RENDER SCREEN STRUCTURE
// ========================================

screenManager.render("app");

// ========================================
// GAME PAGE
// ========================================

const gamePage = new GamePage({
  screenManager: screenManager,

  pollingService: pollingService,

  onReturnHome: handleReturnHome,
});

// ========================================
// HOME PAGE
// ========================================

const homePage = new HomePage({
  screenManager: screenManager,

  pollingService: pollingService,

  onGameStarted: handleGameStarted,
});

// ========================================
// RENDER PAGES
// ========================================

homePage.render(screenManager.getHomeTarget());

gamePage.render(screenManager.getGameTarget());

// ========================================
// WHEN TWO PLAYERS ARE READY
// ========================================

async function handleGameStarted() {
  await gamePage.startGame();
}

// ========================================
// RETURN HOME
// ========================================

function handleReturnHome(message = "") {
  pollingService.stopRefresh();

  screenManager.returnToHome();

  homePage.resetForm();

  if (message !== "") {
    homePage.showNotice(message);
  }
}

// ========================================
// START APPLICATION
// ========================================

function isValidPlayerSession(session) {
  return (
    session !== null &&
    typeof session.gameCode === "string" &&
    session.gameCode.trim() !== "" &&
    (session.tile === "X" || session.tile === "O") &&
    typeof session.name === "string" &&
    session.name.trim() !== ""
  );
}

function showResumePrompt(session) {
  const resumeContent = document.createElement("div");
  const resumeMessage = document.createElement("p");

  resumeContent.classList.add("modal-form");
  resumeMessage.textContent = `Resume your game as ${session.name} (Player ${session.tile})?`;

  const resumeModal = new Modal({
    title: "Resume Game",
    content: resumeContent,
    closable: false,
  });
  const resumeButton = new Button({
    label: "RESUME",
    className: "button-confirm",
    onClick: async () => {
      resumeButton.element.disabled = true;
      discardButton.element.disabled = true;

      gameState.setSession({
        gameCode: session.gameCode,
        myTile: session.tile,
        myName: session.name,
        gameStarted: true,
      });

      resumeModal.close();

      try {
        await gamePage.startGame();
        resumeModal.dialog.remove();
      } catch (error) {
        console.error("Could not resume game.", error);
        clearSession();
        gameState.reset();
        resumeModal.dialog.remove();
        handleReturnHome();
      }
    },
  });
  const discardButton = new Button({
    label: "DISCARD",
    className: "button-utility",
    onClick: () => {
      clearSession();
      resumeModal.close();
      resumeModal.dialog.remove();
      screenManager.showHomeScreen();
    },
  });

  resumeContent.append(resumeMessage);
  resumeButton.render(resumeContent);
  discardButton.render(resumeContent);
  resumeModal.render(document.body);
  resumeModal.open();
}

async function startApplication() {
  const session = getSession();

  if (!isValidPlayerSession(session)) {
    clearSession();
    screenManager.showHomeScreen();
    return;
  }

  try {
    const gameIsActive = await checkGameStillActive(session.gameCode);

    if (!gameIsActive) {
      clearSession();
      screenManager.showHomeScreen();
      return;
    }

    showResumePrompt(session);
  } catch {
    clearSession();
    screenManager.showHomeScreen();
  }
}

startApplication();
