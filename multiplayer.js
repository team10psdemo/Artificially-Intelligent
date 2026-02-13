// Multiplayer client-side handler
class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.gameId = null;
        this.playerNumber = null;
        this.opponent = null;
        this.opponentState = {};
        this.isMultiplayer = false;
    }

    connect() {
        // Connect to Socket.IO server
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
            if (this.isMultiplayer) {
                this.game.showMessage('Disconnected from server');
            }
        });

        this.socket.on('waiting-for-opponent', () => {
            console.log('Waiting for opponent...');
            this.game.showMessage('Searching for opponent...');
        });

        this.socket.on('match-found', (data) => {
            console.log('Match found!', data);
            this.gameId = data.gameId;
            this.playerNumber = data.playerNumber;
            this.opponent = data.opponent;
            this.isMultiplayer = true;
            
            this.game.showMessage(`Matched with ${data.opponent.name}!`);
            
            // Show ready button
            this.game.showReadyButton();
        });

        this.socket.on('game-start', (data) => {
            console.log('Game starting!', data);
            this.game.startMultiplayerGame(data.gameState, this.playerNumber);
        });

        this.socket.on('opponent-update', (data) => {
            // Update opponent's state
            this.opponentState = data;
        });

        this.socket.on('game-event', (eventData) => {
            // Handle game events from opponent
            this.game.handleMultiplayerEvent(eventData);
        });

        this.socket.on('opponent-disconnected', () => {
            this.game.showMessage('Opponent disconnected. You win!');
            this.game.endMultiplayerGame('win');
        });

        this.socket.on('chat-message', (data) => {
            this.game.addChatMessage(data);
        });
    }

    findMatch(playerName) {
        if (!this.connected) {
            this.connect();
            // Wait a bit for connection
            setTimeout(() => {
                this.socket.emit('find-match', { name: playerName });
            }, 500);
        } else {
            this.socket.emit('find-match', { name: playerName });
        }
    }

    cancelMatchmaking() {
        if (this.socket) {
            this.socket.emit('cancel-matchmaking');
        }
    }

    sendPlayerUpdate(state) {
        if (this.socket && this.connected && this.isMultiplayer) {
            this.socket.emit('player-update', state);
        }
    }

    sendGameEvent(eventType, eventData) {
        if (this.socket && this.connected && this.isMultiplayer) {
            this.socket.emit('game-event', {
                type: eventType,
                ...eventData
            });
        }
    }

    sendReady() {
        if (this.socket && this.connected) {
            this.socket.emit('player-ready');
        }
    }

    sendChatMessage(message) {
        if (this.socket && this.connected && this.isMultiplayer) {
            this.socket.emit('chat-message', message);
        }
    }

    getOpponentState() {
        return this.opponentState;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected = false;
        this.isMultiplayer = false;
        this.gameId = null;
        this.opponent = null;
    }
}

// Export for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiplayerManager;
}
