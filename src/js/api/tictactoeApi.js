import { BASE_URL } from "../config/constants.js";

// ========================================
// GENERIC GET REQUEST
// ========================================

async function requestText(endpoint, parameters = {}, options = {}) {
  const query = new URLSearchParams(parameters);

  const url = `${BASE_URL}/${endpoint}?${query}`;

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return (await response.text()).trim();
}

// ========================================
// CREATE / JOIN GAME
// ========================================

export async function createGame(key) {
  return requestText("createGame", {
    key: key,
  });
}

// ========================================
// CHECK GAME STATUS
// ========================================

export async function checkGame(key) {
  const result = await requestText("check", {
    key: key,
  });

  return result === "true";
}

// ========================================
// GET BOARD
// ========================================

export async function getBoard(key) {
  return requestText("board", {
    key: key,
  });
}

// ========================================
// MAKE MOVE
// ========================================

export async function move(key, tile, y, x) {
  return requestText("move", {
    key: key,
    tile: tile,
    y: y,
    x: x,
  });
}

// ========================================
// RESET GAME
// ========================================

export async function resetGame(key, options = {}) {
  return requestText(
    "reset",
    {
      key: key,
    },
    options,
  );
}
