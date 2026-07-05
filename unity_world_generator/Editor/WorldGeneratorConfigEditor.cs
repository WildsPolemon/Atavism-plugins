#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    [CustomEditor(typeof(WorldGeneratorConfig))]
    public sealed class WorldGeneratorConfigEditor : UnityEditor.Editor
    {
        private bool showShape = true;
        private bool showTerrain = true;
        private bool showNoise = true;
        private bool showBiomes = true;
        private bool showCityCave = true;
        private bool showResources = true;
        private bool showSpawns = true;
        private bool showRuntime = true;
        private string searchQuery = string.Empty;

        public override void OnInspectorGUI()
        {
            serializedObject.Update();
            WorldGeneratorConfig config = (WorldGeneratorConfig)target;
            WorldGenEditorUi.EnsureStyles();

            DrawHeader();
            DrawMetrics(config);
            DrawTopActions(config);
            DrawPresetCards(config);
            DrawTerrainPreview(config);
            DrawSearch();

            showShape = DrawFoldoutSection(showShape, "World Shape", () =>
            {
                DrawProperty("worldSeed");
                DrawProperty("worldSizeInChunks");
                DrawProperty("chunkSizeMeters");
                DrawProperty("maxHeightMeters");
                DrawProperty("seaLevel01");
            });

            showTerrain = DrawFoldoutSection(showTerrain, "Unity Terrain", () =>
            {
                DrawProperty("terrainGeneration");
            });

            showNoise = DrawFoldoutSection(showNoise, "Noise & Climate", () =>
            {
                DrawProperty("heightNoise");
                DrawProperty("moistureNoise");
                DrawProperty("temperatureNoise");
                DrawProperty("terrainShape");
                DrawProperty("biomeClimate");
            });

            showBiomes = DrawFoldoutSection(showBiomes, "Biome Definitions", () =>
            {
                DrawProperty("biomes");
            });

            showCityCave = DrawFoldoutSection(showCityCave, "Cities, Roads & Caves", () =>
            {
                DrawProperty("citySettings");
                DrawProperty("roadSettings");
                DrawProperty("caveSettings");
                DrawProperty("sectorSettings");
            });

            showResources = DrawFoldoutSection(showResources, "Resources", () =>
            {
                DrawProperty("resourceSettings");
            });

            showSpawns = DrawFoldoutSection(showSpawns, "MMO Spawns", () =>
            {
                DrawProperty("spawnSettings");
            });

            showRuntime = DrawFoldoutSection(showRuntime, "Runtime & Markers", () =>
            {
                DrawProperty("cityRoot");
                DrawProperty("caveRoot");
                DrawProperty("resourceRoot");
                DrawProperty("roadRoot");
                DrawProperty("spawnRoot");
                DrawProperty("clearRootsBeforeSpawn");
                DrawProperty("roadMarkerPrefab");
                DrawProperty("playerSpawnMarkerPrefab");
                DrawProperty("npcSpawnMarkerPrefab");
                DrawProperty("mobZoneMarkerPrefab");
                DrawProperty("runtimeOptimization");
            });

            serializedObject.ApplyModifiedProperties();
        }

        private void DrawHeader()
        {
            WorldGenEditorUi.DrawTopBanner(
                "WorldGen Config",
                "Inspector view — open WorldGen Studio for full workflow.");
        }

        private void DrawMetrics(WorldGeneratorConfig config)
        {
            WorldGenPresetLibrary.EnsureConfigSections(config);
            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            float areaKm2 = (worldSize * worldSize) / 1_000_000f;
            int terrainTiles = EstimateTerrainTiles(config);
            List<string> validation = config.GetValidationMessages();
            Color validationColor = validation.Count == 0 ? WorldGenEditorUi.Success : WorldGenEditorUi.Warning;

            EditorGUILayout.Space(4f);
            EditorGUILayout.BeginHorizontal();
            WorldGenEditorUi.DrawMetricCard("Area", $"{areaKm2:0.0} km²", $"{worldSize:0}m", WorldGenEditorUi.Accent);
            WorldGenEditorUi.DrawMetricCard("Cities", config.citySettings.maxCities.ToString(), "target", WorldGenEditorUi.Success);
            WorldGenEditorUi.DrawMetricCard("Tiles", terrainTiles.ToString(), "terrain", WorldGenEditorUi.Accent);
            WorldGenEditorUi.DrawMetricCard("Health", validation.Count == 0 ? "OK" : $"{validation.Count} warn", "validation", validationColor);
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space(4f);
        }

        private void DrawTopActions(WorldGeneratorConfig config)
        {
            WorldGenEditorUi.BeginPanel("Actions", "Quick controls without leaving the inspector.");
            EditorGUILayout.BeginHorizontal();
            if (WorldGenEditorUi.DrawPrimaryButton("Open WorldGen Studio", 32f))
            {
                WorldGeneratorDashboardWindow.Open();
            }

            WorldGenerator sceneGen = FindSceneGenerator();
            EditorGUI.BeginDisabledGroup(sceneGen == null);
            if (GUILayout.Button("Generate World", GUILayout.Height(32f)))
            {
                TryGenerateFromInspector(sceneGen, config);
            }
            if (GUILayout.Button("Terrain Only", GUILayout.Height(32f)))
            {
                TryTerrainOnlyFromInspector(sceneGen, config);
            }
            EditorGUI.EndDisabledGroup();

            if (GUILayout.Button("Validate", GUILayout.Height(32f)))
            {
                List<string> messages = config.GetValidationMessages();
                string body = messages.Count == 0 ? "Config is valid." : string.Join("\n", messages);
                EditorUtility.DisplayDialog("Validation", body, "OK");
            }

            if (GUILayout.Button("Random Seed", GUILayout.Height(32f)))
            {
                Undo.RecordObject(config, "Randomize world seed");
                config.worldSeed = Random.Range(1000, 999_999_999);
                EditorUtility.SetDirty(config);
            }

            if (GUILayout.Button("Copy Snapshot", GUILayout.Height(32f)))
            {
                CopySnapshot(config);
            }
            EditorGUILayout.EndHorizontal();

            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Expand All", GUILayout.Height(22f))) { SetAllFoldouts(true); }
            if (GUILayout.Button("Collapse All", GUILayout.Height(22f))) { SetAllFoldouts(false); }
            EditorGUILayout.EndHorizontal();
            WorldGenEditorUi.EndPanel();
        }

        private void DrawPresetCards(WorldGeneratorConfig config)
        {
            WorldGenEditorUi.BeginPanel("Presets", "One-click production profiles.");
            EditorGUILayout.BeginHorizontal();
            if (WorldGenEditorUi.DrawPresetCard("Balanced MMO", "48 chunks, 18 cities", true))
            {
                WorldGenPresetLibrary.Apply(config, WorldGenPresetLibrary.PresetId.BalancedMmo);
            }
            if (WorldGenEditorUi.DrawPresetCard("WoW-like", "Shaped terrain, 16 cities", true))
            {
                WorldGenPresetLibrary.Apply(config, WorldGenPresetLibrary.PresetId.WowLike);
            }
            if (WorldGenEditorUi.DrawPresetCard("Performance", "Fewer objects, big tiles", true))
            {
                WorldGenPresetLibrary.Apply(config, WorldGenPresetLibrary.PresetId.Performance);
            }
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.BeginHorizontal();
            if (WorldGenEditorUi.DrawPresetCard("Cinematic", "High density + terrain res", true))
            {
                WorldGenPresetLibrary.Apply(config, WorldGenPresetLibrary.PresetId.Cinematic);
            }
            if (WorldGenEditorUi.DrawPresetCard("Mega World", "64 chunks, 28 cities", true))
            {
                WorldGenPresetLibrary.Apply(config, WorldGenPresetLibrary.PresetId.MegaWorld);
            }
            EditorGUILayout.EndHorizontal();
            WorldGenEditorUi.EndPanel();
        }

        private void DrawTerrainPreview(WorldGeneratorConfig config)
        {
            WorldGenEditorUi.BeginPanel("Terrain Preview", "Quick height map without full generation.");
            WorldGenTerrainPreview.DrawPreview(config, 220);
            WorldGenEditorUi.EndPanel();
        }

        private static WorldGenerator FindSceneGenerator()
        {
            return UnityEngine.Object.FindObjectOfType<WorldGenerator>();
        }

        private static void TryGenerateFromInspector(WorldGenerator generator, WorldGeneratorConfig config)
        {
            if (generator == null) return;
            Undo.RecordObject(generator, "Generate world");
            generator.Config = config;
            TerrainBakeEditorRunner.RunFullWorld(
                generator,
                _ => WorldGenTerrainPreview.Invalidate());
        }

        private static void TryTerrainOnlyFromInspector(WorldGenerator generator, WorldGeneratorConfig config)
        {
            if (generator == null) return;
            Undo.RecordObject(generator, "Generate terrain");
            generator.Config = config;
            TerrainBakeEditorRunner.RunTerrainOnly(generator, () => WorldGenTerrainPreview.Invalidate());
        }

        private void DrawSearch()
        {
            EditorGUILayout.BeginHorizontal(EditorStyles.toolbar);
            GUILayout.Label("Filter", EditorStyles.miniLabel, GUILayout.Width(36f));
            searchQuery = EditorGUILayout.TextField(searchQuery, EditorStyles.toolbarSearchField);
            if (GUILayout.Button("Clear", EditorStyles.toolbarButton, GUILayout.Width(48f)))
            {
                searchQuery = string.Empty;
                GUI.FocusControl(null);
            }
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space(4f);
        }

        private bool DrawFoldoutSection(bool expanded, string title, System.Action drawContent)
        {
            WorldGenEditorUi.BeginPanel(title);
            expanded = EditorGUILayout.Foldout(expanded, "Show fields", true);
            if (expanded)
            {
                drawContent();
            }
            WorldGenEditorUi.EndPanel();
            return expanded;
        }

        private void DrawProperty(string propertyName)
        {
            if (!string.IsNullOrWhiteSpace(searchQuery) &&
                propertyName.IndexOf(searchQuery.Trim(), System.StringComparison.OrdinalIgnoreCase) < 0)
            {
                return;
            }

            SerializedProperty property = serializedObject.FindProperty(propertyName);
            if (property != null)
            {
                EditorGUILayout.PropertyField(property, true);
            }
        }

        private static void CopySnapshot(WorldGeneratorConfig config)
        {
            WorldGenPresetLibrary.EnsureConfigSections(config);
            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            float areaKm2 = (worldSize * worldSize) / 1_000_000f;
            string snapshot =
                $"seed={config.worldSeed}\n" +
                $"size={worldSize:0}m ({areaKm2:0.00}km2)\n" +
                $"cities={config.citySettings.maxCities} caves={config.caveSettings.maxCaves} mobZones={config.spawnSettings.maxMobZones}\n" +
                $"runtimeCaps={config.runtimeOptimization.maxActiveObjects}/{config.runtimeOptimization.maxActiveResources}";
            EditorGUIUtility.systemCopyBuffer = snapshot;
        }

        private static int EstimateTerrainTiles(WorldGeneratorConfig config)
        {
            if (config?.terrainGeneration == null || !config.terrainGeneration.enableTerrainGeneration)
            {
                return 0;
            }

            float world = config.worldSizeInChunks * config.chunkSizeMeters;
            float tile = Mathf.Max(32f, config.terrainGeneration.terrainTileSizeMeters);
            int perAxis = Mathf.CeilToInt(world / tile);
            return perAxis * perAxis;
        }

        private void SetAllFoldouts(bool value)
        {
            showShape = value;
            showTerrain = value;
            showNoise = value;
            showBiomes = value;
            showCityCave = value;
            showResources = value;
            showSpawns = value;
            showRuntime = value;
        }
    }
}
#endif
