import { getGame, getRoomGames, getRooms } from "../api/webserviceApi.js";
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

function getIds(records) {
  const ids = [];

  for (const record of records) {
    const id = String(record?.id ?? "").trim();

    if (id === "") {
      throw new Error("Webservice returned an invalid ID.");
    }

    ids.push(id);
  }

  return ids;
}

export class HistoryPage {
  constructor({ screenManager, onBack }) {
    this.screenManager = screenManager;
    this.onBack = onBack;
    this.view = "rooms";
    this.historyRequestId = 0;
    this.roundsRequestId = 0;
    this.roundMovesCache = new Map();
    this.selectedRoomId = null;
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
    this.gamesTitle.textContent = "Room Codes";
    this.configureMessage(this.gamesMessage);
    this.configureTable(
      this.gamesTableWrapper,
      this.gamesTable,
      this.gamesTableHead,
      ["Room Code"],
    );

    this.roundsSection.classList.add("history-view", "hidden");
    this.roundsTitle.textContent = "Rounds";
    this.configureMessage(this.roundsMessage);
    this.configureTable(
      this.roundsTableWrapper,
      this.roundsTable,
      this.roundsTableHead,
      ["Game ID"],
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
    this.gamesSection.classList.toggle("hidden", view !== "rooms");
    this.roundsSection.classList.toggle("hidden", view !== "rounds");
    this.replaySection.classList.toggle("hidden", view !== "replay");

    const backLabels = {
      rooms: "Home",
      rounds: "Back to Rooms",
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
      this.showRooms();
      return;
    }

    this.close();
  }

  async open() {
    this.reset();
    const requestId = this.historyRequestId;

    this.screenManager.showHistoryScreen();
    this.gamesMessage.textContent = "Loading rooms...";

    try {
      const response = await getRooms();

      if (requestId !== this.historyRequestId) {
        return;
      }

      if (!Array.isArray(response?.list)) {
        throw new Error("Webservice returned invalid room history.");
      }

      this.renderRooms(getIds(response.list));
    } catch (error) {
      if (requestId !== this.historyRequestId) {
        return;
      }

      console.error("Could not load room history.", error);
      this.gamesMessage.textContent = this.getRoomsErrorMessage(error);
    }
  }

  renderRooms(roomIds) {
    this.gamesTableBody.replaceChildren();

    if (roomIds.length === 0) {
      this.gamesTableWrapper.classList.add("hidden");
      this.gamesMessage.textContent = "No rooms found.";
      return;
    }

    for (const roomId of roomIds) {
      const row = this.createSelectionRow(
        roomId,
        `View games for room ${roomId}`,
        () => this.loadRounds(roomId),
      );

      this.gamesTableBody.append(row);
    }

    this.gamesMessage.textContent = "";
    this.gamesTableWrapper.classList.remove("hidden");
  }

  async loadRounds(roomId) {
    const requestId = ++this.roundsRequestId;

    this.selectedRoomId = roomId;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;
    this.replay.reset();
    this.roundsTitle.textContent = `Room: ${roomId}`;
    this.roundsMessage.textContent = "Loading games...";
    this.roundsTableBody.replaceChildren();
    this.roundsTableWrapper.classList.add("hidden");
    this.showView("rounds");

    try {
      const response = await getRoomGames(roomId);

      if (!Array.isArray(response?.list)) {
        throw new Error("Webservice returned invalid room games.");
      }

      const rounds = await Promise.all(
        getIds(response.list).map((gameId) => this.loadRound(gameId)),
      );

      if (requestId !== this.roundsRequestId) {
        return;
      }

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
      const round = rounds[index];
      const row = this.createSelectionRow(
        `Game ${roundNumber}: ${round.gameId}`,
        `View game ${round.gameId} in room ${this.selectedRoomId}`,
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
      `Room ${this.selectedRoomId} - ` +
      `Game ${index + 1} of ${this.loadedRounds.length}`;
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

  showRooms() {
    this.roundsRequestId++;
    this.replay.reset();
    this.selectedRoomId = null;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;
    this.showView("rooms");
  }

  getRoomsErrorMessage(error) {
    return error?.status === 402
      ? "Record not found"
      : "Could not load rooms.";
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
    this.selectedRoomId = null;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;
    this.replay.reset();

    this.gamesMessage.textContent = "";
    this.gamesTableBody.replaceChildren();
    this.gamesTableWrapper.classList.add("hidden");

    this.roundsTitle.textContent = "Games";
    this.roundsMessage.textContent = "";
    this.roundsTableBody.replaceChildren();
    this.roundsTableWrapper.classList.add("hidden");

    this.replayTitle.textContent = "Game Replay";
    this.showView("rooms");
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
