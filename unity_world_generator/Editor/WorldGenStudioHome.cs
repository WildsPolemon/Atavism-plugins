#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    internal static class WorldGenStudioHome
    {
        internal static void Draw(
            WorldGeneratorConfig config,
            Action openLocation,
            Action openTerrain,
            Action openBiomes,
            Action generateWorld)
        {
            WorldGenEditorUi.BeginPanel("Start Here", "Build a full zone in minutes — or sculpt terrain and biomes step by step.");
            EditorGUILayout.BeginHorizontal();
            if (WorldGenEditorUi.DrawWorkflowCard(
                    "RECOMMENDED",
                    "Build Zone Location",
                    "Zone map, Alpine/Heroic terrain, 10 biomes, Synty kits, POI markers, one-click bake.",
                    WorldGenEditorUi.Accent,
                    WorldGenEditorArt.GetStepIcon(5),
                    true))
            {
                openLocation?.Invoke();
            }

            if (WorldGenEditorUi.DrawWorkflowCard(
                    "STEP 2",
                    "Terrain Studio",
                    "Live heightmap preview. Sculpt mountains, plains, coastlines with sliders.",
                    WorldGenEditorUi.Success,
                    WorldGenEditorArt.GetStepIcon(1),
                    false))
            {
                openTerrain?.Invoke();
            }
            EditorGUILayout.EndHorizontal();

            EditorGUILayout.BeginHorizontal();
            if (WorldGenEditorUi.DrawWorkflowCard(
                    "STEP 3",
                    "Biome Materials",
                    "Grass/stone splats, per-biome colors, Synty prefab folders.",
                    WorldGenEditorUi.Purple,
                    WorldGenEditorArt.GetStepIcon(2),
                    false))
            {
                openBiomes?.Invoke();
            }

            if (WorldGenEditorUi.DrawWorkflowCard(
                    "FINISH",
                    "Generate World",
                    "Layout → terrain bake → runtime spawn. Incremental, no editor freeze.",
                    WorldGenEditorUi.Warning,
                    WorldGenEditorArt.GetStepIcon(5),
                    false))
            {
                generateWorld?.Invoke();
            }
            EditorGUILayout.EndHorizontal();
            WorldGenEditorUi.EndPanel();

            if (config == null)
            {
                return;
            }

            WorldGenEditorUi.BeginPanel("Map Size Presets", "Small maps bake fast — perfect for zone iteration.");
            EditorGUILayout.BeginHorizontal();
            DrawMapSizeCard("Prototype", WorldGenStudioPresets.MapSizeHints[0], WorldGenStudioPresets.MapSizeId.Prototype, config);
            DrawMapSizeCard("Arena", WorldGenStudioPresets.MapSizeHints[1], WorldGenStudioPresets.MapSizeId.Arena, config);
            DrawMapSizeCard("Zone", WorldGenStudioPresets.MapSizeHints[2], WorldGenStudioPresets.MapSizeId.Zone, config);
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.BeginHorizontal();
            DrawMapSizeCard("Region", WorldGenStudioPresets.MapSizeHints[3], WorldGenStudioPresets.MapSizeId.Region, config);
            DrawMapSizeCard("Continent", WorldGenStudioPresets.MapSizeHints[4], WorldGenStudioPresets.MapSizeId.Continent, config);
            DrawMapSizeCard("Mega", WorldGenStudioPresets.MapSizeHints[5], WorldGenStudioPresets.MapSizeId.MegaWorld, config);
            EditorGUILayout.EndHorizontal();
            WorldGenEditorUi.EndPanel();

            WorldGenEditorUi.BeginPanel("Production Profiles", "Full-game density and streaming defaults.");
            EditorGUILayout.BeginHorizontal();
            if (WorldGenEditorUi.DrawPresetCard("Balanced MMO", "48 chunks, 18 cities", WorldGenEditorUi.Accent, true))
            {
                WorldGenPresetLibrary.Apply(config, WorldGenPresetLibrary.PresetId.BalancedMmo);
            }
            if (WorldGenEditorUi.DrawPresetCard("WoW-like", "Shaped terrain, 16 cities", WorldGenEditorUi.Purple, true))
            {
                WorldGenPresetLibrary.Apply(config, WorldGenPresetLibrary.PresetId.WowLike);
            }
            if (WorldGenEditorUi.DrawPresetCard("Performance", "Fewer objects, larger tiles", WorldGenEditorUi.Success, true))
            {
                WorldGenPresetLibrary.Apply(config, WorldGenPresetLibrary.PresetId.Performance);
            }
            EditorGUILayout.EndHorizontal();
            WorldGenEditorUi.EndPanel();
        }

        private static void DrawMapSizeCard(string title, string hint, WorldGenStudioPresets.MapSizeId size, WorldGeneratorConfig config)
        {
            if (WorldGenEditorUi.DrawPresetCard(title, hint, WorldGenEditorUi.Accent, true))
            {
                WorldGenStudioPresets.ApplyMapSize(config, size);
                WorldGenLivePreview.NotifyConfigChanged(config);
                WorldGenTerrainPreview.Invalidate();
            }
        }
    }
}
#endif
