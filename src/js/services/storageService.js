function getSessionStorageKey() {
  return "tictactoe-session";
}

function getSplashSeenStorageKey() {
  return "tictactoe-splash-seen-v1";
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

// ========================================
// SPLASH SCREEN SESSION
// ========================================

export function hasSeenSplash() {
  return sessionStorage.getItem(getSplashSeenStorageKey()) === "true";
}

export function markSplashSeen() {
  sessionStorage.setItem(getSplashSeenStorageKey(), "true");
}
