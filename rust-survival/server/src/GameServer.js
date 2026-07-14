import { WebSocketServer } from 'ws';
import { World } from './World.js';
import { Player } from './Player.js';

export class GameServer {
  constructor(port = 7777, worldSeed = 1337) {
    this.port = port;
    this.world = new World(worldSeed);
    this.players = new Map();
    this.sockets = new Map();
    this.nextId = 1;
    this.wss = null;
  }

  start() {
    this.wss = new WebSocketServer({ port: this.port });
    this.wss.on('connection', (ws) => this.onConnect(ws));
    setInterval(() => this.tick(), 1000);
    setInterval(() => this.broadcastPlayers(), 100);
    console.log(`RUSt server listening ws://0.0.0.0:${this.port} seed=${this.world.seed}`);
  }

  onConnect(ws) {
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        this.handle(ws, msg);
      } catch (e) {
        this.send(ws, { t: 'S2C_ERROR', message: e.message });
      }
    });
    ws.on('close', () => this.onDisconnect(ws));
  }

  onDisconnect(ws) {
    const pid = this.sockets.get(ws);
    if (pid) {
      this.players.delete(pid);
      this.sockets.delete(ws);
      this.broadcastPlayers();
    }
  }

  handle(ws, msg) {
    switch (msg.t) {
      case 'C2S_JOIN': return this.join(ws, msg);
      case 'C2S_MOVE': return this.move(ws, msg);
      case 'C2S_GATHER': return this.gather(ws, msg);
      case 'C2S_PLACE_BUILDING': return this.place(ws, msg);
      case 'C2S_ATTACK': return this.attack(ws, msg);
      default: this.send(ws, { t: 'S2C_ERROR', message: `Unknown ${msg.t}` });
    }
  }

  join(ws, { name, worldSeed }) {
    if (this.sockets.has(ws)) return;
    if (worldSeed && worldSeed !== this.world.seed) {
      this.world = new World(worldSeed);
    }
    const id = this.nextId++;
    const p = new Player(id, name || `Survivor${id}`);
    p.x = (Math.random() - 0.5) * 30;
    p.z = (Math.random() - 0.5) * 30;
    this.players.set(id, p);
    this.sockets.set(ws, id);
    this.send(ws, {
      t: 'S2C_WELCOME',
      playerId: id,
      worldSeed: this.world.seed,
      spawn: { x: p.x, y: p.y, z: p.z },
    });
    this.send(ws, { t: 'S2C_WORLD', ...this.world.snapshot() });
    this.send(ws, { t: 'S2C_INVENTORY', slots: p.inventory, hotbar: p.hotbar });
    this.broadcastPlayers();
  }

  move(ws, { x, y, z, yaw }) {
    const p = this.player(ws);
    if (!p || !p.alive) return;
    p.x = x; p.y = y; p.z = z; p.yaw = yaw;
  }

  gather(ws, { nodeId }) {
    const p = this.player(ws);
    if (!p || !p.alive) return;
    const drops = this.world.gather(nodeId);
    if (!drops) return this.send(ws, { t: 'S2C_ERROR', message: 'Немає ресурсу' });
    p.addResources(drops);
    this.send(ws, { t: 'S2C_INVENTORY', slots: p.inventory, hotbar: p.hotbar });
    this.broadcast({ t: 'S2C_WORLD', ...this.world.snapshot() });
  }

  place(ws, { type, x, y, z, yaw }) {
    const p = this.player(ws);
    if (!p || !p.alive) return;
    const { building, cost } = this.world.placeBuilding(type, x, y, z, yaw, p.id);
    if (!p.canAfford(cost)) {
      return this.send(ws, { t: 'S2C_ERROR', message: 'Недостатньо ресурсів' });
    }
    p.pay(cost);
    this.send(ws, { t: 'S2C_INVENTORY', slots: p.inventory, hotbar: p.hotbar });
    this.broadcast({ t: 'S2C_EVENT', type: 'building_placed', building });
    this.broadcast({ t: 'S2C_WORLD', ...this.world.snapshot() });
  }

  attack(ws, { targetId }) {
    const attacker = this.player(ws);
    const target = this.players.get(targetId);
    if (!attacker || !target || !attacker.alive || !target.alive) return;
    const dist = Math.hypot(attacker.x - target.x, attacker.z - target.z);
    if (dist > 5) return this.send(ws, { t: 'S2C_ERROR', message: 'Занадто далеко' });
    const result = target.takeDamage(15, attacker);
    if (result.killed) {
      target.respawn();
      this.broadcast({ t: 'S2C_EVENT', type: 'player_killed', killer: attacker.id, victim: target.id });
    }
    this.broadcastPlayers();
  }

  tick() {
    for (const p of this.players.values()) p.tickHunger();
  }

  player(ws) {
    const id = this.sockets.get(ws);
    return id ? this.players.get(id) : null;
  }

  send(ws, msg) {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
  }

  broadcast(msg) {
    const raw = JSON.stringify(msg);
    for (const ws of this.sockets.keys()) {
      if (ws.readyState === 1) ws.send(raw);
    }
  }

  broadcastPlayers() {
    this.broadcast({
      t: 'S2C_PLAYERS',
      players: [...this.players.values()].map((p) => p.toJSON()),
    });
  }
}
