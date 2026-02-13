const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game state
const games = new Map(); // gameId -> game state
const players = new Map(); // socketId -> player info
const waitingPlayers = []; // Players waiting for a match

class GameRoom {
    constructor(gameId, player1, player2) {
        this.gameId = gameId;
        this.players = [player1, player2];
        this.gameState = {
            player1: { id: player1.id, x: 100, y: 100, score: 0 },
            player2: { id: player2.id, x: 700, y: 100, score: 0 }
        };
        this.started = false;
    }

    getOpponent(playerId) {
        return this.players.find(p => p.id !== playerId);
    }

    updatePlayerState(playerId, state) {
        if (this.gameState.player1.id === playerId) {
            this.gameState.player1 = { ...this.gameState.player1, ...state };
        } else if (this.gameState.player2.id === playerId) {
            this.gameState.player2 = { ...this.gameState.player2, ...state };
        }
    }
}

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Player joins matchmaking
    socket.on('find-match', (playerData) => {
        const player = {
            id: socket.id,
            name: playerData.name || `Player ${socket.id.substring(0, 4)}`
        };
        
        players.set(socket.id, player);

        // Check if there's a waiting player
        if (waitingPlayers.length > 0) {
            const opponent = waitingPlayers.shift();
            const gameId = `game-${Date.now()}`;
            
            // Create game room
            const gameRoom = new GameRoom(gameId, opponent, player);
            games.set(gameId, gameRoom);

            // Join both players to the room
            socket.join(gameId);
            io.sockets.sockets.get(opponent.id)?.join(gameId);

            // Update player info
            players.get(socket.id).gameId = gameId;
            players.get(opponent.id).gameId = gameId;

            // Notify both players
            io.to(opponent.id).emit('match-found', {
                gameId,
                opponent: player,
                playerNumber: 1
            });

            io.to(socket.id).emit('match-found', {
                gameId,
                opponent: opponent,
                playerNumber: 2
            });

            console.log(`Match created: ${gameId} - ${opponent.name} vs ${player.name}`);
        } else {
            // Add to waiting list
            waitingPlayers.push(player);
            socket.emit('waiting-for-opponent');
            console.log(`${player.name} is waiting for an opponent`);
        }
    });

    // Cancel matchmaking
    socket.on('cancel-matchmaking', () => {
        const index = waitingPlayers.findIndex(p => p.id === socket.id);
        if (index !== -1) {
            waitingPlayers.splice(index, 1);
            console.log(`Player ${socket.id} cancelled matchmaking`);
        }
    });

    // Player sends game state update
    socket.on('player-update', (data) => {
        const player = players.get(socket.id);
        if (!player || !player.gameId) return;

        const game = games.get(player.gameId);
        if (!game) return;

        // Update player state
        game.updatePlayerState(socket.id, data);

        // Broadcast to opponent
        socket.to(player.gameId).emit('opponent-update', {
            playerId: socket.id,
            ...data
        });
    });

    // Game event (e.g., scoring, power-ups, etc.)
    socket.on('game-event', (eventData) => {
        const player = players.get(socket.id);
        if (!player || !player.gameId) return;

        // Broadcast event to all players in the game
        io.to(player.gameId).emit('game-event', {
            playerId: socket.id,
            ...eventData
        });
    });

    // Player ready to start
    socket.on('player-ready', () => {
        const player = players.get(socket.id);
        if (!player || !player.gameId) return;

        const game = games.get(player.gameId);
        if (!game) return;

        // Mark player as ready
        const playerInGame = game.players.find(p => p.id === socket.id);
        if (playerInGame) {
            playerInGame.ready = true;
        }

        // Check if both players are ready
        if (game.players.every(p => p.ready)) {
            game.started = true;
            io.to(player.gameId).emit('game-start', {
                gameState: game.gameState
            });
            console.log(`Game ${player.gameId} started`);
        }
    });

    // Chat message
    socket.on('chat-message', (message) => {
        const player = players.get(socket.id);
        if (!player || !player.gameId) return;

        io.to(player.gameId).emit('chat-message', {
            playerId: socket.id,
            playerName: player.name,
            message: message,
            timestamp: Date.now()
        });
    });

    // Player disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);

        const player = players.get(socket.id);
        
        // Remove from waiting list
        const waitingIndex = waitingPlayers.findIndex(p => p.id === socket.id);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
        }

        // Handle game disconnect
        if (player && player.gameId) {
            const game = games.get(player.gameId);
            if (game) {
                // Notify opponent
                socket.to(player.gameId).emit('opponent-disconnected');
                
                // Clean up game
                games.delete(player.gameId);
                console.log(`Game ${player.gameId} ended due to disconnect`);
            }
        }

        players.delete(socket.id);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        players: players.size,
        games: games.size,
        waiting: waitingPlayers.length
    });
});

server.listen(PORT, () => {
    console.log(`🎮 Multiplayer game server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
