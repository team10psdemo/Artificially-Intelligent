# Rock Paper Scissors - Multiplayer

A real-time multiplayer rock-paper-scissors game built with WebSockets for instant, competitive gameplay.

## Quick Start

[Download Node.js](https://nodejs.org/en/download/)

### Single Player (vs Computer)
1. Install dependencies: `npm install`
2. Start server: `npm start`
3. Open `http://localhost:3000` in your browser
4. Click "Play vs Computer"
5. Make your choice and play best-of-3!

### Multiplayer (vs Real Player)
1. Start server: `npm start`
2. Open `http://localhost:3000` in **two browser windows**
3. Both players click "Multiplayer"
4. Enter your names and click "Find Match"
5. When matched, both click "Ready!"
6. Play rock-paper-scissors in real-time!

See [MULTIPLAYER_SETUP.md](MULTIPLAYER_SETUP.md) for technical details.

## Project Structure

```
├── index.html              # Main HTML structure with game screens
├── styles.css              # Modern responsive styling with two-column layout
├── game.js                 # RPS game logic, turn-based state management
├── multiplayer.js          # Multiplayer client-side WebSocket handler
├── server.js               # Node.js server with matchmaking & game rooms
├── package.json            # Node.js dependencies (Express, Socket.IO)
├── MULTIPLAYER_SETUP.md    # Technical multiplayer documentation
└── README.md               # This file
```

## Features

✅ **Real-time multiplayer** with instant matchmaking  
✅ **Turn-based gameplay** - best of 3 rounds  
✅ **Server-authoritative logic** - cheat-proof game mechanics  
✅ **Secure choice submission** - choices hidden until both players submit  
✅ **Animated countdown reveal** (3-2-1) for dramatic effect  
✅ **Single player vs AI** for practice  
✅ **Live chat** in dedicated sidebar during games  
✅ **Rematch system** to play again with same opponent  
✅ **Responsive design** - works on desktop and mobile  
✅ **WebSocket-based** with Socket.IO for low-latency gameplay  
✅ **Modern UI** with smooth animations and emoji icons  

## How It Works

### Game Flow

1. **Join Lobby** - Enter your name and click "Find Match"
2. **Matchmaking** - Server pairs you with an available opponent
3. **Ready Up** - Both players click "Ready!" to start
4. **Play Rounds** - Best of 3 rounds:
   - Choose rock, paper, or scissors
   - Wait for opponent to choose
   - Watch the dramatic 3-2-1 countdown reveal
   - See who won the round
5. **Game Over** - Final scores displayed, option to rematch

### Game Rules

- **Rock** ✊ beats Scissors ✌️
- **Paper** ✋ beats Rock ✊  
- **Scissors** ✌️ beats Paper ✋
- **Draw** if both choose the same
- **First to win 2 rounds** wins the game (best of 3)

### Chat Feature

During multiplayer games, use the dedicated chat sidebar to communicate with your opponent:
- Type messages in the input box
- Press Enter to send
- Chat history persists throughout the match
- Perfect for friendly banter and trash talk!

### Architecture Highlights

**Server-Side (`server.js`):**
- Matchmaking queue pairs players automatically
- Game rooms manage 1v1 matches
- Choices stored securely server-side (not broadcast)
- Server determines winners (prevents cheating)
- Handles disconnections gracefully

**Client-Side (`game.js` + `multiplayer.js`):**
- Turn-based state machine
- Real-time WebSocket communication
- Animated reveals for dramatic effect
- Dedicated chat sidebar for trash talk

**Security:**
- Server-authoritative game logic
- Validated inputs (only rock/paper/scissors accepted)
- No client-side manipulation possible

## Technology Stack

- **Frontend:** Vanilla JavaScript, HTML5 Canvas, CSS3
- **Backend:** Node.js + Express
- **Real-time:** Socket.IO (WebSocket)
- **No frameworks required!**

## Deployment

Ready to host on the internet? Deploy to:

- **Render** (recommended) - Free tier with WebSocket support
- **Railway** - Simple deployment with no cold starts
- **Fly.io** - Edge locations for global low-latency
- **Heroku** - Classic platform (paid tiers only)

See deployment instructions in [MULTIPLAYER_SETUP.md](MULTIPLAYER_SETUP.md)

## Troubleshooting

**Players can't see buttons:**
- Refresh the page after both players click "Ready!"

**Connection issues:**
- Check server is running: `npm start`
- Verify health: `http://localhost:3000/health`
- Check browser console for errors (F12)

**Matchmaking not working:**
- Both players must be connected to same server
- Check `/health` endpoint to see waiting players count

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT - Build something awesome! 🚀
