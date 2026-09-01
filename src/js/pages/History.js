import { getGame, getPlayerGames } from "../api/webserviceApi.js";
import { Button } from "../components/base/Button.js";
import { gameState } from "../state/gameState.js";
import { resolveTarget } from "../utils/dom.js";

function compareMoveDates(left, right) {
  const leftTime = Date.parse(left.datesave);
  const rightTime = Date.parse(right.datesave);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return leftTime - rightTime;
  }

  return String(left.datesave).localeCompare(String(right.datesave));
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
    this.playerLabel = document.createElement("p");
    this.message = document.createElement("p");

    this.gamesSection = document.createElement("section");
    this.gamesTitle = document.createElement("h2");
    this.gamesTableWrapper = document.createElement("div");
    this.gamesTable = document.createElement("table");
    this.gamesTableHead = document.createElement("thead");
    this.gamesTableBody = document.createElement("tbody");

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
    this.playerLabel.classList.add("history-player");
    this.message.classList.add("message", "history-message");
    this.message.setAttribute("aria-live", "polite");

    this.gamesSection.classList.add("history-section");
    this.gamesTitle.textContent = "Previous Games";
    this.gamesTableWrapper.classList.add("history-table-wrapper");
    this.gamesTable.classList.add("history-table");
    this.gamesTable.classList.add("hidden");

    this.detailsSection.classList.add("history-section");
    this.detailsSection.classList.add("hidden");
    this.detailsTitle.textContent = "Game Details";
    this.detailsMessage.classList.add("message", "history-message");
    this.detailsMessage.setAttribute("aria-live", "polite");
    this.detailsTableWrapper.classList.add("history-table-wrapper");
    this.detailsTable.classList.add("history-table", "history-moves-table");
    this.detailsTable.classList.add("hidden");

    this.gamesTableHead.append(
      this.createHeaderRow(["Game ID"]),
    );
    this.detailsTableHead.append(
      this.createHeaderRow(["Player", "Symbol", "Location", "Date"]),
    );
  }

  appendElements() {
    this.backButton.render(this.header);
    this.header.append(this.title);

    this.gamesTable.append(this.gamesTableHead, this.gamesTableBody);
    this.gamesTableWrapper.append(this.gamesTable);
    this.gamesSection.append(this.gamesTitle, this.gamesTableWrapper);

    this.detailsTable.append(
      this.detailsTableHead,
      this.detailsTableBody,
    );
    this.detailsTableWrapper.append(this.detailsTable);
    this.detailsSection.append(
      this.detailsTitle,
      this.detailsMessage,
      this.detailsTableWrapper,
    );

    this.panel.append(
      this.header,
      this.playerLabel,
      this.message,
      this.gamesSection,
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

  async open() {
    const playerName = gameState.myName;

    this.reset();
    this.screenManager.showHistoryScreen();

    if (typeof playerName !== "string" || playerName === "") {
      this.message.textContent = "Player history is unavailable.";
      return;
    }

    this.playerLabel.textContent = `Player: ${playerName}`;
    this.message.textContent = "Loading history...";

    try {
      const response = await getPlayerGames(playerName);

      if (!Array.isArray(response?.list)) {
        throw new Error("Webservice returned invalid game history.");
      }

      this.renderGames(response.list);
    } catch (error) {
      console.error("Could not load game history.", error);
      this.message.textContent = this.getHistoryErrorMessage(error);
    }
  }

  renderGames(games) {
    this.gamesTableBody.replaceChildren();

    if (games.length === 0) {
      this.gamesTable.classList.add("hidden");
      this.message.textContent = "No games found.";
      return;
    }

    for (const game of games) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      const selectButton = document.createElement("button");
      const gameId = String(game?.id ?? "");

      selectButton.type = "button";
      selectButton.classList.add("history-game-select");
      selectButton.textContent = gameId;
      selectButton.setAttribute("aria-label", `View game ${gameId}`);
      selectButton.addEventListener("click", () => {
        this.loadGame(gameId);
      });

      cell.append(selectButton);
      row.append(cell);
      this.gamesTableBody.append(row);
    }

    this.message.textContent = "";
    this.gamesTable.classList.remove("hidden");
  }

  async loadGame(gameId) {
    const requestId = ++this.detailsRequestId;

    this.detailsSection.classList.remove("hidden");
    this.detailsTitle.textContent = `Game: ${gameId}`;
    this.detailsMessage.textContent = "Loading game details...";
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
      this.detailsMessage.textContent =
        this.getDetailsErrorMessage(error);
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
    this.playerLabel.textContent = "";
    this.message.textContent = "";
    this.gamesTableBody.replaceChildren();
    this.gamesTable.classList.add("hidden");
    this.detailsSection.classList.add("hidden");
    this.detailsTitle.textContent = "Game Details";
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
