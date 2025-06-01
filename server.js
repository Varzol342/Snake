const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const TILE = 10;
const WIDTH = 400;
const HEIGHT = 400;

let players = {};
let apple = generateApple();

// Génère une nouvelle pomme à une position aléatoire
function generateApple() {
  return {
    x: Math.floor(Math.random() * (WIDTH / TILE)) * TILE,
    y: Math.floor(Math.random() * (HEIGHT / TILE)) * TILE
  };
}

// Envoie le classement trié à tous les clients
function sendLeaderboard() {
  const leaderboard = Object.values(players)
    .map(p => ({ id: p.id, score: p.score }))
    .sort((a, b) => b.score - a.score);
  io.emit("leaderboard", leaderboard);
}

io.on("connection", (socket) => {
  console.log("✅ Connexion :", socket.id);

  players[socket.id] = {
    id: socket.id,
    x: 100,
    y: 100,
    tail: [],
    score: 0
  };

  socket.emit("init", { id: socket.id });
  socket.emit("apple", apple);
  io.emit("players", players);
  sendLeaderboard();

  // Quand un joueur bouge
  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].tail = data.tail;
      io.emit("players", players);
    }
  });

  // Quand un joueur mange une pomme
  socket.on("eat", () => {
    if (!players[socket.id]) return;

    players[socket.id].score += 1;
    apple = generateApple();

    io.emit("apple", apple);
    io.emit("players", players);
    sendLeaderboard();
  });

  // Quand un joueur meurt (collision mur ou soi-même)
  socket.on("dead", () => {
    if (!players[socket.id]) return;

    players[socket.id].score = 0;
    players[socket.id].tail = [];
    io.emit("players", players);
    sendLeaderboard();
  });

  // Quand un joueur utilise le sprint
  socket.on("sprint", () => {
    const p = players[socket.id];
    if (!p) return;

    if (p.score > 0) {
      p.score -= 1;
      io.emit("players", players);
      sendLeaderboard();
    }
  });

  // Quand un joueur se déconnecte
  socket.on("disconnect", () => {
    console.log("❌ Déconnexion :", socket.id);
    delete players[socket.id];
    io.emit("players", players);
    sendLeaderboard();
  });
});

http.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
