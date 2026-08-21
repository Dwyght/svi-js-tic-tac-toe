let activeLockName = null;
let releaseActiveLock = null;
let pendingClaim = null;

function getPlayerLockName({ gameCode, tile }) {
  return `tictactoe-player-${gameCode}-${tile}`;
}

export async function claimPlayerTab(session) {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.locks?.request !== "function"
  ) {
    return true;
  }

  const lockName = getPlayerLockName(session);

  if (activeLockName === lockName && releaseActiveLock !== null) {
    return true;
  }

  if (pendingClaim !== null) {
    return pendingClaim;
  }

  pendingClaim = new Promise((resolveClaim) => {
    navigator.locks
      .request(lockName, { ifAvailable: true }, async (lock) => {
        if (lock === null) {
          resolveClaim(false);
          return;
        }

        activeLockName = lockName;

        await new Promise((releaseLock) => {
          releaseActiveLock = releaseLock;
          resolveClaim(true);
        });

        activeLockName = null;
        releaseActiveLock = null;
      })
      .catch((error) => {
        console.error("Could not claim the player tab lock.", error);
        resolveClaim(false);
      });
  });

  const claimed = await pendingClaim;
  pendingClaim = null;

  return claimed;
}

export function releasePlayerTab() {
  if (releaseActiveLock === null) {
    return;
  }

  const releaseLock = releaseActiveLock;

  activeLockName = null;
  releaseActiveLock = null;
  releaseLock();
}
