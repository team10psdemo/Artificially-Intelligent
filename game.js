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
        

        this.playerName = null;
        this.currentGameMode = null; // 'computer' or 'multiplayer'
        this.highscores = []; // Current highscore list to display
      
        // Animation state
        this.animationTime = 0;
        this.floatingEmojis = [];
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize
        this.setupEventListeners();
        this.showScreen('menu-screen');
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        if (this.floatingEmojis.length > 0) {
            this.initFloatingEmojis();
        }
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('start-btn').addEventListener('click', () => this.showComputerScreen());
        document.getElementById('multiplayer-btn').addEventListener('click', () => this.showMultiplayerScreen());
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            if (typeof audioManager !== 'undefined') {
                audioManager.setEnabled(e.target.checked);
                if (e.target.checked) {
                    audioManager.playButtonClick();
                }
            }
        });
        
        // Computer mode buttons
        document.getElementById('start-computer-btn').addEventListener('click', () => this.startComputerGameWithName());
        document.getElementById('back-to-menu-computer-btn').addEventListener('click', () => this.showScreen('menu-screen'));
        
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
    
    showComputerScreen() {
        this.showScreen('computer-screen');
        document.getElementById('computer-name-input').style.display = 'block';
    }
    
    showMultiplayerScreen() {
        this.showScreen('multiplayer-screen');
        document.getElementById('player-name-input').style.display = 'block';
        document.getElementById('matchmaking-status').style.display = 'none';
        document.getElementById('match-found').style.display = 'none';
    }
    
    startComputerGameWithName() {
        const playerName = document.getElementById('computer-player-name').value.trim() || 'Player';
        this.playerName = playerName;
        this.startGame();
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
        this.currentGameMode = 'computer';
        this.state = GameState.PLAYING;
        this.currentRound = 1;
        this.myScore = 0;
        this.opponentScore = 0;
        this.myChoice = null;
        this.opponentChoice = null;
        this.gamePhase = 'choosing';
        this.updateUI();
        this.showScreen('game-screen');
        document.getElementById('opponent-info').style.display = 'inline';
        document.getElementById('opponent-label').textContent = 'Computer:';
        document.getElementById('chat-box').style.display = 'none';
        document.getElementById('highscore-box').style.display = 'flex';
        
        if (typeof audioManager !== 'undefined') {
            audioManager.playButtonClick();
            audioManager.playThemeMusic();
        }
        
        this.initGame();
        this.render();
        
        // Ensure Socket.IO connection exists for highscore updates
        if (!this.multiplayer) {
            this.multiplayer = new MultiplayerManager(this);
            this.multiplayer.connect();
        } else if (!this.multiplayer.connected) {
            this.multiplayer.connect();
        }
        
        // Request and display computer highscores
        this.requestHighscores('computer');
        
        setTimeout(() => {
            this.resizeCanvas();
            this.initFloatingEmojis();
            this.initGame();
        }, 50);
    }
    
    startMultiplayerGame(gameState, playerNumber) {
        this.isMultiplayer = true;
        this.currentGameMode = 'multiplayer';
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
        document.getElementById('highscore-box').style.display = 'flex';
        
        if (typeof audioManager !== 'undefined') {
            audioManager.playThemeMusic();
        }
        
        this.initGame();
        this.render();
        
        // Request and display multiplayer highscores
        this.requestHighscores('multiplayer');
        document.getElementById('chat-box').style.display = 'flex';
        
        setTimeout(() => {
            this.resizeCanvas();
            this.initFloatingEmojis();
            this.initGame();
        }, 50);
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
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('round-result-screen').style.display = 'none';
        document.getElementById('highscore-box').style.display = 'none';
        if (this.multiplayer) {
            this.multiplayer.disconnect();
        }
        if (typeof audioManager !== 'undefined') {
            audioManager.stopMusic();
        }
        this.showScreen('menu-screen');
    }
    
    updateUI() {
        document.getElementById('round-number').textContent = this.currentRound;
        document.getElementById('score-value').textContent = this.myScore;
        document.getElementById('opponent-score').textContent = this.opponentScore;
    }
    
    initGame() {
        console.log('RPS Game initialized');
        this.gamePhase = 'choosing';
        
        if (this.floatingEmojis.length === 0) {
            this.initFloatingEmojis();
        }
        
        this.showChoiceButtons();
        this.startAnimationLoop();
    }
    
    initFloatingEmojis() {
        this.floatingEmojis = [];
        const emojis = ['✊', '✋', '✌️'];
        const width = this.canvas ? this.canvas.width : 800;
        const height = this.canvas ? this.canvas.height : 500;
        
        for (let i = 0; i < 10; i++) {
            this.floatingEmojis.push({
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.04
            });
        }
    }
    
    updateFloatingEmojis() {
        if (!this.canvas) return;
        
        this.floatingEmojis.forEach(emoji => {
            emoji.x += emoji.vx;
            emoji.y += emoji.vy;
            emoji.rotation += emoji.rotationSpeed;
            
            if (emoji.x < -50) emoji.x = this.canvas.width + 50;
            if (emoji.x > this.canvas.width + 50) emoji.x = -50;
            if (emoji.y < -50) emoji.y = this.canvas.height + 50;
            if (emoji.y > this.canvas.height + 50) emoji.y = -50;
        });
    }
    
    startAnimationLoop() {
        if (this.animationId) {
            return;
        }
        
        const animate = () => {
            if (this.state === GameState.PLAYING) {
                this.animationTime += 0.016;
                this.updateFloatingEmojis();
                this.render();
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.animationId = null;
            }
        };
        this.animationId = requestAnimationFrame(animate);
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
        
        if (typeof audioManager !== 'undefined') {
            audioManager.playButtonClick();
        }
        
        document.getElementById('waiting-message').style.display = 'block';
        document.getElementById('waiting-message').textContent = 'Waiting for opponent...';
        
        if (this.isMultiplayer) {
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
            const winnerId = this.determineLocalWinner(playerChoice, computerChoice);
            
            // Increment scores based on winner
            if (winnerId === 'player') {
                this.myScore++;
            } else if (winnerId === 'computer') {
                this.opponentScore++;
            }
          
            // Draw: no score increment
            
            const mockResult = {
                round: this.currentRound,
                choices: {
                    player: playerChoice,
                    computer: computerChoice
                },
                winnerId: winnerId,
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
        // Server confirmed choice received
    }
    
    async onRoundResult(result) {
        this.gamePhase = 'revealing';
        
        const myId = this.isMultiplayer ? this.multiplayer.socket.id : 'player';
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
            if (typeof audioManager !== 'undefined') {
                audioManager.playDrawSound();
            }
        } else if (winnerId === myId || winnerId === 'player') {
            resultText = 'You Win This Round!';
            if (typeof audioManager !== 'undefined') {
                audioManager.playWinSound();
            }
        } else {
            resultText = 'You Lose This Round!';
            if (typeof audioManager !== 'undefined') {
                audioManager.playLoseSound();
            }
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
            if (typeof audioManager !== 'undefined') {
                audioManager.playCountdownTick();
            }
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '72px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(i, canvas.width / 2, canvas.height / 2);
            await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        if (typeof audioManager !== 'undefined') {
            audioManager.playRevealSound();
        }
        
        this.render();
    }
    
    showRoundResultScreen(resultText) {
        document.getElementById('round-result-screen').style.display = 'block';
        document.getElementById('round-result-text').textContent = resultText;
        document.getElementById('choice-buttons').style.display = 'none';
        
        const choiceInfo = document.getElementById('round-choices-display');
        if (choiceInfo) {
            choiceInfo.innerHTML = `
                <div class="choice-reveal">
                    <div class="player-choice">
                        <span class="choice-emoji">${this.getChoiceEmoji(this.myChoice)}</span>
                        <span class="choice-label">You: ${this.myChoice}</span>
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="opponent-choice">
                        <span class="choice-emoji">${this.getChoiceEmoji(this.opponentChoice)}</span>
                        <span class="choice-label">Opponent: ${this.opponentChoice}</span>
                    </div>
                </div>
            `;
        }
    }
    
    nextRound() {
        this.currentRound++;
        this.myChoice = null;
        this.opponentChoice = null;
        this.roundResult = null;
        this.gamePhase = 'choosing';
        this.showChoiceButtons();
        if (!this.animationId) {
            this.startAnimationLoop();
        }
    }
    
    showFinalResults(data) {
        this.gamePhase = 'game-over';
        const myId = this.isMultiplayer ? this.multiplayer.socket.id : 'player';
        
        let resultText = '';
        if (data.winnerId === 'draw') {
            resultText = "It's a Tie!";
            if (typeof audioManager !== 'undefined') {
                audioManager.playDrawSound();
            }
        } else if (data.winnerId === myId || data.winnerId === 'player') {
            resultText = 'You Win!';
            if (typeof audioManager !== 'undefined') {
                setTimeout(() => audioManager.playWinSound(), 300);
            }
        } else {
            resultText = 'You Lose!';
            if (typeof audioManager !== 'undefined') {
                setTimeout(() => audioManager.playLoseSound(), 300);
            }
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
            // Update computer highscore
            this.updateComputerHighscore(data);
        }
    }
    
    updateComputerHighscore(data) {
        if (!this.playerName) return;
        
        const isTie = data.winnerId === 'draw';
        const won = !isTie && (data.winnerId === 'player');
        
        if (this.multiplayer && this.multiplayer.socket && this.multiplayer.connected) {
            this.multiplayer.socket.emit('update-highscore-computer', {
                playerName: this.playerName,
                isTie: isTie,
                won: won
            });
        }
    }
    
    requestHighscores(mode) {
        if (this.multiplayer && this.multiplayer.socket && this.multiplayer.connected) {
            this.multiplayer.requestHighscores(mode);
        } else if (this.multiplayer) {
            // Wait for connection
            setTimeout(() => {
                if (this.multiplayer && this.multiplayer.socket && this.multiplayer.connected) {
                    this.multiplayer.requestHighscores(mode);
                }
            }, 500);
        }
    }
    
    displayHighscores(highscores, mode) {
        const highscoreList = document.getElementById('highscore-list');
        if (!highscoreList) return;
        
        highscoreList.innerHTML = '';
        
        if (highscores.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'highscore-item';
            emptyMsg.textContent = 'No scores yet';
            emptyMsg.style.textAlign = 'center';
            highscoreList.appendChild(emptyMsg);
        } else {
            highscores.forEach(entry => {
                const item = document.createElement('div');
                item.className = 'highscore-item';
                
                const rank = document.createElement('span');
                rank.className = 'highscore-rank';
                rank.textContent = `#${entry.rank}`;
                
                const name = document.createElement('span');
                name.className = 'highscore-name';
                name.textContent = entry.name;
                
                const score = document.createElement('span');
                score.className = 'highscore-score';
                score.textContent = entry.score;
                
                item.appendChild(rank);
                item.appendChild(name);
                item.appendChild(score);
                highscoreList.appendChild(item);
            });
        }
    }
    
    onGameOver(data) {
        this.showFinalResults(data);
        // Request updated highscores for multiplayer
        if (this.isMultiplayer) {
            this.requestHighscores('multiplayer');
        }
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
        this.initFloatingEmojis();
        if (!this.animationId) {
            this.startAnimationLoop();
        }
    }
    
    render() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        if (!canvas || !ctx) return;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        this.drawFloatingEmojis(ctx);
        
        ctx.textAlign = 'center';
        
        if (this.gamePhase === 'choosing') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, canvas.height / 2 - 100, canvas.width, 150);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Arial';
            ctx.fillText('Make Your Choice!', canvas.width / 2, canvas.height / 2 - 30);
            ctx.font = '22px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`Round ${this.currentRound} of ${this.maxRounds}`, canvas.width / 2, canvas.height / 2 + 20);
        } else if (this.gamePhase === 'waiting') {
            const pulseSize = Math.sin(this.animationTime * 3) * 10 + 60;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, canvas.height / 2 - 120, canvas.width, 200);
            
            ctx.font = `${pulseSize}px Arial`;
            ctx.fillStyle = '#4CAF50';
            ctx.fillText(this.getChoiceEmoji(this.myChoice), canvas.width / 2, canvas.height / 2 - 20);
            
            ctx.font = '18px Arial';
            ctx.fillStyle = '#4CAF50';
            ctx.fillText(`You chose: ${this.myChoice.toUpperCase()}`, canvas.width / 2, canvas.height / 2 + 30);
            
            ctx.font = '24px Arial';
            ctx.fillStyle = '#fff';
            const dots = '.'.repeat((Math.floor(this.animationTime * 2) % 3) + 1);
            ctx.fillText(`Waiting for opponent${dots}`, canvas.width / 2, canvas.height / 2 + 70);
        } else if (this.gamePhase === 'revealing' || this.gamePhase === 'round-result') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const leftX = canvas.width * 0.3;
            const rightX = canvas.width * 0.7;
            const centerY = canvas.height / 2;
            
            ctx.font = '24px Arial';
            ctx.fillStyle = '#4CAF50';
            ctx.fillText('YOU', leftX, 80);
            
            ctx.fillStyle = '#f44336';
            ctx.fillText('OPPONENT', rightX, 80);
            
            ctx.font = '80px Arial';
            ctx.fillStyle = '#4CAF50';
            ctx.fillText(this.getChoiceEmoji(this.myChoice), leftX, centerY);
            
            ctx.fillStyle = '#f44336';
            ctx.fillText(this.getChoiceEmoji(this.opponentChoice), rightX, centerY);
            
            ctx.font = '18px Arial';
            ctx.fillStyle = '#4CAF50';
            ctx.fillText(this.myChoice.toUpperCase(), leftX, centerY + 50);
            
            ctx.fillStyle = '#f44336';
            ctx.fillText(this.opponentChoice.toUpperCase(), rightX, centerY + 50);
            
            ctx.font = '72px Arial';
            ctx.fillStyle = '#666';
            const scale = Math.sin(this.animationTime * 4) * 0.1 + 1;
            ctx.save();
            ctx.translate(canvas.width / 2, centerY);
            ctx.scale(scale, scale);
            ctx.fillText('VS', 0, 10);
            ctx.restore();
            
            if (this.roundResult) {
                ctx.font = 'bold 32px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 20;
                ctx.fillText(this.roundResult, canvas.width / 2, canvas.height - 80);
                ctx.shadowBlur = 0;
            }
            
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Score: ${this.myScore} - ${this.opponentScore}`, canvas.width / 2, canvas.height - 35);
        }
    }
    
    drawFloatingEmojis(ctx) {
        if (!this.floatingEmojis || this.floatingEmojis.length === 0) {
            return;
        }
        
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.font = '45px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        this.floatingEmojis.forEach(emoji => {
            ctx.save();
            ctx.translate(emoji.x, emoji.y);
            ctx.rotate(emoji.rotation);
            ctx.fillStyle = '#fff';
            ctx.fillText(emoji.emoji, 0, 0);
            ctx.restore();
        });
        
        ctx.restore();
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
