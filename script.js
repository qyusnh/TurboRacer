const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const statusEl = document.getElementById("status");
const speedEl = document.getElementById("speed");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");

const W = canvas.width, H = canvas.height;
const lanes = [115, 240, 365];
let player, traffic, score, frame, roadOffset, running, speed, keys;

let best = Number(localStorage.getItem("turboRacerBest") || 0);
bestEl.textContent = best;

function resetGame() {
  player = { x: lanes[1], y: 525, w: 48, h: 82, color: "#b8ff45" };
  traffic = [];
  score = 0;
  frame = 0;
  roadOffset = 0;
  speed = 4;
  keys = { left: false, right: false };
  scoreEl.textContent = "0";
  statusEl.textContent = "¡CORRIENDO!";
}

function roundedRect(x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawRoad() {
  ctx.fillStyle = "#237044";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#333b43";
  ctx.fillRect(45, 0, 390, H);
  ctx.fillStyle = "#f3f0d7";
  ctx.fillRect(49, 0, 5, H);
  ctx.fillRect(426, 0, 5, H);

  roadOffset = (roadOffset + speed) % 80;
  ctx.fillStyle = "#e9e9df";
  for (let y = -80 + roadOffset; y < H; y += 80) {
    ctx.fillRect(174, y, 5, 42);
    ctx.fillRect(301, y, 5, 42);
  }
  // Bordes de la carretera
  ctx.fillStyle = "#d64b45";
  for (let y = -40 + roadOffset; y < H; y += 80) {
    ctx.fillRect(45, y, 7, 35);
    ctx.fillRect(428, y, 7, 35);
  }
}

function drawCar(car, isPlayer = false) {
  const { x, y, w, h } = car;
  // Sombra y ruedas
  roundedRect(x - w / 2 - 5, y + 12, 10, 23, 3, "#111");
  roundedRect(x + w / 2 - 5, y + 12, 10, 23, 3, "#111");
  roundedRect(x - w / 2 - 5, y + h - 35, 10, 23, 3, "#111");
  roundedRect(x + w / 2 - 5, y + h - 35, 10, 23, 3, "#111");
  roundedRect(x - w / 2, y, w, h, 10, car.color);
  // Parabrisas
  roundedRect(x - w / 2 + 7, y + 16, w - 14, 24, 6, isPlayer ? "#263b4b" : "#202b36");
  roundedRect(x - w / 2 + 7, y + 47, w - 14, 17, 5, isPlayer ? "#263b4b" : "#202b36");
  // Luces
  roundedRect(x - w / 2 + 5, y + 4, 10, 6, 2, "#fff3b0");
  roundedRect(x + w / 2 - 15, y + 4, 10, 6, 2, "#fff3b0");
  roundedRect(x - w / 2 + 5, y + h - 9, 10, 5, 2, "#ff4040");
  roundedRect(x + w / 2 - 15, y + h - 9, 10, 5, 2, "#ff4040");
  if (isPlayer) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.fillText("YOU", x, y + 57);
  }
}

function spawnTraffic() {
  const lane = Math.floor(Math.random() * lanes.length);
  const colors = ["#e94f64", "#4ca6e8", "#f0a33c", "#b47be8", "#f0f0f0"];
  traffic.push({
    x: lanes[lane], y: -100, w: 47, h: 82,
    color: colors[Math.floor(Math.random() * colors.length)]
  });
}

function collision(a, b) {
  return Math.abs(a.x - b.x) < 42 &&
         Math.abs((a.y + a.h / 2) - (b.y + b.h / 2)) < 67;
}

function endGame() {
  running = false;
  statusEl.textContent = "FIN DEL JUEGO";
  if (score > best) {
    best = score;
    localStorage.setItem("turboRacerBest", best);
    bestEl.textContent = best;
  }
  document.getElementById("overlay-title").textContent = "¡Choque!";
  document.getElementById("overlay-text").textContent =
    `Conseguiste ${score} puntos. ¡Inténtalo otra vez y supera tu récord!`;
  startBtn.textContent = "VOLVER A JUGAR";
  overlay.classList.remove("hidden");
}

function update() {
  if (!running) return;
  frame++;
  if (keys.left) player.x = Math.max(80, player.x - 6);
  if (keys.right) player.x = Math.min(400, player.x + 6);

  speed = Math.min(8, 4 + score / 250);
  if (frame % Math.max(28, 68 - Math.floor(score / 15)) === 0) spawnTraffic();

  traffic.forEach(car => car.y += speed + 1.5);
  traffic = traffic.filter(car => car.y < H + 100);

  for (const car of traffic) {
    if (collision(player, car)) {
      endGame();
      return;
    }
  }

  if (frame % 6 === 0) {
    score++;
    scoreEl.textContent = score;
  }
  speedEl.textContent = `VELOCIDAD: ${(speed / 4).toFixed(1)}x`;
}

function render() {
  drawRoad();
  traffic.forEach(car => drawCar(car));
  if (player) drawCar(player, true);
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

function startGame() {
  resetGame();
  running = true;
  overlay.classList.add("hidden");
}

function setKey(key, value) {
  if (key === "ArrowLeft" || key.toLowerCase() === "a") keys.left = value;
  if (key === "ArrowRight" || key.toLowerCase() === "d") keys.right = value;
}

document.addEventListener("keydown", e => {
  if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  setKey(e.key, true);
});
document.addEventListener("keyup", e => setKey(e.key, false));

function holdButton(id, direction) {
  const btn = document.getElementById(id);
  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    keys[direction] = true;
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(eventName => {
    btn.addEventListener(eventName, () => keys[direction] = false);
  });
}
holdButton("left-btn", "left");
holdButton("right-btn", "right");

startBtn.addEventListener("click", startGame);

resetGame();
running = false;
render();
loop();
