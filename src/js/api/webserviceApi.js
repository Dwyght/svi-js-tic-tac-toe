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
    throw new Error(
      body?.msg || `Webservice request failed (${response.status}).`,
    );
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
