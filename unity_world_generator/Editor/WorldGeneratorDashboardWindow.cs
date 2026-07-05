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
        private enum Section
        {
            Setup = 0,
            Location = 1,
            Terrain = 2,
            World = 3,
            Biomes = 4,
            Spawns = 5,
            Results = 6
        }

        private static readonly string[] SectionIcons =
        {
            "⌂",
            "◎",
            "⛰",
            "🗺",
            "🌿",
            "⚡",
            "📊"
        };

        private static readonly string[] SectionLabels =
        {
            "Home",
            "Build Location",
            "Terrain Studio",
            "World Layout",
            "Biomes",
            "Spawns",
            "Results"
        };

        private WorldGenerator generator;
        private WorldGeneratorConfig config;
        private SerializedObject configSerializedObject;
        private Vector2 sidebarScroll;
        private Vector2 contentScroll;
        private Section activeSection = Section.Location;
        private string statusLine = "Ready";
        private string searchQuery = string.Empty;
        private List<string> validationMessages = new List<string>();
        private float sidebarWidth = 220f;
        private WorldGenStudioPresets.MapSizeId selectedMapSize = WorldGenStudioPresets.MapSizeId.Zone;
        private WorldGenStudioPresets.HeightmapProfileId selectedHeightmap = WorldGenStudioPresets.HeightmapProfileId.RollingMmo;
        private DefaultAsset pendingPrefabFolder;

        [MenuItem("Window/World Generation/AAA Generator Dashboard")]
        public static void Open()
        {
            WorldGeneratorDashboardWindow window = GetWindow<WorldGeneratorDashboardWindow>();
            window.titleContent = new GUIContent("WorldGen Studio");
            window.minSize = new Vector2(1280f, 760f);
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
            WorldGenEditorUi.EnsureStyles();
            WorldGenEditorUi.DrawHeroBanner(
                "WorldGen Studio",
                "Procedural MMO worlds — zone builder, terrain sculpt, biomes, Synty kits, POI polish.",
                $"engine {TerrainGenerator.BakeEngineVersion}");

            DrawCommandRail();

            EditorGUILayout.BeginHorizontal();
            DrawSidebar();
            DrawMainContent();
            EditorGUILayout.EndHorizontal();

            DrawFooter();
        }

        private void DrawCommandRail()
        {
            EditorGUILayout.Space(8f);
            EditorGUILayout.BeginHorizontal();
            EditorGUI.BeginDisabledGroup(TerrainBakeEditorRunner.IsRunning || config == null);
            if (WorldGenEditorUi.DrawPrimaryButton("  GENERATE WORLD  ", 44f))
            {
                TryGenerateWorld();
            }

            if (WorldGenEditorUi.DrawSecondaryButton("Terrain Only", 108f, 44f))
            {
                TryGenerateTerrainOnly();
            }
            EditorGUI.EndDisabledGroup();

            if (WorldGenEditorUi.DrawSecondaryButton("Validate", 84f, 44f))
            {
                RefreshValidation();
            }

            if (WorldGenEditorUi.DrawSecondaryButton("Random Seed", 104f, 44f))
            {
                RandomizeSeed();
            }

            GUILayout.FlexibleSpace();
            WorldGenEditorUi.DrawStatusChip(statusLine, validationMessages.Count == 0 ? WorldGenEditorUi.Success : WorldGenEditorUi.Warning);
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space(6f);
        }

        private void DrawSidebar()
        {
            EditorGUILayout.BeginVertical(GUILayout.Width(sidebarWidth));
            Rect bg = EditorGUILayout.GetControlRect(false, position.height);
            bg.width = sidebarWidth;
            EditorGUI.DrawRect(bg, WorldGenEditorUi.BgSidebar);

            GUILayout.Space(10f);
            sidebarScroll = EditorGUILayout.BeginScrollView(sidebarScroll, GUILayout.Width(sidebarWidth));
            for (int i = 0; i < SectionLabels.Length; i++)
            {
                if (WorldGenEditorUi.DrawSidebarNav(
                        SectionIcons[i],
                        SectionLabels[i],
                        activeSection == (Section)i,
                        sidebarWidth - 10f,
                        i == 1 ? WorldGenEditorArt.GetStepIcon(5) : null))
                {
                    activeSection = (Section)i;
                    GUI.FocusControl(null);
                }
            }
            EditorGUILayout.EndScrollView();

            EditorGUILayout.Space(8f);
            GUILayout.Label("Scene Bindings", EditorStyles.miniBoldLabel);
            generator = (WorldGenerator)EditorGUILayout.ObjectField(generator, typeof(WorldGenerator), true);
            config = (WorldGeneratorConfig)EditorGUILayout.ObjectField(config, typeof(WorldGeneratorConfig), false);
            if (generator != null && config != null && generator.Config != config)
            {
                Undo.RecordObject(generator, "Assign World Generator Config");
                generator.Config = config;
                EditorUtility.SetDirty(generator);
            }
            EditorGUILayout.Space(10f);
            EditorGUILayout.EndVertical();
        }

        private void DrawMainContent()
        {
            EditorGUILayout.BeginVertical();
            if (config == null)
            {
                WorldGenEditorUi.DrawEmptyState(
                    "Welcome to WorldGen Studio",
                    "Assign a WorldGeneratorConfig in the sidebar, then open Build Location to create your first zone.",
                    "I have a config",
                    () => { });
                EditorGUILayout.EndVertical();
                return;
            }

            EnsureSerializedObject();
            configSerializedObject.Update();

            DrawMetricsRow();
            if (activeSection == Section.World || activeSection == Section.Spawns || activeSection == Section.Results)
            {
                DrawSearchBar();
            }

            contentScroll = EditorGUILayout.BeginScrollView(contentScroll);
            switch (activeSection)
            {
                case Section.Setup:
                    DrawSetupSection();
                    break;
                case Section.Location:
                    DrawLocationSection();
                    break;
                case Section.Terrain:
                    DrawTerrainSection();
                    break;
                case Section.World:
                    DrawWorldSection();
                    break;
                case Section.Biomes:
                    DrawBiomesSection();
                    break;
                case Section.Spawns:
                    DrawSpawnsSection();
                    break;
                case Section.Results:
                    DrawResultsSection();
                    break;
            }
            EditorGUILayout.EndScrollView();

            if (configSerializedObject.ApplyModifiedProperties())
            {
                EditorUtility.SetDirty(config);
                WorldGenLivePreview.NotifyConfigChanged(config);
            }

            EditorGUILayout.EndVertical();
        }

        private void DrawMetricsRow()
        {
            WorldGenPresetLibrary.EnsureConfigSections(config);
            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            float areaKm2 = (worldSize * worldSize) / 1_000_000f;
            int terrainTiles = EstimateTerrainTiles();
            string bakeHint = terrainTiles > 0 ? WorldGenStudioPresets.GetBakeTimeHint(config) : "n/a";
            Color bakeColor = terrainTiles > 64 ? WorldGenEditorUi.Warning : WorldGenEditorUi.Success;

            EditorGUILayout.BeginHorizontal();
            WorldGenEditorUi.DrawMetricCard("World Area", $"{areaKm2:0.0} km²", WorldGenStudioPresets.GetMapSizeLabel(config), WorldGenEditorUi.Accent);
            WorldGenEditorUi.DrawMetricCard("Cities", config.citySettings.maxCities.ToString(), "target placements", WorldGenEditorUi.Success);
            WorldGenEditorUi.DrawMetricCard("Terrain Tiles", terrainTiles.ToString(), $"res {config.terrainGeneration.heightmapResolution}", WorldGenEditorUi.Accent);
            WorldGenEditorUi.DrawMetricCard("Bake ETA", bakeHint, $"{terrainTiles} tiles", bakeColor);
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space(6f);
        }

        private void DrawSearchBar()
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

        private void DrawSetupSection()
        {
            WorldGenStudioHome.Draw(
                config,
                () => activeSection = Section.Location,
                () => activeSection = Section.Terrain,
                () => activeSection = Section.Biomes,
                TryGenerateWorld);

            if (PropertyVisible("runtime"))
            {
                WorldGenEditorUi.BeginPanel("Scene Roots", "Optional parent transforms for spawned content.");
                DrawProperty("cityRoot");
                DrawProperty("caveRoot");
                DrawProperty("resourceRoot");
                DrawProperty("roadRoot");
                DrawProperty("spawnRoot");
                DrawProperty("clearRootsBeforeSpawn");
                WorldGenEditorUi.EndPanel();
            }
        }

        private void DrawLocationSection()
        {
            WorldGenLocationWizard.Draw(
                config,
                generator,
                message => statusLine = message,
                result =>
                {
                    activeSection = Section.Results;
                    WorldGenTerrainPreview.Invalidate();
                    Repaint();
                });
        }

        private void DrawTerrainSection()
        {
            WorldGenEditorUi.BeginPanel("Heightmap Presets", "Starting points — then sculpt with sliders on the right.");
            EditorGUILayout.BeginHorizontal();
            for (int i = 0; i < 4; i++)
            {
                int idx = i;
                if (WorldGenEditorUi.DrawPresetCard(
                        WorldGenStudioPresets.HeightmapNames[idx],
                        WorldGenStudioPresets.HeightmapHints[idx],
                        WorldGenStudioPresets.HeightmapAccentColors[idx],
                        true,
                        selectedHeightmap == (WorldGenStudioPresets.HeightmapProfileId)idx))
                {
                    ApplyHeightmapProfile((WorldGenStudioPresets.HeightmapProfileId)idx);
                }
            }
            for (int i = 4; i < 7; i++)
            {
                int idx = i;
                if (WorldGenEditorUi.DrawPresetCard(
                        WorldGenStudioPresets.HeightmapNames[idx],
                        WorldGenStudioPresets.HeightmapHints[idx],
                        WorldGenStudioPresets.HeightmapAccentColors[idx],
                        true,
                        selectedHeightmap == (WorldGenStudioPresets.HeightmapProfileId)idx))
                {
                    ApplyHeightmapProfile((WorldGenStudioPresets.HeightmapProfileId)idx);
                }
            }
            EditorGUILayout.EndHorizontal();
            WorldGenEditorUi.EndPanel();

            EditorGUILayout.BeginHorizontal();

            EditorGUILayout.BeginVertical(GUILayout.Width(460f));
            WorldGenEditorUi.BeginPanel("Live World Map", "Sculpt sliders on the right — preview updates live.");
            WorldGenLivePreview.PreviewResolution = 440;
            WorldGenTerrainPreview.DrawPreview(config, 440);
            WorldGenEditorUi.EndPanel();
            EditorGUILayout.EndVertical();

            EditorGUILayout.BeginVertical();
            WorldGenEditorUi.BeginPanel("Terrain Sculpt", "Mountains, plains, valleys, coastlines, noise.");
            WorldGenTerrainSculptPanel.Draw(config, NotifySculptChanged);
            WorldGenEditorUi.EndPanel();

            EditorGUILayout.BeginHorizontal();
            if (WorldGenEditorUi.DrawMiniButton("129", config.terrainGeneration.heightmapResolution == 129))
            {
                ApplyHeightmapResolution(129);
            }
            if (WorldGenEditorUi.DrawMiniButton("257", config.terrainGeneration.heightmapResolution == 257))
            {
                ApplyHeightmapResolution(257);
            }
            if (WorldGenEditorUi.DrawMiniButton("513", config.terrainGeneration.heightmapResolution == 513))
            {
                ApplyHeightmapResolution(513);
            }
            GUILayout.FlexibleSpace();
            EditorGUILayout.LabelField("Bake resolution", EditorStyles.miniLabel);
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.EndVertical();

            EditorGUILayout.EndHorizontal();
        }

        private void NotifySculptChanged()
        {
            if (config == null)
            {
                return;
            }

            EditorUtility.SetDirty(config);
            WorldGenLivePreview.NotifyConfigChanged(config);
            Repaint();
        }

        private void DrawWorldSection()
        {
            WorldGenEditorUi.BeginPanel("Cities", "Poisson placement with inland / shoreline safety.");
            DrawProperty("citySettings");
            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Inland Safety Defaults", GUILayout.Height(24f)))
            {
                ApplyInlandCityDefaults();
            }
            if (GUILayout.Button("Relaxed Placement", GUILayout.Height(24f)))
            {
                ApplyRelaxedCityDefaults();
            }
            EditorGUILayout.EndHorizontal();
            WorldGenEditorUi.EndPanel();

            WorldGenEditorUi.BeginPanel("Road Network", "MST backbone + extra intercity links.");
            DrawProperty("roadSettings");
            DrawProperty("roadMarkerPrefab");
            WorldGenEditorUi.EndPanel();

            WorldGenEditorUi.BeginPanel("Caves (Variant A)", "Stamp entrances with corridor chains.");
            DrawProperty("caveSettings");
            WorldGenEditorUi.EndPanel();

            WorldGenEditorUi.BeginPanel("Sectors", "MMO AOI partitioning grid.");
            DrawProperty("sectorSettings");
            WorldGenEditorUi.EndPanel();
        }

        private void DrawBiomesSection()
        {
            WorldGenPresetLibrary.EnsureConfigSections(config);
            WorldGenEditorUi.BeginPanel("Biome Studio", "Templates, textures, and Synty prefab folders — all from the editor.");
            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("10-Biome Rich World", GUILayout.Height(28f)))
            {
                ApplyRichBiomeTemplate();
            }
            if (GUILayout.Button("Normalize Weights", GUILayout.Height(28f)))
            {
                NormalizeBiomeBlendWeights();
            }
            if (GUILayout.Button("Sort by Height", GUILayout.Height(28f)))
            {
                SortBiomesByHeight();
            }
            EditorGUILayout.EndHorizontal();

            EditorGUILayout.Space(4f);
            EditorGUILayout.LabelField("Default ground textures", EditorStyles.boldLabel);
            EditorGUILayout.BeginHorizontal();
            Texture2D grass = config.terrainGeneration.defaultTerrainDiffuse;
            Texture2D grassN = config.terrainGeneration.defaultTerrainNormal;
            Texture2D stone = config.locationKit?.stoneDiffuse;
            Texture2D stoneN = config.locationKit?.stoneNormal;
            WorldGenEditorUi.DrawTextureSlot("Grass", ref grass);
            WorldGenEditorUi.DrawTextureSlot("Grass N", ref grassN);
            WorldGenEditorUi.DrawTextureSlot("Stone", ref stone);
            WorldGenEditorUi.DrawTextureSlot("Stone N", ref stoneN);
            if (grass != config.terrainGeneration.defaultTerrainDiffuse ||
                grassN != config.terrainGeneration.defaultTerrainNormal)
            {
                config.terrainGeneration.defaultTerrainDiffuse = grass;
                config.terrainGeneration.defaultTerrainNormal = grassN;
                EditorUtility.SetDirty(config);
            }

            if (config.locationKit != null &&
                (stone != config.locationKit.stoneDiffuse || stoneN != config.locationKit.stoneNormal))
            {
                WorldGenBiomeTemplates.AssignGrassStoneTextures(config, grass, grassN, stone, stoneN);
            }
            EditorGUILayout.EndHorizontal();

            config.terrainGeneration.paintBiomeTerrainLayers = EditorGUILayout.Toggle(
                "Paint Biome Splat On Bake",
                config.terrainGeneration.paintBiomeTerrainLayers);

            EditorGUILayout.Space(4f);
            EditorGUILayout.LabelField("Drop a Synty prefab folder for all biomes", EditorStyles.miniLabel);
            pendingPrefabFolder = (DefaultAsset)EditorGUILayout.ObjectField(
                "Prefab Folder",
                pendingPrefabFolder,
                typeof(DefaultAsset),
                false);
            if (pendingPrefabFolder != null)
            {
                WorldGenBiomeTemplates.AssignPrefabFolder(config, pendingPrefabFolder);
                pendingPrefabFolder = null;
            }

            EditorGUILayout.Space(4f);
            DrawBiomeTextureGrid();
            WorldGenEditorUi.EndPanel();

            WorldGenEditorUi.BeginPanel("Biome Definitions", "Per-biome climate, preview color, terrain texture, Synty prefabs.");
            DrawProperty("biomes");
            DrawProperty("resourceSettings");
            WorldGenEditorUi.EndPanel();
        }

        private void DrawBiomeTextureGrid()
        {
            if (config?.biomes == null || config.biomes.Count == 0)
            {
                return;
            }

            EditorGUILayout.LabelField("Per-biome terrain textures", EditorStyles.boldLabel);
            int columns = 5;
            int index = 0;
            EditorGUILayout.BeginHorizontal();
            for (int i = 0; i < config.biomes.Count; i++)
            {
                if (index > 0 && index % columns == 0)
                {
                    EditorGUILayout.EndHorizontal();
                    EditorGUILayout.BeginHorizontal();
                }

                BiomeDefinition biome = config.biomes[i];
                EditorGUILayout.BeginVertical(GUILayout.Width(108f));
                Color accent = BiomePalette.ResolvePreviewColor(biome);
                Rect swatch = GUILayoutUtility.GetRect(100f, 14f);
                EditorGUI.DrawRect(swatch, accent);
                EditorGUI.BeginChangeCheck();
                biome.terrainDiffuse = (Texture2D)EditorGUILayout.ObjectField(
                    biome.terrainDiffuse,
                    typeof(Texture2D),
                    false,
                    GUILayout.Width(100f),
                    GUILayout.Height(56f));
                biome.previewColor = EditorGUILayout.ColorField(biome.previewColor, GUILayout.Width(100f));
                EditorGUILayout.LabelField(biome.biomeId, EditorStyles.centeredGreyMiniLabel, GUILayout.Width(100f));
                if (EditorGUI.EndChangeCheck())
                {
                    EditorUtility.SetDirty(config);
                    WorldGenLivePreview.NotifyConfigChanged(config);
                }
                EditorGUILayout.EndVertical();
                index++;
            }
            EditorGUILayout.EndHorizontal();
        }

        private void DrawSpawnsSection()
        {
            WorldGenEditorUi.BeginPanel("Resources");
            DrawProperty("resourceSettings");
            WorldGenEditorUi.EndPanel();

            WorldGenEditorUi.BeginPanel("MMO Spawns");
            DrawProperty("spawnSettings");
            DrawProperty("playerSpawnMarkerPrefab");
            DrawProperty("npcSpawnMarkerPrefab");
            DrawProperty("mobZoneMarkerPrefab");
            WorldGenEditorUi.EndPanel();

            WorldGenEditorUi.BeginPanel("Runtime Streaming", "Distance culling + object budgets.");
            DrawProperty("runtimeOptimization");
            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Performance Profile", GUILayout.Height(24f))) { ApplyRuntimePerformanceProfile(); }
            if (GUILayout.Button("Visual Richness", GUILayout.Height(24f))) { ApplyRuntimeRichProfile(); }
            EditorGUILayout.EndHorizontal();
            WorldGenEditorUi.EndPanel();
        }

        private void DrawResultsSection()
        {
            WorldGenEditorUi.BeginPanel("Validation");
            if (validationMessages.Count == 0)
            {
                EditorGUILayout.HelpBox("Config is valid.", MessageType.Info);
            }
            else
            {
                for (int i = 0; i < validationMessages.Count; i++)
                {
                    if (string.IsNullOrWhiteSpace(searchQuery) || validationMessages[i].IndexOf(searchQuery, StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        EditorGUILayout.HelpBox(validationMessages[i], MessageType.Warning);
                    }
                }
            }
            WorldGenEditorUi.EndPanel();

            WorldGenEditorUi.BeginPanel("Last Generation");
            if (generator == null || generator.LastResult == null)
            {
                EditorGUILayout.HelpBox("Run GENERATE WORLD to populate stats.", MessageType.None);
            }
            else
            {
                WorldGenerationResult r = generator.LastResult;
                EditorGUILayout.LabelField("Seed", r.worldSeed.ToString());
                EditorGUILayout.LabelField("Size", $"{r.worldWidth:0} x {r.worldLength:0} m");
                EditorGUILayout.LabelField("Cities / Roads / Caves", $"{r.cities.Count} / {r.worldRoads.Count} / {r.caves.Count}");
                EditorGUILayout.LabelField("Resources / Mob Zones", $"{r.resources.Count} / {r.mobSpawnZones.Count}");
                EditorGUILayout.LabelField("Sectors", r.sectors.Count.ToString());
                TerrainGenerator.TerrainGenerationResult terrain = generator.LastTerrainResult;
                if (terrain != null && terrain.terrains != null)
                {
                    EditorGUILayout.LabelField("Terrain Tiles", terrain.terrains.Count.ToString());
                }
                DrawBiomeDistribution(r);
                DrawSectorHotspots(r);
            }
            WorldGenEditorUi.EndPanel();

            WorldGenEditorUi.BeginPanel("Tools");
            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Copy Snapshot", GUILayout.Height(26f))) { CopyConfigSnapshot(); }
            if (GUILayout.Button("Ping Roots", GUILayout.Height(26f))) { PingSpawnRoots(); }
            if (GUILayout.Button("Open README", GUILayout.Height(26f))) { RevealGeneratorFolder(); }
            EditorGUILayout.EndHorizontal();
            WorldGenEditorUi.EndPanel();
        }

        private void DrawFooter()
        {
            Rect rect = EditorGUILayout.GetControlRect(false, 24f);
            EditorGUI.DrawRect(rect, WorldGenEditorUi.BgSidebar);
            string footer = $"{statusLine}  |  bake {TerrainGenerator.BakeEngineVersion}";
            GUI.Label(new Rect(rect.x + 12f, rect.y + 4f, rect.width - 24f, 18f), footer, EditorStyles.miniLabel);
        }

        private int EstimateTerrainTiles()
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

        private void ApplyPreset(WorldGenPresetLibrary.PresetId preset)
        {
            if (config == null) return;
            WorldGenPresetLibrary.Apply(config, preset);
            statusLine = $"Preset applied: {WorldGenPresetLibrary.Names[(int)preset]}";
            RefreshValidation();
            Repaint();
        }

        private void ApplyMapSize(WorldGenStudioPresets.MapSizeId size)
        {
            if (config == null) return;
            WorldGenStudioPresets.ApplyMapSize(config, size);
            selectedMapSize = size;
            statusLine = $"Map size: {WorldGenStudioPresets.MapSizeNames[(int)size]} — {WorldGenStudioPresets.GetBakeTimeHint(config)} bake";
            activeSection = Section.Terrain;
            WorldGenLivePreview.NotifyConfigChanged(config);
            WorldGenTerrainPreview.Invalidate();
            RefreshValidation();
            Repaint();
        }

        private void ApplyHeightmapProfile(WorldGenStudioPresets.HeightmapProfileId profile)
        {
            if (config == null) return;
            WorldGenStudioPresets.ApplyHeightmapProfile(config, profile);
            selectedHeightmap = profile;
            statusLine = $"Heightmap style: {WorldGenStudioPresets.HeightmapNames[(int)profile]}";
            NotifySculptChanged();
            RefreshValidation();
        }

        private void ApplyHeightmapResolution(int resolution)
        {
            if (config == null) return;
            WorldGenStudioPresets.ApplyHeightmapResolution(config, resolution);
            statusLine = $"Heightmap resolution: {resolution}";
            RefreshValidation();
            Repaint();
        }

        private void TryGenerateWorld()
        {
            if (generator == null) { statusLine = "No WorldGenerator in scene."; return; }
            if (config == null) { statusLine = "No config selected."; return; }
            if (TerrainBakeEditorRunner.IsRunning)
            {
                statusLine = "World generation already running.";
                return;
            }

            try
            {
                Undo.RecordObject(generator, "Generate World");
                generator.Config = config;
                TerrainBakeEditorRunner.RunFullWorld(
                    generator,
                    result =>
                    {
                        activeSection = Section.Results;
                        WorldGenTerrainPreview.Invalidate();
                        Repaint();
                    },
                    message => statusLine = message);
            }
            catch (Exception ex)
            {
                statusLine = "Generation failed.";
                Debug.LogException(ex);
            }
        }

        private void TryGenerateTerrainOnly()
        {
            if (generator == null) { statusLine = "No WorldGenerator in scene."; return; }
            if (config == null) { statusLine = "No config selected."; return; }
            if (TerrainBakeEditorRunner.IsRunning)
            {
                statusLine = "Terrain bake already running.";
                return;
            }

            try
            {
                Undo.RecordObject(generator, "Generate terrain");
                generator.Config = config;
                TerrainBakeEditorRunner.RunTerrainOnly(
                    generator,
                    () =>
                    {
                        activeSection = Section.Terrain;
                        WorldGenTerrainPreview.Invalidate();
                        Repaint();
                    },
                    message => statusLine = message);
            }
            catch (Exception ex)
            {
                statusLine = "Terrain bake failed.";
                Debug.LogException(ex);
            }
        }

        private void RandomizeSeed()
        {
            if (config == null) return;
            Undo.RecordObject(config, "Randomize seed");
            config.worldSeed = UnityEngine.Random.Range(1000, 999_999_999);
            EditorUtility.SetDirty(config);
            statusLine = $"Seed: {config.worldSeed}";
        }

        private void RefreshValidation()
        {
            validationMessages = config != null ? config.GetValidationMessages() : new List<string>();
            statusLine = validationMessages.Count == 0 ? "Config valid." : $"{validationMessages.Count} warnings";
        }

        private void DrawProperty(string propertyName)
        {
            if (!PropertyVisible(propertyName)) return;
            SerializedProperty property = configSerializedObject.FindProperty(propertyName);
            if (property != null) EditorGUILayout.PropertyField(property, true);
        }

        private bool PropertyVisible(string propertyName)
        {
            return string.IsNullOrWhiteSpace(searchQuery) ||
                   propertyName.IndexOf(searchQuery.Trim(), StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private void EnsureSerializedObject()
        {
            if (config == null) { configSerializedObject = null; return; }
            if (configSerializedObject == null || configSerializedObject.targetObject != config)
                configSerializedObject = new SerializedObject(config);
        }

        // --- helpers retained from previous dashboard ---
        private void ApplyInlandCityDefaults()
        {
            if (config == null) return;
            WorldGenPresetLibrary.EnsureConfigSections(config);
            Undo.RecordObject(config, "Inland defaults");
            config.citySettings.minHeightAboveSea01 = 0.03f;
            config.citySettings.shorelineBuffer01 = 0.08f;
            config.citySettings.minAreaHeightAboveSea01 = 0.05f;
            config.citySettings.waterProximitySamples = 32;
            EditorUtility.SetDirty(config);
            statusLine = "Inland city defaults applied.";
        }

        private void ApplyRelaxedCityDefaults()
        {
            if (config == null) return;
            WorldGenPresetLibrary.EnsureConfigSections(config);
            Undo.RecordObject(config, "Relaxed defaults");
            config.citySettings.minHeightAboveSea01 = 0.018f;
            config.citySettings.shorelineBuffer01 = 0.045f;
            config.citySettings.minAreaHeightAboveSea01 = 0.03f;
            config.citySettings.waterProximitySamples = 20;
            EditorUtility.SetDirty(config);
            statusLine = "Relaxed city defaults applied.";
        }

        private void ApplyRuntimePerformanceProfile()
        {
            if (config == null) return;
            WorldGenPresetLibrary.EnsureConfigSections(config);
            Undo.RecordObject(config, "Perf profile");
            config.runtimeOptimization.enableDistanceStreaming = true;
            config.runtimeOptimization.maxActiveObjects = 3000;
            config.runtimeOptimization.maxActiveResources = 1200;
            config.runtimeOptimization.streamingRadiusMeters = 1050f;
            EditorUtility.SetDirty(config);
            statusLine = "Performance profile applied.";
        }

        private void ApplyRuntimeRichProfile()
        {
            if (config == null) return;
            WorldGenPresetLibrary.EnsureConfigSections(config);
            Undo.RecordObject(config, "Rich profile");
            config.runtimeOptimization.enableDistanceStreaming = true;
            config.runtimeOptimization.maxActiveObjects = 8800;
            config.runtimeOptimization.maxActiveResources = 4200;
            config.runtimeOptimization.streamingRadiusMeters = 1900f;
            EditorUtility.SetDirty(config);
            statusLine = "Visual richness profile applied.";
        }

        private void NormalizeBiomeBlendWeights()
        {
            if (config?.biomes == null || config.biomes.Count == 0) return;
            Undo.RecordObject(config, "Normalize weights");
            float total = 0f;
            for (int i = 0; i < config.biomes.Count; i++) total += Mathf.Max(0.001f, config.biomes[i].blendWeight);
            float target = config.biomes.Count;
            for (int i = 0; i < config.biomes.Count; i++)
                config.biomes[i].blendWeight = (Mathf.Max(0.001f, config.biomes[i].blendWeight) / total) * target;
            EditorUtility.SetDirty(config);
            statusLine = "Biome weights normalized.";
        }

        private void RebalanceBiomeHeightBands()
        {
            if (config?.biomes == null || config.biomes.Count == 0) return;
            Undo.RecordObject(config, "Rebalance heights");
            int count = config.biomes.Count;
            for (int i = 0; i < count; i++)
            {
                config.biomes[i].minHeight01 = i / (float)count;
                config.biomes[i].maxHeight01 = (i + 1) / (float)count;
            }
            EditorUtility.SetDirty(config);
            statusLine = "Height bands rebalanced.";
        }

        private void SortBiomesByHeight()
        {
            if (config?.biomes == null || config.biomes.Count <= 1) return;
            Undo.RecordObject(config, "Sort biomes");
            config.biomes.Sort((a, b) => a.minHeight01.CompareTo(b.minHeight01));
            EditorUtility.SetDirty(config);
            statusLine = "Biomes sorted.";
        }

        private void ApplyRichBiomeTemplate()
        {
            if (config == null) return;
            WorldGenBiomeTemplates.ApplyRichWorldTemplate(config);
            statusLine = "10-biome rich world template applied.";
            WorldGenTerrainPreview.Invalidate();
            RefreshValidation();
            Repaint();
        }

        private void ApplyBiomeTemplate()
        {
            if (config == null) return;
            Undo.RecordObject(config, "Biome template");
            config.biomes = new List<BiomeDefinition>
            {
                new BiomeDefinition { biomeId = "swamp", minHeight01 = 0f, maxHeight01 = 0.30f, idealMoisture01 = 0.85f, idealTemperature01 = 0.62f, blendWeight = 1.2f },
                new BiomeDefinition { biomeId = "forest", minHeight01 = 0.12f, maxHeight01 = 0.72f, idealMoisture01 = 0.70f, idealTemperature01 = 0.58f, blendWeight = 1.2f },
                new BiomeDefinition { biomeId = "desert", minHeight01 = 0.08f, maxHeight01 = 0.70f, idealMoisture01 = 0.20f, idealTemperature01 = 0.88f, blendWeight = 1f },
                new BiomeDefinition { biomeId = "tundra", minHeight01 = 0.18f, maxHeight01 = 0.92f, idealMoisture01 = 0.40f, idealTemperature01 = 0.18f, blendWeight = 1.1f },
            };
            EditorUtility.SetDirty(config);
            statusLine = "4-biome template applied.";
        }

        private void DrawBiomeDistribution(WorldGenerationResult result)
        {
            if (result?.resources == null || result.resources.Count == 0) return;
            Dictionary<string, int> counts = new Dictionary<string, int>();
            for (int i = 0; i < result.resources.Count; i++)
            {
                string biome = string.IsNullOrWhiteSpace(result.resources[i].biomeId) ? "unknown" : result.resources[i].biomeId;
                counts.TryGetValue(biome, out int c);
                counts[biome] = c + 1;
            }
            EditorGUILayout.Space(4f);
            EditorGUILayout.LabelField("Resource Biome Mix", EditorStyles.boldLabel);
            foreach (KeyValuePair<string, int> kv in counts.OrderByDescending(x => x.Value))
                EditorGUILayout.LabelField($"{kv.Key}: {kv.Value}");
        }

        private void DrawSectorHotspots(WorldGenerationResult result)
        {
            if (result?.sectors == null || result.sectors.Count == 0) return;
            List<(WorldSector s, int load)> top = new List<(WorldSector, int)>();
            for (int i = 0; i < result.sectors.Count; i++)
            {
                WorldSector s = result.sectors[i];
                int load = s.resources.Count + s.npcSpawns.Count + s.mobSpawnZones.Count + s.cities.Count * 12;
                top.Add((s, load));
            }
            top.Sort((a, b) => b.load.CompareTo(a.load));
            int max = Mathf.Max(1, top[0].load);
            EditorGUILayout.Space(6f);
            EditorGUILayout.LabelField("Sector Hotspots", EditorStyles.boldLabel);
            for (int i = 0; i < Mathf.Min(6, top.Count); i++)
            {
                Rect rect = EditorGUILayout.GetControlRect(false, 18f);
                EditorGUI.ProgressBar(rect, top[i].load / (float)max, $"{top[i].s.sectorId}  load={top[i].load}");
            }
        }

        private void CopyConfigSnapshot()
        {
            if (config == null) return;
            WorldGenPresetLibrary.EnsureConfigSections(config);
            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            string snap = $"seed={config.worldSeed}\nsize={worldSize:0}m\ncities={config.citySettings.maxCities}\nterrainTiles={EstimateTerrainTiles()}";
            EditorGUIUtility.systemCopyBuffer = snap;
            statusLine = "Snapshot copied.";
        }

        private void PingSpawnRoots()
        {
            if (config == null) return;
            List<UnityEngine.Object> roots = new List<UnityEngine.Object>();
            if (config.cityRoot) roots.Add(config.cityRoot);
            if (config.roadRoot) roots.Add(config.roadRoot);
            if (config.caveRoot) roots.Add(config.caveRoot);
            if (config.resourceRoot) roots.Add(config.resourceRoot);
            if (config.spawnRoot) roots.Add(config.spawnRoot);
            if (roots.Count == 0) { statusLine = "No roots assigned."; return; }
            Selection.objects = roots.ToArray();
            EditorGUIUtility.PingObject(roots[0]);
            statusLine = $"Selected {roots.Count} roots.";
        }

        private void RevealGeneratorFolder()
        {
            string path = Path.Combine(Application.dataPath, "WorldGen");
            if (!Directory.Exists(path)) path = Application.dataPath;
            EditorUtility.RevealInFinder(path);
            statusLine = "Opened project folder.";
        }
    }
}
#endif
