export const BASE_URL = "http://localhost:8080/tictactoe/tictactoeserver";

export const REFRESH_INTERVAL_MS = 500;

export const PLAYER_NAME_MAX_LENGTH = 10;

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

export const X_SUSHIS = Object.freeze([
  {
    id: "x-sushi-1",
    src: "./src/assets/images/x-sushis/x_sushi_1.png",
    alt: "Crossed salmon sushi",
  },
  {
    id: "x-sushi-2",
    src: "./src/assets/images/x-sushis/x_sushi_2.png",
    alt: "Crossed tuna sushi",
  },
  {
    id: "x-sushi-3",
    src: "./src/assets/images/x-sushis/x_sushi_3.png",
    alt: "Crossed egg sushi",
  },
  {
    id: "x-sushi-4",
    src: "./src/assets/images/x-sushis/x_sushi_4.png",
    alt: "Crossed shrimp sushi",
  },
  {
    id: "x-sushi-5",
    src: "./src/assets/images/x-sushis/x_sushi_5.png",
    alt: "Crossed salmon roe sushi",
  },
]);

export const O_SUSHIS = Object.freeze([
  {
    id: "o-sushi-1",
    src: "./src/assets/images/o-sushis/o_sushi_1.png",
    alt: "Avocado and crab sushi roll",
  },
  {
    id: "o-sushi-2",
    src: "./src/assets/images/o-sushis/o_sushi_2.png",
    alt: "Salmon and avocado sushi roll",
  },
  {
    id: "o-sushi-3",
    src: "./src/assets/images/o-sushis/o_sushi_3.png",
    alt: "Avocado and egg sushi roll",
  },
  {
    id: "o-sushi-4",
    src: "./src/assets/images/o-sushis/o_sushi_4.png",
    alt: "Salmon sushi roll",
  },
  {
    id: "o-sushi-5",
    src: "./src/assets/images/o-sushis/o_sushi_5.png",
    alt: "Tuna sushi roll",
  },
]);

export const DEFAULT_SUSHI = Object.freeze({
  X: X_SUSHIS[0].id,
  O: O_SUSHIS[0].id,
});

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
