# Sushi Tic-Tac-Toe

A sushi-themed, browser-based Tic-Tac-Toe game built with vanilla JavaScript, HTML, and CSS. Two players can create or join a room with a game code, choose sushi pieces, play multiple scored rounds, exchange emotes, or watch an active game as a spectator.

The frontend uses native ES modules and does not require a bundler or an npm build step.

## Features

- Create and join games using an eight-character room code
- Play as Player X or Player O with server-backed board state
- Spectate an active game without interacting with the board
- Choose from five sushi designs for each player
- Enforced turns and guarded move submission
- Automatic board updates through 500 ms polling
- Victory, defeat, draw, and spectator result banners
- Persistent X/O series scores; drawn rounds do not add a point
- Player X authority for starting the next round
- Emotes between same-origin browser tabs that appear on the other player's screen
- Pause, resume, copy-code, quit, and leave confirmation flows
- Resume prompt after refreshing an active player session
- One splash-screen appearance per browser tab session
- Responsive layouts, modal-aware background-video pausing, and reduced-motion support

## Requirements

- A modern browser with support for JavaScript modules, `dialog`, Fetch, and Web Storage
- A local static HTTP server for the frontend
- A compatible Tic-Tac-Toe backend running at:

  ```text
  http://localhost:8080/tictactoe/tictactoeserver
  ```

The backend is not included in this repository. Its URL is configured in [`src/js/config/constants.js`](src/js/config/constants.js).

## Running the frontend

1. Start the compatible backend on port `8080`.
2. From the repository root, start any static HTTP server. For example, with Python:

   ```powershell
   py -m http.server 5500
   ```

   Alternatively:

   ```bash
   python -m http.server 5500
   ```

3. Open `http://localhost:5500` in a browser.

There is no `npm install` or build command for this project.

## Playing locally

1. Select **Create Game**, enter Player X's name, and choose an X sushi.
2. Copy the generated room code.
3. Open the same frontend URL in a second same-origin browser tab, select **Join Game**, enter the code and Player O's name, and choose an O sushi.
4. Player X takes the first turn.
5. After a round, Player X can select **Play Again**. Player O waits for X to start the next round.

Opening a fresh second tab is safer than duplicating an active player tab because some browsers clone `sessionStorage` when a tab is duplicated.

## Game rules and session behavior

- Player X always moves first.
- Players alternate until X or O completes a row, column, or diagonal, or the board is full.
- A win adds one point to the winner's series score.
- A draw ends the round but does not change the score.
- Only Player X can reset the board for another round.
- Confirming **Quit Game** resets the server room and returns the player home. The other active client detects the missing room during polling and returns home.
- A spectator's **Leave** action only exits the spectator view; it does not reset the game.
- Closing a tab abruptly does not currently notify the server or delete the room.

## Browser storage

The project uses both storage types intentionally:

| Storage | Data | Behavior |
| --- | --- | --- |
| `sessionStorage` | Active player's room code, tile, and name | Allows a player to resume after a refresh in the same tab session |
| `sessionStorage` | Splash-screen-seen flag | Prevents the splash from appearing again during that tab session |
| `localStorage` | Player names and sushi selections | Shared between same-origin tabs |
| `localStorage` | X/O series scores | Preserved between rounds for the room code |
| `localStorage` | Latest emote event | Delivered to other same-origin tabs through the browser `storage` event |

Spectator sessions are intentionally not saved for resume. A browser may also restore `sessionStorage` as part of its own tab/session restoration behavior.

Because names, sushi choices, scores, and emotes are stored locally, the complete experience is designed primarily for same-origin tabs in the same browser. The server board can still be fetched elsewhere, but those locally stored details are not synchronized across different browsers or devices.

## Backend API contract

The frontend expects plain-text responses from these GET endpoints under the configured base URL:

| Endpoint | Parameters | Purpose |
| --- | --- | --- |
| `createGame` | `key` | Claims the next player slot and returns `X` or `O` |
| `check` | `key` | Returns whether the room is active |
| `board` | `key` | Returns the colon-delimited board state |
| `move` | `key`, `tile`, `y`, `x` | Submits a move |
| `reset` | `key` | Removes or resets the room |

The current client uses the same `createGame` endpoint for creating a room and joining its second player slot.

## Project structure

```text
.
├── index.html
└── src
    ├── assets/images/       Artwork, banners, sushi, emotes, and video
    ├── css/
    │   ├── base/            Tokens, reset, and application layout
    │   ├── components/      Component-specific styles
    │   ├── pages/           Home and game page styles
    │   ├── main.css         Ordered CSS imports
    │   └── responsive.css   Shared breakpoints and adaptations
    └── js/
        ├── api/             HTTP requests to the game server
        ├── components/
        │   ├── base/        Reusable Button, Card, and Modal primitives
        │   └── game/        Game-specific UI components and modals
        ├── config/          API URL, timing, sushi, and emote definitions
        ├── game/            Pure board rules and room-code generation
        ├── pages/           HomePage and GamePage controllers
        ├── services/        Game flow, polling, storage, and emotes
        ├── state/           In-memory game state
        ├── utils/           DOM, clipboard, and sushi helpers
        └── app.js           Application composition and startup flow
```

`HomePage` and `GamePage` coordinate application flows. Reusable DOM construction stays in component classes, which follow the project's `initializeElements`, `setAttributes`, `appendElements`, and `render(target)` pattern.

## Development notes

- Keep `HomePage` and `GamePage` as controllers rather than placing large component markup directly in them.
- Build DOM safely with `document.createElement`, `textContent`, and `append`; the project does not rely on `innerHTML`.
- Add shared primitives under `src/js/components/base/` and game-specific components under `src/js/components/game/`.
- Import CSS only through `src/css/main.css`, preserving the order: base, components, pages, then responsive rules.
- Update `BASE_URL` in `src/js/config/constants.js` if the backend is hosted elsewhere.
- Clipboard access can depend on browser permission and a secure context; `localhost` is treated as secure by modern browsers.

## Testing status

No automated test runner or package manifest is currently included. Changes should be checked manually with two same-origin tabs and, when relevant, a spectator tab at desktop and mobile viewport sizes.

## License

No license file is currently included in this repository.
