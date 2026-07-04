# WotLK Talent System for Atavism AGIS

Wrath of the Lich King (3.3.5) talent rules:

- **3 trees per class** (`tree_id` 0..2)
- **1 talent point per level from level 10**
- **71 total points at level 80** — shared across all trees (can put 71 in one tree)
- **Tier gates**: row N requires `(N-1) × 5` points spent in **that tree** (auto if `tree_points_required=0`)
- **No exclusive row choices** — multiple talents in the same row are allowed (WotLK default)
- **Dual spec** (patch 3.1+): 2 independent full allocations, switch **out of combat**
- **Respec**: resets **active spec only**, optional gold cost, out of combat

## Install

1. `sql/001_talent_tree_columns.sql`
2. `sql/002_wow_talent_game_settings.sql`
3. `sql/003_class_ability_by_level.sql`
4. (Optional) `sql/sample_warrior_abilities_by_level.sql` — remap `ability_id` to your abilities
5. Rebuild & deploy AGIS
6. Copy `unity/Scripts/` to Unity client

## Atavism Editor

After applying SQL, open the editor:

- **Character → Class Abilities by Level** — CRUD for `class_ability_by_level` (class, player level, ability)
- **Combat → Skills** — WoW talent fields (`tree_id`, `tier`, `column`) when **Talent** is checked
- **Character → Player Templates** — starting skills only; level-up spells are in Class Abilities by Level

## WoW model: spells vs talents

| WoW | Atavism implementation |
|-----|------------------------|
| **Class spells** auto-learned at character level 1, 4, 6… | `class_ability_by_level` table + `ClassAbilityByLevelHelper` |
| **Talent points** from level 10, spent in 3 trees | `skills` with `talent=1` + WotLK talent rules |
| Trainer / rank upgrades | Optional: level rewards or future trainer effect |

On level-up the server learns abilities from `class_ability_by_level` where `player_level <= new level`.  
Talents remain **separate** — they only modify gameplay via talent ranks, not replace the core spell list.

### `class_ability_by_level` columns

| Column | Purpose |
|--------|---------|
| `aspect` | Class ID (same as `skills.aspect`) |
| `player_level` | Character level when spell is learned |
| `ability_id` | `abilities.id` |
| `auto_learn` | Learn on level-up / login sync |
| `unlearn_on_delevel` | Remove if `LOST_LEVEL=true` and player delevels |

Game setting: `CLASS_ABILITIES_BY_LEVEL_ENABLED` (default `true`).

### Example Warrior (WotLK-style)

| Level | Spell |
|-------|-------|
| 1 | Battle Stance, Heroic Strike |
| 4 | Charge |
| 6 | Rend |
| 8 | Thunder Clap |
| 10 | Bloodrage (+ first talent point) |
| 20 | Cleave, Slam |

See `sql/sample_warrior_abilities_by_level.sql` — replace placeholder IDs `100001+` with your ability IDs.

## WotLK point table

| Level | Talent points |
|-------|---------------|
| 9 | 0 |
| 10 | 1 |
| 60 | 51 |
| 70 | 61 |
| 80 | 71 |

Formula: `max(0, level - 10 + 1)`

## Content authoring

| Field | WotLK usage |
|-------|-------------|
| `tree_id` | 0 / 1 / 2 (e.g. Arms / Fury / Protection) |
| `tier` | Row number (1 = top) |
| `column` | Position in row |
| `tree_points_required` | 0 = auto `(tier-1)*5`; or set manually |
| `parentSkill` | Talent in column above (vertical prereq) |
| `exclusive_group` | **Leave 0** for WotLK (only enable via setting for custom builds) |

## Game settings

| Key | WotLK default |
|-----|---------------|
| `TALENT_POINTS_START_LEVEL` | 10 |
| `TALENT_POINTS_PER_LEVEL` | 1 |
| `TALENT_TIER_POINT_STEP` | 5 |
| `TALENT_EXCLUSIVE_GROUPS_ENABLED` | 0 (off) |
| `TALENT_SWITCH_REQUIRES_OUT_OF_COMBAT` | 1 |
| `TALENT_RESET_REQUIRES_OUT_OF_COMBAT` | 1 |
| `TALENT_LOADOUT_COUNT` | 2 |
| `TALENT_TREE_MAX_POINTS` | 0 (disabled; uses level-based total) |

## Dual spec (WotLK)

Each loadout stores its own talent ranks and points spent. Switching loadout:

- Saves current spec snapshot
- Loads other spec (full 71-point budget if unspent)
- Blocked in combat

Client: `ClassAbilityClient.switchTalentLoadout(oid, loadoutIndex)` or `WowTalentTreeController.SwitchLoadout(n)`.

## Differences from MoP+ / custom

| Feature | WotLK | Our optional setting |
|---------|-------|---------------------|
| Pick 1 of 3 per row | No | `TALENT_EXCLUSIVE_GROUPS_ENABLED=1` |
| Per-tree 51 cap | No (total pool) | `TALENT_TREE_MAX_POINTS` (legacy, default off) |
