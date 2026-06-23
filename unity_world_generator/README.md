# AAA World Generator (Unity, no AGIS)

This module provides a Unity-ready procedural world generation pipeline for large open worlds using Synty POLYGON biomes packs.

## Features

- Deterministic world seed generation.
- Biome synthesis from height/moisture/temperature noise fields.
- City placement with spacing constraints and district lot generation.
- Cave generation **Variant A** (stamp-based cave prefabs + entrances).
- Resource distribution by biome with exclusion zones.
- Runtime prefab spawning + JSON export for generated layout.

## Folder layout

- `Runtime/` - core runtime generator scripts.
- `Editor/` - optional editor tooling.
- `Samples~/` - example presets/config payloads.
- `tools/` - standalone preview generator for CI/smoke checks.
- `tests/` - automated tests for deterministic generation and constraints.

## Unity integration

1. Copy `unity_world_generator/Runtime` into your Unity project's `Assets/WorldGen/Runtime`.
2. Create `WorldGeneratorConfig` asset (`Create > World Generation > AAA World Generator Config`).
3. Fill biome mappings and prefab arrays with Synty assets from:
   - POLYGON Nature Biomes Season One
   - POLYGON Nature Biomes Season Two
4. Add `WorldGenerator` component to an empty scene object and assign config.
5. Click **Generate World** in inspector (or call `GenerateNow()` at runtime).

## Cave Variant A

Variant A uses prebuilt cave stamps (module chains) and entrance placement rules:

- Entrances appear on suitable slopes.
- Stamp presets are selected by weighted rarity.
- Entrances avoid city cores and keep spacing between cave systems.

## Local smoke checks

This repository does not include Unity or dotnet in CI VM. For runtime verification, a Python preview implementation mirrors the generation rules:

- Run preview: `python3 unity_world_generator/tools/worldgen_preview.py --config unity_world_generator/Samples~/Configs/example_world_config.json --out /tmp/world_preview.json`
- Run tests: `python3 -m unittest unity_world_generator/tests/test_worldgen_preview.py -v`
