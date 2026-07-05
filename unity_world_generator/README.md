# AAA World Generator (Unity, no AGIS)

This module provides a Unity-ready procedural world generation pipeline for large open worlds using Synty POLYGON biomes packs.

## Features

- Deterministic world seed generation.
- Biome synthesis from height/moisture/temperature noise fields.
- Advanced terrain shaping (continent mask + ridges + lowland flattening + mountain boost).
- **Unity Terrain generation** (tiled heightmaps from the same noise pipeline).
- Climate-aware biome shaping (latitude cooling, elevation cooling, coastal humidity, micro-variation).
- City placement with spacing constraints and district lot generation.
- Intercity road network generation (MST backbone + extra links).
- Cave generation **Variant A** (stamp-based cave prefabs + entrances).
- Resource distribution by biome with exclusion zones.
- MMORPG-ready spawn generation (player, NPC, wilderness mob zones).
- Sectorized world data for MMO server/AOI partitioning.
- Runtime FPS optimization via distance streaming + active object budgets.
- Runtime prefab spawning + JSON export for generated layout.

## Folder layout

- `Runtime/` - core runtime generator scripts.
- `Editor/` - optional editor tooling.
- `Samples~/` - example presets/config payloads.
- `tools/` - standalone preview generator for CI/smoke checks.
- `tests/` - automated tests for deterministic generation and constraints.

## Unity integration

1. Copy `unity_world_generator/Runtime` into your Unity project's `Assets/WorldGen/Runtime`.
2. Copy `unity_world_generator/Editor` into `Assets/WorldGen/Editor` for dashboard tooling.
3. Create `WorldGeneratorConfig` asset (`Create > World Generation > AAA World Generator Config`).
4. Fill biome mappings and prefab arrays with Synty assets from:
   - POLYGON Nature Biomes Season One
   - POLYGON Nature Biomes Season Two
   - Tune `biomeClimate` values for stronger biome contrast and smoother natural transitions.
5. Add `WorldGenerator` component to an empty scene object and assign config.
6. Open **Tools > World Generation > Open Generator Dashboard**.
7. Click **Generate World** in dashboard — layout runs first, then terrain bakes incrementally in the editor (progress bar, cancellable).
8. **Terrain Only** and **Generate World** use incremental-v3 baking in the editor (footer shows `bake incremental-v3`).
9. Terrain tiles appear under `TerrainRoot` (auto-created on the generator). Tune `terrainGeneration` in config:
   - `enableTerrainGeneration` — on by default
   - `terrainTileSizeMeters` — tile size (512 recommended for large worlds)
   - `heightmapResolution` — per-tile resolution (257 default)
10. At runtime, call `GenerateNow()` for synchronous full generation.

## Runtime FPS optimization

Use `runtimeOptimization` in `WorldGeneratorConfig`:

- `enableDistanceStreaming` - stream objects around player/focus target only.
- `streamingRadiusMeters` + `unloadPaddingMeters` - visible radius and hysteresis.
- `maxActiveObjects` - hard cap of active runtime objects.
- `maxActiveResources` - specific cap for resource props (largest category).
- `streamingTarget` - optional transform to follow (player/camera rig).

## Sector mode for Atavism/MMO backend

Use `sectorSettings` in `WorldGeneratorConfig`:

- `sectorSizeMeters` - fixed world partition size.
- `neighborLoadRadius` - recommended number of neighboring sectors to keep loaded.
- `maxResourcesPerSector`, `maxNpcSpawnsPerSector`, `maxMobZonesPerSector` - per-sector spawn budgets.

Generated result includes `sectors` with per-sector spawn/resource lists and overflow counters.
This is intended for Atavism-style AOI/interest management where server and client both operate on the same sector grid.

## Editor UX

`WorldGeneratorDashboardWindow` provides a centralized control panel:

- tabbed workflow (Overview, Biome Lab, World Layout, Spawns + Performance, Diagnostics, Tools)
- preset system (Balanced MMO / Cinematic / Performance / Mega World)
- WoW-like Adventure preset for highland silhouettes + wide quest-friendly plains
- one-click generation, Generate+Export, and quick temp export
- biome automation helpers (normalize blend weights, rebalance height bands, biome template)
- city inland safety profile toggles and runtime profile shortcuts
- inline configuration validation warnings with filtering
- generation diagnostics: biome distribution + sector load hotspots
- operations toolkit: config snapshot copy, root pinging, and folder shortcuts

`WorldGeneratorConfigEditor` provides a polished inspector with grouped foldouts, quick presets, expand/collapse-all controls, filter search, and snapshot/random-seed actions.

## Cave Variant A

Variant A uses prebuilt cave stamps (module chains) and entrance placement rules:

- Entrances appear on suitable slopes.
- Stamp presets are selected by weighted rarity.
- Entrances avoid city cores and keep spacing between cave systems.

## Presets and sample configs

- Default sample: `unity_world_generator/Samples~/Configs/example_world_config.json`
- WoW-like sample: `unity_world_generator/Samples~/Configs/wow_like_world_config.json`
- Both configs include `terrain_shape` for macro terrain forms (continents, ridges, quest plains, highland boosts).

## Local smoke checks

This repository does not include Unity or dotnet in CI VM. For runtime verification, a Python preview implementation mirrors the generation rules:

- Run preview: `python3 unity_world_generator/tools/worldgen_preview.py --config unity_world_generator/Samples~/Configs/example_world_config.json --out /tmp/world_preview.json`
- Run tests: `python3 -m unittest unity_world_generator/tests/test_worldgen_preview.py -v`
