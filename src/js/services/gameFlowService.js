import {
  createGame as createGameApi,
  checkGame,
  getBoard,
  move,
  resetGame,
} from "../api/tictactoeApi.js";
import {
  createRoundGameId,
  getCurrentRoundGameId,
  saveMove,
} from "../api/webserviceApi.js";
import {
  parseBoard,
  getCurrentTurn,
  checkGameResult,
} from "../game/boardLogic.js";
import { generateGameCode } from "../game/gameCode.js";
import { gameState } from "../state/gameState.js";
import {
  savePlayerName,
  savePlayerSushi,
  saveSession,
  clearPlayerNames,
  clearScores,
  clearSession,
} from "./storageService.js";

const JOIN_GAME_ERROR_MESSAGES = Object.freeze({
  "[GAME ALREADY STARTED]":
    "This game has already started. You can spectate it instead.",
});

function getJoinGameErrorMessage(serverResponse) {
  return (
    JOIN_GAME_ERROR_MESSAGES[serverResponse] ??
    "Could not join the game. Please check the code and try again."
  );
}

// ========================================
// HOME FLOW
// ========================================

// ========================================
// CREATE GAME
// ========================================

export async function createGame(playerName, sushiId) {
  const gameCode = generateGameCode();
  const restoreSushi = savePlayerSushi(gameCode, "X", sushiId);

  try {
    const result = await createGameApi(gameCode);
    console.log("Create Game:", result);

    // Creator must receive X.
    if (result !== "X") {
      restoreSushi();

      return {
        ok: false,
        message: "Could not create the room. Please try again.",
      };
    }

    let gameId = null;

    try {
      gameId = await createRoundGameId(gameCode);
    } catch (error) {
      console.error("Could not create the round game ID.", error);
    }

    gameState.setSession({
      gameCode: gameCode,
      gameId: gameId,
      myTile: "X",
      myName: playerName,
      mySushi: sushiId,
      gameStarted: false,
    });
    savePlayerName(gameCode, "X", playerName);
    saveSession(gameCode, "X", playerName);

    return {
      ok: true,
      gameCode: gameCode,
    };
  } catch (error) {
    restoreSushi();
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

export async function joinGame(gameCode, playerName, sushiId) {
  const restoreSushi = savePlayerSushi(gameCode, "O", sushiId);

  try {
    const result = await createGameApi(gameCode);
    console.log("Join Game:", result);

    // The endpoint also creates rooms.
    // Therefore if joining returns X, the room did not exist.
    if (result === "X") {
      restoreSushi();
      await resetGame(gameCode);

      return {
        ok: false,
        message: "Game code does not exist.",
      };
    }

    if (result !== "O") {
      restoreSushi();

      return {
        ok: false,
        message: getJoinGameErrorMessage(result),
      };
    }

    let gameId = null;

    try {
      gameId = await getCurrentRoundGameId(gameCode);
    } catch (error) {
      console.error("Could not load the current round game ID.", error);
    }

    gameState.setSession({
      gameCode: gameCode,
      gameId: gameId,
      myTile: "O",
      myName: playerName,
      mySushi: sushiId,
      gameStarted: true,
    });
    savePlayerName(gameCode, "O", playerName);
    saveSession(gameCode, "O", playerName);

    return {
      ok: true,
      gameCode: gameCode,
    };
  } catch (error) {
    restoreSushi();
    console.error(error);

    return {
      ok: false,
      message: "Could not connect to the server.",
    };
  }
}

// ========================================
// SPECTATE GAME
// ========================================

export async function spectateGame(gameCode) {
  try {
    const started = await checkGame(gameCode);

    if (!started) {
      return {
        ok: false,
        message: "That game doesn't exist or hasn't started yet.",
      };
    }

    gameState.setSession({
      gameCode: gameCode,
      myTile: null,
      myName: null,
      gameStarted: true,
      isSpectator: true,
    });

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
// GAME FLOW
// ========================================

// ========================================
// FETCH AND PARSE BOARD
// ========================================

export async function fetchAndParseBoard(gameCode) {
  const boardData = await getBoard(gameCode);

  if (boardData === "[GAME NOT YET STARTED]") {
    return {
      status: "waiting",
    };
  }

  return {
    status: "ok",
    cells: parseBoard(boardData),
  };
}

// ========================================
// EVALUATE BOARD
// ========================================

export function evaluateBoard(cells) {
  const result = checkGameResult(cells);

  if (result.status !== "playing") {
    return {
      status: "finished",
      result: result,
    };
  }

  return {
    status: "playing",
    turn: getCurrentTurn(cells),
  };
}

// ========================================
// SUBMIT MOVE
// ========================================

export async function submitMove(gameCode, tile, x, y) {
  // Always get latest board before submitting a move.
  const board = await fetchAndParseBoard(gameCode);

  if (board.status === "waiting") {
    return {
      ok: false,
      reason: "waiting",
    };
  }

  // -------------------------
  // CHECK GAME ALREADY ENDED
  // -------------------------

  const result = checkGameResult(board.cells);

  if (result.status !== "playing") {
    return {
      ok: false,
      reason: "game_over",
      result: result,
    };
  }

  // -------------------------
  // WHOSE TURN?
  // -------------------------

  const currentTurn = getCurrentTurn(board.cells);

  // X/O must alternate. Also prevents O from submitting an X turn.
  if (currentTurn !== tile) {
    return {
      ok: false,
      reason: "not_your_turn",
      currentTurn: currentTurn,
    };
  }

  // -------------------------
  // CHECK CELL
  // -------------------------

  const index = y * 3 + x;

  if (board.cells[index] === "X" || board.cells[index] === "O") {
    return {
      ok: false,
      reason: "cell_taken",
      refreshBoard: false,
    };
  }

  // -------------------------
  // SEND MOVE
  // -------------------------

  const moveResult = await move(
    gameCode,
    // Player cannot choose this. The server assigned it.
    tile,
    y,
    x,
  );

  if (moveResult === "[TAKEN]") {
    return {
      ok: false,
      reason: "cell_taken",
      refreshBoard: true,
    };
  }

  let persistenceError = null;

  if (!gameState.isSpectator) {
    try {
      await saveMove({
        gameid: gameState.gameId,
        playerid: gameState.myName,
        symbol: gameState.myTile,
        location: String(y * 3 + x),
        datesave: new Date().toISOString(),
      });
    } catch (error) {
      persistenceError = error;
      console.error("The accepted move could not be saved.", error);
    }
  }

  return {
    ok: true,
    persistenceError: persistenceError,
  };
}

// ========================================
// CHECK GAME STILL ACTIVE
// ========================================

export async function checkGameStillActive(gameCode) {
  return checkGame(gameCode);
}

// ========================================
// SYNC CURRENT ROUND ID
// ========================================

export async function syncCurrentRoundGameId(gameCode) {
  const gameId = await getCurrentRoundGameId(gameCode);

  if (gameState.gameCode === gameCode) {
    gameState.gameId = gameId;
  }

  return gameId;
}

// ========================================
// RESTART GAME SESSION
// ========================================

export async function restartGameSession(gameCode) {
  if (gameState.myTile !== "X") {
    throw new Error("Only Player X can start a new match.");
  }

  await resetGame(gameCode);

  // Recreate both server-side player slots under the same game code.
  // The clients keep their existing names and X/O assignments locally.
  const playerX = await createGameApi(gameCode);

  if (playerX !== "X") {
    throw new Error("Could not recreate the Player X slot.");
  }

  const playerO = await createGameApi(gameCode);

  if (playerO !== "O") {
    throw new Error("Could not recreate the Player O slot.");
  }

  let roundIdError = null;

  try {
    gameState.gameId = await createRoundGameId(gameCode);
  } catch (error) {
    gameState.gameId = null;
    roundIdError = error;
    console.error("Could not create the next round game ID.", error);
  }

  gameState.gameStarted = true;
  gameState.gameOver = false;

  return {
    roundIdError: roundIdError,
  };
}

// ========================================
// RESET GAME SESSION
// ========================================

export async function resetGameSession(gameCode) {
  await resetGame(gameCode);
  clearPlayerNames(gameCode);
  clearScores(gameCode);
  clearSession();
  gameState.reset();
}
