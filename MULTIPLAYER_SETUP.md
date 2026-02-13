# Multiplayer Setup Guide

This guide explains how to set up and use the multiplayer functionality.

## Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open the game:**
   - Navigate to `http://localhost:3000` in your browser
   - Open another browser window/tab (or use a different device on the same network)
   - Both players can now connect and play together

## How It Works

### Architecture

- **Server (`server.js`)**: Node.js + Express + Socket.IO server that handles:
  - Matchmaking (pairing players together)
  - Real-time communication between players
  - Game state synchronization
  - Chat functionality

- **Client (`multiplayer.js`)**: Client-side multiplayer manager that:
  - Connects to the server via WebSocket
  - Sends player updates (position, score, etc.)
  - Receives opponent updates
  - Handles game events

- **Game (`game.js`)**: Enhanced with multiplayer support:
  - Single player and multiplayer modes
  - Renders both local and opponent players
  - Syncs game state in real-time

### Multiplayer Flow

1. **Player clicks "Multiplayer"** → Shows multiplayer screen
2. **Player enters name and clicks "Find Match"** → Connects to server
3. **Server matches two players** → Creates a game room
4. **Both players click "Ready"** → Game starts
5. **During gameplay:**
   - Player positions/actions are sent to server
   - Server broadcasts to opponent
   - Both clients render each other's state
6. **Game ends** when one player wins or disconnects

## Customizing for Your Game

### 1. Send Player State

In `game.js`, update the `update()` method to send your player's state:

```javascript
update() {
    // Update your player
    this.player.update();
    
    // Send state to opponent
    if (this.isMultiplayer && this.multiplayer) {
        this.multiplayer.sendPlayerUpdate({
            x: this.player.x,
            y: this.player.y,
            rotation: this.player.rotation,
            // Add any other state you need
        });
    }
}
```

### 2. Render Opponent

In `game.js`, update the `render()` method to draw the opponent:

```javascript
render() {
    // ... your rendering code ...
    
    // Draw opponent
    if (this.isMultiplayer && this.multiplayer) {
        const opponentState = this.multiplayer.getOpponentState();
        if (opponentState.x !== undefined) {
            // Draw opponent at their position
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(opponentState.x, opponentState.y, 20, 20);
        }
    }
}
```

### 3. Send Game Events

For discrete events (shooting, collecting items, etc.):

```javascript
// When something happens in your game
this.multiplayer.sendGameEvent('projectile-fired', {
    x: projectile.x,
    y: projectile.y,
    direction: projectile.direction
});
```

Then handle it in `handleMultiplayerEvent()`:

```javascript
handleMultiplayerEvent(eventData) {
    if (eventData.type === 'projectile-fired') {
        // Create opponent's projectile
        this.createOpponentProjectile(eventData);
    }
}
```

### 4. Winning Conditions

When a player wins:

```javascript
if (this.isMultiplayer) {
    this.multiplayer.sendGameEvent('player-won', {
        winnerId: this.multiplayer.socket.id
    });
    this.endMultiplayerGame('win');
} else {
    this.gameOver();
}
```

## Server Customization

### Adding Game Logic to Server

You can add server-side game logic in `server.js`:

```javascript
socket.on('game-event', (eventData) => {
    const player = players.get(socket.id);
    if (!player || !player.gameId) return;
    
    const game = games.get(player.gameId);
    
    // Server-side validation
    if (eventData.type === 'score-point') {
        // Validate the score
        game.updatePlayerState(socket.id, { score: eventData.score });
    }
    
    // Broadcast to all players
    io.to(player.gameId).emit('game-event', {
        playerId: socket.id,
        ...eventData
    });
});
```

## Testing Multiplayer Locally

1. Start the server: `npm start`
2. Open `http://localhost:3000` in two browser windows
3. Click "Multiplayer" in both
4. Enter names and click "Find Match"
5. Both players should be matched
6. Click "Ready" in both windows
7. Game starts!

## Deployment

To deploy your multiplayer game:

1. **Deploy to a hosting service** (Heroku, Railway, Render, etc.)
2. **Update the Socket.IO connection** in `multiplayer.js` if needed:
   ```javascript
   // For production, you might need:
   this.socket = io('https://your-domain.com');
   ```

3. **Set environment variables:**
   ```bash
   PORT=3000  # Or whatever port your host uses
   ```

## Network Considerations

- **Latency**: Updates are sent in real-time. For fast-paced games, consider:
  - Client-side prediction
  - Interpolation for smooth movement
  - Throttling update frequency

- **Security**: For production:
  - Add authentication
  - Validate all client inputs on server
  - Rate limit connections
  - Use HTTPS/WSS

## Troubleshooting

**Players can't connect:**
- Check that server is running (`npm start`)
- Verify firewall settings
- Check browser console for errors

**Lag/stuttering:**
- Reduce update frequency
- Implement interpolation
- Check network quality

**Players not matching:**
- Check server logs
- Verify both clients are connected
- Check `/health` endpoint: `http://localhost:3000/health`

## Health Check

Visit `http://localhost:3000/health` to see:
- Server status
- Number of connected players
- Number of active games
- Number of players waiting for match

## Chat Feature

Built-in chat is available during multiplayer games:
- Type message in chat input
- Press Enter to send
- Messages appear for both players

## Next Steps

1. Implement your game logic in single-player first
2. Test thoroughly
3. Add multiplayer state synchronization
4. Test with two players locally
5. Deploy and share with friends!

Good luck with your hackathon! 🚀
