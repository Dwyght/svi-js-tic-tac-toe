import { WEBSERVICE_BASE_URL } from "../config/constants.js";

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

function readGameId(responseBody) {
  const gameId = responseBody?.gameid;

  if (typeof gameId !== "string" || gameId.trim() === "") {
    throw new Error("Webservice returned an invalid game ID.");
  }

  return gameId;
}

export async function saveMove(moveRecord) {
  return requestJson("save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(moveRecord),
  });
}

export async function getPlayerGames(playerId) {
  return requestJson(
    `list-games/${encodeURIComponent(playerId)}`,
  );
}

export async function getGame(gameId) {
  return requestJson(`game/${encodeURIComponent(gameId)}`);
}

export async function createRoundGameId(gameCode) {
  const response = await requestJson(
    `session/${encodeURIComponent(gameCode)}/game`,
    { method: "POST" },
  );

  return readGameId(response);
}

export async function getCurrentRoundGameId(gameCode) {
  const response = await requestJson(
    `session/${encodeURIComponent(gameCode)}/game`,
  );

  return readGameId(response);
}
