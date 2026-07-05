#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    /// <summary>
    /// Guided zone location builder: Setup → Zone, terrain style, 10-biome, Synty kits, POI markers, Generate World.
    /// </summary>
    internal static class WorldGenLocationWizard
    {
        internal enum HeightStyle
        {
            Alpine,
            HeroicWow
        }

        internal static HeightStyle SelectedHeightStyle = HeightStyle.HeroicWow;
        internal static float MountainTweak;

        internal static int ActiveWizardStep;
        private static Vector2 wizardScroll;

        internal static void Draw(
            WorldGeneratorConfig config,
            WorldGenerator generator,
            Action<string> setStatusLine,
            Action<WorldGenerationResult> onWorldComplete)
        {
            if (config == null)
            {
                WorldGenEditorUi.DrawEmptyState(
                    "No config assigned",
                    "Create or assign a WorldGeneratorConfig asset in Scene Bindings.",
                    "Open Setup",
                    null);
                return;
            }

            WorldGenPresetLibrary.EnsureConfigSections(config);
            LocationKitSettings kit = config.locationKit;

            string[] steps = { "Zone", "Terrain", "Biomes", "Synty", "POI", "Build" };
            WorldGenEditorUi.DrawStepRail(steps, ActiveWizardStep);

            EditorGUILayout.Space(8f);
            EditorGUILayout.BeginHorizontal();

            EditorGUILayout.BeginVertical(GUILayout.Width(420f));
            WorldGenEditorUi.BeginPanel("Live Map Preview", "Height + biome colors update as you change settings.");
            WorldGenLivePreview.PreviewResolution = 392;
            WorldGenTerrainPreview.DrawPreview(config, 392);
            EditorGUILayout.Space(4f);
            EditorGUILayout.BeginHorizontal();
            WorldGenEditorUi.DrawStatusChip($"Seed {config.worldSeed}", WorldGenEditorUi.AccentSoft);
            WorldGenEditorUi.DrawStatusChip(WorldGenStudioPresets.GetMapSizeLabel(config), WorldGenEditorUi.Success);
            WorldGenEditorUi.DrawStatusChip(WorldGenStudioPresets.GetBakeTimeHint(config), WorldGenEditorUi.Warning);
            EditorGUILayout.EndHorizontal();
            WorldGenEditorUi.EndPanel();

            WorldGenEditorUi.BeginPanel("Workflow", "Your zone → boss pipeline in one place.");
            DrawWorkflowRow("1", "Setup → Zone", "~3 km, 16 tiles, ~1–2 min");
            DrawWorkflowRow("2", "Alpine / Heroic WoW", SelectedHeightStyle == HeightStyle.Alpine ? "Alpine Peaks" : "Heroic WoW");
            DrawWorkflowRow("3", "10-Biome + textures", "Grass/stone splat on bake");
            DrawWorkflowRow("4", "Synty kits", "Forest, ruins, road folders");
            DrawWorkflowRow("5", "POI markers", "Spawn, ruins, boss + road hints");
            DrawWorkflowRow("6", "Generate World", "Full layout + terrain bake");
            WorldGenEditorUi.EndPanel();
            EditorGUILayout.EndVertical();

            EditorGUILayout.BeginVertical();
            wizardScroll = EditorGUILayout.BeginScrollView(wizardScroll);

            WorldGenEditorUi.BeginPanel("Location", "Name your zone and walk through each step.");
            kit.locationName = EditorGUILayout.TextField("Location Name", kit.locationName);
            WorldGenEditorUi.EndPanel();

            if (ActiveWizardStep == 0 || ActiveWizardStep == 5)
            {
                DrawStepZone(config, kit);
            }

            if (ActiveWizardStep == 1 || ActiveWizardStep == 5)
            {
                DrawStepTerrain();
            }

            if (ActiveWizardStep == 2 || ActiveWizardStep == 5)
            {
                DrawStepBiomes(config, kit);
            }

            if (ActiveWizardStep == 3 || ActiveWizardStep == 5)
            {
                DrawStepSynty(config, kit);
            }

            if (ActiveWizardStep == 4 || ActiveWizardStep == 5)
            {
                DrawStepPoi(kit);
            }

            EditorGUILayout.EndScrollView();

            EditorGUILayout.Space(6f);
            EditorGUILayout.BeginHorizontal();
            if (WorldGenEditorUi.DrawSecondaryButton("◀ Prev", 72f, 36f) && ActiveWizardStep > 0)
            {
                ActiveWizardStep--;
            }

            if (WorldGenEditorUi.DrawSecondaryButton("Next ▶", 72f, 36f) && ActiveWizardStep < steps.Length - 1)
            {
                ActiveWizardStep++;
            }

            GUILayout.FlexibleSpace();

            if (WorldGenEditorUi.DrawSecondaryButton("Apply Setup", 110f, 36f))
            {
                ApplyZoneLocationPreset(config);
                setStatusLine?.Invoke($"Location preset applied — {kit.locationName}");
                WorldGenLivePreview.NotifyConfigChanged(config);
                WorldGenTerrainPreview.Invalidate();
            }

            EditorGUI.BeginDisabledGroup(generator == null || TerrainBakeEditorRunner.IsRunning);
            if (WorldGenEditorUi.DrawPrimaryButton("  BUILD ZONE LOCATION  ", 40f))
            {
                BuildZoneLocation(generator, config, result =>
                {
                    setStatusLine?.Invoke($"Location built — {kit.locationName}");
                    onWorldComplete?.Invoke(result);
                }, setStatusLine);
            }
            EditorGUI.EndDisabledGroup();
            EditorGUILayout.EndHorizontal();

            if (generator == null)
            {
                EditorGUILayout.HelpBox("Assign a WorldGenerator in Scene Bindings (sidebar) to build.", MessageType.Warning);
            }

            EditorGUILayout.EndVertical();
            EditorGUILayout.EndHorizontal();
        }

        private static void DrawWorkflowRow(string num, string title, string detail)
        {
            EditorGUILayout.BeginHorizontal();
            WorldGenEditorUi.DrawStatusChip(num, WorldGenEditorUi.Accent);
            EditorGUILayout.BeginVertical();
            EditorGUILayout.LabelField(title, EditorStyles.boldLabel);
            EditorGUILayout.LabelField(detail, EditorStyles.miniLabel);
            EditorGUILayout.EndVertical();
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space(2f);
        }

        private static void DrawStepZone(WorldGeneratorConfig config, LocationKitSettings kit)
        {
            WorldGenEditorUi.BeginPanel("Step 1 — Zone Map", "Single dungeon zone scale — fast iteration.");
            EditorGUILayout.LabelField("Zone preset: 12×256m chunks, 512m terrain tiles, 16 tiles total.", EditorStyles.wordWrappedLabel);
            if (GUILayout.Button("Apply Zone Size", GUILayout.Height(28f)))
            {
                WorldGenStudioPresets.ApplyMapSize(config, WorldGenStudioPresets.MapSizeId.Zone);
                WorldGenLivePreview.NotifyConfigChanged(config);
            }
            WorldGenEditorUi.EndPanel();
        }

        private static void DrawStepTerrain()
        {
            WorldGenEditorUi.BeginPanel("Step 2 — Terrain Style", "Pick a height profile, then tweak peaks.");
            EditorGUILayout.BeginHorizontal();
            if (WorldGenEditorUi.DrawPresetCard(
                    "Alpine Peaks",
                    "Sharp ridges, tall peaks",
                    WorldGenStudioPresets.HeightmapAccentColors[2],
                    true,
                    SelectedHeightStyle == HeightStyle.Alpine))
            {
                SelectedHeightStyle = HeightStyle.Alpine;
            }

            if (WorldGenEditorUi.DrawPresetCard(
                    "Heroic WoW",
                    "Classic adventure MMO",
                    WorldGenStudioPresets.HeightmapAccentColors[6],
                    true,
                    SelectedHeightStyle == HeightStyle.HeroicWow))
            {
                SelectedHeightStyle = HeightStyle.HeroicWow;
            }
            EditorGUILayout.EndHorizontal();

            MountainTweak = EditorGUILayout.Slider(
                new GUIContent("Mountain Boost", "Extra peak drama on top of the preset."),
                MountainTweak,
                -0.15f,
                0.25f);
            WorldGenEditorUi.EndPanel();
        }

        private static void DrawStepBiomes(WorldGeneratorConfig config, LocationKitSettings kit)
        {
            WorldGenEditorUi.BeginPanel("Step 3 — Biomes & Ground", "10-biome climate + grass/stone terrain paint.");
            if (GUILayout.Button("Apply 10-Biome Rich World", GUILayout.Height(28f)))
            {
                WorldGenBiomeTemplates.ApplyRichWorldTemplate(config);
            }

            EditorGUILayout.Space(6f);
            EditorGUILayout.BeginHorizontal();
            WorldGenEditorUi.DrawTextureSlot("Grass", ref kit.grassDiffuse);
            WorldGenEditorUi.DrawTextureSlot("Grass N", ref kit.grassNormal);
            WorldGenEditorUi.DrawTextureSlot("Stone", ref kit.stoneDiffuse);
            WorldGenEditorUi.DrawTextureSlot("Stone N", ref kit.stoneNormal);
            EditorGUILayout.EndHorizontal();
            WorldGenEditorUi.EndPanel();
        }

        private static void DrawStepSynty(WorldGeneratorConfig config, LocationKitSettings kit)
        {
            WorldGenEditorUi.BeginPanel("Step 4 — Synty Kits", "Drag POLYGON prefab folders from the Project window.");
            WorldGenEditorUi.DrawFolderSlot("Forest", "meadow, forest, jungle props", ref kit.forestKitFolder);
            EditorGUILayout.Space(4f);
            WorldGenEditorUi.DrawFolderSlot("Ruins", "volcanic/alpine caves + ruins", ref kit.ruinsKitFolder);
            EditorGUILayout.Space(4f);
            WorldGenEditorUi.DrawFolderSlot("Road", "road pieces toward boss arena", ref kit.roadKitFolder);
            if (GUILayout.Button("Assign Kits to Biomes", GUILayout.Height(26f)))
            {
                ApplySyntyKits(config);
                EditorUtility.SetDirty(config);
            }
            WorldGenEditorUi.EndPanel();
        }

        private static void DrawStepPoi(LocationKitSettings kit)
        {
            WorldGenEditorUi.BeginPanel("Step 5 — POI Markers", "Empty anchors for hand polish in Scene view.");
            kit.spawnPoiMarkers = EditorGUILayout.Toggle("Spawn POI empties after bake", kit.spawnPoiMarkers);
            kit.roadHintSteps = EditorGUILayout.IntSlider("Road hint steps", kit.roadHintSteps, 3, 12);
            kit.spawnHub01 = EditorGUILayout.Vector2Field("Spawn hub (0–1)", kit.spawnHub01);
            kit.ruins01 = EditorGUILayout.Vector2Field("Ruins (0–1)", kit.ruins01);
            kit.bossArena01 = EditorGUILayout.Vector2Field("Boss arena (0–1)", kit.bossArena01);
            WorldGenEditorUi.EndPanel();
        }

        internal static void ApplyZoneLocationPreset(WorldGeneratorConfig config)
        {
            if (config == null)
            {
                return;
            }

            WorldGenPresetLibrary.EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply zone location preset");

            WorldGenStudioPresets.ApplyMapSize(config, WorldGenStudioPresets.MapSizeId.Zone);
            ApplyHeightStyle(config, SelectedHeightStyle, MountainTweak);

            config.citySettings.maxCities = 1;
            config.caveSettings.maxCaves = 12;
            config.spawnSettings.maxMobZones = 64;
            config.resourceSettings.baseNodeSpacing = 38f;
            config.roadSettings.extraConnectionsPerCity = 0;
            config.terrainGeneration.paintBiomeTerrainLayers = true;

            WorldGenBiomeTemplates.ApplyRichWorldTemplate(config);
            ApplySyntyKits(config);
            WorldGenBiomeTemplates.AssignGrassStoneTextures(
                config,
                config.locationKit.grassDiffuse,
                config.locationKit.grassNormal,
                config.locationKit.stoneDiffuse,
                config.locationKit.stoneNormal);

            EditorUtility.SetDirty(config);
            WorldGenLivePreview.NotifyConfigChanged(config);
            WorldGenTerrainPreview.Invalidate();
        }

        internal static void ApplySyntyKits(WorldGeneratorConfig config)
        {
            if (config?.locationKit == null)
            {
                return;
            }

            LocationKitSettings kit = config.locationKit;
            if (!string.IsNullOrEmpty(kit.forestKitFolder))
            {
                WorldGenBiomeTemplates.AssignPrefabFolderPath(
                    config,
                    kit.forestKitFolder,
                    "meadow",
                    "forest",
                    "jungle");
            }

            if (!string.IsNullOrEmpty(kit.ruinsKitFolder))
            {
                WorldGenBiomeTemplates.AssignCavePrefabsFromFolder(
                    config,
                    kit.ruinsKitFolder,
                    "volcanic",
                    "alpine");
            }

            if (!string.IsNullOrEmpty(kit.roadKitFolder))
            {
                List<GameObject> roadPrefabs = WorldGenBiomeTemplates.LoadPrefabsFromFolder(kit.roadKitFolder);
                if (roadPrefabs.Count > 0)
                {
                    Undo.RecordObject(config, "Assign road kit");
                    config.roadMarkerPrefab = roadPrefabs[0];
                    EditorUtility.SetDirty(config);
                }
            }
        }

        internal static void BuildZoneLocation(
            WorldGenerator generator,
            WorldGeneratorConfig config,
            Action<WorldGenerationResult> onComplete,
            Action<string> statusCallback)
        {
            if (generator == null || config == null)
            {
                return;
            }

            ApplyZoneLocationPreset(config);
            EnsureSceneRoots(generator, config);
            SpawnPreviewPois(config);

            Undo.RecordObject(generator, "Build zone location");
            generator.Config = config;

            TerrainBakeEditorRunner.RunFullWorld(
                generator,
                result =>
                {
                    if (config.locationKit.spawnPoiMarkers)
                    {
                        SnapPoisFromResult(config, result);
                    }

                    Selection.activeGameObject = FindPoiRoot(config);
                    onComplete?.Invoke(result);
                },
                statusCallback);
        }

        internal static void SpawnPreviewPois(WorldGeneratorConfig config)
        {
            if (config?.locationKit == null || !config.locationKit.spawnPoiMarkers)
            {
                return;
            }

            float worldW = config.worldSizeInChunks * config.chunkSizeMeters;
            float worldL = config.worldSizeInChunks * config.chunkSizeMeters;
            LocationKitSettings kit = config.locationKit;

            Vector3 spawn = NormalizedToWorld(kit.spawnHub01, worldW, worldL, config);
            Vector3 ruins = NormalizedToWorld(kit.ruins01, worldW, worldL, config);
            Vector3 boss = NormalizedToWorld(kit.bossArena01, worldW, worldL, config);

            Transform root = EnsurePoiRoot(config);
            ClearPoiChildren(root);
            CreatePoiMarker(root, "POI_SpawnHub", spawn, new Color(0.3f, 0.9f, 0.4f));
            CreatePoiMarker(root, "POI_Ruins", ruins, new Color(0.85f, 0.65f, 0.25f));
            CreatePoiMarker(root, "POI_BossArena", boss, new Color(0.92f, 0.28f, 0.32f));
            SpawnRoadHints(root, spawn, boss, kit.roadHintSteps);
        }

        internal static void SnapPoisFromResult(WorldGeneratorConfig config, WorldGenerationResult result)
        {
            if (config?.locationKit == null || result == null)
            {
                return;
            }

            float worldW = result.worldWidth;
            float worldL = result.worldLength;
            LocationKitSettings kit = config.locationKit;

            Vector3 spawn = ResolveSpawnPosition(result, kit, worldW, worldL, config);
            Vector3 ruins = ResolveRuinsPosition(result, kit, worldW, worldL, config);
            Vector3 boss = ResolveBossPosition(result, spawn, kit, worldW, worldL, config);

            kit.spawnHub01 = WorldToNormalized(spawn, worldW, worldL);
            kit.ruins01 = WorldToNormalized(ruins, worldW, worldL);
            kit.bossArena01 = WorldToNormalized(boss, worldW, worldL);

            Transform root = EnsurePoiRoot(config);
            ClearPoiChildren(root);
            CreatePoiMarker(root, "POI_SpawnHub", spawn, new Color(0.3f, 0.9f, 0.4f));
            CreatePoiMarker(root, "POI_Ruins", ruins, new Color(0.85f, 0.65f, 0.25f));
            CreatePoiMarker(root, "POI_BossArena", boss, new Color(0.92f, 0.28f, 0.32f));
            SpawnRoadHints(root, spawn, boss, kit.roadHintSteps);

            EditorUtility.SetDirty(config);
        }

        private static void ApplyHeightStyle(WorldGeneratorConfig config, HeightStyle style, float mountainTweak)
        {
            WorldGenStudioPresets.HeightmapProfileId profile = style == HeightStyle.Alpine
                ? WorldGenStudioPresets.HeightmapProfileId.AlpinePeaks
                : WorldGenStudioPresets.HeightmapProfileId.HeroicWow;
            WorldGenStudioPresets.ApplyHeightmapProfile(config, profile);

            if (Mathf.Abs(mountainTweak) > 0.001f)
            {
                config.terrainShape.mountainBoostStrength = Mathf.Clamp(
                    config.terrainShape.mountainBoostStrength + mountainTweak,
                    0f,
                    0.65f);
                config.terrainShape.ridgeStrength = Mathf.Clamp(
                    config.terrainShape.ridgeStrength + mountainTweak * 0.5f,
                    0f,
                    0.45f);
            }
        }

        private static void EnsureSceneRoots(WorldGenerator generator, WorldGeneratorConfig config)
        {
            Transform genTransform = generator.transform;
            if (config.cityRoot == null)
            {
                config.cityRoot = FindOrCreateChild(genTransform, "Cities");
            }

            if (config.caveRoot == null)
            {
                config.caveRoot = FindOrCreateChild(genTransform, "Caves");
            }

            if (config.resourceRoot == null)
            {
                config.resourceRoot = FindOrCreateChild(genTransform, "Resources");
            }

            if (config.roadRoot == null)
            {
                config.roadRoot = FindOrCreateChild(genTransform, "Roads");
            }

            if (config.spawnRoot == null)
            {
                config.spawnRoot = FindOrCreateChild(genTransform, "Spawns");
            }

            if (config.terrainGeneration.terrainRoot == null)
            {
                config.terrainGeneration.terrainRoot = FindOrCreateChild(genTransform, "Terrain");
            }

            EditorUtility.SetDirty(config);
            EditorUtility.SetDirty(generator);
        }

        private static Transform FindOrCreateChild(Transform parent, string name)
        {
            Transform existing = parent.Find(name);
            if (existing != null)
            {
                return existing;
            }

            GameObject go = new GameObject(name);
            Undo.RegisterCreatedObjectUndo(go, "Create world root");
            go.transform.SetParent(parent, false);
            return go.transform;
        }

        private static Transform EnsurePoiRoot(WorldGeneratorConfig config)
        {
            if (config.locationKit.poiRoot != null)
            {
                return config.locationKit.poiRoot;
            }

            WorldGenerator generator = UnityEngine.Object.FindObjectOfType<WorldGenerator>();
            Transform parent = generator != null ? generator.transform : null;
            GameObject rootGo = new GameObject(string.IsNullOrEmpty(config.locationKit.locationName)
                ? "LocationPOIs"
                : $"LocationPOIs_{config.locationKit.locationName}");
            Undo.RegisterCreatedObjectUndo(rootGo, "Create POI root");
            if (parent != null)
            {
                rootGo.transform.SetParent(parent, false);
            }

            config.locationKit.poiRoot = rootGo.transform;
            EditorUtility.SetDirty(config);
            return rootGo.transform;
        }

        private static GameObject FindPoiRoot(WorldGeneratorConfig config)
        {
            return config?.locationKit?.poiRoot != null ? config.locationKit.poiRoot.gameObject : null;
        }

        private static void ClearPoiChildren(Transform root)
        {
            if (root == null)
            {
                return;
            }

            for (int i = root.childCount - 1; i >= 0; i--)
            {
                Undo.DestroyObjectImmediate(root.GetChild(i).gameObject);
            }
        }

        private static void CreatePoiMarker(Transform root, string name, Vector3 position, Color color)
        {
            GameObject marker = new GameObject(name);
            Undo.RegisterCreatedObjectUndo(marker, "Create POI marker");
            marker.transform.SetParent(root, false);
            marker.transform.position = position;

            GameObject icon = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            icon.name = "Gizmo";
            Undo.RegisterCreatedObjectUndo(icon, "Create POI gizmo");
            icon.transform.SetParent(marker.transform, false);
            icon.transform.localScale = new Vector3(6f, 0.4f, 6f);
            icon.transform.localPosition = new Vector3(0f, 0.4f, 0f);
            Renderer renderer = icon.GetComponent<Renderer>();
            if (renderer != null)
            {
                Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                mat.color = color;
                renderer.sharedMaterial = mat;
            }

            Collider col = icon.GetComponent<Collider>();
            if (col != null)
            {
                Undo.DestroyObjectImmediate(col);
            }
        }

        private static void SpawnRoadHints(Transform root, Vector3 from, Vector3 to, int steps)
        {
            GameObject roadRoot = new GameObject("RoadHints");
            Undo.RegisterCreatedObjectUndo(roadRoot, "Create road hints");
            roadRoot.transform.SetParent(root, false);

            int count = Mathf.Max(3, steps);
            for (int i = 0; i <= count; i++)
            {
                float t = i / (float)count;
                Vector3 pos = Vector3.Lerp(from, to, t);
                GameObject hint = new GameObject($"RoadHint_{i:00}");
                Undo.RegisterCreatedObjectUndo(hint, "Create road hint");
                hint.transform.SetParent(roadRoot.transform, false);
                hint.transform.position = pos;
            }
        }

        private static Vector3 ResolveSpawnPosition(
            WorldGenerationResult result,
            LocationKitSettings kit,
            float worldW,
            float worldL,
            WorldGeneratorConfig config)
        {
            if (result.playerSpawns != null && result.playerSpawns.Count > 0)
            {
                return result.playerSpawns[0].position;
            }

            if (result.cities != null && result.cities.Count > 0)
            {
                return result.cities[0].center;
            }

            return NormalizedToWorld(kit.spawnHub01, worldW, worldL, config);
        }

        private static Vector3 ResolveRuinsPosition(
            WorldGenerationResult result,
            LocationKitSettings kit,
            float worldW,
            float worldL,
            WorldGeneratorConfig config)
        {
            CavePlacement best = null;
            float bestScore = float.MinValue;
            if (result.caves != null)
            {
                for (int i = 0; i < result.caves.Count; i++)
                {
                    CavePlacement cave = result.caves[i];
                    float score = 0f;
                    if (cave.biomeId == "volcanic" || cave.biomeId == "alpine")
                    {
                        score += 2f;
                    }

                    float centerDist = Vector2.Distance(
                        new Vector2(cave.entrance.x / worldW, cave.entrance.z / worldL),
                        new Vector2(0.5f, 0.5f));
                    score += 1f - centerDist;
                    if (score > bestScore)
                    {
                        bestScore = score;
                        best = cave;
                    }
                }
            }

            if (best != null)
            {
                return best.entrance;
            }

            return NormalizedToWorld(kit.ruins01, worldW, worldL, config);
        }

        private static Vector3 ResolveBossPosition(
            WorldGenerationResult result,
            Vector3 spawn,
            LocationKitSettings kit,
            float worldW,
            float worldL,
            WorldGeneratorConfig config)
        {
            Vector3 configured = NormalizedToWorld(kit.bossArena01, worldW, worldL, config);
            float configuredDist = Vector3.Distance(spawn, configured);

            Vector3 farCorner = new Vector3(worldW * 0.88f, 0f, worldL * 0.86f);
            float cornerDist = Vector3.Distance(spawn, farCorner);
            return cornerDist > configuredDist ? farCorner : configured;
        }

        private static Vector3 NormalizedToWorld(Vector2 norm, float worldW, float worldL, WorldGeneratorConfig config)
        {
            float x = Mathf.Clamp01(norm.x) * worldW;
            float z = Mathf.Clamp01(norm.y) * worldL;
            float y = SampleTerrainHeight(config, x, z);
            return new Vector3(x, y, z);
        }

        private static Vector2 WorldToNormalized(Vector3 world, float worldW, float worldL)
        {
            return new Vector2(
                worldW > 0f ? world.x / worldW : 0f,
                worldL > 0f ? world.z / worldL : 0f);
        }

        private static float SampleTerrainHeight(WorldGeneratorConfig config, float x, float z)
        {
            if (config == null)
            {
                return 0f;
            }

            Func<float, float, float> sampler = HeightSampler.BuildHeight01Sampler(config);
            float h01 = sampler(x, z);
            return h01 * config.maxHeightMeters + 1.5f;
        }
    }
}
#endif
