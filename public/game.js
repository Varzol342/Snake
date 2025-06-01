const socket = io();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scale = 20;
const rows = 25;
const cols = 25;

let playerId = null;

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      socket.emit("direction", { x: 0, y: -1 });
      break;
    case "ArrowDown":
      socket.emit("direction", { x: 0, y: 1 });
      break;
    case "ArrowLeft":
      socket.emit("direction", { x: -1, y: 0 });
      break;
    case "ArrowRight":
      socket.emit("direction", { x: 1, y: 0 });
      break;
  }
});

socket.on("connect", () => {
  playerId = socket.id;
});

socket.on("gameState", (state) => {
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dessiner la pomme
  ctx.fillStyle = "red";
  ctx.fillRect(state.apple.x * scale, state.apple.y * scale, scale, scale);

  // Dessiner tous les joueurs
  for (let id in state.players) {
    const player = state.players[id];

    // Couleur différente pour le joueur local
    ctx.fillStyle = id === playerId ? "#00FF00" : "#00BFFF";

    // Dessiner la tête
    ctx.fillRect(player.x * scale, player.y * scale, scale, scale);

    // Dessiner la queue
    for (let segment of player.tail) {
      ctx.fillRect(segment.x * scale, segment.y * scale, scale, scale);
    }
  }
});
