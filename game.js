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
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
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
    
    startGame() {
        this.state = GameState.PLAYING;
        this.score = 0;
        this.lives = 3;
        this.updateUI();
        this.showScreen('game-screen');
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
    }
    
    addScore(points) {
        this.score += points;
        this.updateUI();
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
    }
    
    // Render game (customize this for your game)
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // TODO: Draw game objects
        // Example: this.player.draw(this.ctx);
        // Example: this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Example placeholder rendering
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game rendering here', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('Add your game logic!', this.canvas.width / 2, this.canvas.height / 2 + 40);
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
