const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

let players = {};
let apple = spawnApple();

function spawnApple() {
  return {
    x: Math.floor(Math.random() * 25),
    y: Math.floor(Math.random() * 25),
  };
}

io.on("connection", (socket) => {
  console.log("Nouveau joueur connecté :", socket.id);

  players[socket.id] = {
    id: socket.id,
    x: Math.floor(Math.random() * 25),
    y: Math.floor(Math.random() * 25),
    tail: [],
    direction: { x: 0, y: 0 },
    score: 0,
  };

  socket.on("direction", (direction) => {
    players[socket.id].direction = direction;
  });

  socket.on("disconnect", () => {
    console.log("Joueur déconnecté :", socket.id);
    delete players[socket.id];
  });
});

function gameLoop() {
  for (let id in players) {
    const player = players[id];
    movePlayer(player);
    checkCollision(player);
  }

  io.emit("gameState", { players, apple });
}

function movePlayer(player) {
  const newX = player.x + player.direction.x;
  const newY = player.y + player.direction.y;

  player.tail.unshift({ x: player.x, y: player.y });

  if (player.tail.length > player.score) {
    player.tail.pop();
  }

  player.x = newX;
  player.y = newY;

  // Collision avec les murs
  if (player.x < 0 || player.x >= 25 || player.y < 0 || player.y >= 25) {
    player.x = Math.floor(Math.random() * 25);
    player.y = Math.floor(Math.random() * 25);
    player.tail = [];
    player.score = 0;
  }
}

function checkCollision(player) {
  // Pomme
  if (player.x === apple.x && player.y === apple.y) {
    player.score++;
    apple = spawnApple();
  }

  // Collision avec soi-même
  for (let segment of player.tail) {
    if (player.x === segment.x && player.y === segment.y) {
      player.x = Math.floor(Math.random() * 25);
      player.y = Math.floor(Math.random() * 25);
      player.tail = [];
      player.score = 0;
    }
  }
}

setInterval(gameLoop, 100);

http.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
