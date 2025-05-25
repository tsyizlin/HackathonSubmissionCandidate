## Project Plan: Waku Tic-Tac-Toe Game

This project plan outlines the steps to convert the existing Waku "Confession Board" web application into a real-time, peer-to-peer Tic-Tac-Toe game using the Waku messaging protocol. The core idea is to leverage Waku's publish/subscribe capabilities for turn-based gameplay communication and Waku Store for game state persistence (though for a single game, direct P2P might be sufficient, we'll keep the Store in mind for potential future enhancements like game history).

**High-Level Goal:** Develop a web-based Tic-Tac-Toe game where players on different computers can play against each other by connecting to the same Waku content topic. Game moves will be broadcast via Waku, and the UI will update dynamically.

---

### Phase 1: Game Logic & Core Data Structures (Local)

Before integrating Waku, we'll build the fundamental Tic-Tac-Toe game logic and state management locally.

**Coding Tasks Checklist:**

*   [ ] Define a `GameSession` data structure to represent the complete state of a Tic-Tac-Toe game (e.g., board state, current player, turn count, game status (in progress, won, draw)).
*   [ ] Implement a function `initializeNewGame()` that creates a fresh `GameSession` state.
*   [ ] Implement a function `applyMove(gameSession, move)` that updates the `gameSession` based on a player's move. This function should validate the move (e.g., cell not already taken, correct player's turn) and update the board state.
*   [ ] Implement a function `checkGameStatus(gameSession)` that determines if the game has been won, is a draw, or is still in progress.
*   [ ] Implement a function `getCurrentPlayer(gameSession)` to determine whose turn it is.
*   [ ] Implement basic UI rendering for the Tic-Tac-Toe board based on the `GameSession` state.
*   [ ] Implement local user interaction for making moves (e.g., clicking on a cell).

---

### Phase 2: Waku Integration & Player Role Management

This phase focuses on adapting the Waku communication pattern for a two-player game and managing who is Player X and who is Player O.

**Coding Tasks Checklist:**

*   [ ] Modify the Waku connection logic to allow users to specify a unique `contentTopic` for a game session (e.g., via a game ID input).
*   [ ] Develop a mechanism for two players to identify themselves as Player X and Player O for a given `contentTopic`. This could involve:
    *   [ ] Player 1 joining and broadcasting a "Player X ready" message.
    *   [ ] Player 2 joining, seeing "Player X ready", and broadcasting a "Player O ready" message to confirm the match.
    *   [ ] Implement logic to prevent more than two players from joining the same game `contentTopic`.
*   [ ] Define a `WakuMessageType.GameMove` data structure to encapsulate a player's move (e.g., contentTopic, player ID (X or O), cell index).
*   [ ] Define a `WakuMessageType.GameControl` data structure for game state synchronization messages (e.g., "Player ready", "Game Start", "Player X disconnect", "Player O disconnect").
*   [ ] Implement a function `sendGameMove(move)` that broadcasts a `WakuMessageType.GameMove` message to the designated `contentTopic`.
*   [ ] Implement a function `sendGameControlMessage(controlMsg)` that broadcasts a `WakuMessageType.GameControl` message.
*   [ ] Implement Waku message listener for the specified `contentTopic`.
*   [ ] Parse incoming Waku messages to distinguish between `GameMove` and `GameControl` messages.
*   [ ] Update the local `GameSession` state based on received `GameMove` messages, ensuring only valid moves from the correct player are applied.
*   [ ] Implement UI updates based on `GameControl` messages (e.g., "Waiting for Player", "Game Started").
*   [ ] Ensure that a player can only make a move if it's their turn and they are the designated player (X or O).
*   [ ] Display the current player's turn prominently in the UI.

---

### Phase 3: Game Flow & UI Enhancements

This phase brings together the Waku communication and local game logic to create a smooth, interactive game experience.

**Coding Tasks Checklist:**

*   [ ] Implement logic to automatically restart a game or allow players to start a new game after a win/draw.
*   [ ] Display game status messages (e.g., "X wins!", "O wins!", "It's a draw!", "Waiting for opponent...").
*   [ ] Implement a mechanism for players to indicate readiness to start a new game after one concludes.
*   [ ] Disable UI interaction for making moves when it's not the current player's turn.
*   [ ] Visually indicate the move being made by the opponent as it arrives via Waku.
*   [ ] Implement basic error handling and feedback for invalid moves (e.g., clicking an occupied cell).
*   [ ] Integrate the Waku Store:
    *   [ ] When a game concludes (win/draw), store the final `GameSession` state or a game summary (winner, moves played) to the Waku Store for the given `contentTopic`.
    *   [ ] Implement logic to check the Waku Store for existing game sessions on a `contentTopic` upon joining, to potentially resume or view past games (stretch goal, focus on live play first).
*   [ ] Handle opponent disconnection:
    *   [ ] Implement a basic timeout mechanism to detect if an opponent has become unresponsive.
    *   [ ] Display a message if the opponent disconnects.

---

### Phase 4: Polish & Refinement

This phase is for usability, robustness, and final touches.

**Coding Tasks Checklist:**

*   [ ] Improve UI/UX:
    *   [ ] Add visual feedback for successful moves.
    *   [ ] Clearer indicators for whose turn it is.
    *   [ ] Enhanced end-game display (e.g., highlighting winning line).
*   [ ] Add a "Lobby" or "Game ID" input where users can enter a `contentTopic` to join an existing game or create a new one.
*   [ ] Implement proper unsubscribe from Waku topics when a player leaves a game.
*   [ ] Consider adding a small "ping/pong" mechanism between players to detect active connections more robustly.
*   [ ] Review and refactor code for clarity, maintainability, and performance.