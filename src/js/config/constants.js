export const BASE_URL = "http://localhost:8080/tictactoe/tictactoeserver";

export const REFRESH_INTERVAL_MS = 500;

export const EMOTES = Object.freeze([
  {
    id: "angry",
    src: "./src/assets/images/emote/emote_angry.png",
    alt: "Angry",
  },
  {
    id: "cry",
    src: "./src/assets/images/emote/emote_cry.png",
    alt: "Crying",
  },
  {
    id: "haha",
    src: "./src/assets/images/emote/emote_haha.png",
    alt: "Laughing",
  },
  {
    id: "happy",
    src: "./src/assets/images/emote/emote_happy.png",
    alt: "Happy",
  },
  {
    id: "hm",
    src: "./src/assets/images/emote/emote_hm.png",
    alt: "Thinking",
  },
  {
    id: "sad",
    src: "./src/assets/images/emote/emote_sad.png",
    alt: "Sad",
  },
]);

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
