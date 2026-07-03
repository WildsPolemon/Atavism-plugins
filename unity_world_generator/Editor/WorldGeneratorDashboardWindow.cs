#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    public sealed class WorldGeneratorDashboardWindow : EditorWindow
    {
        private static readonly string[] Tabs =
        {
            "Overview",
            "Biome Lab",
            "World Layout",
            "Spawns + Performance",
            "Diagnostics",
            "Tools"
        };
        private static readonly string[] PresetNames = { "Balanced MMO", "Cinematic World", "Performance First", "Mega World", "WoW-like Adventure" };

        private WorldGenerator generator;
        private WorldGeneratorConfig config;
        private SerializedObject configSerializedObject;
        private Vector2 scroll;
        private int selectedTab;
        private int selectedPreset;
        private string statusLine = "Ready";
        private string searchQuery = string.Empty;
        private bool showValidationWarningsOnly = true;
        private string toolsSnapshot = string.Empty;
        private List<string> validationMessages = new List<string>();

        private GUIStyle heroTitleStyle;
        private GUIStyle heroSubtitleStyle;
        private GUIStyle cardTitleStyle;
        private GUIStyle dimLabelStyle;
        private GUIStyle chipStyle;
        private bool stylesInitialized;

        [MenuItem("Window/World Generation/AAA Generator Dashboard")]
        public static void Open()
        {
            WorldGeneratorDashboardWindow window = GetWindow<WorldGeneratorDashboardWindow>();
            window.titleContent = new GUIContent("AAA WorldGen");
            window.minSize = new Vector2(820f, 560f);
            window.Show();
        }

        private void OnEnable()
        {
            if (generator == null)
            {
                generator = FindObjectOfType<WorldGenerator>();
            }

            if (generator != null && config == null)
            {
                config = generator.Config;
            }

            EnsureSerializedObject();
            RefreshValidation();
        }

        private void OnGUI()
        {
            EnsureStyles();
            DrawHero();
            DrawSelections();
            DrawActionBar();
            DrawFilterBar();
            DrawTabs();

            if (config == null)
            {
                EditorGUILayout.HelpBox("Assign a WorldGeneratorConfig to start editing and generating the world.", MessageType.Info);
                return;
            }

            EnsureSerializedObject();
            configSerializedObject.Update();

            scroll = EditorGUILayout.BeginScrollView(scroll);
            switch (selectedTab)
            {
                case 0:
                    DrawOverviewTab();
                    break;
                case 1:
                    DrawBiomeLabTab();
                    break;
                case 2:
                    DrawWorldLayoutTab();
                    break;
                case 3:
                    DrawSpawnsAndPerformanceTab();
                    break;
                case 4:
                    DrawDiagnosticsTab();
                    break;
                case 5:
                    DrawToolsTab();
                    break;
            }
            EditorGUILayout.EndScrollView();

            if (configSerializedObject.ApplyModifiedProperties())
            {
                EditorUtility.SetDirty(config);
            }
        }

        private void DrawHero()
        {
            Rect rect = EditorGUILayout.GetControlRect(false, 76f);
            EditorGUI.DrawRect(rect, new Color(0.10f, 0.13f, 0.18f, 1f));

            Rect accent = new Rect(rect.x, rect.yMax - 4f, rect.width, 4f);
            EditorGUI.DrawRect(accent, new Color(0.20f, 0.58f, 0.95f, 1f));

            GUI.Label(new Rect(rect.x + 16f, rect.y + 10f, rect.width - 32f, 28f), "AAA World Generator Dashboard", heroTitleStyle);
            GUI.Label(new Rect(rect.x + 16f, rect.y + 38f, rect.width - 32f, 20f), "Biome lab, presets, MMO sectors, diagnostics, and runtime optimization in one workspace.", heroSubtitleStyle);
        }

        private void DrawSelections()
        {
            EditorGUILayout.Space(6f);
            EditorGUILayout.BeginHorizontal();
            generator = (WorldGenerator)EditorGUILayout.ObjectField("World Generator", generator, typeof(WorldGenerator), true);
            config = (WorldGeneratorConfig)EditorGUILayout.ObjectField("Config", config, typeof(WorldGeneratorConfig), false);
            EditorGUILayout.EndHorizontal();

            if (generator != null && config != null && generator.Config != config)
            {
                Undo.RecordObject(generator, "Assign World Generator Config");
                generator.Config = config;
                EditorUtility.SetDirty(generator);
            }
        }

        private void DrawActionBar()
        {
            EditorGUILayout.Space(4f);
            EditorGUILayout.BeginHorizontal(EditorStyles.helpBox);

            if (GUILayout.Button("Generate World", GUILayout.Height(28f)))
            {
                TryGenerateWorld();
            }

            if (GUILayout.Button("Generate + Export", GUILayout.Height(28f)))
            {
                TryGenerateAndExportQuick();
            }

            if (GUILayout.Button("Export JSON", GUILayout.Height(28f)))
            {
                TryExportJson();
            }

            if (GUILayout.Button("Validate Config", GUILayout.Height(28f)))
            {
                RefreshValidation();
            }

            if (GUILayout.Button("Randomize Seed", GUILayout.Height(28f)))
            {
                RandomizeSeed();
            }

            selectedPreset = EditorGUILayout.Popup(selectedPreset, PresetNames, GUILayout.Width(140f));
            if (GUILayout.Button("Apply Preset", GUILayout.Height(28f), GUILayout.Width(110f)))
            {
                ApplySelectedPreset();
            }

            GUILayout.FlexibleSpace();
            GUILayout.Label(statusLine, dimLabelStyle);
            EditorGUILayout.EndHorizontal();
        }

        private void DrawFilterBar()
        {
            EditorGUILayout.BeginHorizontal(EditorStyles.helpBox);
            GUILayout.Label("Filter", GUILayout.Width(42f));
            searchQuery = EditorGUILayout.TextField(searchQuery);
            if (GUILayout.Button("Clear", GUILayout.Width(58f)))
            {
                searchQuery = string.Empty;
                GUI.FocusControl(null);
            }

            GUILayout.Label($"{validationMessages.Count} warnings", chipStyle, GUILayout.Width(104f));
            EditorGUILayout.EndHorizontal();
        }

        private void DrawTabs()
        {
            selectedTab = GUILayout.Toolbar(selectedTab, Tabs, GUILayout.Height(26f));
            EditorGUILayout.Space(6f);
        }

        private void DrawOverviewTab()
        {
            DrawCard("Quick Presets", () =>
            {
                EditorGUILayout.HelpBox("Use one-click setup profiles, then tweak details below.", MessageType.None);
                EditorGUILayout.BeginHorizontal();
                if (GUILayout.Button("Balanced MMO", GUILayout.Height(26f))) { ApplyPresetBalancedMmo(); }
                if (GUILayout.Button("Cinematic", GUILayout.Height(26f))) { ApplyPresetCinematic(); }
                if (GUILayout.Button("Performance", GUILayout.Height(26f))) { ApplyPresetPerformance(); }
                if (GUILayout.Button("Mega World", GUILayout.Height(26f))) { ApplyPresetMegaWorld(); }
                EditorGUILayout.EndHorizontal();
                EditorGUILayout.BeginHorizontal();
                if (GUILayout.Button("WoW-like Adventure", GUILayout.Height(26f))) { ApplyPresetWowLikeAdventure(); }
                EditorGUILayout.EndHorizontal();
                EditorGUILayout.Space(4f);
                DrawConfigEstimateSummary();
            });

            if (GroupVisible("world", "shape", "size", "height", "sea"))
            {
                DrawCard("World Shape", () =>
                {
                    DrawProperty("worldSeed");
                    DrawProperty("worldSizeInChunks");
                    DrawProperty("chunkSizeMeters");
                    DrawProperty("maxHeightMeters");
                    DrawProperty("seaLevel01");
                });

                DrawCard("Unity Terrain", () =>
                {
                    DrawProperty("terrainGeneration");
                });
            }

            if (GroupVisible("noise", "temperature", "moisture", "climate", "variation", "terrain", "ridge", "continent"))
            {
                DrawCard("Noise + Climate", () =>
                {
                    DrawProperty("heightNoise");
                    DrawProperty("moistureNoise");
                    DrawProperty("temperatureNoise");
                    DrawProperty("terrainShape");
                    DrawProperty("biomeClimate");
                });
            }

            if (GroupVisible("runtime", "root", "prefab", "marker", "streaming"))
            {
                DrawCard("Runtime + Roots", () =>
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
            }
        }

        private void DrawBiomeLabTab()
        {
            DrawCard("Biome Automation", () =>
            {
                EditorGUILayout.HelpBox("Fast helpers for cleaner biome blends and better visual separation.", MessageType.None);
                EditorGUILayout.BeginHorizontal();
                if (GUILayout.Button("Normalize Blend Weights", GUILayout.Height(24f)))
                {
                    NormalizeBiomeBlendWeights();
                }

                if (GUILayout.Button("Rebalance Height Bands", GUILayout.Height(24f)))
                {
                    RebalanceBiomeHeightBands();
                }
                EditorGUILayout.EndHorizontal();

                EditorGUILayout.BeginHorizontal();
                if (GUILayout.Button("Apply 4-Biome MMO Template", GUILayout.Height(24f)))
                {
                    ApplyBiomeTemplate();
                }

                if (GUILayout.Button("Sort by Min Height", GUILayout.Height(24f)))
                {
                    SortBiomesByHeight();
                }
                EditorGUILayout.EndHorizontal();
            });

            if (GroupVisible("biome", "forest", "desert", "tundra", "swamp", "prefab"))
            {
                DrawCard("Biome Studio", () =>
                {
                    EditorGUILayout.HelpBox("Configure thresholds and assign Synty prefab pools per biome.", MessageType.None);
                    DrawProperty("biomes");
                });
            }
        }

        private void DrawWorldLayoutTab()
        {
            if (GroupVisible("city", "shore", "water", "district"))
            {
                DrawCard("City Generation + Inland Safety", () =>
                {
                    DrawProperty("citySettings");
                    EditorGUILayout.BeginHorizontal();
                    if (GUILayout.Button("Apply Inland Safety Defaults", GUILayout.Height(24f)))
                    {
                        ApplyInlandCityDefaults();
                    }

                    if (GUILayout.Button("Loosen Inland Safety", GUILayout.Height(24f)))
                    {
                        ApplyRelaxedCityDefaults();
                    }
                    EditorGUILayout.EndHorizontal();
                });
            }

            if (GroupVisible("sector", "aoi", "partition"))
            {
                DrawCard("World Sectors", () =>
                {
                    EditorGUILayout.HelpBox("Sector grid for MMO streaming and server-side spawn partitioning.", MessageType.None);
                    DrawProperty("sectorSettings");
                });
            }

            if (GroupVisible("road", "network"))
            {
                DrawCard("Intercity Roads", () =>
                {
                    EditorGUILayout.HelpBox("Road network builds MST backbone plus extra city connections.", MessageType.None);
                    DrawProperty("roadSettings");
                });
            }

            if (GroupVisible("cave", "stamp"))
            {
                DrawCard("Cave Generation (Variant A)", () =>
                {
                    EditorGUILayout.HelpBox("Stamp-based cave entrances with weighted presets and corridor chains.", MessageType.None);
                    DrawProperty("caveSettings");
                });
            }
        }

        private void DrawSpawnsAndPerformanceTab()
        {
            if (GroupVisible("resource", "node"))
            {
                DrawCard("Resource Distribution", () =>
                {
                    DrawProperty("resourceSettings");
                });
            }

            if (GroupVisible("spawn", "npc", "mob", "player"))
            {
                DrawCard("MMORPG Spawn Generation", () =>
                {
                    EditorGUILayout.HelpBox("Generates player, NPC, and wilderness mob zones for MMO loops.", MessageType.None);
                    DrawProperty("spawnSettings");
                });
            }

            if (GroupVisible("runtime", "performance", "stream", "budget"))
            {
                DrawCard("Runtime Performance", () =>
                {
                    DrawProperty("runtimeOptimization");
                    EditorGUILayout.BeginHorizontal();
                    if (GUILayout.Button("Performance Preset", GUILayout.Height(24f)))
                    {
                        ApplyRuntimePerformanceProfile();
                    }
                    if (GUILayout.Button("Visual Richness Preset", GUILayout.Height(24f)))
                    {
                        ApplyRuntimeRichProfile();
                    }
                    EditorGUILayout.EndHorizontal();
                });
            }
        }

        private void DrawDiagnosticsTab()
        {
            DrawCard("Validation", () =>
            {
                showValidationWarningsOnly = EditorGUILayout.ToggleLeft("Show warnings only", showValidationWarningsOnly);
                List<string> visible = FilterValidationMessages();
                if (visible.Count == 0)
                {
                    EditorGUILayout.HelpBox("Config is valid.", MessageType.Info);
                }
                else
                {
                    for (int i = 0; i < visible.Count; i++)
                    {
                        EditorGUILayout.HelpBox(visible[i], MessageType.Warning);
                    }
                }
            });

            DrawCard("Last Generation", () =>
            {
                if (generator == null || generator.LastResult == null)
                {
                    EditorGUILayout.HelpBox("No generation has been run yet.", MessageType.None);
                    return;
                }

                WorldGenerationResult result = generator.LastResult;
                EditorGUILayout.LabelField("Seed", result.worldSeed.ToString());
                EditorGUILayout.LabelField("World Size", $"{result.worldWidth:0}m x {result.worldLength:0}m");
                EditorGUILayout.LabelField("Cities", result.cities.Count.ToString());
                EditorGUILayout.LabelField("Intercity Roads", result.worldRoads.Count.ToString());
                EditorGUILayout.LabelField("Caves", result.caves.Count.ToString());
                EditorGUILayout.LabelField("Resources", result.resources.Count.ToString());
                EditorGUILayout.LabelField("Player Spawns", result.playerSpawns.Count.ToString());
                EditorGUILayout.LabelField("NPC Spawns", result.npcSpawns.Count.ToString());
                EditorGUILayout.LabelField("Mob Zones", result.mobSpawnZones.Count.ToString());
                EditorGUILayout.LabelField("Sectors", result.sectors.Count.ToString());

                DrawBiomeDistribution(result);
                DrawSectorHotspots(result);
            });
        }

        private void DrawToolsTab()
        {
            DrawCard("Operations Toolkit", () =>
            {
                EditorGUILayout.HelpBox("Advanced utility actions for iteration and handoff.", MessageType.None);
                EditorGUILayout.BeginHorizontal();
                if (GUILayout.Button("Copy Config Snapshot", GUILayout.Height(24f)))
                {
                    CopyConfigSnapshotToClipboard();
                }

                if (GUILayout.Button("Ping Spawn Roots", GUILayout.Height(24f)))
                {
                    PingSpawnRoots();
                }
                EditorGUILayout.EndHorizontal();

                EditorGUILayout.BeginHorizontal();
                if (GUILayout.Button("Generate + Save /tmp JSON", GUILayout.Height(24f)))
                {
                    TryQuickExportToTemp();
                }

                if (GUILayout.Button("Open README Folder", GUILayout.Height(24f)))
                {
                    RevealGeneratorFolder();
                }
                EditorGUILayout.EndHorizontal();

                if (!string.IsNullOrWhiteSpace(toolsSnapshot))
                {
                    EditorGUILayout.Space(6f);
                    EditorGUILayout.LabelField("Snapshot", EditorStyles.boldLabel);
                    EditorGUILayout.TextArea(toolsSnapshot, GUILayout.Height(170f));
                }
            });
        }

        private void TryGenerateWorld()
        {
            if (generator == null)
            {
                statusLine = "No WorldGenerator in scene.";
                return;
            }

            if (config == null)
            {
                statusLine = "No config selected.";
                return;
            }

            try
            {
                Undo.RecordObject(generator, "Generate World");
                generator.Config = config;
                WorldGenerationResult result = generator.GenerateNow();
                TerrainGenerator.TerrainGenerationResult terrain = generator.LastTerrainResult;
                string terrainInfo = terrain != null && terrain.terrains != null
                    ? $", {terrain.terrains.Count} terrain tiles"
                    : string.Empty;
                statusLine = $"Generated: {result.cities.Count} cities, {result.worldRoads.Count} roads, {result.caves.Count} caves, {result.resources.Count} resources, {result.mobSpawnZones.Count} mob zones{terrainInfo}.";
            }
            catch (Exception ex)
            {
                statusLine = "Generation failed.";
                Debug.LogException(ex);
            }
        }

        private void TryGenerateAndExportQuick()
        {
            if (generator == null || config == null)
            {
                statusLine = "Assign generator and config first.";
                return;
            }

            try
            {
                generator.Config = config;
                generator.GenerateNow();
                string path = Path.Combine(Path.GetTempPath(), $"worldgen_{DateTime.Now:yyyyMMdd_HHmmss}.json");
                generator.ExportLastResultJson(path);
                statusLine = $"Generated and exported: {path}";
            }
            catch (Exception ex)
            {
                statusLine = "Generate + export failed.";
                Debug.LogException(ex);
            }
        }

        private void TryQuickExportToTemp()
        {
            if (generator == null || config == null)
            {
                statusLine = "Assign generator and config first.";
                return;
            }

            try
            {
                generator.Config = config;
                string path = Path.Combine(Path.GetTempPath(), $"worldgen_manual_{DateTime.Now:yyyyMMdd_HHmmss}.json");
                generator.ExportLastResultJson(path);
                statusLine = $"Saved temp JSON: {path}";
            }
            catch (Exception ex)
            {
                statusLine = "Temp export failed.";
                Debug.LogException(ex);
            }
        }

        private void RandomizeSeed()
        {
            if (config == null)
            {
                return;
            }

            Undo.RecordObject(config, "Randomize world seed");
            config.worldSeed = UnityEngine.Random.Range(1000, 999_999_999);
            EditorUtility.SetDirty(config);
            statusLine = $"New seed: {config.worldSeed}";
        }

        private void ApplySelectedPreset()
        {
            switch (selectedPreset)
            {
                case 0:
                    ApplyPresetBalancedMmo();
                    break;
                case 1:
                    ApplyPresetCinematic();
                    break;
                case 2:
                    ApplyPresetPerformance();
                    break;
                case 3:
                    ApplyPresetMegaWorld();
                    break;
                case 4:
                    ApplyPresetWowLikeAdventure();
                    break;
            }
        }

        private void ApplyPresetBalancedMmo()
        {
            if (config == null)
            {
                return;
            }

            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply balanced MMO preset");
            config.worldSizeInChunks = 48;
            config.chunkSizeMeters = 256;
            config.citySettings.maxCities = 18;
            config.caveSettings.maxCaves = 220;
            config.resourceSettings.baseNodeSpacing = 30f;
            config.spawnSettings.maxMobZones = 360;
            config.runtimeOptimization.maxActiveObjects = 6000;
            config.runtimeOptimization.maxActiveResources = 2600;
            config.runtimeOptimization.streamingRadiusMeters = 1400f;
            config.sectorSettings.sectorSizeMeters = 768f;
            config.sectorSettings.neighborLoadRadius = 1;
            EditorUtility.SetDirty(config);
            statusLine = "Preset applied: Balanced MMO";
        }

        private void ApplyPresetCinematic()
        {
            if (config == null)
            {
                return;
            }

            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply cinematic preset");
            config.citySettings.maxCities = 24;
            config.caveSettings.maxCaves = 300;
            config.resourceSettings.baseNodeSpacing = 24f;
            config.spawnSettings.maxMobZones = 460;
            config.runtimeOptimization.maxActiveObjects = 9000;
            config.runtimeOptimization.maxActiveResources = 4200;
            config.runtimeOptimization.streamingRadiusMeters = 1800f;
            config.biomeClimate.variationStrength = 0.11f;
            EditorUtility.SetDirty(config);
            statusLine = "Preset applied: Cinematic World";
        }

        private void ApplyPresetPerformance()
        {
            if (config == null)
            {
                return;
            }

            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply performance preset");
            config.citySettings.maxCities = Mathf.Min(config.citySettings.maxCities, 14);
            config.caveSettings.maxCaves = Mathf.Min(config.caveSettings.maxCaves, 140);
            config.resourceSettings.baseNodeSpacing = 42f;
            config.spawnSettings.maxMobZones = 220;
            config.runtimeOptimization.maxActiveObjects = 3500;
            config.runtimeOptimization.maxActiveResources = 1500;
            config.runtimeOptimization.streamingRadiusMeters = 1150f;
            config.runtimeOptimization.refreshIntervalSeconds = 0.45f;
            config.sectorSettings.sectorSizeMeters = 640f;
            EditorUtility.SetDirty(config);
            statusLine = "Preset applied: Performance First";
        }

        private void ApplyPresetMegaWorld()
        {
            if (config == null)
            {
                return;
            }

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
            statusLine = "Preset applied: Mega World";
        }

        private void ApplyPresetWowLikeAdventure()
        {
            if (config == null)
            {
                return;
            }

            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply WoW-like adventure preset");
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
            statusLine = "Preset applied: WoW-like Adventure";
        }

        private void ApplyInlandCityDefaults()
        {
            if (config == null)
            {
                return;
            }

            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply inland city defaults");
            config.citySettings.minHeightAboveSea01 = 0.03f;
            config.citySettings.shorelineBuffer01 = 0.08f;
            config.citySettings.minAreaHeightAboveSea01 = 0.05f;
            config.citySettings.waterProximitySamples = 32;
            EditorUtility.SetDirty(config);
            statusLine = "Applied inland city defaults.";
        }

        private void ApplyRelaxedCityDefaults()
        {
            if (config == null)
            {
                return;
            }

            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply relaxed city defaults");
            config.citySettings.minHeightAboveSea01 = 0.018f;
            config.citySettings.shorelineBuffer01 = 0.045f;
            config.citySettings.minAreaHeightAboveSea01 = 0.03f;
            config.citySettings.waterProximitySamples = 20;
            EditorUtility.SetDirty(config);
            statusLine = "Applied relaxed inland defaults.";
        }

        private void ApplyRuntimePerformanceProfile()
        {
            if (config == null)
            {
                return;
            }

            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply runtime performance profile");
            config.runtimeOptimization.enableDistanceStreaming = true;
            config.runtimeOptimization.maxActiveObjects = 3000;
            config.runtimeOptimization.maxActiveResources = 1200;
            config.runtimeOptimization.streamingRadiusMeters = 1050f;
            config.runtimeOptimization.unloadPaddingMeters = 200f;
            config.runtimeOptimization.refreshIntervalSeconds = 0.45f;
            EditorUtility.SetDirty(config);
            statusLine = "Runtime profile: Performance";
        }

        private void ApplyRuntimeRichProfile()
        {
            if (config == null)
            {
                return;
            }

            EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply runtime rich profile");
            config.runtimeOptimization.enableDistanceStreaming = true;
            config.runtimeOptimization.maxActiveObjects = 8800;
            config.runtimeOptimization.maxActiveResources = 4200;
            config.runtimeOptimization.streamingRadiusMeters = 1900f;
            config.runtimeOptimization.unloadPaddingMeters = 320f;
            config.runtimeOptimization.refreshIntervalSeconds = 0.30f;
            EditorUtility.SetDirty(config);
            statusLine = "Runtime profile: Visual Richness";
        }

        private void NormalizeBiomeBlendWeights()
        {
            if (config == null || config.biomes == null || config.biomes.Count == 0)
            {
                return;
            }

            Undo.RecordObject(config, "Normalize biome blend weights");
            float total = 0f;
            for (int i = 0; i < config.biomes.Count; i++)
            {
                total += Mathf.Max(0.001f, config.biomes[i].blendWeight);
            }

            float target = config.biomes.Count;
            for (int i = 0; i < config.biomes.Count; i++)
            {
                float w = Mathf.Max(0.001f, config.biomes[i].blendWeight);
                config.biomes[i].blendWeight = (w / total) * target;
            }

            EditorUtility.SetDirty(config);
            statusLine = "Biome blend weights normalized.";
        }

        private void RebalanceBiomeHeightBands()
        {
            if (config == null || config.biomes == null || config.biomes.Count == 0)
            {
                return;
            }

            Undo.RecordObject(config, "Rebalance biome height bands");
            int count = config.biomes.Count;
            for (int i = 0; i < count; i++)
            {
                float min = i / (float)count;
                float max = (i + 1) / (float)count;
                config.biomes[i].minHeight01 = min;
                config.biomes[i].maxHeight01 = max;
            }

            EditorUtility.SetDirty(config);
            statusLine = "Biome height bands rebalanced.";
        }

        private void SortBiomesByHeight()
        {
            if (config == null || config.biomes == null || config.biomes.Count <= 1)
            {
                return;
            }

            Undo.RecordObject(config, "Sort biomes by min height");
            config.biomes.Sort((a, b) => a.minHeight01.CompareTo(b.minHeight01));
            EditorUtility.SetDirty(config);
            statusLine = "Biomes sorted by min height.";
        }

        private void ApplyBiomeTemplate()
        {
            if (config == null)
            {
                return;
            }

            Undo.RecordObject(config, "Apply biome template");
            config.biomes = new List<BiomeDefinition>
            {
                new BiomeDefinition { biomeId = "swamp", minHeight01 = 0.00f, maxHeight01 = 0.30f, idealMoisture01 = 0.85f, idealTemperature01 = 0.62f, blendWeight = 1.2f },
                new BiomeDefinition { biomeId = "forest", minHeight01 = 0.12f, maxHeight01 = 0.72f, idealMoisture01 = 0.70f, idealTemperature01 = 0.58f, blendWeight = 1.2f },
                new BiomeDefinition { biomeId = "desert", minHeight01 = 0.08f, maxHeight01 = 0.70f, idealMoisture01 = 0.20f, idealTemperature01 = 0.88f, blendWeight = 1.0f },
                new BiomeDefinition { biomeId = "tundra", minHeight01 = 0.18f, maxHeight01 = 0.92f, idealMoisture01 = 0.40f, idealTemperature01 = 0.18f, blendWeight = 1.1f },
            };
            EditorUtility.SetDirty(config);
            statusLine = "Applied 4-biome MMO template.";
        }

        private void TryExportJson()
        {
            if (generator == null)
            {
                statusLine = "No WorldGenerator in scene.";
                return;
            }

            string path = EditorUtility.SaveFilePanel("Export Generated World JSON", Application.dataPath, "generated_world_layout", "json");
            if (string.IsNullOrEmpty(path))
            {
                statusLine = "Export canceled.";
                return;
            }

            try
            {
                generator.Config = config;
                generator.ExportLastResultJson(path);
                statusLine = $"Exported JSON: {path}";
            }
            catch (Exception ex)
            {
                statusLine = "Export failed.";
                Debug.LogException(ex);
            }
        }

        private void RefreshValidation()
        {
            validationMessages = config != null ? config.GetValidationMessages() : new List<string>();
            statusLine = validationMessages.Count == 0 ? "Config validation passed." : $"Validation warnings: {validationMessages.Count}";
        }

        private List<string> FilterValidationMessages()
        {
            if (validationMessages == null || validationMessages.Count == 0)
            {
                return new List<string>();
            }

            List<string> filtered = new List<string>();
            for (int i = 0; i < validationMessages.Count; i++)
            {
                string msg = validationMessages[i];
                if (showValidationWarningsOnly && msg.IndexOf("should", StringComparison.OrdinalIgnoreCase) < 0)
                {
                    continue;
                }

                if (string.IsNullOrWhiteSpace(searchQuery) || msg.IndexOf(searchQuery.Trim(), StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    filtered.Add(msg);
                }
            }

            return filtered;
        }

        private void DrawCard(string title, Action content)
        {
            EditorGUILayout.BeginVertical(EditorStyles.helpBox);
            GUILayout.Label(title, cardTitleStyle);
            EditorGUILayout.Space(4f);
            content?.Invoke();
            EditorGUILayout.EndVertical();
            EditorGUILayout.Space(6f);
        }

        private void DrawProperty(string propertyName)
        {
            if (!PropertyVisible(propertyName))
            {
                return;
            }

            SerializedProperty property = configSerializedObject.FindProperty(propertyName);
            if (property != null)
            {
                EditorGUILayout.PropertyField(property, true);
            }
        }

        private bool GroupVisible(params string[] keys)
        {
            if (string.IsNullOrWhiteSpace(searchQuery))
            {
                return true;
            }

            string q = searchQuery.Trim();
            for (int i = 0; i < keys.Length; i++)
            {
                if (keys[i].IndexOf(q, StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    return true;
                }
            }

            return false;
        }

        private bool PropertyVisible(string propertyName)
        {
            if (string.IsNullOrWhiteSpace(searchQuery))
            {
                return true;
            }

            return propertyName.IndexOf(searchQuery.Trim(), StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private void DrawConfigEstimateSummary()
        {
            if (config == null)
            {
                return;
            }

            EnsureConfigSections(config);

            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            float areaKm2 = (worldSize * worldSize) / 1_000_000f;
            int estimatedPlayers = Mathf.Max(0, config.citySettings.maxCities * Mathf.Max(1, config.spawnSettings.playerSpawnsPerCity));
            int estimatedNpcs = Mathf.Max(0, config.citySettings.maxCities * config.spawnSettings.npcSpawnsPerCity);
            int estimatedMobs = Mathf.Max(0, config.spawnSettings.maxMobZones);
            int estimatedResources = 0;
            if (config.resourceSettings != null && config.resourceSettings.biomeRules != null && config.resourceSettings.biomeRules.Count > 0)
            {
                int sum = 0;
                for (int i = 0; i < config.resourceSettings.biomeRules.Count; i++)
                {
                    sum += Mathf.Max(0, config.resourceSettings.biomeRules[i].nodesPerSquareKm);
                }
                estimatedResources = Mathf.RoundToInt((sum / (float)config.resourceSettings.biomeRules.Count) * areaKm2);
            }

            EditorGUILayout.LabelField($"Area: {areaKm2:0.00} km²");
            EditorGUILayout.LabelField($"Estimated Player Spawns: {estimatedPlayers}");
            EditorGUILayout.LabelField($"Estimated NPC Spawns: {estimatedNpcs}");
            EditorGUILayout.LabelField($"Estimated Mob Zones: {estimatedMobs}");
            EditorGUILayout.LabelField($"Estimated Resource Nodes: {estimatedResources}");
        }

        private void DrawBiomeDistribution(WorldGenerationResult result)
        {
            if (result == null || result.resources == null || result.resources.Count == 0)
            {
                return;
            }

            Dictionary<string, int> counts = new Dictionary<string, int>();
            for (int i = 0; i < result.resources.Count; i++)
            {
                string biome = string.IsNullOrWhiteSpace(result.resources[i].biomeId) ? "unknown" : result.resources[i].biomeId;
                counts.TryGetValue(biome, out int current);
                counts[biome] = current + 1;
            }

            EditorGUILayout.Space(6f);
            EditorGUILayout.LabelField("Resource Biome Distribution", EditorStyles.boldLabel);
            foreach (KeyValuePair<string, int> kv in counts.OrderByDescending(kv => kv.Value))
            {
                EditorGUILayout.LabelField($"{kv.Key}: {kv.Value}");
            }
        }

        private void DrawSectorHotspots(WorldGenerationResult result)
        {
            if (result == null || result.sectors == null || result.sectors.Count == 0)
            {
                return;
            }

            List<SectorLoadInfo> top = new List<SectorLoadInfo>();
            for (int i = 0; i < result.sectors.Count; i++)
            {
                WorldSector s = result.sectors[i];
                int load = s.resources.Count + s.npcSpawns.Count + s.mobSpawnZones.Count + (s.cities.Count * 12);
                top.Add(new SectorLoadInfo
                {
                    sector = s,
                    load = load
                });
            }

            top.Sort((a, b) => b.load.CompareTo(a.load));
            int maxLoad = Mathf.Max(1, top[0].load);

            EditorGUILayout.Space(8f);
            EditorGUILayout.LabelField("Sector Load Hotspots", EditorStyles.boldLabel);
            int show = Mathf.Min(8, top.Count);
            for (int i = 0; i < show; i++)
            {
                SectorLoadInfo row = top[i];
                Rect rect = EditorGUILayout.GetControlRect(false, 18f);
                float p = row.load / (float)maxLoad;
                EditorGUI.ProgressBar(rect, p, $"{row.sector.sectorId}  load={row.load}  (res:{row.sector.resources.Count} npc:{row.sector.npcSpawns.Count} mob:{row.sector.mobSpawnZones.Count})");
            }
        }

        private void CopyConfigSnapshotToClipboard()
        {
            if (config == null)
            {
                return;
            }

            EnsureConfigSections(config);

            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            float areaKm2 = (worldSize * worldSize) / 1_000_000f;
            string snapshot =
                $"seed={config.worldSeed}\n" +
                $"size={worldSize:0}m ({areaKm2:0.00}km2)\n" +
                $"cities_max={config.citySettings.maxCities}\n" +
                $"caves_max={config.caveSettings.maxCaves}\n" +
                $"mob_zones_max={config.spawnSettings.maxMobZones}\n" +
                $"runtime_caps={config.runtimeOptimization.maxActiveObjects}/{config.runtimeOptimization.maxActiveResources}\n" +
                $"sector={config.sectorSettings.sectorSizeMeters:0}m radius={config.sectorSettings.neighborLoadRadius}\n" +
                $"city_water_guard={config.citySettings.minHeightAboveSea01:0.000}/{config.citySettings.minAreaHeightAboveSea01:0.000}";

            EditorGUIUtility.systemCopyBuffer = snapshot;
            toolsSnapshot = snapshot;
            statusLine = "Config snapshot copied to clipboard.";
        }

        private void PingSpawnRoots()
        {
            if (config == null)
            {
                return;
            }

            List<UnityEngine.Object> roots = new List<UnityEngine.Object>();
            if (config.cityRoot != null) { roots.Add(config.cityRoot); }
            if (config.roadRoot != null) { roots.Add(config.roadRoot); }
            if (config.caveRoot != null) { roots.Add(config.caveRoot); }
            if (config.resourceRoot != null) { roots.Add(config.resourceRoot); }
            if (config.spawnRoot != null) { roots.Add(config.spawnRoot); }

            if (roots.Count == 0)
            {
                statusLine = "No root transforms assigned.";
                return;
            }

            Selection.objects = roots.ToArray();
            EditorGUIUtility.PingObject(roots[0]);
            statusLine = $"Selected {roots.Count} root objects.";
        }

        private void RevealGeneratorFolder()
        {
            string path = Path.Combine(Application.dataPath, "WorldGen");
            if (!Directory.Exists(path))
            {
                path = Application.dataPath;
            }

            EditorUtility.RevealInFinder(path);
            statusLine = $"Opened folder: {path}";
        }

        private void EnsureSerializedObject()
        {
            if (config == null)
            {
                configSerializedObject = null;
                return;
            }

            if (configSerializedObject == null || configSerializedObject.targetObject != config)
            {
                configSerializedObject = new SerializedObject(config);
            }
        }

        private void EnsureStyles()
        {
            if (stylesInitialized)
            {
                return;
            }

            heroTitleStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 18,
                normal = { textColor = Color.white }
            };

            heroSubtitleStyle = new GUIStyle(EditorStyles.label)
            {
                fontSize = 11,
                normal = { textColor = new Color(0.80f, 0.86f, 0.94f, 1f) }
            };

            cardTitleStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 13
            };

            dimLabelStyle = new GUIStyle(EditorStyles.miniLabel)
            {
                normal = { textColor = new Color(0.72f, 0.75f, 0.80f, 1f) }
            };

            chipStyle = new GUIStyle(EditorStyles.miniButton)
            {
                fontSize = 10,
                alignment = TextAnchor.MiddleCenter
            };

            stylesInitialized = true;
        }

        private static void EnsureConfigSections(WorldGeneratorConfig target)
        {
            if (target.citySettings == null) { target.citySettings = new CityGenerationSettings(); }
            if (target.caveSettings == null) { target.caveSettings = new CaveGenerationSettings(); }
            if (target.resourceSettings == null) { target.resourceSettings = new ResourceGenerationSettings(); }
            if (target.spawnSettings == null) { target.spawnSettings = new SpawnGenerationSettings(); }
            if (target.runtimeOptimization == null) { target.runtimeOptimization = new RuntimeOptimizationSettings(); }
            if (target.sectorSettings == null) { target.sectorSettings = new SectorGenerationSettings(); }
            if (target.terrainShape == null) { target.terrainShape = new TerrainShapeSettings(); }
            if (target.terrainShape.continentNoise == null) { target.terrainShape.continentNoise = new NoiseLayerSettings(0.00022f, 3, 2f, 0.5f, 201f, -144f); }
            if (target.terrainShape.ridgeNoise == null) { target.terrainShape.ridgeNoise = new NoiseLayerSettings(0.00092f, 4, 2.1f, 0.5f, -77f, 129f); }
            if (target.terrainGeneration == null) { target.terrainGeneration = new TerrainGenerationSettings(); }
            if (target.biomes == null) { target.biomes = new List<BiomeDefinition>(); }
        }

        private sealed class SectorLoadInfo
        {
            public WorldSector sector;
            public int load;
        }
    }
}
#endif
