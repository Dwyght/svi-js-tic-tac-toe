function getStorageKey(gameCode) {
  return `tictactoe-${gameCode}`;
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
