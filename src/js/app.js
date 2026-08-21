import { ScreenManager } from "./components/ScreenManager.js";

import { MODAL_EVENTS } from "./components/base/Modal.js";

import { ResumeGameModal } from "./components/game/ResumeGameModal.js";

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
// BACKGROUND VIDEO DURING MODALS
// ========================================

const backgroundVideo = document.querySelector(".bg-video");

let backgroundVideoPausedByModal = false;

document.addEventListener(MODAL_EVENTS.opened, () => {
  if (!backgroundVideo) {
    return;
  }

  backgroundVideoPausedByModal = true;
  backgroundVideo.pause();
});

document.addEventListener(MODAL_EVENTS.closed, () => {
  queueMicrotask(() => {
    if (
      !backgroundVideo ||
      !backgroundVideoPausedByModal ||
      document.querySelector("dialog[open]")
    ) {
      return;
    }

    backgroundVideoPausedByModal = false;

    const playRequest = backgroundVideo.play();

    if (playRequest) {
      playRequest.catch((error) => {
        console.error("Could not resume background video.", error);
      });
    }
  });
});

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

const resumeGameModal = new ResumeGameModal({
  onResume: () => resumeSavedGame(),
  onQuit: () => gamePage.openQuitModal(),
});

// ========================================
// RENDER PAGES
// ========================================

homePage.render(screenManager.getHomeTarget());

gamePage.render(screenManager.getGameTarget());

resumeGameModal.render(document.body);

// ========================================
// WHEN TWO PLAYERS ARE READY
// ========================================

async function handleGameStarted() {
  await gamePage.startGame();
}

// ========================================
// RETURN HOME
// ========================================

function handleReturnHome(message = "", title = "Game Update") {
  pollingService.stopRefresh();

  resumeGameModal.close();

  screenManager.returnToHome();

  homePage.resetForm();

  if (message !== "") {
    homePage.showNotice(message, title);
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
  gameState.setSession({
    gameCode: session.gameCode,
    myTile: session.tile,
    myName: session.name,
    gameStarted: true,
  });

  resumeGameModal.setSession(session);
  resumeGameModal.open();
}

async function resumeSavedGame() {
  resumeGameModal.setResumePending(true);

  try {
    await gamePage.startGame();
    resumeGameModal.close();
  } catch (error) {
    console.error("Could not resume game.", error);
    clearSession();
    gameState.reset();
    handleReturnHome();
  }
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
