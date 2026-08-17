import { WINNING_LINES } from "../config/constants.js";

// ========================================
// CONVERT API BOARD TO ARRAY
// ========================================

export function parseBoard(boardData) {
  return boardData
    .split(":")
    .slice(0, 9)
    .map(function (cell) {
      return cell.trim();
    });
}

// ========================================
// CURRENT TURN
// ========================================

export function getCurrentTurn(cells) {
  let xCount = 0;
  let oCount = 0;

  for (const cell of cells) {
    if (cell === "X") {
      xCount++;
    }

    if (cell === "O") {
      oCount++;
    }
  }

  // X always starts.
  //
  // X = 0, O = 0
  // therefore X
  //
  // X = 1, O = 1
  // therefore X

  if (xCount === oCount) {
    return "X";
  }

  // X has one extra move:
  //
  // X = 1, O = 0
  // therefore O

  return "O";
}

// ========================================
// FIND WINNER
// ========================================

export function findWinner(cells) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;

    if (cells[a] !== "" && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a];
    }
  }

  return null;
}

// ========================================
// DRAW
// ========================================

export function isDraw(cells) {
  return cells.every(function (cell) {
    return cell === "X" || cell === "O";
  });
}

// ========================================
// CHECK COMPLETE GAME RESULT
// ========================================

export function checkGameResult(cells) {
  const winner = findWinner(cells);

  if (winner !== null) {
    return {
      status: "win",
      winner: winner,
    };
  }

  if (isDraw(cells)) {
    return {
      status: "draw",
      winner: null,
    };
  }

  return {
    status: "playing",
    winner: null,
  };
}
