import {
  getGame,
  getPlayerGames,
  getPlayers,
  getRoomGames,
  getRooms,
} from "../api/webserviceApi.js";
import { Button } from "../components/base/Button.js";
import { MODAL_EVENTS, Modal } from "../components/base/Modal.js";
import { HistoryReplay } from "../components/history/HistoryReplay.js";

// ========================================
// DATE COMPARISON
// ========================================

function compareDates(left, right) {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return leftTime - rightTime;
  }

  return String(left).localeCompare(String(right));
}

function compareMoveDates(left, right) {
  return compareDates(left.datesave, right.datesave);
}

function compareRoundDates(left, right) {
  return compareDates(left.startedAt, right.startedAt);
}

// ========================================
// RESPONSE HELPERS
// ========================================

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

function getRoundPlayers(moves) {
  const players = {
    X: "Player X",
    O: "Player O",
  };

  for (const move of moves) {
    const symbol = move?.symbol;
    const playerId = String(move?.playerid ?? "").trim();

    if ((symbol === "X" || symbol === "O") && playerId !== "") {
      players[symbol] = playerId;
    }
  }

  return players;
}

export class HistoryPage {
  constructor() {
    this.view = "menu";
    this.historyMode = null;
    this.historyRequestId = 0;
    this.roundsRequestId = 0;
    this.roomGameIdsCache = new Map();
    this.playerGameIdsCache = new Map();
    this.roundMovesCache = new Map();
    this.selectedRoomId = null;
    this.selectedPlayerId = null;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;

    this.initializeElements();
    this.initializeComponents();
    this.setAttributes();
    this.appendElements();
  }

  // ========================================
  // STEP 1
  // ========================================

  initializeElements() {
    this.container = document.createElement("div");
    this.navigation = document.createElement("div");

    this.menuSection = document.createElement("section");
    this.menuTitle = document.createElement("h2");
    this.menuOptions = document.createElement("div");

    this.gamesSection = document.createElement("section");
    this.gamesMessage = document.createElement("p");
    this.gamesTableWrapper = document.createElement("div");
    this.gamesTable = document.createElement("table");
    this.gamesTableHead = document.createElement("thead");
    this.gamesTableBody = document.createElement("tbody");

    this.playersSection = document.createElement("section");
    this.playersTitle = document.createElement("h2");
    this.playersMessage = document.createElement("p");
    this.playersTableWrapper = document.createElement("div");
    this.playersTable = document.createElement("table");
    this.playersTableHead = document.createElement("thead");
    this.playersTableBody = document.createElement("tbody");

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

  // ========================================
  // COMPONENTS
  // ========================================

  initializeComponents() {
    this.gameHistoryButton = new Button({
      label: "Game History",
      className: "history-type-button",
      onClick: () => this.loadGameHistory(),
    });
    this.playerHistoryButton = new Button({
      label: "Player History",
      className: "history-type-button",
      onClick: () => this.loadPlayerHistory(),
    });
    this.backButton = new Button({
      label: "Back to History",
      className: "button-utility",
      onClick: () => this.handleBack(),
    });
    this.replay = new HistoryReplay({
      onPreviousRound: () => this.selectAdjacentRound(-1),
      onNextRound: () => this.selectAdjacentRound(1),
    });
    this.modal = new Modal({
      title: "History",
      content: this.container,
    });
  }

  // ========================================
  // STEP 2
  // ========================================

  setAttributes() {
    this.container.classList.add("history-content");
    this.navigation.classList.add("history-navigation", "hidden");
    this.modal.dialog.classList.add("history-modal");

    this.menuSection.classList.add("history-view");
    this.menuTitle.textContent = "Choose a history view";
    this.menuOptions.classList.add("history-type-options");

    this.gamesSection.classList.add("history-view", "hidden");
    this.configureMessage(this.gamesMessage);
    this.configureTable(
      this.gamesTableWrapper,
      this.gamesTable,
      this.gamesTableHead,
      ["Room Codes"],
    );

    this.playersSection.classList.add("history-view", "hidden");
    this.playersTitle.textContent = "Players";
    this.configureMessage(this.playersMessage);
    this.configureTable(
      this.playersTableWrapper,
      this.playersTable,
      this.playersTableHead,
      ["Player Names"],
    );

    this.roundsSection.classList.add("history-view", "hidden");
    this.roundsTitle.textContent = "Rounds";
    this.configureMessage(this.roundsMessage);
    this.configureTable(
      this.roundsTableWrapper,
      this.roundsTable,
      this.roundsTableHead,
      ["Rounds"],
    );

    this.replaySection.classList.add("history-view", "hidden");
    this.replayTitle.textContent = "Round Replay";
  }

  // ========================================
  // CONFIGURATION HELPERS
  // ========================================

  configureMessage(message) {
    message.classList.add("message", "history-message");
    message.setAttribute("aria-live", "polite");
  }

  configureTable(wrapper, table, tableHead, labels) {
    wrapper.classList.add("history-table-wrapper", "hidden");
    table.classList.add("history-table");
    tableHead.append(this.createHeaderRow(labels));
  }

  // ========================================
  // STEP 3
  // ========================================

  appendElements() {
    this.gameHistoryButton.render(this.menuOptions);
    this.playerHistoryButton.render(this.menuOptions);
    this.menuSection.append(this.menuTitle, this.menuOptions);

    this.gamesTable.append(this.gamesTableHead, this.gamesTableBody);
    this.gamesTableWrapper.append(this.gamesTable);
    this.gamesSection.append(
      this.gamesMessage,
      this.gamesTableWrapper,
    );

    this.playersTable.append(this.playersTableHead, this.playersTableBody);
    this.playersTableWrapper.append(this.playersTable);
    this.playersSection.append(
      this.playersTitle,
      this.playersMessage,
      this.playersTableWrapper,
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
    this.backButton.render(this.navigation);

    this.container.append(
      this.menuSection,
      this.gamesSection,
      this.playersSection,
      this.roundsSection,
      this.replaySection,
      this.navigation,
    );

    this.modal.dialog.addEventListener(MODAL_EVENTS.closed, () => {
      this.reset();
    });
  }

  // ========================================
  // TABLE ROWS
  // ========================================

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

  createSelectionRow(ariaLabel, onSelect, className) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    const selectButton = document.createElement("button");

    selectButton.type = "button";
    selectButton.classList.add("history-game-select", className);
    selectButton.setAttribute("aria-label", ariaLabel);
    selectButton.addEventListener("click", onSelect);

    cell.append(selectButton);
    row.append(cell);

    return { row, selectButton };
  }

  createRoomSelectionRow(roomId, roundCount) {
    const roundLabel = roundCount === 1 ? "round" : "rounds";
    const { row, selectButton } = this.createSelectionRow(
      `View ${roundCount} ${roundLabel} for room ${roomId}`,
      () => this.loadRounds(roomId),
      "history-room-select",
    );
    const code = document.createElement("span");
    const count = document.createElement("span");

    code.classList.add("history-room-code");
    code.textContent = roomId;
    count.classList.add("history-room-count");
    count.textContent = `${roundCount} ${roundLabel}`;
    selectButton.append(code, count);

    return row;
  }

  createPlayerSelectionRow(playerId) {
    const { row, selectButton } = this.createSelectionRow(
      `View games for player ${playerId}`,
      () => this.loadPlayerGames(playerId),
      "history-player-select",
    );
    const name = document.createElement("span");
    const action = document.createElement("span");

    name.classList.add("history-player-name");
    name.textContent = playerId.toUpperCase();
    action.classList.add("history-player-action");
    action.textContent = "View games";
    selectButton.append(name, action);

    return row;
  }

  createRoundSelectionRow(round, roundNumber) {
    const itemLabel = this.historyMode === "players" ? "Game" : "Round";
    const ownerLabel = this.historyMode === "players"
      ? `player ${this.selectedPlayerId}`
      : `room ${this.selectedRoomId}`;
    const { row, selectButton } = this.createSelectionRow(
      `Replay ${itemLabel.toLowerCase()} ${roundNumber} for ${ownerLabel}`,
      () => this.selectRound(roundNumber - 1),
      "history-round-select",
    );
    const number = document.createElement("span");
    const matchup = document.createElement("span");

    number.classList.add("history-round-number");
    number.textContent = `${itemLabel} ${roundNumber}`;
    matchup.classList.add("history-round-matchup");
    matchup.textContent =
      `${round.players.X}(X) VS ${round.players.O}(O)`;
    selectButton.append(number, matchup);

    return row;
  }

  // ========================================
  // VIEW NAVIGATION
  // ========================================

  showView(view) {
    this.view = view;
    this.menuSection.classList.toggle("hidden", view !== "menu");
    this.gamesSection.classList.toggle("hidden", view !== "rooms");
    this.playersSection.classList.toggle("hidden", view !== "players");
    this.roundsSection.classList.toggle("hidden", view !== "rounds");
    this.replaySection.classList.toggle("hidden", view !== "replay");
    this.navigation.classList.toggle("hidden", view === "menu");

    const backLabels = {
      rooms: "Back to History",
      players: "Back to History",
      rounds: this.historyMode === "players"
        ? "Back to Players"
        : "Back to Rooms",
      replay: this.historyMode === "players"
        ? "Back to Games"
        : "Back to Rounds",
    };

    if (backLabels[view]) {
      this.backButton.setLabel(backLabels[view]);
    }
  }

  handleBack() {
    if (this.view === "replay") {
      this.showRounds();
      return;
    }

    if (this.view === "rounds") {
      if (this.historyMode === "players") {
        this.showPlayers();
      } else {
        this.showRooms();
      }

      return;
    }

    if (this.view === "rooms" || this.view === "players") {
      this.showMenu();
    }
  }

  // ========================================
  // ROOM HISTORY
  // ========================================

  async open() {
    this.reset();
    this.modal.open();
  }

  async loadGameHistory() {
    this.historyMode = "games";
    const requestId = ++this.historyRequestId;

    this.gamesTableBody.replaceChildren();
    this.gamesTableWrapper.classList.add("hidden");
    this.gamesMessage.textContent = "Loading rooms...";
    this.showView("rooms");

    try {
      const response = await getRooms();

      if (requestId !== this.historyRequestId) {
        return;
      }

      if (!Array.isArray(response?.list)) {
        throw new Error("Webservice returned invalid room history.");
      }

      const roomIds = getIds(response.list);
      const roomResults = await Promise.allSettled(
        roomIds.map(async (roomId) => ({
          roomId,
          gameIds: await this.loadRoomGameIds(roomId),
        })),
      );
      const roomSummaries = roomResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      if (requestId !== this.historyRequestId) {
        return;
      }

      if (roomSummaries.length === 0 && roomResults.length > 0) {
        throw roomResults[0].reason;
      }

      for (const result of roomResults) {
        if (result.status === "rejected") {
          console.warn("Skipped an invalid room history record.", result.reason);
        }
      }

      this.renderRooms(roomSummaries);
    } catch (error) {
      if (requestId !== this.historyRequestId) {
        return;
      }

      console.error("Could not load room history.", error);
      this.gamesMessage.textContent = this.getRoomsErrorMessage(error);
    }
  }

  // ========================================
  // PLAYER HISTORY
  // ========================================

  async loadPlayerHistory() {
    this.historyMode = "players";
    const requestId = ++this.historyRequestId;

    this.playersTableBody.replaceChildren();
    this.playersTableWrapper.classList.add("hidden");
    this.playersMessage.textContent = "Loading players...";
    this.showView("players");

    try {
      const response = await getPlayers();

      if (requestId !== this.historyRequestId) {
        return;
      }

      if (!Array.isArray(response?.list)) {
        throw new Error("Webservice returned invalid player history.");
      }

      this.renderPlayers(getIds(response.list));
    } catch (error) {
      if (requestId !== this.historyRequestId) {
        return;
      }

      console.error("Could not load player history.", error);
      this.playersMessage.textContent = this.getPlayersErrorMessage(error);
    }
  }

  renderPlayers(playerIds) {
    this.playersTableBody.replaceChildren();

    if (playerIds.length === 0) {
      this.playersTableWrapper.classList.add("hidden");
      this.playersMessage.textContent = "No players found.";
      return;
    }

    for (const playerId of playerIds) {
      this.playersTableBody.append(this.createPlayerSelectionRow(playerId));
    }

    this.playersMessage.textContent = "";
    this.playersTableWrapper.classList.remove("hidden");
  }

  async loadPlayerGameIds(playerId) {
    if (!this.playerGameIdsCache.has(playerId)) {
      const request = getPlayerGames(playerId).then((response) => {
        if (!Array.isArray(response?.list)) {
          throw new Error("Webservice returned invalid player games.");
        }

        return getIds(response.list);
      });

      this.playerGameIdsCache.set(playerId, request);
    }

    const request = this.playerGameIdsCache.get(playerId);

    try {
      return await request;
    } catch (error) {
      if (this.playerGameIdsCache.get(playerId) === request) {
        this.playerGameIdsCache.delete(playerId);
      }

      throw error;
    }
  }

  renderRooms(roomSummaries) {
    this.gamesTableBody.replaceChildren();

    if (roomSummaries.length === 0) {
      this.gamesTableWrapper.classList.add("hidden");
      this.gamesMessage.textContent = "No rooms found.";
      return;
    }

    for (const { roomId, gameIds } of roomSummaries) {
      const roundCount = gameIds.length;
      const row = this.createRoomSelectionRow(roomId, roundCount);

      this.gamesTableBody.append(row);
    }

    this.gamesMessage.textContent = "";
    this.gamesTableWrapper.classList.remove("hidden");
  }

  async loadRoomGameIds(roomId) {
    if (!this.roomGameIdsCache.has(roomId)) {
      const request = getRoomGames(roomId).then((response) => {
        if (!Array.isArray(response?.list)) {
          throw new Error("Webservice returned invalid room games.");
        }

        return getIds(response.list);
      });

      this.roomGameIdsCache.set(roomId, request);
    }

    const request = this.roomGameIdsCache.get(roomId);

    try {
      return await request;
    } catch (error) {
      if (this.roomGameIdsCache.get(roomId) === request) {
        this.roomGameIdsCache.delete(roomId);
      }

      throw error;
    }
  }

  // ========================================
  // ROUND HISTORY
  // ========================================

  async loadRounds(roomId) {
    this.historyMode = "games";
    this.selectedRoomId = roomId;
    this.selectedPlayerId = null;

    return this.loadGames(
      `Rounds for room code ${roomId}`,
      () => this.loadRoomGameIds(roomId),
    );
  }

  async loadPlayerGames(playerId) {
    this.historyMode = "players";
    this.selectedRoomId = null;
    this.selectedPlayerId = playerId;

    return this.loadGames(
      `Games for player ${playerId}`,
      () => this.loadPlayerGameIds(playerId),
    );
  }

  async loadGames(title, loadGameIds) {
    const requestId = ++this.roundsRequestId;
    const itemLabel = this.historyMode === "players" ? "games" : "rounds";
    const tableHeader = this.roundsTableHead.querySelector("th");

    this.loadedRounds = [];
    this.selectedRoundIndex = -1;
    this.replay.reset();
    this.roundsTitle.textContent = title;
    this.roundsMessage.textContent = `Loading ${itemLabel}...`;

    if (tableHeader) {
      tableHeader.textContent = itemLabel[0].toUpperCase() + itemLabel.slice(1);
    }

    this.roundsTableBody.replaceChildren();
    this.roundsTableWrapper.classList.add("hidden");
    this.showView("rounds");

    try {
      const rounds = await Promise.all(
        (await loadGameIds()).map((gameId) =>
          this.loadRound(gameId),
        ),
      );

      if (requestId !== this.roundsRequestId) {
        return;
      }

      this.renderRounds(rounds.sort((a, b) => compareRoundDates(b, a)));
    } catch (error) {
      if (requestId !== this.roundsRequestId) {
        return;
      }

      console.error("Could not load game rounds.", error);
      this.roundsMessage.textContent = this.getHistoryItemsErrorMessage(
        error,
        itemLabel,
      );
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
          moves,
          startedAt: moves[0]?.datesave ?? "",
          players: getRoundPlayers(moves),
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

    if (rounds.length === 0) {
      this.roundsTableWrapper.classList.add("hidden");
      this.roundsMessage.textContent = this.historyMode === "players"
        ? "No games found."
        : "No rounds found.";
      return;
    }

    for (const [index] of rounds.entries()) {
      const roundNumber = index + 1;
      const round = rounds[index];
      const row = this.createRoundSelectionRow(round, roundNumber);

      this.roundsTableBody.append(row);
    }

    this.roundsMessage.textContent = "";
    this.roundsTableWrapper.classList.remove("hidden");
  }

  // ========================================
  // ROUND REPLAY
  // ========================================

  selectRound(index) {
    const round = this.loadedRounds[index];

    if (!round) {
      return;
    }

    this.selectedRoundIndex = index;
    const itemLabel = this.historyMode === "players" ? "Game" : "Round";
    this.replayTitle.textContent = `Replay of ${itemLabel} ${index + 1}`;
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

  showPlayers() {
    this.roundsRequestId++;
    this.replay.reset();
    this.selectedPlayerId = null;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;
    this.showView("players");
  }

  showMenu() {
    this.historyRequestId++;
    this.roundsRequestId++;
    this.replay.reset();
    this.historyMode = null;
    this.selectedRoomId = null;
    this.selectedPlayerId = null;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;
    this.showView("menu");
  }

  // ========================================
  // ERROR MESSAGES
  // ========================================

  getRoomsErrorMessage(error) {
    return error?.status === 402
      ? "Record not found"
      : "Could not load rooms.";
  }

  getPlayersErrorMessage(error) {
    return error?.status === 402
      ? "No player history found."
      : "Could not load players.";
  }

  getHistoryItemsErrorMessage(error, itemLabel) {
    return error?.status === 402
      ? "Record not found"
      : `Could not load ${itemLabel}.`;
  }

  // ========================================
  // MODAL LIFECYCLE
  // ========================================

  close() {
    this.modal.close();
  }

  reset() {
    this.historyRequestId++;
    this.roundsRequestId++;
    this.roomGameIdsCache.clear();
    this.playerGameIdsCache.clear();
    this.roundMovesCache.clear();
    this.historyMode = null;
    this.selectedRoomId = null;
    this.selectedPlayerId = null;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;
    this.replay.reset();

    this.gamesMessage.textContent = "";
    this.gamesTableBody.replaceChildren();
    this.gamesTableWrapper.classList.add("hidden");

    this.playersMessage.textContent = "";
    this.playersTableBody.replaceChildren();
    this.playersTableWrapper.classList.add("hidden");

    this.roundsTitle.textContent = "Rounds";
    this.roundsTableHead.querySelector("th").textContent = "Rounds";
    this.roundsMessage.textContent = "";
    this.roundsTableBody.replaceChildren();
    this.roundsTableWrapper.classList.add("hidden");

    this.replayTitle.textContent = "Round Replay";
    this.showView("menu");
  }

  render(target) {
    this.modal.render(target);
  }
}
