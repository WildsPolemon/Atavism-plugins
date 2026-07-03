# WoW-Style Talent System for Atavism AGIS

Full Classic/WotLK-style talent trees with:

- **3 trees per class** (`tree_id` 0..2)
- **Tier rows** (`tier`) with **tree point gates** (`tree_points_required`)
- **Grid layout** (`column`)
- **Exclusive branch choice** (`exclusive_group`) — pick one talent per group (WoW row branches)
- **1 point / level from level 10** (configurable)
- **51 points max per tree**
- **Dual spec** (2 loadouts, `combat.SWITCH_TALENT_LOADOUT`)
- **Respec cost** via currency game settings

## Install

1. Run SQL migrations on your **content database**:
   - `sql/001_talent_tree_columns.sql`
   - `sql/002_wow_talent_game_settings.sql`
2. Deploy patched AGIS JAR (rebuild from `agis_10.13.0_*/atavism/agis/`).
3. Copy Unity scripts from `unity/` into your Atavism client project.
4. Configure talents in Editor (Skills tab) or SQL — see `sql/sample_branch_choice_talents.sql`.

## Editor fields (Skills)

| Field | Meaning |
|-------|---------|
| `tree_id` | Tree index: 0, 1, 2 (Arms / Fury / Protection) |
| `tier` | Row from top (1 = first row) |
| `column` | Position in row (1 = left) |
| `tree_points_required` | Points spent in **this tree** before node unlocks |
| `exclusive_group` | Same group in same tree = **pick one branch** |

## Game settings

| Key | Default | Description |
|-----|---------|-------------|
| `TALENT_POINTS_START_LEVEL` | 10 | First level that grants talent points |
| `TALENT_POINTS_PER_LEVEL` | 1 | Points per level after start |
| `TALENT_TREE_MAX_POINTS` | 51 | Max points per tree |
| `TALENT_LOADOUT_COUNT` | 2 | Dual spec loadouts |
| `TALENT_RESET_CURRENCY_ID` | -1 | Currency for respec (-1 = free) |
| `TALENT_RESET_CURRENCY_COST` | 0 | Respec price |
| `TALENT_POINTS_GIVEN_PER_LEVEL` | 0 | Legacy formula disabled when start level > 1 |

## Exclusive branch choice (server)

When `exclusive_group > 0`, the server blocks investing in talent B if talent A in the same group already has ranks. Player must reset or choose a different branch before switching.

## Dual spec

Client calls:

```csharp
AtavismClient.Instance.NetworkHelper.SendTargetedCommand(
    OID.fromLong(playerOid), "combat.SWITCH_TALENT_LOADOUT", loadoutIndex);
```

Or use `WowTalentTreeController.SwitchLoadout(int)` from the Unity module.

## Unity module

Copy `unity/Scripts/` to `Assets/YourGame/Scripts/WowTalents/`.

Wire `WowTalentTreeWindow` in your UI canvas. It reads prefab skill data + live `skills` extension messages.

## Server files changed

- `SkillTemplate.java` — tree metadata
- `TalentTreeHelper.java` — validation
- `SkillInfo.java` — loadouts, tier/exclusive checks
- `ClassAbilityPlugin.java` — settings + hooks
- `ClassAbilityClient.java` — `SWITCH_TALENT_LOADOUT`
- `CombatDatabase.java` — load new columns
- `PrefabPlugin.java` — sync to client
- `ExtendedCombatMessages.java` — enriched `sendSkills`
- `RequirementCheckResult.java` — new failure types
