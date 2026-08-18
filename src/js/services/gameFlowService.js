import {
  createGame as createGameApi,
  checkGame,
  resetGame,
} from "../api/tictactoeApi.js";

import { generateGameCode } from "../game/gameCode.js";

import { gameState } from "../state/gameState.js";

import { savePlayerName } from "./storageService.js";

// ========================================
// CREATE GAME
// ========================================

export async function createGame(playerName) {
  const gameCode = generateGameCode();

  try {
    const result = await createGameApi(gameCode);

    console.log("Create Game:", result);

    // Creator must receive X.
    if (result !== "X") {
      return {
        ok: false,

        message: "Could not create the room. Please try again.",
      };
    }

    gameState.setSession({
      gameCode: gameCode,

      myTile: "X",

      myName: playerName,

      gameStarted: false,
    });

    savePlayerName(gameCode, "X", playerName);

    return {
      ok: true,

      gameCode: gameCode,
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,

      message: "Could not connect to the server.",
    };
  }
}

// ========================================
// WAIT FOR PLAYER O
// ========================================

export async function waitForPlayerO(gameCode) {
  const started = await checkGame(gameCode);

  if (!started) {
    return {
      ok: true,

      started: false,
    };
  }

  gameState.gameStarted = true;

  return {
    ok: true,

    started: true,
  };
}

// ========================================
// JOIN GAME
// ========================================

export async function joinGame(gameCode, playerName) {
  try {
    const result = await createGameApi(gameCode);

    console.log("Join Game:", result);

    // The endpoint also creates rooms.
    //
    // Therefore if joining returns X,
    // the room did not exist.
    if (result === "X") {
      await resetGame(gameCode);

      return {
        ok: false,

        message: "Game code does not exist.",
      };
    }

    if (result !== "O") {
      return {
        ok: false,

        message: result,
      };
    }

    gameState.setSession({
      gameCode: gameCode,

      myTile: "O",

      myName: playerName,

      gameStarted: true,
    });

    savePlayerName(gameCode, "O", playerName);

    return {
      ok: true,

      gameCode: gameCode,
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,

      message: "Could not connect to the server.",
    };
  }
}
