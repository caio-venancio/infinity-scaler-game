// server.js
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");

const PORT = process.env.PORT || 8080;

// Estado do jogo
const players = new Map(); // playerId -> { id, x, y, input: {up,right,down,left} , ws }

// Config do "mundo"
const WORLD = { width: 800, height: 600 };
const SPEED_PX_PER_SEC = 200; // velocidade do player
const TICK_HZ = 20;           // snapshots por segundo
const TICK_MS = 1000 / TICK_HZ;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function makeId() {
  return crypto.randomBytes(8).toString("hex");
}

// HTTP server (opcional, mas útil pra healthcheck)
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, players: players.size }));
    return;
  }
  res.writeHead(200);
  res.end("InfinityScaler WS server is running.");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  let playerId = null;

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "JSON inválido." }));
      return;
    }

    // Mensagens esperadas pelo OnlineService:
    // join, input, leave, ping
    if (msg.type === "join") {
      // cria player
      playerId = makeId();
      const p = {
        id: playerId,
        x: WORLD.width / 2,
        y: WORLD.height / 2,
        input: { up: false, right: false, down: false, left: false },
        ws
      };
      players.set(playerId, p);

      // responde welcome (OnlineService espera isso)
      ws.send(JSON.stringify({ type: "welcome", playerId }));

      return;
    }

    // se ainda não deu join, rejeita
    if (!playerId || !players.has(playerId)) {
      ws.send(JSON.stringify({ type: "error", message: "Faça join primeiro." }));
      return;
    }

    if (msg.type === "input") {
      const p = players.get(playerId);
      // atualiza input (servidor autoritário)
      p.input.up = !!msg.up;
      p.input.right = !!msg.right;
      p.input.down = !!msg.down;
      p.input.left = !!msg.left;
      return;
    }

    if (msg.type === "leave") {
      cleanupPlayer(playerId);
      playerId = null;
      try { ws.close(); } catch {}
      return;
    }

    if (msg.type === "ping") {
      ws.send(JSON.stringify({ type: "pong", t: msg.t ?? Date.now() }));
      return;
    }
  });

  ws.on("close", () => {
    if (playerId) cleanupPlayer(playerId);
  });

  ws.on("error", () => {
    if (playerId) cleanupPlayer(playerId);
  });
});

function cleanupPlayer(id) {
  players.delete(id);
}

// Loop do jogo: simula movimento e manda snapshots
let last = Date.now();
setInterval(() => {
  const now = Date.now();
  const dtSec = (now - last) / 1000;
  last = now;

  // 1) Simula posições
  for (const p of players.values()) {
    const step = SPEED_PX_PER_SEC * dtSec;

    if (p.input.up) p.y -= step;
    if (p.input.down) p.y += step;
    if (p.input.left) p.x -= step;
    if (p.input.right) p.x += step;

    p.x = clamp(p.x, 0, WORLD.width);
    p.y = clamp(p.y, 0, WORLD.height);
  }

  // 2) Monta snapshot
  const snapshot = {
    type: "snapshot",
    players: Array.from(players.values()).map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y
    }))
  };

  const payload = JSON.stringify(snapshot);

  // 3) Envia para todos
  for (const p of players.values()) {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(payload);
    }
  }
}, TICK_MS);

server.listen(PORT, () => {
  console.log(`WS server listening on http://localhost:${PORT}`);
  console.log(`WebSocket URL: ws://localhost:${PORT}`);
});
