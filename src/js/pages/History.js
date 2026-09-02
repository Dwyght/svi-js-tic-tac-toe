import { getGame, getRoomGames, getRooms } from "../api/webserviceApi.js";
import { Button } from "../components/base/Button.js";
import { MODAL_EVENTS, Modal } from "../components/base/Modal.js";
import { HistoryReplay } from "../components/history/HistoryReplay.js";

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
    this.view = "rooms";
    this.historyRequestId = 0;
    this.roundsRequestId = 0;
    this.roomGameIdsCache = new Map();
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
    this.navigation = document.createElement("div");

    this.gamesSection = document.createElement("section");
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
      label: "Back to Rooms",
      className: "button-utility",
      onClick: () => this.handleBack(),
    });
    this.replay = new HistoryReplay({
      onPreviousRound: () => this.selectAdjacentRound(-1),
      onNextRound: () => this.selectAdjacentRound(1),
    });
    this.modal = new Modal({
      title: "Game History",
      content: this.container,
    });
  }

  setAttributes() {
    this.container.classList.add("history-content");
    this.navigation.classList.add("history-navigation", "hidden");
    this.modal.dialog.classList.add("history-modal");

    this.gamesSection.classList.add("history-view");
    this.configureMessage(this.gamesMessage);
    this.configureTable(
      this.gamesTableWrapper,
      this.gamesTable,
      this.gamesTableHead,
      ["Room Codes"],
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
    this.gamesTable.append(this.gamesTableHead, this.gamesTableBody);
    this.gamesTableWrapper.append(this.gamesTable);
    this.gamesSection.append(
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
    this.backButton.render(this.navigation);

    this.container.append(
      this.gamesSection,
      this.roundsSection,
      this.replaySection,
      this.navigation,
    );

    this.modal.dialog.addEventListener(MODAL_EVENTS.closed, () => {
      this.reset();
    });
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

  createRoundSelectionRow(round, roundNumber) {
    const { row, selectButton } = this.createSelectionRow(
      `Replay round ${roundNumber} for room ${this.selectedRoomId}`,
      () => this.selectRound(roundNumber - 1),
      "history-round-select",
    );
    const number = document.createElement("span");
    const matchup = document.createElement("span");

    number.classList.add("history-round-number");
    number.textContent = `Round ${roundNumber}`;
    matchup.classList.add("history-round-matchup");
    matchup.textContent =
      `${round.players.X}(X) VS ${round.players.O}(O)`;
    selectButton.append(number, matchup);

    return row;
  }

  showView(view) {
    this.view = view;
    this.gamesSection.classList.toggle("hidden", view !== "rooms");
    this.roundsSection.classList.toggle("hidden", view !== "rounds");
    this.replaySection.classList.toggle("hidden", view !== "replay");
    this.navigation.classList.toggle("hidden", view === "rooms");

    const backLabels = {
      rounds: "Back to Rooms",
      replay: "Back to Rounds",
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
      this.showRooms();
    }
  }

  async open() {
    this.reset();
    const requestId = this.historyRequestId;

    this.modal.open();
    this.gamesMessage.textContent = "Loading rooms...";

    try {
      const response = await getRooms();

      if (requestId !== this.historyRequestId) {
        return;
      }

      if (!Array.isArray(response?.list)) {
        throw new Error("Webservice returned invalid room history.");
      }

      const roomSummaries = await Promise.all(
        getIds(response.list).map(async (roomId) => ({
          roomId,
          gameIds: await this.loadRoomGameIds(roomId),
        })),
      );

      if (requestId !== this.historyRequestId) {
        return;
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

  async loadRounds(roomId) {
    const requestId = ++this.roundsRequestId;

    this.selectedRoomId = roomId;
    this.loadedRounds = [];
    this.selectedRoundIndex = -1;
    this.replay.reset();
    this.roundsTitle.textContent = `Rounds for room code ${roomId}`;
    this.roundsMessage.textContent = "Loading rounds...";
    this.roundsTableBody.replaceChildren();
    this.roundsTableWrapper.classList.add("hidden");
    this.showView("rounds");

    try {
      const rounds = await Promise.all(
        (await this.loadRoomGameIds(roomId)).map((gameId) =>
          this.loadRound(gameId),
        ),
      );

      if (requestId !== this.roundsRequestId) {
        return;
      }

      this.renderRounds(rounds.sort(compareRoundDates));
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
      this.roundsMessage.textContent = "No rounds found.";
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

  selectRound(index) {
    const round = this.loadedRounds[index];

    if (!round) {
      return;
    }

    this.selectedRoundIndex = index;
    this.replayTitle.textContent = `Replay of Round ${index + 1}`;
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
      : "Could not load rounds.";
  }

  close() {
    this.modal.close();
  }

  reset() {
    this.historyRequestId++;
    this.roundsRequestId++;
    this.roomGameIdsCache.clear();
    this.roundMovesCache.clear();
    this.selectedRoomId = null;
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
    this.showView("rooms");
  }

  render(target) {
    this.modal.render(target);
  }
}
