# Artificially-Intelligent

Hackathon game project - a flexible web-based game starter template.

## Quick Start

1. Open `index.html` in a web browser
2. Start customizing the game logic in `game.js`
3. Adjust styles in `styles.css`

## Project Structure

```
├── index.html          # Main HTML structure with game screens
├── styles.css          # Styling and responsive design
├── game.js             # Game logic, state management, and utilities
└── README.md           # This file
```

## Features

✅ **Complete game state management** (menu, playing, paused, game over)  
✅ **Responsive canvas** that adapts to screen size  
✅ **Input handling** (keyboard, mouse, touch)  
✅ **Score and lives system**  
✅ **Settings panel** (sound toggle, easily extensible)  
✅ **Modern UI** with smooth transitions and gradients  
✅ **Utility functions** for common game operations  
✅ **Clean architecture** ready for rapid development  

## Customization Guide

### Adding Your Game Logic

The template is designed to be game-agnostic. Here's where to add your specific game:

1. **Initialize game objects** in `initGame()` method
2. **Update game logic** in `update()` method
3. **Render graphics** in `render()` method
4. **Handle inputs** in the input handler methods

### Example: Creating a Simple Game

```javascript
// In initGame()
this.player = { x: this.canvas.width / 2, y: this.canvas.height / 2, size: 20 };
this.enemies = [];

// In update()
// Move player, update enemies, check collisions

// In render()
this.ctx.fillStyle = '#00ff00';
this.ctx.fillRect(this.player.x, this.player.y, this.player.size, this.player.size);
```

### Adding More Screens

1. Add a new div with class "screen" in `index.html`
2. Use `this.showScreen('your-screen-id')` to display it

### Extending Settings

Add new settings in the `#settings` div and handle them in the Game class.

## Tips for Hackathon

- **Start simple**: Get basic gameplay working first
- **Use the Entity class**: Extend it for players, enemies, projectiles
- **Leverage Utils**: Pre-built collision detection and math helpers
- **Test frequently**: The game runs immediately in the browser
- **Mobile-friendly**: Canvas and UI are already responsive

## Adding Assets Later

If you need images or sounds:

```javascript
// Images
const img = new Image();
img.src = 'path/to/image.png';
img.onload = () => { /* ready to use */ };

// Audio
const audio = new Audio('path/to/sound.mp3');
if (this.soundEnabled) audio.play();
```

## Common Game Types This Supports

- **Arcade games** (Space Invaders, Breakout)
- **Platformers** (with gravity and collision)
- **Puzzle games** (Tetris, Match-3)
- **Shooter games** (top-down or side-scrolling)
- **Clicker/idle games**
- **Physics-based games**

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge). No build tools or dependencies required!

## Development

No installation needed! Just open `index.html` in your browser and start coding. Use browser dev tools (F12) for debugging.

## License

MIT - Build something awesome! 🚀
