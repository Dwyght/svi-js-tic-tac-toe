import { getAllGames, getGame } from "../api/webserviceApi.js";
import { Button } from "../components/base/Button.js";
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

function parseGameId(gameId) {
  const separatorIndex = gameId.indexOf(GAME_ID_SEPARATOR);

  if (
    separatorIndex <= 0 ||
    separatorIndex === gameId.length - GAME_ID_SEPARATOR.length
  ) {
    return {
      gameCode: gameId,
      roundId: gameId,
      gameId,
    };
  }

  return {
    gameCode: gameId.slice(0, separatorIndex),
    roundId: gameId.slice(separatorIndex + GAME_ID_SEPARATOR.length),
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
    this.detailsRequestId = 0;

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
      onClick: () => this.onBack(),
    });
  }

  setAttributes() {
    this.container.classList.add("history-page");
    this.panel.classList.add("history-panel", "card");
    this.header.classList.add("history-header");
    this.title.textContent = "Game History";
    this.message.classList.add("message", "history-message");
    this.message.setAttribute("aria-live", "polite");

    this.configureSection(this.gamesSection, this.gamesTableWrapper);
    this.gamesTitle.textContent = "Games Played";
    this.gamesTable.classList.add("history-table", "hidden");

    this.configureSection(this.roundsSection, this.roundsTableWrapper);
    this.roundsSection.classList.add("hidden");
    this.roundsTitle.textContent = "Rounds";
    this.roundsTable.classList.add("history-table");

    this.configureSection(this.detailsSection, this.detailsTableWrapper);
    this.detailsSection.classList.add("hidden");
    this.detailsTitle.textContent = "Round Details";
    this.detailsMessage.classList.add("message", "history-message");
    this.detailsMessage.setAttribute("aria-live", "polite");
    this.detailsTable.classList.add(
      "history-table",
      "history-moves-table",
      "hidden",
    );

    this.gamesTableHead.append(this.createHeaderRow(["Game Code"]));
    this.roundsTableHead.append(this.createHeaderRow(["Round UUID"]));
    this.detailsTableHead.append(
      this.createHeaderRow(["Player", "Symbol", "Location", "Date"]),
    );
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
    this.roundsSection.append(this.roundsTitle, this.roundsTableWrapper);

    this.detailsTable.append(this.detailsTableHead, this.detailsTableBody);
    this.detailsTableWrapper.append(this.detailsTable);
    this.detailsSection.append(
      this.detailsTitle,
      this.detailsMessage,
      this.detailsTableWrapper,
    );

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
    this.screenManager.showHistoryScreen();
    this.message.textContent = "Loading history...";

    try {
      const response = await getAllGames();

      if (!Array.isArray(response?.list)) {
        throw new Error("Webservice returned invalid game history.");
      }

      this.renderGames(groupGamesByCode(response.list));
    } catch (error) {
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
        () => this.renderRounds(group),
      );

      this.gamesTableBody.append(row);
    }

    this.message.textContent = "";
    this.gamesTable.classList.remove("hidden");
  }

  renderRounds(group) {
    this.detailsRequestId++;
    this.roundsTableBody.replaceChildren();

    for (const round of group.rounds) {
      const row = this.createSelectionRow(
        round.roundId,
        `View round ${round.roundId} for game ${group.gameCode}`,
        () => this.loadGame(round.gameId, round.roundId),
      );

      this.roundsTableBody.append(row);
    }

    this.roundsTitle.textContent = `Game: ${group.gameCode}`;
    this.roundsSection.classList.remove("hidden");
    this.detailsSection.classList.add("hidden");
    this.detailsMessage.textContent = "";
    this.detailsTableBody.replaceChildren();
    this.detailsTable.classList.add("hidden");
  }

  async loadGame(gameId, roundId) {
    const requestId = ++this.detailsRequestId;

    this.detailsSection.classList.remove("hidden");
    this.detailsTitle.textContent = `Round: ${roundId}`;
    this.detailsMessage.textContent = "Loading round details...";
    this.detailsTable.classList.add("hidden");
    this.detailsTableBody.replaceChildren();

    try {
      const response = await getGame(gameId);

      if (requestId !== this.detailsRequestId) {
        return;
      }

      if (!Array.isArray(response?.list)) {
        throw new Error("Webservice returned invalid game details.");
      }

      const moves = [...response.list].sort(compareMoveDates);
      this.renderMoves(moves);
    } catch (error) {
      if (requestId !== this.detailsRequestId) {
        return;
      }

      console.error("Could not load game details.", error);
      this.detailsMessage.textContent = this.getDetailsErrorMessage(error);
    }
  }

  renderMoves(moves) {
    this.detailsTableBody.replaceChildren();

    if (moves.length === 0) {
      this.detailsMessage.textContent = "No moves found.";
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

  getDetailsErrorMessage(error) {
    return error?.status === 402
      ? "Record not found"
      : "Could not load game details.";
  }

  reset() {
    this.detailsRequestId++;
    this.message.textContent = "";
    this.gamesTableBody.replaceChildren();
    this.gamesTable.classList.add("hidden");
    this.roundsSection.classList.add("hidden");
    this.roundsTitle.textContent = "Rounds";
    this.roundsTableBody.replaceChildren();
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
