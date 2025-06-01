const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let players = {};
let apples = [];

function spawnApple() {
  const x = Math.floor(Math.random() * 25);
  const y = Math.floor(Math.random() * 25);
  apples.push({ x, y });
}

function gameLoop() {
  for (let id in players) {
    const player = players[id];
    if (!player.direction) continue;

    // Avancer
    player.x += player.direction.x;
    player.y += player.direction.y;

    // Collision avec pomme
    apples.forEach((apple, index) => {
      if (player.x === apple.x && player.y === apple.y) {
        player.length++;
        apples.splice(index, 1);
        spawnApple();
      }
    });

    // Limite du terrain
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x > 24) player.x = 24;
    if (player.y > 24) player.y = 24;
  }

  // Envoyer l'état du jeu
  io.emit('state', { players, apples });
}

// Boucle toutes les 100ms
setInterval(gameLoop, 100);

// Gestion socket
io.on('connection', socket => {
  console.log('Joueur connecté:', socket.id);
  players[socket.id] = {
    x: Math.floor(Math.random() * 25),
    y: Math.floor(Math.random() * 25),
    direction: { x: 0, y: 0 },
    length: 3,
  };

  if (apples.length === 0) spawnApple();

  socket.on('direction', dir => {
    players[socket.id].direction = dir;
  });

  socket.on('sprint', (active) => {
    // optionnel pour future amélioration
  });

  socket.on('disconnect', () => {
    console.log('Joueur déconnecté:', socket.id);
    delete players[socket.id];
  });
});

server.listen(PORT, () => {
  console.log('Serveur démarré sur le port', PORT);
});
