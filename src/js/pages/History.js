import { getAllGames, getGame } from "../api/webserviceApi.js";
import { Button } from "../components/base/Button.js";
import { HistoryReplay } from "../components/history/HistoryReplay.js";
import { resolveTarget } from "../utils/dom.js";

const GAME_ID_SEPARATOR = "__";

function compareMoveDates(left, right) {
  const leftTime = Date.parse(left.datesave);
  const rightTime = Date.parse(right.datesave);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return leftTime - rightTime;
  }

  return String(left.datesave).localeCompare(String(right.datesave));
}

function getFirstMoveTime(moves) {
  for (const move of moves) {
    const time = Date.parse(move.datesave);

    if (Number.isFinite(time)) {
      return time;
    }
  }

  return Number.POSITIVE_INFINITY;
}

function compareRounds(left, right) {
  if (left.firstMoveTime !== right.firstMoveTime) {
    return left.firstMoveTime < right.firstMoveTime ? -1 : 1;
  }

  return left.gameId.localeCompare(right.gameId);
}

function parseGameId(gameId) {
  const separatorIndex = gameId.indexOf(GAME_ID_SEPARATOR);

  if (
    separatorIndex <= 0 ||
    separatorIndex === gameId.length - GAME_ID_SEPARATOR.length
  ) {
    return {
      gameCode: gameId,
      gameId,
    };
  }

  return {
    gameCode: gameId.slice(0, separatorIndex),
    gameId,
  };
}

function groupGamesByCode(games) {
  const groups = new Map();

  for (const game of games) {
    const gameId = String(game?.id ?? "").trim();

    if (gameId === "") {
      throw new Error("Webservice returned an invalid game ID.");
    }

    const round = parseGameId(gameId);

    if (!groups.has(round.gameCode)) {
      groups.set(round.gameCode, {
        gameCode: round.gameCode,
        rounds: [],
      });
    }

    groups.get(round.gameCode).rounds.push(round);
  }

  return [...groups.values()];
}

export class HistoryPage {
  constructor({ screenManager, onBack }) {
    this.screenManager = screenManager;
    this.onBack = onBack;
    this.historyRequestId = 0;
    this.roundsRequestId = 0;
    this.roundMovesCache = new Map();

    this.initializeElements();
    this.initializeComponents();
    this.setAttributes();
    this.appendElements();
  }

  initializeElements() {
    this.container = document.createElement("div");
    this.panel = document.createElement("div");
    this.header = document.createElement("header");
    this.title = document.createElement("h1");
    this.message = document.createElement("p");

    this.gamesSection = document.createElement("section");
    this.gamesTitle = document.createElement("h2");
    this.gamesTableWrapper = document.createElement("div");
    this.gamesTable = document.createElement("table");
    this.gamesTableHead = document.createElement("thead");
    this.gamesTableBody = document.createElement("tbody");

    this.roundsSection = document.createElement("section");
    this.roundsTitle = document.createElement("h2");
    this.roundsMessage = document.createElement("p");
    this.roundsTableWrapper = document.createElement("div");
    this.roundsTable = document.createElement("table");
    this.roundsTableHead = document.createElement("thead");
    this.roundsTableBody = document.createElement("tbody");

    this.detailsSection = document.createElement("section");
    this.detailsTitle = document.createElement("h2");
    this.detailsMessage = document.createElement("p");
    this.detailsTableWrapper = document.createElement("div");
    this.detailsTable = document.createElement("table");
    this.detailsTableHead = document.createElement("thead");
    this.detailsTableBody = document.createElement("tbody");
  }

  initializeComponents() {
    this.backButton = new Button({
      label: "Back",
      className: "button-utility",
      onClick: () => this.close(),
    });
    this.replay = new HistoryReplay();
  }

  setAttributes() {
    this.container.classList.add("history-page");
    this.panel.classList.add("history-panel", "card");
    this.header.classList.add("history-header");
    this.title.textContent = "Game History";
    this.configureMessage(this.message);

    this.configureSection(this.gamesSection, this.gamesTableWrapper);
    this.gamesTitle.textContent = "Games Played";
    this.gamesTable.classList.add("history-table", "hidden");

    this.configureSection(this.roundsSection, this.roundsTableWrapper);
    this.roundsSection.classList.add("hidden");
    this.roundsTitle.textContent = "Rounds";
    this.configureMessage(this.roundsMessage);
    this.roundsTable.classList.add("history-table", "hidden");

    this.configureSection(this.detailsSection, this.detailsTableWrapper);
    this.detailsSection.classList.add("hidden");
    this.detailsTitle.textContent = "Round Details";
    this.configureMessage(this.detailsMessage);
    this.detailsTable.classList.add(
      "history-table",
      "history-moves-table",
      "hidden",
    );

    this.gamesTableHead.append(this.createHeaderRow(["Game Code"]));
    this.roundsTableHead.append(this.createHeaderRow(["Round"]));
    this.detailsTableHead.append(
      this.createHeaderRow(["Player", "Symbol", "Location", "Date"]),
    );
  }

  configureMessage(message) {
    message.classList.add("message", "history-message");
    message.setAttribute("aria-live", "polite");
  }

  configureSection(section, tableWrapper) {
    section.classList.add("history-section");
    tableWrapper.classList.add("history-table-wrapper");
  }

  appendElements() {
    this.backButton.render(this.header);
    this.header.append(this.title);

    this.gamesTable.append(this.gamesTableHead, this.gamesTableBody);
    this.gamesTableWrapper.append(this.gamesTable);
    this.gamesSection.append(this.gamesTitle, this.gamesTableWrapper);

    this.roundsTable.append(this.roundsTableHead, this.roundsTableBody);
    this.roundsTableWrapper.append(this.roundsTable);
    this.roundsSection.append(
      this.roundsTitle,
      this.roundsMessage,
      this.roundsTableWrapper,
    );

    this.detailsTable.append(this.detailsTableHead, this.detailsTableBody);
    this.detailsTableWrapper.append(this.detailsTable);
    this.detailsSection.append(this.detailsTitle, this.detailsMessage);
    this.replay.render(this.detailsSection);
    this.detailsSection.append(this.detailsTableWrapper);

    this.panel.append(
      this.header,
      this.message,
      this.gamesSection,
      this.roundsSection,
      this.detailsSection,
    );
    this.container.append(this.panel);
  }

  createHeaderRow(labels) {
    const row = document.createElement("tr");

    for (const label of labels) {
      const header = document.createElement("th");
      header.scope = "col";
      header.textContent = label;
      row.append(header);
    }

    return row;
  }

  createSelectionRow(label, ariaLabel, onSelect) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    const selectButton = document.createElement("button");

    selectButton.type = "button";
    selectButton.classList.add("history-game-select");
    selectButton.textContent = label;
    selectButton.setAttribute("aria-label", ariaLabel);
    selectButton.addEventListener("click", onSelect);

    cell.append(selectButton);
    row.append(cell);

    return row;
  }

  async open() {
    this.reset();
    const requestId = this.historyRequestId;

    this.screenManager.showHistoryScreen();
    this.message.textContent = "Loading history...";

    try {
      const response = await getAllGames();

      if (requestId !== this.historyRequestId) {
        return;
      }

      if (!Array.isArray(response?.list)) {
        throw new Error("Webservice returned invalid game history.");
      }

      this.renderGames(groupGamesByCode(response.list));
    } catch (error) {
      if (requestId !== this.historyRequestId) {
        return;
      }

      console.error("Could not load game history.", error);
      this.message.textContent = this.getHistoryErrorMessage(error);
    }
  }

  renderGames(gameGroups) {
    this.gamesTableBody.replaceChildren();

    if (gameGroups.length === 0) {
      this.gamesTable.classList.add("hidden");
      this.message.textContent = "No games found.";
      return;
    }

    for (const group of gameGroups) {
      const row = this.createSelectionRow(
        group.gameCode,
        `View rounds for game ${group.gameCode}`,
        () => this.loadRounds(group),
      );

      this.gamesTableBody.append(row);
    }

    this.message.textContent = "";
    this.gamesTable.classList.remove("hidden");
  }

  async loadRounds(group) {
    const requestId = ++this.roundsRequestId;

    this.replay.reset();
    this.detailsSection.classList.add("hidden");
    this.roundsSection.classList.remove("hidden");
    this.roundsTitle.textContent = `Game: ${group.gameCode}`;
    this.roundsMessage.textContent = "Loading rounds...";
    this.roundsTableBody.replaceChildren();
    this.roundsTable.classList.add("hidden");

    try {
      const rounds = await Promise.all(
        group.rounds.map((round) => this.loadRound(round.gameId)),
      );

      if (requestId !== this.roundsRequestId) {
        return;
      }

      rounds.sort(compareRounds);
      this.renderRounds(group.gameCode, rounds);
    } catch (error) {
      if (requestId !== this.roundsRequestId) {
        return;
      }

      console.error("Could not load game rounds.", error);
      this.roundsMessage.textContent = this.getRoundsErrorMessage(error);
    }
  }

  async loadRound(gameId) {
    if (!this.roundMovesCache.has(gameId)) {
      const request = getGame(gameId)
        .then((response) => {
          if (!Array.isArray(response?.list)) {
            throw new Error("Webservice returned invalid game details.");
          }

          const moves = [...response.list].sort(compareMoveDates);

          return {
            gameId,
            firstMoveTime: getFirstMoveTime(moves),
            moves,
          };
        });

      this.roundMovesCache.set(gameId, request);
    }

    const request = this.roundMovesCache.get(gameId);

    try {
      return await request;
    } catch (error) {
      if (this.roundMovesCache.get(gameId) === request) {
        this.roundMovesCache.delete(gameId);
      }

      throw error;
    }
  }

  renderRounds(gameCode, rounds) {
    this.roundsTableBody.replaceChildren();

    for (const [index, round] of rounds.entries()) {
      const roundNumber = index + 1;
      const row = this.createSelectionRow(
        `Round ${roundNumber}`,
        `View Round ${roundNumber} for game ${gameCode}`,
        () => this.selectRound(gameCode, roundNumber, round.moves),
      );

      this.roundsTableBody.append(row);
    }

    this.roundsMessage.textContent = "";
    this.roundsTable.classList.remove("hidden");
  }

  selectRound(gameCode, roundNumber, moves) {
    this.detailsSection.classList.remove("hidden");
    this.detailsTitle.textContent =
      `Game ${gameCode} - Round ${roundNumber}`;
    this.renderMoves(moves);
    this.replay.setMoves(moves);
  }

  renderMoves(moves) {
    this.detailsTableBody.replaceChildren();

    if (moves.length === 0) {
      this.detailsMessage.textContent = "No moves found.";
      this.detailsTable.classList.add("hidden");
      return;
    }

    for (const move of moves) {
      const row = document.createElement("tr");

      for (const value of [
        move.playerid,
        move.symbol,
        move.location,
        move.datesave,
      ]) {
        const cell = document.createElement("td");
        cell.textContent = String(value ?? "");
        row.append(cell);
      }

      this.detailsTableBody.append(row);
    }

    this.detailsMessage.textContent = "";
    this.detailsTable.classList.remove("hidden");
  }

  getHistoryErrorMessage(error) {
    return error?.status === 402
      ? "Record not found"
      : "Could not load game history.";
  }

  getRoundsErrorMessage(error) {
    return error?.status === 402
      ? "Record not found"
      : "Could not load game rounds.";
  }

  close() {
    this.reset();
    this.onBack();
  }

  reset() {
    this.historyRequestId++;
    this.roundsRequestId++;
    this.roundMovesCache.clear();
    this.replay.reset();

    this.message.textContent = "";
    this.gamesTableBody.replaceChildren();
    this.gamesTable.classList.add("hidden");

    this.roundsSection.classList.add("hidden");
    this.roundsTitle.textContent = "Rounds";
    this.roundsMessage.textContent = "";
    this.roundsTableBody.replaceChildren();
    this.roundsTable.classList.add("hidden");

    this.detailsSection.classList.add("hidden");
    this.detailsTitle.textContent = "Round Details";
    this.detailsMessage.textContent = "";
    this.detailsTableBody.replaceChildren();
    this.detailsTable.classList.add("hidden");
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.container);
    } else {
      console.error("HistoryPage target not found.");
    }
  }
}
