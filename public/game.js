const socket = io();

let playerId;
let players = {};
let apple = { x: 0, y: 0 };

const tileSize = 10;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 400;

let x = 100;
let y = 100;
let dx = tileSize;
let dy = 0;
let tail = [];
let maxTail = 5;
let sprinting = false;
let speed = 100;
let sprintSpeed = 50;

socket.on("init", (data) => {
  playerId = data.id;
});

socket.on("players", (data) => {
  players = data;
});

socket.on("apple", (data) => {
  apple = data;
});

socket.on("leaderboard", (data) => {
  const board = document.getElementById("leaderboard");
  board.innerHTML = "<h3>🏆 Classement</h3>";
  data.forEach((p, i) => {
    board.innerHTML += `<div>${i + 1}. ${p.id === playerId ? "<b>Moi</b>" : "Joueur"} – ${p.score}</div>`;
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" && dy === 0) {
    dx = 0;
    dy = -tileSize;
  } else if (e.key === "ArrowDown" && dy === 0) {
    dx = 0;
    dy = tileSize;
  } else if (e.key === "ArrowLeft" && dx === 0) {
    dx = -tileSize;
    dy = 0;
  } else if (e.key === "ArrowRight" && dx === 0) {
    dx = tileSize;
    dy = 0;
  } else if (e.key === "Shift") {
    sprinting = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    sprinting = false;
  }
});

function resetPlayer() {
  x = 100;
  y = 100;
  dx = tileSize;
  dy = 0;
  tail = [];
  maxTail = 5;
  socket.emit("dead");
}

function gameLoop() {
  setTimeout(gameLoop, sprinting ? sprintSpeed : speed);

  x += dx;
  y += dy;

  // Collision mur
  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    resetPlayer();
    return;
  }

  // Ajoute la nouvelle position au début du tableau
  tail.unshift({ x, y });

  // Si la longueur dépasse, retire le dernier
  if (tail.length > maxTail) tail.pop();

  // Collision avec soi-même
  for (let i = 1; i < tail.length; i++) {
    if (x === tail[i].x && y === tail[i].y) {
      resetPlayer();
      return;
    }
  }

  // Mange la pomme
  if (x === apple.x && y === apple.y) {
    maxTail++;
    socket.emit("eat");
  }

  // Sprint → on perd 1 point
  if (sprinting) {
    socket.emit("sprint");
  }

  // Envoie les données au serveur
  socket.emit("move", { x, y, tail });

  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pomme
  ctx.fillStyle = "red";
  ctx.fillRect(apple.x, apple.y, tileSize, tileSize);

  // Tous les joueurs
  for (const id in players) {
    const p = players[id];
    ctx.fillStyle = id === playerId ? "green" : "blue";
    ctx.fillRect(p.x, p.y, tileSize, tileSize);

    for (const segment of p.tail) {
      ctx.fillRect(segment.x, segment.y, tileSize, tileSize);
    }
  }
}

gameLoop();
