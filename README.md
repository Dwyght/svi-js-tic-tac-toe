# Sushi Tic-Tac-Toe

A sushi-themed Tic-Tac-Toe game built with vanilla JavaScript, HTML, and CSS. Players can create or join a room, choose sushi pieces, play multiple scored rounds, exchange emotes, review match history, or watch an active game as a spectator.

The frontend uses native ES modules. It has no npm dependencies and requires no bundling step.

## Architecture

The frontend communicates with two backend applications:

| Backend | Default base URL | Responsibility |
| --- | --- | --- |
| Tic-Tac-Toe game server | `http://localhost:8080/tictactoe/tictactoeserver` | Player-slot assignment, board state, move validation, and room reset |
| Tic-Tac-Toe webservice | `http://localhost:8080/tictactoe-webservice-1.0/api` | Runtime player details, sushi choices, scores, emotes, round IDs, and game history |

Both URLs are configured in [`src/js/config/constants.js`](src/js/config/constants.js).

## Features

- Create and join games using an eight-character room code
- Play as Player X or Player O with server-backed board state
- Display the current player's name in the turn indicator
- Spectate an active game without interacting with the board
- Choose from five sushi designs for each player
- Enforce alternating turns and guard duplicate move submission
- Poll the servers every 500 ms for board and session updates
- Show victory, defeat, draw, and spectator result states
- Preserve X/O series scores between rounds
- Let Player X start the next round
- Exchange emotes through the webservice session
- Browse rooms, rounds, and recorded moves on the History screen
- Resume a player session after refreshing the same browser tab
- Prevent duplicate tabs from controlling the same player slot
- Support responsive layouts and reduced-motion preferences

## Requirements

- A modern browser supporting ES modules, Fetch, `dialog`, Web Storage, and the Web Locks API
- A local static HTTP server
- The Tic-Tac-Toe game server running on port `8080`
- The companion Jakarta EE webservice deployed on Payara

## Configuration

Edit [`src/js/config/constants.js`](src/js/config/constants.js) if either backend uses a different host, port, context root, or application path:

```js
export const BASE_URL =
  "http://localhost:8080/tictactoe/tictactoeserver";

export const WEBSERVICE_BASE_URL =
  "http://localhost:8080/tictactoe-webservice-1.0/api";
```

The webservice allows these frontend origins by default:

- `http://localhost:5500`
- `http://127.0.0.1:5500`

If the frontend is served from a different origin, add it to the webservice's `FRONTEND_URLS` configuration.

## Running the frontend

1. Start the Tic-Tac-Toe game server.
2. Build and deploy the companion webservice WAR to Payara.
3. From this repository's root, start a static server on port `5500`:

   ```powershell
   py -m http.server 5500
   ```

   On systems where the command is named `python`:

   ```bash
   python -m http.server 5500
   ```

4. Open `http://localhost:5500` in a browser.

There is no `npm install` or frontend build command.

## Playing locally

1. Select **Create Game**, enter Player X's name, choose a sushi, and select **Continue**.
2. Copy the generated room code.
3. Open the frontend in a second tab, select **Join Game**, enter the room code and Player O's name, and choose a sushi.
4. Player X takes the first turn. The turn indicator includes the active player's name.
5. After the round, Player X can select **Play Again**. Player O waits for X to start the next round.

To watch instead of play, select **Spectate Game** and enter an active room code. A spectator cannot submit moves or reset the room.

## Game and session behavior

- Player X always moves first.
- Players alternate until someone completes a row, column, or diagonal, or the board is full.
- A win adds one point to the winner's series score; a draw does not change either score.
- The game server is the authority for the board and accepted moves.
- The webservice synchronizes player names, sushi selections, scores, emotes, and the current round ID.
- Accepted moves are also sent to the webservice for history persistence.
- Only Player X can start another round.
- Quitting resets the game-server room and returns the player home.
- Leaving spectator mode does not reset the room.
- Runtime webservice sessions are held in backend memory, while completed move history is stored in files.

## Browser storage

The frontend uses `sessionStorage` for:

| Data | Purpose |
| --- | --- |
| Room code, tile, and player name | Resume an active player after refreshing the same tab session |
| Splash-screen flag | Show the splash only once per tab session |

Spectator sessions are not saved. Active player ownership is guarded separately with a Web Lock keyed by room code and tile, preventing a duplicated tab from taking over the same player.

## Game-server API

All calls use `BASE_URL` and return plain text.

| Function | Method | Endpoint | Query parameters |
| --- | --- | --- | --- |
| `createGame` | GET | `/createGame` | `key` |
| `checkGame` | GET | `/check` | `key` |
| `getBoard` | GET | `/board` | `key` |
| `move` | GET | `/move` | `key`, `tile`, `y`, `x` |
| `resetGame` | GET | `/reset` | `key` |

The same `createGame` endpoint assigns Player X when a room is created and Player O when the second player joins.

## Webservice API

All calls use `WEBSERVICE_BASE_URL` and exchange JSON.

| Exported function | Method | Endpoint |
| --- | --- | --- |
| `saveMove` | POST | `/game/save` |
| `getAllGames` | GET | `/game` |
| `getRooms` | GET | `/rooms` |
| `getPlayerGames` | GET | `/player/{playerId}/games` |
| `getGame` | GET | `/game/{gameId}` |
| `getRoomGames` | GET | `/room/{roomId}/games` |
| `getGameSession` | GET | `/session/{gameCode}` |
| `registerSessionPlayer` | POST | `/session/{gameCode}/player` |
| `updateSessionScore` | POST | `/session/{gameCode}/score` |
| `sendSessionEmote` | POST | `/session/{gameCode}/emote` |
| `createRoundGameId` | POST | `/session/{gameCode}/game` |
| `getCurrentRoundGameId` | GET | `/session/{gameCode}/game` |

Path parameters are encoded with `encodeURIComponent()` before requests are sent. Webservice errors expose the backend's `msg` value and HTTP status through the thrown JavaScript `Error`.

## Project structure

```text
.
|-- index.html
`-- src
    |-- assets/images/       Artwork, sushi, emotes, and video
    |-- css/
    |   |-- base/            Tokens, reset, and application layout
    |   |-- components/      Component-specific styles
    |   |-- pages/           Page-specific styles
    |   |-- main.css         Ordered CSS imports
    |   `-- responsive.css   Shared breakpoints
    `-- js/
        |-- api/             Calls to both backend applications
        |-- components/      Reusable and game-specific UI components
        |-- config/          Backend URLs and game constants
        |-- game/            Board parsing and game rules
        |-- pages/           Home, game, result, and history flows
        |-- services/        Polling, game flow, storage, and tab locking
        |-- state/           In-memory frontend state
        |-- utils/           DOM, clipboard, and sushi helpers
        `-- app.js           Application composition and startup
```

## Development and verification

- Build DOM content with `document.createElement`, `textContent`, and `append` rather than `innerHTML`.
- Keep reusable components under `src/js/components/` and application flows under `src/js/pages/` or `src/js/services/`.
- Import styles through `src/css/main.css`.
- When changing an endpoint, update the appropriate API wrapper instead of constructing request URLs inside page components.
- Test gameplay with two player tabs and, when relevant, a third spectator tab.
- Test both `localhost:5500` and `127.0.0.1:5500` when changing CORS behavior.

No automated frontend test runner or package manifest is currently included.

## License

No license file is currently included in this repository.
