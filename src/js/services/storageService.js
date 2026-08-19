function getStorageKey(gameCode) {
  return `tictactoe-${gameCode}`;
}

function getScoreStorageKey(gameCode) {
  return `tictactoe-scores-${gameCode}`;
}

function getSessionStorageKey() {
  return "tictactoe-session";
}

function getDefaultScores() {
  return {
    X: 0,
    O: 0,
    draws: 0,
  };
}

// ========================================
// SAVE PLAYER NAME
// ========================================

export function savePlayerName(gameCode, tile, name) {
  const storageKey = getStorageKey(gameCode);

  let players = {};

  const saved = localStorage.getItem(storageKey);

  if (saved !== null) {
    try {
      players = JSON.parse(saved);
    } catch {
      players = {};
    }
  }

  players[tile] = name;

  localStorage.setItem(storageKey, JSON.stringify(players));
}

// ========================================
// GET PLAYER NAMES
// ========================================

export function getPlayerNames(gameCode) {
  const storageKey = getStorageKey(gameCode);

  const saved = localStorage.getItem(storageKey);

  if (saved === null) {
    return {
      X: "Player X",
      O: "Player O",
    };
  }

  try {
    const players = JSON.parse(saved);

    return {
      X: players.X || "Player X",

      O: players.O || "Player O",
    };
  } catch {
    return {
      X: "Player X",
      O: "Player O",
    };
  }
}

// ========================================
// DELETE PLAYER NAMES
// ========================================

export function clearPlayerNames(gameCode) {
  localStorage.removeItem(getStorageKey(gameCode));
}

// ========================================
// SAVE SCORE
// ========================================

export function saveScore(gameCode, scores) {
  const storageKey = getScoreStorageKey(gameCode);

  localStorage.setItem(storageKey, JSON.stringify(scores));
}

// ========================================
// GET SCORES
// ========================================

export function getScores(gameCode) {
  const storageKey = getScoreStorageKey(gameCode);

  const saved = localStorage.getItem(storageKey);

  if (saved === null) {
    return getDefaultScores();
  }

  try {
    const scores = JSON.parse(saved);

    return {
      X: Number.isFinite(scores.X) ? scores.X : 0,
      O: Number.isFinite(scores.O) ? scores.O : 0,
      draws: Number.isFinite(scores.draws) ? scores.draws : 0,
    };
  } catch {
    return getDefaultScores();
  }
}

// ========================================
// DELETE SCORES
// ========================================

export function clearScores(gameCode) {
  localStorage.removeItem(getScoreStorageKey(gameCode));
}

// ========================================
// SAVE SESSION
// ========================================

export function saveSession(gameCode, tile, name) {
  const storageKey = getSessionStorageKey();

  const session = {
    gameCode: gameCode,
    tile: tile,
    name: name,
  };

  sessionStorage.setItem(storageKey, JSON.stringify(session));
}

// ========================================
// GET SESSION
// ========================================

export function getSession() {
  const storageKey = getSessionStorageKey();

  const saved = sessionStorage.getItem(storageKey);

  if (saved === null) {
    return null;
  }

  try {
    const session = JSON.parse(saved);

    return {
      gameCode: session.gameCode,
      tile: session.tile,
      name: session.name,
    };
  } catch {
    return null;
  }
}

// ========================================
// DELETE SESSION
// ========================================

export function clearSession() {
  sessionStorage.removeItem(getSessionStorageKey());
}
