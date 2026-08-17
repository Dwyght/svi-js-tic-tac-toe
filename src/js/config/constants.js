export const BASE_URL = "http://localhost:8080/tictactoe/tictactoeserver";

export const REFRESH_INTERVAL_MS = 1000;

export const WINNING_LINES = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];
