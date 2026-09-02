class GameState {
  constructor() {
    this.reset();
  }

  // =========================
  // SET SESSION
  // =========================

  setSession({
    gameCode,
    gameId = null,
    myTile,
    myName,
    mySushi = null,
    gameStarted = false,
    isSpectator = false,
  }) {
    this.gameCode = gameCode;
    this.gameId = gameId;
    this.myTile = myTile;
    this.myName = myName;
    this.mySushi = mySushi;
    this.gameStarted = gameStarted;
    this.gameOver = false;
    this.isSpectator = isSpectator;
    this.playerNames = {
      X: myTile === "X" ? myName : "Player X",
      O: myTile === "O" ? myName : "Player O",
    };
    this.sushiIds = {
      X: myTile === "X" ? mySushi : null,
      O: myTile === "O" ? mySushi : null,
    };
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
    this.gameId = null;
    this.myTile = null;
    this.myName = null;
    this.mySushi = null;

    this.gameStarted = false;
    this.gameOver = false;
    this.isSpectator = false;
    this.playerNames = {
      X: "Player X",
      O: "Player O",
    };
    this.sushiIds = {
      X: null,
      O: null,
    };
    this.scores = {
      X: 0,
      O: 0,
    };
  }
}

export const gameState = new GameState();
