class GameState {
  constructor() {
    this.reset();
  }

  // =========================
  // SET SESSION
  // =========================

  setSession({
    gameCode,
    myTile,
    myName,
    mySushi = null,
    gameStarted = false,
    isSpectator = false,
  }) {
    this.gameCode = gameCode;
    this.myTile = myTile;
    this.myName = myName;
    this.mySushi = mySushi;
    this.gameStarted = gameStarted;
    this.gameOver = false;
    this.isSpectator = isSpectator;
    this.scores = {
      X: 0,
      O: 0,
    };
  }

  // =========================
  // RESET
  // =========================

  reset() {
    this.gameCode = null;
    this.myTile = null;
    this.myName = null;
    this.mySushi = null;

    this.gameStarted = false;
    this.gameOver = false;
    this.isSpectator = false;
    this.scores = {
      X: 0,
      O: 0,
    };
  }
}

export const gameState = new GameState();
