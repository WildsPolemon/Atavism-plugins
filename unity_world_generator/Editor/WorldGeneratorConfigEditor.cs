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

            DrawHeader();
            DrawTopActions(config);
            DrawPresetActions(config);
            DrawSearch();

            showShape = EditorGUILayout.BeginFoldoutHeaderGroup(showShape, "World Shape");
            if (showShape)
            {
                DrawProperty("worldSeed");
                DrawProperty("worldSizeInChunks");
                DrawProperty("chunkSizeMeters");
                DrawProperty("maxHeightMeters");
                DrawProperty("seaLevel01");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showTerrain = EditorGUILayout.BeginFoldoutHeaderGroup(showTerrain, "Unity Terrain");
            if (showTerrain)
            {
                DrawProperty("terrainGeneration");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showNoise = EditorGUILayout.BeginFoldoutHeaderGroup(showNoise, "Noise");
            if (showNoise)
            {
                DrawProperty("heightNoise");
                DrawProperty("moistureNoise");
                DrawProperty("temperatureNoise");
                DrawProperty("terrainShape");
                DrawProperty("biomeClimate");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showBiomes = EditorGUILayout.BeginFoldoutHeaderGroup(showBiomes, "Biome Definitions");
            if (showBiomes)
            {
                DrawProperty("biomes");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showCityCave = EditorGUILayout.BeginFoldoutHeaderGroup(showCityCave, "Cities + Caves + Roads");
            if (showCityCave)
            {
                DrawProperty("citySettings");
                DrawProperty("roadSettings");
                DrawProperty("caveSettings");
                DrawProperty("sectorSettings");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showResources = EditorGUILayout.BeginFoldoutHeaderGroup(showResources, "Resources");
            if (showResources)
            {
                DrawProperty("resourceSettings");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showSpawns = EditorGUILayout.BeginFoldoutHeaderGroup(showSpawns, "MMORPG Spawns");
            if (showSpawns)
            {
                DrawProperty("spawnSettings");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showRuntime = EditorGUILayout.BeginFoldoutHeaderGroup(showRuntime, "Runtime");
            if (showRuntime)
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
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            serializedObject.ApplyModifiedProperties();
        }

        private void DrawHeader()
        {
            Rect rect = EditorGUILayout.GetControlRect(false, 56f);
            EditorGUI.DrawRect(rect, new Color(0.12f, 0.15f, 0.20f, 1f));
            EditorGUI.DrawRect(new Rect(rect.x, rect.yMax - 3f, rect.width, 3f), new Color(0.20f, 0.58f, 0.95f, 1f));
            GUI.Label(new Rect(rect.x + 12f, rect.y + 8f, rect.width - 24f, 20f), "AAA World Generator Config", EditorStyles.boldLabel);
            GUI.Label(new Rect(rect.x + 12f, rect.y + 30f, rect.width - 24f, 18f), "Synty-ready world setup (biomes, cities, caves A, resources)", EditorStyles.miniLabel);
            EditorGUILayout.Space(6f);
        }

        private void DrawTopActions(WorldGeneratorConfig config)
        {
            EnsureConfigSections(config);
            EditorGUILayout.BeginHorizontal(EditorStyles.helpBox);
            if (GUILayout.Button("Open Dashboard", GUILayout.Height(24f)))
            {
                WorldGeneratorDashboardWindow.Open();
            }

            if (GUILayout.Button("Validate", GUILayout.Height(24f)))
            {
                List<string> messages = config.GetValidationMessages();
                if (messages.Count == 0)
                {
                    EditorUtility.DisplayDialog("Validation", "Config is valid.", "OK");
                }
                else
                {
                    EditorUtility.DisplayDialog("Validation Warnings", string.Join("\n", messages), "OK");
                }
            }

            if (GUILayout.Button("Random Seed", GUILayout.Height(24f)))
            {
                Undo.RecordObject(config, "Randomize world seed");
                config.worldSeed = Random.Range(1000, 999_999_999);
                EditorUtility.SetDirty(config);
            }

            if (GUILayout.Button("Copy Snapshot", GUILayout.Height(24f)))
            {
                float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
                float areaKm2 = (worldSize * worldSize) / 1_000_000f;
                string snapshot =
                    $"seed={config.worldSeed}\n" +
                    $"size={worldSize:0}m ({areaKm2:0.00}km2)\n" +
                    $"cities={config.citySettings.maxCities} caves={config.caveSettings.maxCaves} mobZones={config.spawnSettings.maxMobZones}\n" +
                    $"runtimeCaps={config.runtimeOptimization.maxActiveObjects}/{config.runtimeOptimization.maxActiveResources}";
                EditorGUIUtility.systemCopyBuffer = snapshot;
            }

            EditorGUILayout.EndHorizontal();
            EditorGUILayout.BeginHorizontal(EditorStyles.helpBox);
            if (GUILayout.Button("Expand All", GUILayout.Height(22f)))
            {
                SetAllFoldouts(true);
            }

            if (GUILayout.Button("Collapse All", GUILayout.Height(22f)))
            {
                SetAllFoldouts(false);
            }
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space(3f);
        }

        private void DrawPresetActions(WorldGeneratorConfig config)
        {
            EditorGUILayout.BeginVertical(EditorStyles.helpBox);
            EditorGUILayout.LabelField("Quick Presets", EditorStyles.boldLabel);
            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Balanced MMO", GUILayout.Height(22f)))
            {
                ApplyPresetBalanced(config);
            }
            if (GUILayout.Button("Cinematic", GUILayout.Height(22f)))
            {
                ApplyPresetCinematic(config);
            }
            if (GUILayout.Button("Performance", GUILayout.Height(22f)))
            {
                ApplyPresetPerformance(config);
            }
            if (GUILayout.Button("Mega World", GUILayout.Height(22f)))
            {
                ApplyPresetMega(config);
            }
            if (GUILayout.Button("WoW-like", GUILayout.Height(22f)))
            {
                ApplyPresetWowLike(config);
            }
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.EndVertical();
        }

        private void DrawSearch()
        {
            EditorGUILayout.BeginHorizontal(EditorStyles.helpBox);
            GUILayout.Label("Filter", GUILayout.Width(40f));
            searchQuery = EditorGUILayout.TextField(searchQuery);
            if (GUILayout.Button("Clear", GUILayout.Width(52f)))
            {
                searchQuery = string.Empty;
                GUI.FocusControl(null);
            }
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space(2f);
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

        private void SetAllFoldouts(bool value)
        {
            showShape = value;
            showNoise = value;
            showBiomes = value;
            showCityCave = value;
            showResources = value;
            showSpawns = value;
            showRuntime = value;
        }

        private static void ApplyPresetBalanced(WorldGeneratorConfig config)
        {
            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply balanced preset");
            config.worldSizeInChunks = 48;
            config.chunkSizeMeters = 256;
            config.citySettings.maxCities = 18;
            config.caveSettings.maxCaves = 220;
            config.spawnSettings.maxMobZones = 360;
            config.resourceSettings.baseNodeSpacing = 30f;
            config.runtimeOptimization.maxActiveObjects = 6000;
            config.runtimeOptimization.maxActiveResources = 2600;
            config.runtimeOptimization.streamingRadiusMeters = 1400f;
            config.sectorSettings.sectorSizeMeters = 768f;
            config.sectorSettings.neighborLoadRadius = 1;
            EditorUtility.SetDirty(config);
        }

        private static void ApplyPresetCinematic(WorldGeneratorConfig config)
        {
            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply cinematic preset");
            config.citySettings.maxCities = 24;
            config.caveSettings.maxCaves = 300;
            config.spawnSettings.maxMobZones = 460;
            config.resourceSettings.baseNodeSpacing = 24f;
            config.biomeClimate.variationStrength = 0.11f;
            config.runtimeOptimization.maxActiveObjects = 9000;
            config.runtimeOptimization.maxActiveResources = 4200;
            config.runtimeOptimization.streamingRadiusMeters = 1800f;
            EditorUtility.SetDirty(config);
        }

        private static void ApplyPresetPerformance(WorldGeneratorConfig config)
        {
            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply performance preset");
            config.citySettings.maxCities = Mathf.Min(config.citySettings.maxCities, 14);
            config.caveSettings.maxCaves = Mathf.Min(config.caveSettings.maxCaves, 140);
            config.spawnSettings.maxMobZones = 220;
            config.resourceSettings.baseNodeSpacing = 42f;
            config.runtimeOptimization.maxActiveObjects = 3000;
            config.runtimeOptimization.maxActiveResources = 1200;
            config.runtimeOptimization.streamingRadiusMeters = 1050f;
            config.runtimeOptimization.refreshIntervalSeconds = 0.45f;
            config.sectorSettings.sectorSizeMeters = 640f;
            EditorUtility.SetDirty(config);
        }

        private static void ApplyPresetMega(WorldGeneratorConfig config)
        {
            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply mega world preset");
            config.worldSizeInChunks = 64;
            config.chunkSizeMeters = 256;
            config.citySettings.maxCities = 28;
            config.caveSettings.maxCaves = 420;
            config.spawnSettings.maxMobZones = 700;
            config.resourceSettings.baseNodeSpacing = 34f;
            config.runtimeOptimization.maxActiveObjects = 8200;
            config.runtimeOptimization.maxActiveResources = 3800;
            config.runtimeOptimization.streamingRadiusMeters = 1900f;
            config.sectorSettings.sectorSizeMeters = 900f;
            config.sectorSettings.neighborLoadRadius = 1;
            EditorUtility.SetDirty(config);
        }

        private static void ApplyPresetWowLike(WorldGeneratorConfig config)
        {
            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply WoW-like preset");
            config.worldSizeInChunks = 56;
            config.chunkSizeMeters = 256;
            config.maxHeightMeters = 340f;
            config.seaLevel01 = 0.28f;

            config.heightNoise.frequency = 0.00095f;
            config.heightNoise.octaves = 6;
            config.heightNoise.lacunarity = 2.05f;
            config.heightNoise.persistence = 0.53f;

            config.biomeClimate.latitudeTemperatureInfluence = 0.32f;
            config.biomeClimate.elevationTemperatureDrop = 0.29f;
            config.biomeClimate.coastalMoistureBoost = 0.14f;
            config.biomeClimate.variationStrength = 0.06f;

            config.terrainShape.enableAdvancedShaping = true;
            config.terrainShape.continentInfluence = 0.28f;
            config.terrainShape.continentNoise.frequency = 0.00020f;
            config.terrainShape.continentNoise.octaves = 3;
            config.terrainShape.continentNoise.lacunarity = 2f;
            config.terrainShape.continentNoise.persistence = 0.5f;
            config.terrainShape.ridgeStrength = 0.24f;
            config.terrainShape.ridgeNoise.frequency = 0.00105f;
            config.terrainShape.ridgeNoise.octaves = 4;
            config.terrainShape.ridgeNoise.lacunarity = 2.12f;
            config.terrainShape.ridgeNoise.persistence = 0.52f;
            config.terrainShape.lowlandFlattenStrength = 0.42f;
            config.terrainShape.lowlandThreshold01 = 0.53f;
            config.terrainShape.mountainBoostStart01 = 0.72f;
            config.terrainShape.mountainBoostStrength = 0.29f;

            config.biomes = new List<BiomeDefinition>
            {
                new BiomeDefinition { biomeId = "forest", minHeight01 = 0.05f, maxHeight01 = 0.66f, idealMoisture01 = 0.66f, idealTemperature01 = 0.57f, blendWeight = 1.35f },
                new BiomeDefinition { biomeId = "desert", minHeight01 = 0.06f, maxHeight01 = 0.60f, idealMoisture01 = 0.26f, idealTemperature01 = 0.86f, blendWeight = 0.85f },
                new BiomeDefinition { biomeId = "tundra", minHeight01 = 0.34f, maxHeight01 = 1.00f, idealMoisture01 = 0.42f, idealTemperature01 = 0.20f, blendWeight = 1.20f },
                new BiomeDefinition { biomeId = "swamp", minHeight01 = 0.00f, maxHeight01 = 0.32f, idealMoisture01 = 0.90f, idealTemperature01 = 0.64f, blendWeight = 0.95f },
            };

            config.citySettings.maxCities = 16;
            config.citySettings.minDistanceBetweenCities = 980f;
            config.citySettings.cityCoreRadius = 240f;
            config.citySettings.districtRingRadius = 540f;
            config.citySettings.targetLotsPerCity = 140;
            config.citySettings.minHeightAboveSea01 = 0.03f;
            config.citySettings.shorelineBuffer01 = 0.085f;
            config.citySettings.minAreaHeightAboveSea01 = 0.05f;
            config.citySettings.waterProximitySamples = 32;

            config.roadSettings.extraConnectionsPerCity = 1;
            config.roadSettings.maxCurvatureRatio = 0.06f;
            config.caveSettings.maxCaves = 260;
            config.caveSettings.minSlopeDelta = 0.006f;
            config.resourceSettings.baseNodeSpacing = 32f;
            config.spawnSettings.maxMobZones = 390;
            config.runtimeOptimization.maxActiveObjects = 6800;
            config.runtimeOptimization.maxActiveResources = 3000;
            config.runtimeOptimization.streamingRadiusMeters = 1600f;
            config.sectorSettings.sectorSizeMeters = 820f;
            config.sectorSettings.neighborLoadRadius = 1;
            EditorUtility.SetDirty(config);
        }

        private static void EnsureConfigSections(WorldGeneratorConfig config)
        {
            if (config.citySettings == null) { config.citySettings = new CityGenerationSettings(); }
            if (config.caveSettings == null) { config.caveSettings = new CaveGenerationSettings(); }
            if (config.resourceSettings == null) { config.resourceSettings = new ResourceGenerationSettings(); }
            if (config.spawnSettings == null) { config.spawnSettings = new SpawnGenerationSettings(); }
            if (config.runtimeOptimization == null) { config.runtimeOptimization = new RuntimeOptimizationSettings(); }
            if (config.sectorSettings == null) { config.sectorSettings = new SectorGenerationSettings(); }
            if (config.terrainShape == null) { config.terrainShape = new TerrainShapeSettings(); }
            if (config.terrainGeneration == null) { config.terrainGeneration = new TerrainGenerationSettings(); }
            if (config.terrainShape.continentNoise == null) { config.terrainShape.continentNoise = new NoiseLayerSettings(0.00022f, 3, 2f, 0.5f, 201f, -144f); }
            if (config.terrainShape.ridgeNoise == null) { config.terrainShape.ridgeNoise = new NoiseLayerSettings(0.00092f, 4, 2.1f, 0.5f, -77f, 129f); }
            if (config.biomeClimate == null) { config.biomeClimate = new BiomeClimateSettings(); }
        }
    }
}
#endif
