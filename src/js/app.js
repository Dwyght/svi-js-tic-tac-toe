import { ScreenManager } from "./components/ScreenManager.js";
import { SplashScreen } from "./components/SplashScreen.js";
import { MODAL_EVENTS } from "./components/base/Modal.js";
import { ResumeGameModal } from "./components/game/ResumeGameModal.js";
import { HomePage } from "./pages/Home.js";
import { GamePage } from "./pages/Game.js";
import { HistoryPage } from "./pages/History.js";
import { PollingService } from "./services/pollingService.js";
import {
  claimPlayerTab,
  releasePlayerTab,
} from "./services/playerTabLockService.js";
import { checkGameStillActive } from "./services/gameFlowService.js";
import {
  getSession,
  clearSession,
  hasSeenSplash,
  markSplashSeen,
} from "./services/storageService.js";
import { gameState } from "./state/gameState.js";

// ========================================
// CREATE CORE SERVICES
// ========================================

const screenManager = new ScreenManager();
const pollingService = new PollingService();

const historyPage = new HistoryPage({
  screenManager: screenManager,
  onBack: () => screenManager.showGameScreen(),
});

let splashScreen = null;
let applicationStartRequested = false;

// ========================================
// BACKGROUND VIDEO DURING MODALS
// ========================================

const backgroundVideo = document.querySelector(".bg-video");
let backgroundVideoPausedByModal = false;

function playBackgroundVideo() {
  if (!backgroundVideo || document.querySelector("dialog[open]")) {
    return;
  }

  const playRequest = backgroundVideo.play();

  if (playRequest) {
    playRequest.catch((error) => {
      console.error("Could not resume background video.", error);
    });
  }
}

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
    playBackgroundVideo();
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
  onOpenHistory: () => historyPage.open(),
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
  onQuit: () => gamePage.quit.openQuitModal(),
});

// ========================================
// RENDER PAGES
// ========================================

homePage.render(screenManager.getHomeTarget());
gamePage.render(screenManager.getGameTarget());
historyPage.render(screenManager.getHistoryTarget());
resumeGameModal.render(document.body);

// ========================================
// WHEN TWO PLAYERS ARE READY
// ========================================

async function handleGameStarted() {
  if (!gameState.isSpectator) {
    const session = getSession();

    if (
      !isValidPlayerSession(session) ||
      !(await claimPlayerTab(session))
    ) {
      clearSession();
      gameState.reset();
      handleReturnHome();
      return;
    }
  }

  await gamePage.startGame();
}

// ========================================
// RETURN HOME
// ========================================

function handleReturnHome(message = "", title = "Game Update") {
  pollingService.stopRefresh();
  releasePlayerTab();
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

    const ownsPlayerTab = await claimPlayerTab(session);

    if (!ownsPlayerTab) {
      clearSession();
      gameState.reset();
      handleReturnHome();
      return;
    }

    showResumePrompt(session);
  } catch {
    clearSession();
    screenManager.showHomeScreen();
  }
}

async function startApplicationOnce() {
  if (applicationStartRequested) {
    return;
  }

  applicationStartRequested = true;
  await startApplication();
}

async function handleSplashStart() {
  if (splashScreen === null) {
    return;
  }

  markSplashSeen();
  await splashScreen.close();
  await startApplicationOnce();
  playBackgroundVideo();
}

function launchApplication() {
  if (hasSeenSplash()) {
    startApplicationOnce();
    return;
  }

  if (backgroundVideo) {
    backgroundVideo.pause();
  }

  splashScreen = new SplashScreen({
    onStart: () => handleSplashStart(),
  });
  splashScreen.render(document.body);
  splashScreen.open();
}

launchApplication();
