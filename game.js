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
        
        // RPS Game state
        this.currentRound = 1;
        this.maxRounds = 3;
        this.myScore = 0;
        this.opponentScore = 0;
        this.myChoice = null;
        this.opponentChoice = null;
        this.gamePhase = 'menu'; // 'menu', 'choosing', 'waiting', 'revealing', 'round-result', 'game-over'
        this.roundResult = null;
        
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
        
        // RPS choice buttons
        document.getElementById('rock-btn')?.addEventListener('click', () => this.makeChoice('rock'));
        document.getElementById('paper-btn')?.addEventListener('click', () => this.makeChoice('paper'));
        document.getElementById('scissors-btn')?.addEventListener('click', () => this.makeChoice('scissors'));
        document.getElementById('next-round-btn')?.addEventListener('click', () => this.nextRound());
        document.getElementById('rematch-btn')?.addEventListener('click', () => this.requestRematch());
        document.getElementById('final-menu-btn')?.addEventListener('click', () => this.quitToMenu());
        
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
        this.currentRound = 1;
        this.myScore = 0;
        this.opponentScore = 0;
        this.myChoice = null;
        this.opponentChoice = null;
        this.gamePhase = 'choosing';
        this.updateUI();
        this.showScreen('game-screen');
        document.getElementById('opponent-info').style.display = 'none';
        document.getElementById('chat-box').style.display = 'none';
        this.initGame();
        this.render();
    }
    
    startMultiplayerGame(gameState, playerNumber) {
        this.isMultiplayer = true;
        this.playerNumber = playerNumber;
        this.state = GameState.PLAYING;
        this.currentRound = 1;
        this.myScore = 0;
        this.opponentScore = 0;
        this.myChoice = null;
        this.opponentChoice = null;
        this.gamePhase = 'choosing';
        this.updateUI();
        this.showScreen('game-screen');
        document.getElementById('opponent-info').style.display = 'block';
        document.getElementById('chat-box').style.display = 'block';
        this.initGame();
        this.render();
    }
    
    pauseGame() {
        if (confirm('Are you sure you want to quit?')) {
            this.quitToMenu();
        }
    }
    
    resumeGame() {
        this.showScreen('game-screen');
    }
    
    quitToMenu() {
        this.state = GameState.MENU;
        this.isMultiplayer = false;
        this.gamePhase = 'menu';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('round-result-screen').style.display = 'none';
        if (this.multiplayer) {
            this.multiplayer.disconnect();
        }
        this.showScreen('menu-screen');
    }
    
    updateUI() {
        document.getElementById('round-number').textContent = this.currentRound;
        document.getElementById('score-value').textContent = this.myScore;
        
        if (this.isMultiplayer) {
            document.getElementById('opponent-score').textContent = this.opponentScore;
        }
    }
    
    initGame() {
        console.log('RPS Game initialized');
        this.gamePhase = 'choosing';
        this.showChoiceButtons();
    }
    
    showChoiceButtons() {
        const choiceButtons = document.getElementById('choice-buttons');
        const waitingMsg = document.getElementById('waiting-message');
        const resultDisplay = document.getElementById('result-display');
        const roundResultScreen = document.getElementById('round-result-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        
        if (choiceButtons) choiceButtons.style.display = 'flex';
        if (waitingMsg) waitingMsg.style.display = 'none';
        if (resultDisplay) resultDisplay.style.display = 'none';
        if (roundResultScreen) roundResultScreen.style.display = 'none';
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        
        ['rock-btn', 'paper-btn', 'scissors-btn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });
    }
    
    hideChoiceButtons() {
        ['rock-btn', 'paper-btn', 'scissors-btn'].forEach(id => {
            document.getElementById(id).disabled = true;
        });
    }
    
    makeChoice(choice) {
        this.myChoice = choice;
        this.gamePhase = 'waiting';
        this.hideChoiceButtons();
        
        document.getElementById('waiting-message').style.display = 'block';
        document.getElementById('waiting-message').textContent = 'Waiting for opponent...';
        
        if (this.multiplayer) {
            this.multiplayer.submitChoice(choice);
        } else {
            this.playAgainstComputer(choice);
        }
        
        this.render();
    }
    
    playAgainstComputer(playerChoice) {
        const choices = ['rock', 'paper', 'scissors'];
        const computerChoice = choices[Math.floor(Math.random() * choices.length)];
        
        setTimeout(() => {
            const mockResult = {
                round: this.currentRound,
                choices: {
                    player: playerChoice,
                    computer: computerChoice
                },
                winnerId: this.determineLocalWinner(playerChoice, computerChoice),
                scores: {
                    player: this.myScore,
                    computer: this.opponentScore
                },
                gameOver: this.currentRound >= this.maxRounds
            };
            
            this.onRoundResult(mockResult);
        }, 1000);
    }
    
    determineLocalWinner(choice1, choice2) {
        if (choice1 === choice2) return 'draw';
        if (
            (choice1 === 'rock' && choice2 === 'scissors') ||
            (choice1 === 'paper' && choice2 === 'rock') ||
            (choice1 === 'scissors' && choice2 === 'paper')
        ) {
            return 'player';
        }
        return 'computer';
    }
    
    onChoiceConfirmed() {
        console.log('Choice confirmed by server');
    }
    
    async onRoundResult(result) {
        this.gamePhase = 'revealing';
        
        const myId = this.multiplayer ? this.multiplayer.socket.id : 'player';
        this.myChoice = result.choices[myId] || result.choices.player;
        
        const opponentId = Object.keys(result.choices).find(id => id !== myId);
        this.opponentChoice = result.choices[opponentId];
        
        this.myScore = result.scores[myId] || result.scores.player || 0;
        this.opponentScore = result.scores[opponentId] || result.scores.computer || 0;
        
        document.getElementById('waiting-message').style.display = 'none';
        
        await this.animateReveal();
        
        const winnerId = result.winnerId;
        let resultText = '';
        if (winnerId === 'draw') {
            resultText = "It's a Draw!";
        } else if (winnerId === myId || winnerId === 'player') {
            resultText = 'You Win This Round!';
        } else {
            resultText = 'You Lose This Round!';
        }
        
        this.roundResult = resultText;
        this.updateUI();
        
        if (result.gameOver) {
            setTimeout(() => {
                this.showFinalResults({
                    winnerId: this.myScore > this.opponentScore ? myId : (this.myScore < this.opponentScore ? opponentId : 'draw'),
                    finalScores: result.scores
                });
            }, 2000);
        } else {
            this.gamePhase = 'round-result';
            this.showRoundResultScreen(resultText);
        }
    }
    
    async animateReveal() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        for (let i = 3; i >= 1; i--) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '72px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(i, canvas.width / 2, canvas.height / 2);
            await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        this.render();
    }
    
    showRoundResultScreen(resultText) {
        document.getElementById('round-result-screen').style.display = 'block';
        document.getElementById('round-result-text').textContent = resultText;
        document.getElementById('choice-buttons').style.display = 'none';
    }
    
    nextRound() {
        this.currentRound++;
        this.myChoice = null;
        this.opponentChoice = null;
        this.roundResult = null;
        this.gamePhase = 'choosing';
        this.showChoiceButtons();
        this.render();
    }
    
    showFinalResults(data) {
        this.gamePhase = 'game-over';
        const myId = this.multiplayer ? this.multiplayer.socket.id : 'player';
        
        let resultText = '';
        if (data.winnerId === 'draw') {
            resultText = "It's a Tie!";
        } else if (data.winnerId === myId || data.winnerId === 'player') {
            resultText = 'You Win!';
        } else {
            resultText = 'You Lose!';
        }
        
        document.getElementById('final-result-text').textContent = resultText;
        document.getElementById('final-my-score').textContent = this.myScore;
        document.getElementById('final-opponent-score').textContent = this.opponentScore;
        document.getElementById('game-over-screen').style.display = 'block';
        document.getElementById('round-result-screen').style.display = 'none';
        document.getElementById('choice-buttons').style.display = 'none';
        
        if (this.isMultiplayer) {
            document.getElementById('rematch-section').style.display = 'block';
        } else {
            document.getElementById('rematch-section').style.display = 'none';
        }
    }
    
    onGameOver(data) {
        this.showFinalResults(data);
    }
    
    onOpponentDisconnected() {
        alert('Opponent disconnected! Returning to menu.');
        this.quitToMenu();
    }
    
    showRematchRequest() {
        const rematchStatus = document.getElementById('rematch-status');
        if (rematchStatus) {
            rematchStatus.textContent = 'Opponent wants a rematch!';
        }
    }
    
    requestRematch() {
        if (this.multiplayer) {
            this.multiplayer.requestRematch();
            const rematchStatus = document.getElementById('rematch-status');
            if (rematchStatus) {
                rematchStatus.textContent = 'Waiting for opponent...';
            }
            document.getElementById('rematch-btn').disabled = true;
        }
    }
    
    startRematch() {
        this.currentRound = 1;
        this.myScore = 0;
        this.opponentScore = 0;
        this.myChoice = null;
        this.opponentChoice = null;
        this.roundResult = null;
        this.gamePhase = 'choosing';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('rematch-btn').disabled = false;
        const rematchStatus = document.getElementById('rematch-status');
        if (rematchStatus) {
            rematchStatus.textContent = '';
        }
        this.updateUI();
        this.showChoiceButtons();
        this.render();
    }
    
    render() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        
        if (this.gamePhase === 'choosing') {
            ctx.fillStyle = '#fff';
            ctx.font = '32px Arial';
            ctx.fillText('Make Your Choice!', canvas.width / 2, canvas.height / 2 - 50);
            ctx.font = '20px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText(`Round ${this.currentRound} of ${this.maxRounds}`, canvas.width / 2, canvas.height / 2);
        } else if (this.gamePhase === 'waiting') {
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.fillText('Waiting for opponent...', canvas.width / 2, canvas.height / 2);
            
            if (this.myChoice) {
                ctx.font = '18px Arial';
                ctx.fillStyle = '#4CAF50';
                ctx.fillText(`Your choice: ${this.myChoice.toUpperCase()}`, canvas.width / 2, canvas.height / 2 + 40);
            }
        } else if (this.gamePhase === 'revealing' || this.gamePhase === 'round-result') {
            const spacing = canvas.width / 3;
            
            ctx.font = '20px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('You', spacing, 100);
            ctx.fillText('Opponent', spacing * 2, 100);
            
            ctx.font = '48px Arial';
            ctx.fillStyle = '#4CAF50';
            ctx.fillText(this.getChoiceEmoji(this.myChoice), spacing, canvas.height / 2);
            
            ctx.fillStyle = '#f44336';
            ctx.fillText(this.getChoiceEmoji(this.opponentChoice), spacing * 2, canvas.height / 2);
            
            if (this.roundResult) {
                ctx.font = '28px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.fillText(this.roundResult, canvas.width / 2, canvas.height - 80);
            }
            
            ctx.font = '20px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Score: ${this.myScore} - ${this.opponentScore}`, canvas.width / 2, canvas.height - 40);
        }
    }
    
    getChoiceEmoji(choice) {
        const emojis = {
            'rock': '✊',
            'paper': '✋',
            'scissors': '✌️'
        };
        return emojis[choice] || '?';
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
    
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.state === GameState.PLAYING) {
            this.pauseGame();
        }
    }
    
    handleKeyUp(e) {
        // Not needed for RPS
    }
    
    handleClick(e) {
        // Not needed for RPS
    }
    
    handleMouseMove(e) {
        // Not needed for RPS
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
