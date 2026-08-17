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
  // SET SESSION
  // =========================

  setSession({ gameCode, myTile, myName, gameStarted = false }) {
    this._gameCode = gameCode;
    this._myTile = myTile;
    this._myName = myName;
    this._gameStarted = gameStarted;
    this._gameOver = false;
  }

  // =========================
  // RESET
  // =========================

  reset() {
    this._gameCode = null;
    this._myTile = null;
    this._myName = null;

    this._gameStarted = false;
    this._gameOver = false;
  }
}

export const gameState = new GameState();
