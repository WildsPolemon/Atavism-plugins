import { GameServer } from './GameServer.js';

const port = Number(process.env.RUST_PORT || 7777);
const seed = Number(process.env.RUST_SEED || 1337);

const game = new GameServer(port, seed);
game.start();
