const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

let gameState = {
  players: {},
  apples: [],
};

function generateApple() {
  return {
    x: Math.floor(Math.random() * 40),
    y: Math.floor(Math.random() * 30)
  };
}

function resetPlayer(id) {
  return {
    snake: [{ x: Math.floor(Math.random() * 40), y: Math.floor(Math.random() * 30) }],
    dir: { x: 0, y: 0 },
    score: 0,
    sprinting: false,
    sprintCooldown: 0,
  };
}

io.on('connection', socket => {
  console.log(`🟢 ${socket.id} connected`);

  gameState.players[socket.id] = resetPlayer(socket.id);

  socket.on('direction', dir => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].dir = dir;
    }
  });

  socket.on('sprint', isSprinting => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].sprinting = isSprinting;
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔴 ${socket.id} disconnected`);
    delete gameState.players[socket.id];
  });
});

function gameLoop() {
  for (let id in gameState.players) {
    const player = gameState.players[id];
    if (!player) continue;

    const head = { ...player.snake[0] };
    head.x += player.dir.x;
    head.y += player.dir.y;

    // Mur
    if (head.x < 0 || head.x >= 40 || head.y < 0 || head.y >= 30) {
      gameState.players[id] = resetPlayer(id);
      continue;
    }

    // Collision avec soi
    if (player.snake.some((segment, i) => i !== 0 && segment.x === head.x && segment.y === head.y)) {
      gameState.players[id] = resetPlayer(id);
      continue;
    }

    // Collision avec autres
    for (let otherId in gameState.players) {
      if (otherId !== id) {
        if (gameState.players[otherId].snake.some(s => s.x === head.x && s.y === head.y)) {
          gameState.players[id] = resetPlayer(id);
          break;
        }
      }
    }

    player.snake.unshift(head);

    // Mange une pomme ?
    let ate = false;
    for (let i = 0; i < gameState.apples.length; i++) {
      const apple = gameState.apples[i];
      if (apple.x === head.x && apple.y === head.y) {
        player.score++;
        gameState.apples.splice(i, 1);
        gameState.apples.push(generateApple());
        ate = true;
        break;
      }
    }

    if (!ate) {
      // Sprint consomme
      if (player.sprinting && player.snake.length > 2) {
        player.snake.pop();
        player.snake.pop(); // perdre plus vite
        player.score = Math.max(0, player.score - 1);
      } else {
        player.snake.pop();
      }
    }
  }

  // S'assurer qu’il y a toujours une pomme
  while (gameState.apples.length < 1) {
    gameState.apples.push(generateApple());
  }

  // 🔽 Envoi des données simplifiées
  const simplifiedState = {
    players: {},
    apples: gameState.apples
  };

  for (let id in gameState.players) {
    const p = gameState.players[id];
    simplifiedState.players[id] = {
      x: p.snake[0].x,
      y: p.snake[0].y,
      length: p.snake.length,
      score: p.score
    };
  }

  io.emit('state', simplifiedState);
}

setInterval(gameLoop, 100); // 🔁 10 FPS pour moins de lag

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
