import { WEBSERVICE_BASE_URL } from "../config/constants.js";

// ========================================
// GENERIC JSON REQUEST
// ========================================

async function requestJson(endpoint, options = {}) {
  const response = await fetch(`${WEBSERVICE_BASE_URL}/${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  let body = null;

  try {
    body = await response.json();
  } catch {
    // A clear fallback is provided below for empty/non-JSON responses.
  }

  if (!response.ok) {
    const error = new Error(
      body?.msg || `Webservice request failed (${response.status}).`,
    );

    error.status = response.status;
    throw error;
  }

  return body;
}

// ========================================
// READ GAME ID
// ========================================

function readGameId(responseBody) {
  const gameId = responseBody?.gameid;

  if (typeof gameId !== "string" || gameId.trim() === "") {
    throw new Error("Webservice returned an invalid game ID.");
  }

  return gameId;
}

// ========================================
// SAVE MOVE
// ========================================

export async function saveMove(moveRecord) {
  return requestJson("game/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(moveRecord),
  });
}

// ========================================
// GET ALL GAMES
// ========================================

export async function getAllGames() {
  return requestJson("game");
}

// ========================================
// GET ROOMS
// ========================================

export async function getRooms() {
  return requestJson("rooms");
}

// ========================================
// GET PLAYER GAMES
// ========================================

export async function getPlayerGames(playerId) {
  return requestJson(
    `player/${encodeURIComponent(playerId)}/games`,
  );
}

// ========================================
// GET GAME
// ========================================

export async function getGame(gameId) {
  return requestJson(`game/${encodeURIComponent(gameId)}`);
}

// ========================================
// GET ROOM GAMES
// ========================================

export async function getRoomGames(roomId) {
  return requestJson(
    `room/${encodeURIComponent(roomId)}/games`,
  );
}

// ========================================
// GET GAME SESSION
// ========================================

export async function getGameSession(gameCode) {
  return requestJson(`session/${encodeURIComponent(gameCode)}`);
}

// ========================================
// REGISTER SESSION PLAYER
// ========================================

export async function registerSessionPlayer(gameCode, player) {
  return requestJson(`session/${encodeURIComponent(gameCode)}/player`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(player),
  });
}

// ========================================
// UPDATE SESSION SCORE
// ========================================

export async function updateSessionScore(gameCode, scores) {
  return requestJson(`session/${encodeURIComponent(gameCode)}/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(scores),
  });
}

// ========================================
// SEND SESSION EMOTE
// ========================================

export async function sendSessionEmote(gameCode, emote) {
  return requestJson(`session/${encodeURIComponent(gameCode)}/emote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emote),
  });
}

// ========================================
// CREATE ROUND GAME ID
// ========================================

export async function createRoundGameId(gameCode) {
  const response = await requestJson(
    `session/${encodeURIComponent(gameCode)}/game`,
    { method: "POST" },
  );

  return readGameId(response);
}

// ========================================
// GET CURRENT ROUND GAME ID
// ========================================

export async function getCurrentRoundGameId(gameCode) {
  const response = await requestJson(
    `session/${encodeURIComponent(gameCode)}/game`,
  );

  return readGameId(response);
}
