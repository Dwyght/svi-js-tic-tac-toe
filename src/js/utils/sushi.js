import { O_SUSHIS, X_SUSHIS } from "../config/constants.js";

export function getSushiOptions(tile) {
  if (tile === "X") {
    return X_SUSHIS;
  }

  if (tile === "O") {
    return O_SUSHIS;
  }

  return [];
}

export function resolveSushi(tile, sushiId) {
  const options = getSushiOptions(tile);

  return (
    options.find((sushi) => sushi.id === sushiId) ||
    options[0] ||
    null
  );
}
