export class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.x = 0; this.y = 1; this.z = 0; this.yaw = 0;
    this.hp = 100; this.hunger = 100;
    this.inventory = { wood: 0, stone: 0, metal: 0, sulfur: 0, cloth: 0 };
    this.hotbar = 0;
    this.alive = true;
  }

  addResources(drops) {
    for (const [k, v] of Object.entries(drops)) {
      this.inventory[k] = (this.inventory[k] || 0) + v;
    }
  }

  canAfford(cost) {
    for (const [k, v] of Object.entries(cost)) {
      if ((this.inventory[k] || 0) < v) return false;
    }
    return true;
  }

  pay(cost) {
    for (const [k, v] of Object.entries(cost)) {
      this.inventory[k] -= v;
    }
  }

  takeDamage(amount, attacker) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.alive = false;
      return { killed: true, killer: attacker?.id };
    }
    return { killed: false, hp: this.hp };
  }

  tickHunger() {
    if (!this.alive) return;
    this.hunger = Math.max(0, this.hunger - 0.05);
    if (this.hunger <= 0) this.hp = Math.max(0, this.hp - 0.1);
  }

  respawn() {
    this.x = (Math.random() - 0.5) * 20;
    this.z = (Math.random() - 0.5) * 20;
    this.y = 1;
    this.hp = 100;
    this.hunger = 80;
    this.alive = true;
  }

  toJSON() {
    return {
      id: this.id, name: this.name,
      x: this.x, y: this.y, z: this.z, yaw: this.yaw,
      hp: this.hp, hunger: this.hunger, alive: this.alive,
    };
  }
}
