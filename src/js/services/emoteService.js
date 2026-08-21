export function getEmoteStorageKey(gameCode) {
  return `tictactoe-emote-${gameCode}`;
}

function parseEmoteEntry(savedEntry) {
  if (savedEntry === null) {
    return null;
  }

  try {
    const entry = JSON.parse(savedEntry);

    if (
      entry === null ||
      (entry.tile !== "X" && entry.tile !== "O") ||
      typeof entry.emoteId !== "string" ||
      !Number.isFinite(entry.timestamp)
    ) {
      return null;
    }

    return {
      tile: entry.tile,
      emoteId: entry.emoteId,
      timestamp: entry.timestamp,
    };
  } catch {
    return null;
  }
}

export function saveEmote(gameCode, tile, emoteId) {
  const storageKey = getEmoteStorageKey(gameCode);
  const emoteEntry = {
    tile,
    emoteId,
    timestamp: Date.now(),
  };

  localStorage.setItem(storageKey, JSON.stringify(emoteEntry));
}

export function subscribeToEmotes(gameCode, callback) {
  const storageKey = getEmoteStorageKey(gameCode);

  const handleStorage = (event) => {
    if (event.key !== storageKey) {
      return;
    }

    const emoteEntry = parseEmoteEntry(event.newValue);

    if (emoteEntry !== null) {
      callback(emoteEntry);
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}
