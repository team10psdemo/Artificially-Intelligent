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

// Highscore storage
const computerHighscores = new Map(); // playerName -> totalWins
const multiplayerHighscores = new Map(); // playerName -> totalWins

class RPSGameRoom {
    constructor(gameId, player1, player2) {
        this.gameId = gameId;
        this.players = [player1, player2];
        this.currentRound = 1;
        this.maxRounds = 3;
        this.scores = {
            [player1.id]: 0,
            [player2.id]: 0
        };
        this.roundChoices = {
            [player1.id]: null,
            [player2.id]: null
        };
        this.started = false;
        this.phase = 'waiting';
    }

    getOpponent(playerId) {
        return this.players.find(p => p.id !== playerId);
    }

    submitChoice(playerId, choice) {
        if (!['rock', 'paper', 'scissors'].includes(choice)) {
            return false;
        }
        this.roundChoices[playerId] = choice;
        return true;
    }

    bothChoicesSubmitted() {
        return this.roundChoices[this.players[0].id] !== null && 
               this.roundChoices[this.players[1].id] !== null;
    }

    determineWinner() {
        const player1Id = this.players[0].id;
        const player2Id = this.players[1].id;
        const choice1 = this.roundChoices[player1Id];
        const choice2 = this.roundChoices[player2Id];

        let winnerId = null;
        if (choice1 === choice2) {
            winnerId = 'draw';
        } else if (
            (choice1 === 'rock' && choice2 === 'scissors') ||
            (choice1 === 'paper' && choice2 === 'rock') ||
            (choice1 === 'scissors' && choice2 === 'paper')
        ) {
            winnerId = player1Id;
            this.scores[player1Id]++;
        } else {
            winnerId = player2Id;
            this.scores[player2Id]++;
        }

        const result = {
            round: this.currentRound,
            choices: {
                [player1Id]: choice1,
                [player2Id]: choice2
            },
            winnerId: winnerId,
            scores: this.scores,
            gameOver: this.currentRound >= this.maxRounds
        };

        if (!result.gameOver) {
            this.currentRound++;
            this.roundChoices[player1Id] = null;
            this.roundChoices[player2Id] = null;
        }

        return result;
    }

    reset() {
        this.currentRound = 1;
        this.scores[this.players[0].id] = 0;
        this.scores[this.players[1].id] = 0;
        this.roundChoices[this.players[0].id] = null;
        this.roundChoices[this.players[1].id] = null;
        this.phase = 'waiting';
    }
}

// Helper function to get top N highscores from a Map
function getTopHighscores(highscoreMap, limit = 10) {
    const entries = Array.from(highscoreMap.entries());
    entries.sort((a, b) => b[1] - a[1]); // Sort by score descending
    return entries.slice(0, limit).map((entry, index) => ({
        name: entry[0],
        score: entry[1],
        rank: index + 1
    }));
}

// Helper function to broadcast highscore updates to all clients
function broadcastHighscores(mode) {
    const highscoreMap = mode === 'computer' ? computerHighscores : multiplayerHighscores;
    const topHighscores = getTopHighscores(highscoreMap, 10);
    io.emit('highscores-updated', { mode, highscores: topHighscores });
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
            const gameRoom = new RPSGameRoom(gameId, opponent, player);
            games.set(gameId, gameRoom);

            // Join both players to the room
            socket.join(gameId);
            const opponentSocket = io.sockets.sockets.get(opponent.id);
            if (opponentSocket) {
                opponentSocket.join(gameId);
            }

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

    // Player submits their choice (rock/paper/scissors)
    socket.on('submit-choice', (choice) => {
        const player = players.get(socket.id);
        if (!player || !player.gameId) return;

        const game = games.get(player.gameId);
        if (!game || !game.started) return;

        const validChoice = game.submitChoice(socket.id, choice);
        
        if (!validChoice) {
            socket.emit('error', { message: 'Invalid choice' });
            return;
        }

        socket.emit('choice-confirmed');

        if (game.bothChoicesSubmitted()) {
            const result = game.determineWinner();
            io.to(player.gameId).emit('round-result', result);

            if (result.gameOver) {
                const finalWinnerId = result.scores[game.players[0].id] > result.scores[game.players[1].id] 
                    ? game.players[0].id 
                    : (result.scores[game.players[0].id] < result.scores[game.players[1].id] 
                        ? game.players[1].id 
                        : 'draw');
                
                // Update multiplayer highscores
                const player1 = game.players[0];
                const player2 = game.players[1];
                const player1Data = players.get(player1.id);
                const player2Data = players.get(player2.id);
                const player1Name = (player1Data && player1Data.name) || 'Unknown';
                const player2Name = (player2Data && player2Data.name) || 'Unknown';
                
                if (finalWinnerId === 'draw') {
                    // Both players get 0.5 points
                    const currentScore1 = multiplayerHighscores.get(player1Name) || 0;
                    const currentScore2 = multiplayerHighscores.get(player2Name) || 0;
                    multiplayerHighscores.set(player1Name, currentScore1 + 0.5);
                    multiplayerHighscores.set(player2Name, currentScore2 + 0.5);
                } else if (finalWinnerId === player1.id) {
                    // Player 1 wins
                    const currentScore = multiplayerHighscores.get(player1Name) || 0;
                    multiplayerHighscores.set(player1Name, currentScore + 1);
                } else {
                    // Player 2 wins
                    const currentScore = multiplayerHighscores.get(player2Name) || 0;
                    multiplayerHighscores.set(player2Name, currentScore + 1);
                }
                
                // Broadcast updated highscores
                broadcastHighscores('multiplayer');
                
                io.to(player.gameId).emit('game-over', {
                    winnerId: finalWinnerId,
                    finalScores: result.scores
                });
            }
        }
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

    // Rematch request
    socket.on('request-rematch', () => {
        const player = players.get(socket.id);
        if (!player || !player.gameId) return;

        const game = games.get(player.gameId);
        if (!game) return;

        const playerInGame = game.players.find(p => p.id === socket.id);
        if (playerInGame) {
            playerInGame.wantsRematch = true;
        }

        socket.to(player.gameId).emit('opponent-wants-rematch');

        if (game.players.every(p => p.wantsRematch)) {
            game.reset();
            game.players.forEach(p => {
                p.ready = false;
                p.wantsRematch = false;
            });
            io.to(player.gameId).emit('rematch-ready');
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

    // Request highscores
    socket.on('request-highscores', (data) => {
        const mode = data.mode; // 'computer' or 'multiplayer'
        const highscoreMap = mode === 'computer' ? computerHighscores : multiplayerHighscores;
        const topHighscores = getTopHighscores(highscoreMap, 10);
        socket.emit('highscores-data', { mode, highscores: topHighscores });
    });

    // Update computer highscore
    socket.on('update-highscore-computer', (data) => {
        const playerName = data.playerName;
        const isTie = data.isTie;
        const won = data.won;
        
        if (isTie) {
            const currentScore = computerHighscores.get(playerName) || 0;
            computerHighscores.set(playerName, currentScore + 0.5);
        } else if (won) {
            const currentScore = computerHighscores.get(playerName) || 0;
            computerHighscores.set(playerName, currentScore + 1);
        }
        
        // Broadcast updated highscores
        broadcastHighscores('computer');
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
