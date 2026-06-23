# AAA World Generator (Unity, no AGIS)

This module provides a Unity-ready procedural world generation pipeline for large open worlds using Synty POLYGON biomes packs.

## Features

- Deterministic world seed generation.
- Biome synthesis from height/moisture/temperature noise fields.
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
7. Click **Generate World** in dashboard (or call `GenerateNow()` at runtime).

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

- tabbed workflow (Overview, Biomes, Cities + Caves + Roads, Resources + Spawns, Diagnostics)
- one-click generation and JSON export
- inline configuration validation warnings
- generation summary counters (cities/roads/caves/resources/spawns)

`WorldGeneratorConfigEditor` provides a polished inspector with grouped foldouts and quick actions.

## Cave Variant A

Variant A uses prebuilt cave stamps (module chains) and entrance placement rules:

- Entrances appear on suitable slopes.
- Stamp presets are selected by weighted rarity.
- Entrances avoid city cores and keep spacing between cave systems.

## Local smoke checks

This repository does not include Unity or dotnet in CI VM. For runtime verification, a Python preview implementation mirrors the generation rules:

- Run preview: `python3 unity_world_generator/tools/worldgen_preview.py --config unity_world_generator/Samples~/Configs/example_world_config.json --out /tmp/world_preview.json`
- Run tests: `python3 -m unittest unity_world_generator/tests/test_worldgen_preview.py -v`
