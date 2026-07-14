/** Procedural world — resource nodes like Rust (trees, stone, sulfur) */

const NODE_TYPES = ['tree', 'stone', 'metal', 'sulfur', 'hemp'];

function hash(seed, x, z) {
  let h = seed ^ (x * 374761393) ^ (z * 668265263);
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

export class World {
  constructor(seed = 1337) {
    this.seed = seed;
    this.nodes = new Map();
    this.buildings = new Map();
    this.nextBuildingId = 1;
    this._generateNodes();
  }

  _generateNodes() {
    const size = 256;
    const step = 8;
    let id = 1;
    for (let x = -size; x <= size; x += step) {
      for (let z = -size; z <= size; z += step) {
        const h = hash(this.seed, x, z);
        if ((h % 100) < 35) continue;
        const type = NODE_TYPES[h % NODE_TYPES.length];
        const y = 0;
        this.nodes.set(id, { id, type, x, y, z, hp: type === 'tree' ? 50 : 100, maxHp: type === 'tree' ? 50 : 100 });
        id++;
      }
    }
  }

  gather(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node || node.hp <= 0) return null;
    node.hp -= 25;
    const drops = { wood: 0, stone: 0, metal: 0, sulfur: 0, cloth: 0 };
    if (node.type === 'tree') drops.wood = 50;
    else if (node.type === 'stone') drops.stone = 100;
    else if (node.type === 'metal') drops.metal = 25;
    else if (node.type === 'sulfur') drops.sulfur = 25;
    else if (node.type === 'hemp') drops.cloth = 10;
    if (node.hp <= 0) this.nodes.delete(nodeId);
    return drops;
  }

  placeBuilding(type, x, y, z, yaw, ownerId) {
    const costs = { foundation: { stone: 50 }, wall: { wood: 25 }, door: { wood: 15, metal: 10 } };
    const id = this.nextBuildingId++;
    const b = { id, type, x, y, z, yaw, ownerId, hp: 500 };
    this.buildings.set(id, b);
    return { building: b, cost: costs[type] || { wood: 10 } };
  }

  snapshot() {
    return {
      nodes: [...this.nodes.values()],
      buildings: [...this.buildings.values()],
    };
  }
}
