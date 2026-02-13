// Game State Management
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GameState.MENU;
        this.score = 0;
        this.lives = 3;
        this.soundEnabled = true;
        this.animationId = null;
        
        // Multiplayer
        this.isMultiplayer = false;
        this.multiplayer = null;
        this.playerNumber = null;
        this.opponentScore = 0;
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize
        this.setupEventListeners();
        this.showScreen('menu-screen');
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('multiplayer-btn').addEventListener('click', () => this.showMultiplayerScreen());
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });
        
        // Multiplayer buttons
        document.getElementById('find-match-btn').addEventListener('click', () => this.findMatch());
        document.getElementById('cancel-match-btn').addEventListener('click', () => this.cancelMatch());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.showScreen('menu-screen'));
        document.getElementById('ready-btn').addEventListener('click', () => this.playerReady());
        
        // Chat
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.isMultiplayer) {
                this.sendChatMessage();
            }
        });
        
        // Game buttons
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitToMenu());
        
        // Game over buttons
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.quitToMenu());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse/touch controls
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    showMultiplayerScreen() {
        this.showScreen('multiplayer-screen');
        document.getElementById('player-name-input').style.display = 'block';
        document.getElementById('matchmaking-status').style.display = 'none';
        document.getElementById('match-found').style.display = 'none';
    }
    
    findMatch() {
        const playerName = document.getElementById('player-name').value.trim() || 'Player';
        
        if (!this.multiplayer) {
            this.multiplayer = new MultiplayerManager(this);
        }
        
        this.multiplayer.findMatch(playerName);
        
        document.getElementById('player-name-input').style.display = 'none';
        document.getElementById('matchmaking-status').style.display = 'block';
    }
    
    cancelMatch() {
        if (this.multiplayer) {
            this.multiplayer.cancelMatchmaking();
        }
        this.showScreen('menu-screen');
    }
    
    playerReady() {
        if (this.multiplayer) {
            this.multiplayer.sendReady();
        }
        document.getElementById('ready-btn').disabled = true;
        document.getElementById('ready-btn').textContent = 'Waiting...';
    }
    
    showMessage(message) {
        const statusMsg = document.getElementById('status-message');
        if (statusMsg) {
            statusMsg.textContent = message;
        }
    }
    
    showReadyButton() {
        document.getElementById('matchmaking-status').style.display = 'none';
        document.getElementById('match-found').style.display = 'block';
        
        if (this.multiplayer && this.multiplayer.opponent) {
            document.getElementById('opponent-name').textContent = this.multiplayer.opponent.name;
        }
    }
    
    startGame() {
        this.isMultiplayer = false;
        this.state = GameState.PLAYING;
        this.score = 0;
        this.lives = 3;
        this.updateUI();
        this.showScreen('game-screen');
        document.getElementById('opponent-info').style.display = 'none';
        document.getElementById('chat-box').style.display = 'none';
        this.initGame();
        this.gameLoop();
    }
    
    startMultiplayerGame(gameState, playerNumber) {
        this.isMultiplayer = true;
        this.playerNumber = playerNumber;
        this.state = GameState.PLAYING;
        this.score = 0;
        this.lives = 3;
        this.opponentScore = 0;
        this.updateUI();
        this.showScreen('game-screen');
        document.getElementById('opponent-info').style.display = 'block';
        document.getElementById('chat-box').style.display = 'block';
        this.initGame();
        this.gameLoop();
    }
    
    pauseGame() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            this.showScreen('pause-screen');
            cancelAnimationFrame(this.animationId);
        }
    }
    
    resumeGame() {
        if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            this.showScreen('game-screen');
            this.gameLoop();
        }
    }
    
    quitToMenu() {
        this.state = GameState.MENU;
        cancelAnimationFrame(this.animationId);
        this.showScreen('menu-screen');
    }
    
    gameOver() {
        this.state = GameState.GAME_OVER;
        cancelAnimationFrame(this.animationId);
        document.getElementById('final-score').textContent = this.score;
        this.showScreen('game-over-screen');
    }
    
    updateUI() {
        document.getElementById('score-value').textContent = this.score;
        document.getElementById('lives-value').textContent = this.lives;
        
        if (this.isMultiplayer) {
            document.getElementById('opponent-score').textContent = this.opponentScore;
        }
    }
    
    addScore(points) {
        this.score += points;
        this.updateUI();
        
        // Send score update to opponent
        if (this.isMultiplayer && this.multiplayer) {
            this.multiplayer.sendPlayerUpdate({ score: this.score });
        }
    }
    
    loseLife() {
        this.lives--;
        this.updateUI();
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    // Game-specific initialization (customize this for your game)
    initGame() {
        // TODO: Initialize game objects, entities, etc.
        // Example: this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        // Example: this.enemies = [];
        console.log('Game initialized');
    }
    
    // Main game loop
    gameLoop() {
        if (this.state !== GameState.PLAYING) return;
        
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    // Update game logic (customize this for your game)
    update() {
        // TODO: Update game objects, check collisions, etc.
        // Example: this.player.update();
        // Example: this.enemies.forEach(enemy => enemy.update());
        // Example: this.checkCollisions();
        
        // Send player state to opponent (throttled)
        if (this.isMultiplayer && this.multiplayer) {
            // TODO: Send your player position/state
            // Example: this.multiplayer.sendPlayerUpdate({ x: this.player.x, y: this.player.y });
        }
    }
    
    // Render game (customize this for your game)
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // TODO: Draw game objects
        // Example: this.player.draw(this.ctx);
        // Example: this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Draw opponent (if multiplayer)
        if (this.isMultiplayer && this.multiplayer) {
            const opponentState = this.multiplayer.getOpponentState();
            // TODO: Draw opponent based on their state
            // Example: this.drawOpponent(opponentState);
        }
        
        // Example placeholder rendering
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game rendering here', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('Add your game logic!', this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        if (this.isMultiplayer) {
            this.ctx.fillText(`You are Player ${this.playerNumber}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
        }
    }
    
    handleMultiplayerEvent(eventData) {
        // Handle events from opponent
        // Example: if (eventData.type === 'score') this.opponentScore = eventData.score;
        if (eventData.type === 'score') {
            this.opponentScore = eventData.score;
            this.updateUI();
        }
    }
    
    endMultiplayerGame(result) {
        this.isMultiplayer = false;
        if (result === 'win') {
            this.addScore(1000); // Bonus for winning
        }
        this.gameOver();
    }
    
    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message && this.multiplayer) {
            this.multiplayer.sendChatMessage(message);
            input.value = '';
        }
    }
    
    addChatMessage(data) {
        const chatMessages = document.getElementById('chat-messages');
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message';
        messageEl.textContent = `${data.playerName}: ${data.message}`;
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Input handlers (customize for your game)
    handleKeyDown(e) {
        if (this.state !== GameState.PLAYING) return;
        
        // TODO: Handle key presses
        // Example:
        // switch(e.key) {
        //     case 'ArrowLeft': this.player.moveLeft(); break;
        //     case 'ArrowRight': this.player.moveRight(); break;
        //     case ' ': this.player.shoot(); break;
        // }
        
        if (e.key === 'Escape') {
            this.pauseGame();
        }
    }
    
    handleKeyUp(e) {
        if (this.state !== GameState.PLAYING) return;
        
        // TODO: Handle key releases
        // Example:
        // switch(e.key) {
        //     case 'ArrowLeft':
        //     case 'ArrowRight':
        //         this.player.stop();
        //         break;
        // }
    }
    
    handleClick(e) {
        if (this.state !== GameState.PLAYING) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // TODO: Handle clicks
        // Example: this.player.shootAt(x, y);
        console.log('Click at:', x, y);
    }
    
    handleMouseMove(e) {
        if (this.state !== GameState.PLAYING) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // TODO: Handle mouse movement
        // Example: this.player.aimAt(x, y);
    }
}

// Utility functions
const Utils = {
    // Random number between min and max
    random(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // Random integer between min and max
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Distance between two points
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    // Check collision between two rectangles
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },
    
    // Check collision between two circles
    circleCollision(circle1, circle2) {
        const dist = this.distance(circle1.x, circle1.y, circle2.x, circle2.y);
        return dist < circle1.radius + circle2.radius;
    },
    
    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
};

// Example Entity class (customize or remove)
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw(ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
