import { ScreenManager } from "./components/ScreenManager.js";

import { HomePage } from "./pages/HomePage.js";

import { GamePage } from "./pages/GamePage.js";

import { PollingService } from "./services/pollingService.js";

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
    homePage.setMessage(message);
  }
}

// ========================================
// START APPLICATION
// ========================================

screenManager.showHomeScreen();
