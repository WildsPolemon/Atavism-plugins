# RUSt — Survival (Unity 6 + Server)

Клон механік **Rust** (виживання, збір ресурсів, будівництво, PvP) на **Unity 6** з authoritative Node.js сервером.

## Структура

```
rust-survival/
├── server/              # Node.js authoritative game server (WebSocket)
├── unity-client/        # Unity 6 проєкт
├── shared/protocol.json # Протокол повідомлень C2S/S2C
└── scripts/             # setup/start shell scripts
```

## Швидкий старт

### 1. Сервер
```bash
cd rust-survival
./scripts/setup-server.sh
./scripts/start-server.sh
# ws://localhost:7777
```

Або вручну:
```bash
cd rust-survival/server
npm install
RUST_PORT=7777 RUST_SEED=1337 npm start
npm test   # smoke test
```

### 2. Unity 6 клієнт
1. Відкрийте `rust-survival/unity-client` в **Unity 6** (6000.0+)
2. Відкрийте сцену `Assets/RUSt/Scenes/Main.unity` (або будь-яку порожню — `RuntimeAutoSetup` створить об'єкти)
3. **Play** → панель підключення → `ws://127.0.0.1:7777`

Меню редактора: **RUSt → Setup Main Scene** — створює об'єкти вручну.

## Керування

| Клавіша | Дія |
|---------|-----|
| WASD | Рух |
| Shift | Спринт |
| Space | Стрибок |
| E | Зібрати ресурс (погляд на вузол) |
| 1 / 2 / 3 | Тип будівлі (foundation / wall / door) |
| ПКМ | Поставити будівлю |
| ЛКМ | Атака гравця |
| Esc | Курсор |

## Механіки (MVP)

| Система | Клієнт | Сервер |
|---------|--------|--------|
| Процедурний terrain (seed) | TerrainBootstrap + AaaWorldGen | World seed sync |
| Ресурсні вузли | ResourceNodeView | World.gather |
| Інвентар | InventoryHUD | Player.inventory |
| Будівництво | BuildingPlacer | World.placeBuilding |
| PvP | PlayerInteractor | Player.takeDamage |
| Голод | — | Player.tickHunger |

## Змінні середовища

| Змінна | За замовч. | Опис |
|--------|------------|------|
| `RUST_PORT` | 7777 | Порт WebSocket |
| `RUST_SEED` | 1337 | Seed світу |

## Протокол

Див. `shared/protocol.json`. Повідомлення — JSON з полем `t` (тип).

## Зв'язок з Atavism

Логіка building натхненна AGIS `VoxelPlugin` / `BuildingGrid`. Процедурний світ — модуль `unity_world_generator` (`AaaWorldGen`).
