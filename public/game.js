const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const blockSize = 20;

let playerId = null;
let players = {};
let apples = [];

socket.on('connect', () => {
  playerId = socket.id;
  console.log("Connecté avec ID:", playerId);
});

// direction
let direction = { x: 0, y: 0 };
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp') direction = { x: 0, y: -1 };
  if (e.key === 'ArrowDown') direction = { x: 0, y: 1 };
  if (e.key === 'ArrowLeft') direction = { x: -1, y: 0 };
  if (e.key === 'ArrowRight') direction = { x: 1, y: 0 };
  socket.emit('direction', direction);
});

// sprint
let sprinting = false;
window.addEventListener('keydown', e => {
  if (e.key === ' ') {
    sprinting = true;
    socket.emit('sprint', true);
  }
});
window.addEventListener('keyup', e => {
  if (e.key === ' ') {
    sprinting = false;
    socket.emit('sprint', false);
  }
});

// dessiner
function drawBlock(x, y, color = 'lime') {
  ctx.fillStyle = color;
  ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
}

socket.on('state', state => {
  players = state.players;
  apples = state.apples;
  draw();
});

function draw() {
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 🍎 pommes
  apples.forEach(apple => {
    drawBlock(apple.x, apple.y, 'red');
  });

  // 🐍 serpents
  for (let id in players) {
    const p = players[id];
    const color = id === playerId ? 'lime' : 'green';

    // Simule un corps (en affichant plusieurs blocs à la même position)
    for (let i = 0; i < p.length; i++) {
      drawBlock(p.x, p.y, color);
    }
  }
}
