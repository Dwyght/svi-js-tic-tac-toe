import { getAllGames, getGame } from "../api/webserviceApi.js";
import { Button } from "../components/base/Button.js";
import { HistoryReplay } from "../components/history/HistoryReplay.js";
import { resolveTarget } from "../utils/dom.js";

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

function createGameGroups(games) {
  const groups = [];

  for (const game of games) {
    const gameId = String(game?.id ?? "").trim();

    if (gameId === "") {
      throw new Error("Webservice returned an invalid game ID.");
    }

    groups.push({
      gameId,
      rounds: [{ gameId }],
    });
  }

  return groups;
}

export class HistoryPage {
  constructor({ screenManager, onBack }) {
    this.screenManager = screenManager;
    this.onBack = onBack;
    this.view = "games";
    this.historyRequestId = 0;
    this.roundsRequestId = 0;
    this.roundMovesCache = new Map();
    this.selectedGameId = null;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;

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

    this.gamesSection = document.createElement("section");
    this.gamesTitle = document.createElement("h2");
    this.gamesMessage = document.createElement("p");
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

    this.replaySection = document.createElement("section");
    this.replayTitle = document.createElement("h2");
  }

  initializeComponents() {
    this.backButton = new Button({
      label: "Home",
      className: "button-utility",
      onClick: () => this.handleBack(),
    });
    this.replay = new HistoryReplay({
      onPreviousRound: () => this.selectAdjacentRound(-1),
      onNextRound: () => this.selectAdjacentRound(1),
    });
  }

  setAttributes() {
    this.container.classList.add("history-page");
    this.panel.classList.add("history-panel", "card");
    this.header.classList.add("history-header");
    this.title.textContent = "Game History";

    this.gamesSection.classList.add("history-view");
    this.gamesTitle.textContent = "Games";
    this.configureMessage(this.gamesMessage);
    this.configureTable(
      this.gamesTableWrapper,
      this.gamesTable,
      this.gamesTableHead,
      ["Game ID"],
    );

    this.roundsSection.classList.add("history-view", "hidden");
    this.roundsTitle.textContent = "Rounds";
    this.configureMessage(this.roundsMessage);
    this.configureTable(
      this.roundsTableWrapper,
      this.roundsTable,
      this.roundsTableHead,
      ["Round"],
    );

    this.replaySection.classList.add("history-view", "hidden");
    this.replayTitle.textContent = "Round Replay";
  }

  configureMessage(message) {
    message.classList.add("message", "history-message");
    message.setAttribute("aria-live", "polite");
  }

  configureTable(wrapper, table, tableHead, labels) {
    wrapper.classList.add("history-table-wrapper", "hidden");
    table.classList.add("history-table");
    tableHead.append(this.createHeaderRow(labels));
  }

  appendElements() {
    this.backButton.render(this.header);
    this.header.append(this.title);

    this.gamesTable.append(this.gamesTableHead, this.gamesTableBody);
    this.gamesTableWrapper.append(this.gamesTable);
    this.gamesSection.append(
      this.gamesTitle,
      this.gamesMessage,
      this.gamesTableWrapper,
    );

    this.roundsTable.append(this.roundsTableHead, this.roundsTableBody);
    this.roundsTableWrapper.append(this.roundsTable);
    this.roundsSection.append(
      this.roundsTitle,
      this.roundsMessage,
      this.roundsTableWrapper,
    );

    this.replaySection.append(this.replayTitle);
    this.replay.render(this.replaySection);

    this.panel.append(
      this.header,
      this.gamesSection,
      this.roundsSection,
      this.replaySection,
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

  showView(view) {
    this.view = view;
    this.gamesSection.classList.toggle("hidden", view !== "games");
    this.roundsSection.classList.toggle("hidden", view !== "rounds");
    this.replaySection.classList.toggle("hidden", view !== "replay");

    const backLabels = {
      games: "Home",
      rounds: "Back to Games",
      replay: "Back to Rounds",
    };

    this.backButton.setLabel(backLabels[view]);
  }

  handleBack() {
    if (this.view === "replay") {
      this.showRounds();
      return;
    }

    if (this.view === "rounds") {
      this.showGames();
      return;
    }

    this.close();
  }

  async open() {
    this.reset();
    const requestId = this.historyRequestId;

    this.screenManager.showHistoryScreen();
    this.gamesMessage.textContent = "Loading history...";

    try {
      const response = await getAllGames();

      if (requestId !== this.historyRequestId) {
        return;
      }

      if (!Array.isArray(response?.list)) {
        throw new Error("Webservice returned invalid game history.");
      }

      this.renderGames(createGameGroups(response.list));
    } catch (error) {
      if (requestId !== this.historyRequestId) {
        return;
      }

      console.error("Could not load game history.", error);
      this.gamesMessage.textContent = this.getHistoryErrorMessage(error);
    }
  }

  renderGames(gameGroups) {
    this.gamesTableBody.replaceChildren();

    if (gameGroups.length === 0) {
      this.gamesTableWrapper.classList.add("hidden");
      this.gamesMessage.textContent = "No games found.";
      return;
    }

    for (const group of gameGroups) {
      const row = this.createSelectionRow(
        group.gameId,
        `View game ${group.gameId}`,
        () => this.loadRounds(group),
      );

      this.gamesTableBody.append(row);
    }

    this.gamesMessage.textContent = "";
    this.gamesTableWrapper.classList.remove("hidden");
  }

  async loadRounds(group) {
    const requestId = ++this.roundsRequestId;

    this.selectedGameId = group.gameId;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;
    this.replay.reset();
    this.roundsTitle.textContent = `Game: ${group.gameId}`;
    this.roundsMessage.textContent = "Loading rounds...";
    this.roundsTableBody.replaceChildren();
    this.roundsTableWrapper.classList.add("hidden");
    this.showView("rounds");

    try {
      const rounds = await Promise.all(
        group.rounds.map((round) => this.loadRound(round.gameId)),
      );

      if (requestId !== this.roundsRequestId) {
        return;
      }

      rounds.sort(compareRounds);
      this.renderRounds(rounds);
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
      const request = getGame(gameId).then((response) => {
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

  renderRounds(rounds) {
    this.loadedRounds = rounds;
    this.roundsTableBody.replaceChildren();

    for (const [index] of rounds.entries()) {
      const roundNumber = index + 1;
      const row = this.createSelectionRow(
        `Round ${roundNumber}`,
        `View Round ${roundNumber} for game ${this.selectedGameId}`,
        () => this.selectRound(index),
      );

      this.roundsTableBody.append(row);
    }

    this.roundsMessage.textContent = "";
    this.roundsTableWrapper.classList.remove("hidden");
  }

  selectRound(index) {
    const round = this.loadedRounds[index];

    if (!round) {
      return;
    }

    this.selectedRoundIndex = index;
    this.replayTitle.textContent =
      `Game ${this.selectedGameId} - ` +
      `Round ${index + 1} of ${this.loadedRounds.length}`;
    this.showView("replay");
    this.replay.setMoves(round.moves);
    this.replay.setNavigation({
      hasPrevious: index > 0,
      hasNext: index < this.loadedRounds.length - 1,
    });
  }

  selectAdjacentRound(offset) {
    this.selectRound(this.selectedRoundIndex + offset);
  }

  showRounds() {
    this.replay.reset();
    this.selectedRoundIndex = -1;
    this.showView("rounds");
  }

  showGames() {
    this.roundsRequestId++;
    this.replay.reset();
    this.selectedGameId = null;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;
    this.showView("games");
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
    this.selectedGameId = null;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;
    this.replay.reset();

    this.gamesMessage.textContent = "";
    this.gamesTableBody.replaceChildren();
    this.gamesTableWrapper.classList.add("hidden");

    this.roundsTitle.textContent = "Rounds";
    this.roundsMessage.textContent = "";
    this.roundsTableBody.replaceChildren();
    this.roundsTableWrapper.classList.add("hidden");

    this.replayTitle.textContent = "Round Replay";
    this.showView("games");
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
