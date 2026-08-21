class GameState {
  constructor() {
    this.reset();
  }

  // =========================
  // GAME CODE
  // =========================

  get gameCode() {
    return this._gameCode;
  }

  set gameCode(value) {
    this._gameCode = value;
  }

  // =========================
  // MY TILE
  // =========================

  get myTile() {
    return this._myTile;
  }

  set myTile(value) {
    this._myTile = value;
  }

  // =========================
  // MY NAME
  // =========================

  get myName() {
    return this._myName;
  }

  set myName(value) {
    this._myName = value;
  }

  // =========================
  // MY SUSHI
  // =========================

  get mySushi() {
    return this._mySushi;
  }

  set mySushi(value) {
    this._mySushi = value;
  }

  // =========================
  // GAME STARTED
  // =========================

  get gameStarted() {
    return this._gameStarted;
  }

  set gameStarted(value) {
    this._gameStarted = value;
  }

  // =========================
  // GAME OVER
  // =========================

  get gameOver() {
    return this._gameOver;
  }

  set gameOver(value) {
    this._gameOver = value;
  }

  // =========================
  // SPECTATOR
  // =========================

  get isSpectator() {
    return this._isSpectator;
  }

  set isSpectator(value) {
    this._isSpectator = value;
  }

  // =========================
  // SCORES
  // =========================

  get scores() {
    return this._scores;
  }

  set scores(value) {
    this._scores = value;
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
    this._gameCode = gameCode;
    this._myTile = myTile;
    this._myName = myName;
    this._mySushi = mySushi;
    this._gameStarted = gameStarted;
    this._gameOver = false;
    this._isSpectator = isSpectator;
    this._scores = {
      X: 0,
      O: 0,
    };
  }

  // =========================
  // RESET
  // =========================

  reset() {
    this._gameCode = null;
    this._myTile = null;
    this._myName = null;
    this._mySushi = null;

    this._gameStarted = false;
    this._gameOver = false;
    this._isSpectator = false;
    this._scores = {
      X: 0,
      O: 0,
    };
  }
}

export const gameState = new GameState();
