#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.UIElements;
using UnityEngine;
using UnityEngine.UIElements;

namespace AaaWorldGen.Editor
{
    /// <summary>WorldGen Studio — UI Toolkit editor (Unity-native look).</summary>
    public sealed class WorldGenStudioWindow : EditorWindow
    {
        private enum Page
        {
            BuildLocation = 0,
            Terrain = 1,
            Biomes = 2,
            World = 3,
            Spawns = 4,
            Results = 5
        }

        private static readonly string[] PageNames =
        {
            "Build Location",
            "Terrain",
            "Biomes",
            "World Layout",
            "Spawns",
            "Results"
        };

        private WorldGenerator generator;
        private WorldGeneratorConfig config;
        private SerializedObject configSerializedObject;
        private Page activePage = Page.BuildLocation;
        private string statusLine = "Ready";
        private List<string> validationMessages = new List<string>();
        private WorldGenStudioPresets.HeightmapProfileId selectedHeightmap = WorldGenStudioPresets.HeightmapProfileId.RollingMmo;
        private DefaultAsset pendingPrefabFolder;

        private VisualElement root;
        private VisualElement navContainer;
        private VisualElement contentHost;
        private Label statusLabel;
        private Label footerLabel;
        private IMGUIContainer previewImgui;
        private IMGUIContainer sculptImgui;

        [MenuItem("Window/World Generation/AAA Generator Dashboard")]
        public static void Open()
        {
            WorldGenStudioWindow window = GetWindow<WorldGenStudioWindow>();
            window.titleContent = new GUIContent("WorldGen Studio");
            window.minSize = new Vector2(1100f, 680f);
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

        private void CreateGUI()
        {
            root = rootVisualElement;
            root.AddToClassList("studio-root");
            LoadStylesheet();

            BuildToolbar();
            BuildBody();
            BuildFooter();
            RebuildNav();
            RebuildContent();
        }

        private void LoadStylesheet()
        {
            string[] guids = AssetDatabase.FindAssets("WorldGenStudio t:StyleSheet");
            for (int i = 0; i < guids.Length; i++)
            {
                string path = AssetDatabase.GUIDToAssetPath(guids[i]);
                if (path.EndsWith("WorldGenStudio.uss", StringComparison.OrdinalIgnoreCase))
                {
                    StyleSheet sheet = AssetDatabase.LoadAssetAtPath<StyleSheet>(path);
                    if (sheet != null)
                    {
                        root.styleSheets.Add(sheet);
                        return;
                    }
                }
            }
        }

        private void BuildToolbar()
        {
            VisualElement bar = new VisualElement();
            bar.AddToClassList("studio-toolbar");

            Button generate = new Button(TryGenerateWorld) { text = "Generate World" };
            generate.AddToClassList("btn-primary");
            bar.Add(generate);

            bar.Add(new Button(TryGenerateTerrainOnly) { text = "Terrain Only" });
            bar.Add(new Button(RefreshValidation) { text = "Validate" });
            bar.Add(new Button(RandomizeSeed) { text = "Random Seed" });

            VisualElement spacer = new VisualElement();
            spacer.AddToClassList("studio-toolbar-spacer");
            bar.Add(spacer);

            statusLabel = new Label(statusLine);
            statusLabel.AddToClassList("studio-status");
            bar.Add(statusLabel);

            Label version = new Label(TerrainGenerator.BakeEngineVersion);
            version.AddToClassList("studio-version");
            bar.Add(version);

            root.Add(bar);
        }

        private void BuildBody()
        {
            VisualElement body = new VisualElement();
            body.AddToClassList("studio-body");

            navContainer = new VisualElement();
            navContainer.AddToClassList("studio-nav");
            body.Add(navContainer);

            contentHost = new ScrollView(ScrollViewMode.Vertical);
            contentHost.AddToClassList("studio-content");
            contentHost.AddToClassList("studio-scroll");
            body.Add(contentHost);

            root.Add(body);
        }

        private void BuildFooter()
        {
            footerLabel = new Label();
            footerLabel.AddToClassList("studio-footer");
            root.Add(footerLabel);
            UpdateFooter();
        }

        private void RebuildNav()
        {
            navContainer.Clear();

            for (int i = 0; i < PageNames.Length; i++)
            {
                int index = i;
                Button item = new Button(() => SelectPage((Page)index)) { text = PageNames[i] };
                item.AddToClassList("studio-nav-item");
                if ((Page)index == activePage)
                {
                    item.AddToClassList("studio-nav-item-active");
                }

                navContainer.Add(item);
            }

            VisualElement bindings = new VisualElement();
            bindings.AddToClassList("studio-nav-bindings");
            bindings.Add(new Label("Scene"));

            var genField = new ObjectField("Generator") { objectType = typeof(WorldGenerator), allowSceneObjects = true };
            genField.SetValueWithoutNotify(generator);
            genField.RegisterValueChangedCallback(evt =>
            {
                generator = evt.newValue as WorldGenerator;
                if (generator != null && generator.Config != null && config == null)
                {
                    config = generator.Config;
                    EnsureSerializedObject();
                }

                RebuildContent();
            });
            bindings.Add(genField);

            var cfgField = new ObjectField("Config") { objectType = typeof(WorldGeneratorConfig), allowSceneObjects = false };
            cfgField.SetValueWithoutNotify(config);
            cfgField.RegisterValueChangedCallback(evt =>
            {
                config = evt.newValue as WorldGeneratorConfig;
                EnsureSerializedObject();
                RefreshValidation();
                RebuildContent();
            });
            bindings.Add(cfgField);

            navContainer.Add(bindings);
        }

        private void SelectPage(Page page)
        {
            activePage = page;
            RebuildNav();
            RebuildContent();
        }

        private void RebuildContent()
        {
            contentHost.Clear();
            UpdateStatus();

            if (config == null)
            {
                VisualElement help = new VisualElement();
                help.AddToClassList("studio-help");
                help.Add(new Label("Assign a WorldGeneratorConfig in the sidebar to begin."));
                help.Add(new Label("Use Build Location for the full zone workflow."));
                contentHost.Add(help);
                return;
            }

            EnsureSerializedObject();
            configSerializedObject.Update();
            contentHost.Add(BuildMetrics());

            switch (activePage)
            {
                case Page.BuildLocation:
                    contentHost.Add(BuildLocationPage());
                    break;
                case Page.Terrain:
                    contentHost.Add(BuildTerrainPage());
                    break;
                case Page.Biomes:
                    contentHost.Add(BuildBiomesPage());
                    break;
                case Page.World:
                    contentHost.Add(BuildInspectorPage("World Layout", "Cities, roads, caves, sectors.", "citySettings", "roadSettings", "roadMarkerPrefab", "caveSettings", "sectorSettings"));
                    break;
                case Page.Spawns:
                    contentHost.Add(BuildSpawnsPage());
                    break;
                case Page.Results:
                    contentHost.Add(BuildResultsPage());
                    break;
            }
        }

        private VisualElement BuildMetrics()
        {
            WorldGenPresetLibrary.EnsureConfigSections(config);
            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            float areaKm2 = (worldSize * worldSize) / 1_000_000f;
            int terrainTiles = EstimateTerrainTiles();
            string bakeHint = terrainTiles > 0 ? WorldGenStudioPresets.GetBakeTimeHint(config) : "n/a";

            VisualElement row = new VisualElement();
            row.AddToClassList("studio-metrics");
            row.Add(MakeMetric($"{areaKm2:0.0} km²", "World Area"));
            row.Add(MakeMetric(config.citySettings.maxCities.ToString(), "Cities"));
            row.Add(MakeMetric(terrainTiles.ToString(), "Terrain Tiles"));
            row.Add(MakeMetric(bakeHint, "Bake ETA"));
            return row;
        }

        private static VisualElement MakeMetric(string value, string label)
        {
            VisualElement box = new VisualElement();
            box.AddToClassList("studio-metric");
            Label v = new Label(value);
            v.AddToClassList("studio-metric-value");
            Label l = new Label(label);
            l.AddToClassList("studio-metric-label");
            box.Add(v);
            box.Add(l);
            return box;
        }

        private VisualElement BuildLocationPage()
        {
            WorldGenPresetLibrary.EnsureConfigSections(config);
            LocationKitSettings kit = config.locationKit;

            VisualElement page = new VisualElement();
            page.Add(MakeTitle("Build Location", "Zone map, terrain, biomes, Synty kits, POI markers — one workflow."));

            TwoPaneSplitView split = new TwoPaneSplitView(0, 420, TwoPaneSplitViewOrientation.Horizontal);
            split.AddToClassList("studio-split");

            VisualElement previewPane = new VisualElement();
            previewPane.AddToClassList("studio-preview-pane");
            previewImgui = new IMGUIContainer(DrawPreviewOnly);
            previewImgui.style.flexGrow = 1;
            previewImgui.style.minHeight = 380;
            previewPane.Add(previewImgui);
            split.Add(previewPane);

            VisualElement formPane = new ScrollView();
            formPane.AddToClassList("studio-form-pane");

            Foldout fGeneral = new Foldout { text = "General", value = true };
            fGeneral.AddToClassList("studio-foldout");
            var nameField = new TextField("Location Name") { value = kit.locationName };
            nameField.RegisterValueChangedCallback(evt =>
            {
                kit.locationName = evt.newValue;
                EditorUtility.SetDirty(config);
            });
            fGeneral.Add(nameField);
            formPane.Add(fGeneral);

            Foldout fZone = new Foldout { text = "1. Zone (3 km)", value = true };
            fZone.AddToClassList("studio-foldout");
            fZone.Add(new Label("12 chunks × 256 m, 16 terrain tiles, ~1–2 min bake.") { style = { whiteSpace = WhiteSpace.Normal } });
            fZone.Add(new Button(() =>
            {
                WorldGenStudioPresets.ApplyMapSize(config, WorldGenStudioPresets.MapSizeId.Zone);
                WorldGenLivePreview.NotifyConfigChanged(config);
                WorldGenTerrainPreview.Invalidate();
                previewImgui.MarkDirtyRepaint();
            }) { text = "Apply Zone Size" });
            formPane.Add(fZone);

            Foldout fTerrain = new Foldout { text = "2. Terrain Style", value = true };
            fTerrain.AddToClassList("studio-foldout");
            fTerrain.Add(BuildHeightStyleRow());
            var mountainSlider = new Slider("Mountain Boost", -0.15f, 0.25f) { value = WorldGenLocationWizard.MountainTweak, showInputField = true };
            mountainSlider.RegisterValueChangedCallback(evt => WorldGenLocationWizard.MountainTweak = evt.newValue);
            fTerrain.Add(mountainSlider);
            formPane.Add(fTerrain);

            Foldout fBiomes = new Foldout { text = "3. Biomes & Textures", value = true };
            fBiomes.AddToClassList("studio-foldout");
            fBiomes.Add(new Button(() =>
            {
                WorldGenBiomeTemplates.ApplyRichWorldTemplate(config);
                WorldGenTerrainPreview.Invalidate();
                previewImgui.MarkDirtyRepaint();
            }) { text = "Apply 10-Biome Template" });
            fBiomes.Add(MakeTextureField("Grass", () => kit.grassDiffuse, v => kit.grassDiffuse = v));
            fBiomes.Add(MakeTextureField("Grass Normal", () => kit.grassNormal, v => kit.grassNormal = v));
            fBiomes.Add(MakeTextureField("Stone", () => kit.stoneDiffuse, v => kit.stoneDiffuse = v));
            fBiomes.Add(MakeTextureField("Stone Normal", () => kit.stoneNormal, v => kit.stoneNormal = v));
            formPane.Add(fBiomes);

            Foldout fSynty = new Foldout { text = "4. Synty Kits", value = true };
            fSynty.AddToClassList("studio-foldout");
            fSynty.Add(MakeFolderField("Forest", () => kit.forestKitFolder, v => kit.forestKitFolder = v));
            fSynty.Add(MakeFolderField("Ruins", () => kit.ruinsKitFolder, v => kit.ruinsKitFolder = v));
            fSynty.Add(MakeFolderField("Road to Boss", () => kit.roadKitFolder, v => kit.roadKitFolder = v));
            fSynty.Add(new Button(() =>
            {
                WorldGenLocationWizard.ApplySyntyKits(config);
                EditorUtility.SetDirty(config);
            }) { text = "Assign Kits to Biomes" });
            formPane.Add(fSynty);

            Foldout fPoi = new Foldout { text = "5. POI Markers", value = false };
            fPoi.AddToClassList("studio-foldout");
            var poiToggle = new Toggle("Spawn POI after bake") { value = kit.spawnPoiMarkers };
            poiToggle.RegisterValueChangedCallback(evt => kit.spawnPoiMarkers = evt.newValue);
            fPoi.Add(poiToggle);
            fPoi.Add(MakeVector2Field("Spawn hub", () => kit.spawnHub01, v => kit.spawnHub01 = v));
            fPoi.Add(MakeVector2Field("Ruins", () => kit.ruins01, v => kit.ruins01 = v));
            fPoi.Add(MakeVector2Field("Boss arena", () => kit.bossArena01, v => kit.bossArena01 = v));
            formPane.Add(fPoi);

            Button applyBtn = new Button(() =>
            {
                WorldGenLocationWizard.ApplyZoneLocationPreset(config);
                statusLine = $"Preset applied — {kit.locationName}";
                UpdateStatus();
                previewImgui.MarkDirtyRepaint();
            }) { text = "Apply All Settings" };
            applyBtn.AddToClassList("studio-cta-secondary");
            formPane.Add(applyBtn);

            Button buildBtn = new Button(() =>
            {
                if (generator == null)
                {
                    statusLine = "Assign WorldGenerator in sidebar.";
                    UpdateStatus();
                    return;
                }

                WorldGenLocationWizard.BuildZoneLocation(
                    generator,
                    config,
                    result =>
                    {
                        activePage = Page.Results;
                        RebuildNav();
                        RebuildContent();
                    },
                    msg =>
                    {
                        statusLine = msg;
                        UpdateStatus();
                    });
            }) { text = "Build Zone Location" };
            buildBtn.AddToClassList("studio-cta");
            buildBtn.SetEnabled(generator != null && !TerrainBakeEditorRunner.IsRunning);
            formPane.Add(buildBtn);

            split.Add(formPane);
            page.Add(split);
            return page;
        }

        private VisualElement BuildHeightStyleRow()
        {
            VisualElement row = new VisualElement();
            row.AddToClassList("studio-preset-row");

            row.Add(MakePresetToggle(
                "Alpine",
                WorldGenLocationWizard.SelectedHeightStyle == WorldGenLocationWizard.HeightStyle.Alpine,
                () =>
                {
                    WorldGenLocationWizard.SelectedHeightStyle = WorldGenLocationWizard.HeightStyle.Alpine;
                    RebuildContent();
                }));

            row.Add(MakePresetToggle(
                "Heroic WoW",
                WorldGenLocationWizard.SelectedHeightStyle == WorldGenLocationWizard.HeightStyle.HeroicWow,
                () =>
                {
                    WorldGenLocationWizard.SelectedHeightStyle = WorldGenLocationWizard.HeightStyle.HeroicWow;
                    RebuildContent();
                }));

            return row;
        }

        private Button MakePresetToggle(string label, bool active, Action onClick)
        {
            Button btn = new Button(onClick) { text = label };
            btn.AddToClassList("studio-preset-btn");
            if (active)
            {
                btn.AddToClassList("studio-preset-btn-active");
            }

            return btn;
        }

        private ObjectField MakeTextureField(string label, Func<Texture2D> getter, Action<Texture2D> setter)
        {
            var field = new ObjectField(label) { objectType = typeof(Texture2D), allowSceneObjects = false };
            field.SetValueWithoutNotify(getter());
            field.RegisterValueChangedCallback(evt =>
            {
                setter(evt.newValue as Texture2D);
                EditorUtility.SetDirty(config);
            });
            return field;
        }

        private ObjectField MakeFolderField(string label, Func<string> getter, Action<string> setter)
        {
            var field = new ObjectField(label) { objectType = typeof(DefaultAsset), allowSceneObjects = false };
            string path = getter();
            field.SetValueWithoutNotify(string.IsNullOrEmpty(path) ? null : AssetDatabase.LoadAssetAtPath<DefaultAsset>(path));
            field.RegisterValueChangedCallback(evt =>
            {
                DefaultAsset asset = evt.newValue as DefaultAsset;
                setter(asset != null ? AssetDatabase.GetAssetPath(asset) : string.Empty);
                EditorUtility.SetDirty(config);
            });
            return field;
        }

        private VisualElement MakeVector2Field(string label, Func<Vector2> getter, Action<Vector2> setter)
        {
            Vector2 v = getter();
            var xField = new FloatField("X") { value = v.x };
            var yField = new FloatField("Y") { value = v.y };
            VisualElement row = new VisualElement();
            row.Add(new Label(label));
            row.AddToClassList("studio-row");
            xField.RegisterValueChangedCallback(evt => setter(new Vector2(evt.newValue, getter().y)));
            yField.RegisterValueChangedCallback(evt => setter(new Vector2(getter().x, evt.newValue)));
            row.Add(xField);
            row.Add(yField);
            return row;
        }

        private VisualElement BuildTerrainPage()
        {
            VisualElement page = new VisualElement();
            page.Add(MakeTitle("Terrain", "Height presets and sculpt sliders with live preview."));

            VisualElement presets = new VisualElement();
            presets.AddToClassList("studio-card");
            presets.Add(new Label("Heightmap Preset") { style = { unityFontStyleAndWeight = FontStyle.Bold } });
            VisualElement presetRow = new VisualElement();
            presetRow.AddToClassList("studio-preset-row");
            for (int i = 0; i < WorldGenStudioPresets.HeightmapNames.Length; i++)
            {
                int idx = i;
                var id = (WorldGenStudioPresets.HeightmapProfileId)idx;
                presetRow.Add(MakePresetToggle(
                    WorldGenStudioPresets.HeightmapNames[idx],
                    selectedHeightmap == id,
                    () =>
                    {
                        ApplyHeightmapProfile(id);
                        RebuildContent();
                    }));
            }
            presets.Add(presetRow);
            page.Add(presets);

            TwoPaneSplitView split = new TwoPaneSplitView(0, 400, TwoPaneSplitViewOrientation.Horizontal);
            split.AddToClassList("studio-split");

            VisualElement previewPane = new VisualElement();
            previewPane.AddToClassList("studio-preview-pane");
            previewImgui = new IMGUIContainer(DrawPreviewOnly);
            previewImgui.style.minHeight = 360;
            previewPane.Add(previewImgui);
            split.Add(previewPane);

            sculptImgui = new IMGUIContainer(() =>
            {
                WorldGenTerrainSculptPanel.Draw(config, NotifySculptChanged);
                EditorGUILayout.Space(4f);
                EditorGUILayout.BeginHorizontal();
                if (GUILayout.Button("129")) ApplyHeightmapResolution(129);
                if (GUILayout.Button("257")) ApplyHeightmapResolution(257);
                if (GUILayout.Button("513")) ApplyHeightmapResolution(513);
                EditorGUILayout.EndHorizontal();
            });
            sculptImgui.style.minHeight = 360;
            split.Add(sculptImgui);
            page.Add(split);
            return page;
        }

        private VisualElement BuildBiomesPage()
        {
            WorldGenPresetLibrary.EnsureConfigSections(config);
            VisualElement page = new VisualElement();
            page.Add(MakeTitle("Biomes", "Templates, terrain textures, Synty prefab folders."));

            VisualElement tools = new VisualElement();
            tools.AddToClassList("studio-card");
            tools.AddToClassList("studio-row");
            tools.Add(new Button(ApplyRichBiomeTemplate) { text = "10-Biome Template" });
            tools.Add(new Button(NormalizeBiomeBlendWeights) { text = "Normalize Weights" });
            tools.Add(new Button(SortBiomesByHeight) { text = "Sort by Height" });
            page.Add(tools);

            var folderField = new ObjectField("Synty Prefab Folder") { objectType = typeof(DefaultAsset), allowSceneObjects = false };
            folderField.RegisterValueChangedCallback(evt =>
            {
                if (evt.newValue is DefaultAsset folder)
                {
                    WorldGenBiomeTemplates.AssignPrefabFolder(config, folder);
                    WorldGenTerrainPreview.Invalidate();
                }
            });
            page.Add(folderField);

            page.Add(BuildInspectorPage(null, null, "biomes", "resourceSettings"));
            return page;
        }

        private VisualElement BuildSpawnsPage()
        {
            return BuildInspectorPage(
                "Spawns & Performance",
                "Resources, MMO spawns, runtime streaming.",
                "resourceSettings",
                "spawnSettings",
                "playerSpawnMarkerPrefab",
                "npcSpawnMarkerPrefab",
                "mobZoneMarkerPrefab",
                "runtimeOptimization");
        }

        private VisualElement BuildInspectorPage(string title, string desc, params string[] propertyNames)
        {
            VisualElement page = new VisualElement();
            if (!string.IsNullOrEmpty(title))
            {
                page.Add(MakeTitle(title, desc));
            }

            IMGUIContainer imgui = new IMGUIContainer(() =>
            {
                if (configSerializedObject == null)
                {
                    return;
                }

                configSerializedObject.Update();
                for (int i = 0; i < propertyNames.Length; i++)
                {
                    SerializedProperty prop = configSerializedObject.FindProperty(propertyNames[i]);
                    if (prop != null)
                    {
                        EditorGUILayout.PropertyField(prop, true);
                    }
                }

                if (configSerializedObject.ApplyModifiedProperties())
                {
                    EditorUtility.SetDirty(config);
                    WorldGenLivePreview.NotifyConfigChanged(config);
                }
            });
            page.Add(imgui);
            return page;
        }

        private VisualElement BuildResultsPage()
        {
            VisualElement page = new VisualElement();
            page.Add(MakeTitle("Results", "Validation and last generation stats."));

            IMGUIContainer imgui = new IMGUIContainer(() =>
            {
                if (validationMessages.Count == 0)
                {
                    EditorGUILayout.HelpBox("Config is valid.", MessageType.Info);
                }
                else
                {
                    for (int i = 0; i < validationMessages.Count; i++)
                    {
                        EditorGUILayout.HelpBox(validationMessages[i], MessageType.Warning);
                    }
                }

                EditorGUILayout.Space(8f);
                if (generator == null || generator.LastResult == null)
                {
                    EditorGUILayout.HelpBox("Run Generate World to see stats.", MessageType.None);
                }
                else
                {
                    WorldGenerationResult r = generator.LastResult;
                    EditorGUILayout.LabelField("Seed", r.worldSeed.ToString());
                    EditorGUILayout.LabelField("Size", $"{r.worldWidth:0} × {r.worldLength:0} m");
                    EditorGUILayout.LabelField("Cities / Roads / Caves", $"{r.cities.Count} / {r.worldRoads.Count} / {r.caves.Count}");
                    EditorGUILayout.LabelField("Resources / Mob Zones", $"{r.resources.Count} / {r.mobSpawnZones.Count}");
                    TerrainGenerator.TerrainGenerationResult terrain = generator.LastTerrainResult;
                    if (terrain?.terrains != null)
                    {
                        EditorGUILayout.LabelField("Terrain Tiles", terrain.terrains.Count.ToString());
                    }
                }

                EditorGUILayout.Space(8f);
                EditorGUILayout.BeginHorizontal();
                if (GUILayout.Button("Copy Snapshot")) CopyConfigSnapshot();
                if (GUILayout.Button("Ping Roots")) PingSpawnRoots();
                EditorGUILayout.EndHorizontal();
            });
            page.Add(imgui);
            return page;
        }

        private static VisualElement MakeTitle(string title, string desc)
        {
            VisualElement block = new VisualElement();
            block.style.marginBottom = 8;
            Label t = new Label(title);
            t.AddToClassList("studio-section-title");
            block.Add(t);
            if (!string.IsNullOrEmpty(desc))
            {
                Label d = new Label(desc);
                d.AddToClassList("studio-section-desc");
                block.Add(d);
            }

            return block;
        }

        private void DrawPreviewOnly()
        {
            if (config == null)
            {
                return;
            }

            WorldGenLivePreview.PreviewResolution = 384;
            WorldGenTerrainPreview.DrawPreview(config, 384);
        }

        private void NotifySculptChanged()
        {
            if (config == null)
            {
                return;
            }

            EditorUtility.SetDirty(config);
            WorldGenLivePreview.NotifyConfigChanged(config);
            previewImgui?.MarkDirtyRepaint();
            sculptImgui?.MarkDirtyRepaint();
        }

        private void UpdateStatus()
        {
            if (statusLabel != null)
            {
                statusLabel.text = statusLine;
            }

            UpdateFooter();
        }

        private void UpdateFooter()
        {
            if (footerLabel != null)
            {
                footerLabel.text = $"{statusLine}  |  bake {TerrainGenerator.BakeEngineVersion}";
            }
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

        private void ApplyHeightmapProfile(WorldGenStudioPresets.HeightmapProfileId profile)
        {
            if (config == null)
            {
                return;
            }

            WorldGenStudioPresets.ApplyHeightmapProfile(config, profile);
            selectedHeightmap = profile;
            statusLine = $"Heightmap: {WorldGenStudioPresets.HeightmapNames[(int)profile]}";
            NotifySculptChanged();
            RefreshValidation();
            UpdateStatus();
        }

        private void ApplyHeightmapResolution(int resolution)
        {
            if (config == null)
            {
                return;
            }

            WorldGenStudioPresets.ApplyHeightmapResolution(config, resolution);
            statusLine = $"Resolution: {resolution}";
            UpdateStatus();
        }

        private void TryGenerateWorld()
        {
            if (generator == null) { statusLine = "No WorldGenerator in scene."; UpdateStatus(); return; }
            if (config == null) { statusLine = "No config selected."; UpdateStatus(); return; }
            if (TerrainBakeEditorRunner.IsRunning) { statusLine = "Generation running."; UpdateStatus(); return; }

            try
            {
                Undo.RecordObject(generator, "Generate World");
                generator.Config = config;
                TerrainBakeEditorRunner.RunFullWorld(
                    generator,
                    result =>
                    {
                        activePage = Page.Results;
                        RebuildNav();
                        RebuildContent();
                    },
                    message =>
                    {
                        statusLine = message;
                        UpdateStatus();
                    });
            }
            catch (Exception ex)
            {
                statusLine = "Generation failed.";
                Debug.LogException(ex);
                UpdateStatus();
            }
        }

        private void TryGenerateTerrainOnly()
        {
            if (generator == null) { statusLine = "No WorldGenerator."; UpdateStatus(); return; }
            if (config == null) { statusLine = "No config."; UpdateStatus(); return; }
            if (TerrainBakeEditorRunner.IsRunning) { return; }

            try
            {
                Undo.RecordObject(generator, "Terrain Only");
                generator.Config = config;
                TerrainBakeEditorRunner.RunTerrainOnly(
                    generator,
                    () =>
                    {
                        activePage = Page.Terrain;
                        RebuildNav();
                        RebuildContent();
                    },
                    message =>
                    {
                        statusLine = message;
                        UpdateStatus();
                    });
            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
                UpdateStatus();
            }
        }

        private void RandomizeSeed()
        {
            if (config == null) return;
            Undo.RecordObject(config, "Randomize seed");
            config.worldSeed = UnityEngine.Random.Range(1000, 999_999_999);
            EditorUtility.SetDirty(config);
            statusLine = $"Seed: {config.worldSeed}";
            WorldGenLivePreview.NotifyConfigChanged(config);
            previewImgui?.MarkDirtyRepaint();
            UpdateStatus();
        }

        private void RefreshValidation()
        {
            validationMessages = config != null ? config.GetValidationMessages() : new List<string>();
            statusLine = validationMessages.Count == 0 ? "Ready" : $"{validationMessages.Count} warnings";
            UpdateStatus();
        }

        private void EnsureSerializedObject()
        {
            if (config == null) { configSerializedObject = null; return; }
            if (configSerializedObject == null || configSerializedObject.targetObject != config)
            {
                configSerializedObject = new SerializedObject(config);
            }
        }

        private void ApplyRichBiomeTemplate()
        {
            if (config == null) return;
            WorldGenBiomeTemplates.ApplyRichWorldTemplate(config);
            statusLine = "10-biome template applied.";
            WorldGenTerrainPreview.Invalidate();
            RefreshValidation();
            RebuildContent();
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
            statusLine = "Weights normalized.";
            UpdateStatus();
        }

        private void SortBiomesByHeight()
        {
            if (config?.biomes == null || config.biomes.Count <= 1) return;
            Undo.RecordObject(config, "Sort biomes");
            config.biomes.Sort((a, b) => a.minHeight01.CompareTo(b.minHeight01));
            EditorUtility.SetDirty(config);
            statusLine = "Biomes sorted.";
            UpdateStatus();
        }

        private void CopyConfigSnapshot()
        {
            if (config == null) return;
            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            EditorGUIUtility.systemCopyBuffer = $"seed={config.worldSeed}\nsize={worldSize:0}m\ntiles={EstimateTerrainTiles()}";
            statusLine = "Snapshot copied.";
            UpdateStatus();
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
            if (roots.Count == 0) { statusLine = "No roots."; UpdateStatus(); return; }
            Selection.objects = roots.ToArray();
            EditorGUIUtility.PingObject(roots[0]);
            statusLine = $"Selected {roots.Count} roots.";
            UpdateStatus();
        }
    }

    /// <summary>Backward-compatible entry point.</summary>
    public sealed class WorldGeneratorDashboardWindow : EditorWindow
    {
        public static void Open() => WorldGenStudioWindow.Open();
    }
}
#endif
