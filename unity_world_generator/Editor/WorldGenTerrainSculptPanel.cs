#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    /// <summary>Pro terrain sculpt controls with grouped sliders for mountains, plains, coast, etc.</summary>
    internal static class WorldGenTerrainSculptPanel
    {
        private static bool showAdvancedNoise;
        private static bool showErosion;
        private static Vector2 sculptScroll;

        internal static void Draw(WorldGeneratorConfig config, Action onChanged)
        {
            if (config == null)
            {
                return;
            }

            WorldGenPresetLibrary.EnsureConfigSections(config);
            TerrainShapeSettings shape = config.terrainShape;
            TerrainGenerationSettings terrain = config.terrainGeneration;

            EditorGUI.BeginChangeCheck();

            sculptScroll = EditorGUILayout.BeginScrollView(sculptScroll);

            DrawQuickTweaks(config, tweak => ApplyQuickTweak(config, tweak, onChanged));
            WorldGenEditorUi.DrawSeparator();

            DrawGroupHeader("Mountains & Peaks");
            config.maxHeightMeters = EditorGUILayout.Slider(
                new GUIContent("Max Height (m)", "Real-world peak height cap."),
                config.maxHeightMeters, 80f, 520f);
            shape.mountainBoostStrength = EditorGUILayout.Slider(
                new GUIContent("Mountain Boost", "How aggressively highlands become peaks."),
                shape.mountainBoostStrength, 0f, 0.65f);
            shape.mountainBoostStart01 = EditorGUILayout.Slider(
                new GUIContent("Peak Start", "Height where mountains begin rising."),
                shape.mountainBoostStart01, 0.35f, 0.90f);
            shape.mountainPeakPower = EditorGUILayout.Slider(
                new GUIContent("Peak Sharpness", "Higher = sharper, more dramatic summits."),
                shape.mountainPeakPower, 1f, 2.2f);
            shape.ridgeStrength = EditorGUILayout.Slider(
                new GUIContent("Ridge Strength", "Mountain chains and rocky spines."),
                shape.ridgeStrength, 0f, 0.45f);

            WorldGenEditorUi.DrawSeparator();
            DrawGroupHeader("Plains & Lowlands");
            shape.lowlandFlattenStrength = EditorGUILayout.Slider(
                new GUIContent("Plain Flattening", "Wide flat zones for cities and quests."),
                shape.lowlandFlattenStrength, 0f, 0.85f);
            shape.lowlandThreshold01 = EditorGUILayout.Slider(
                new GUIContent("Lowland Ceiling", "Heights treated as plains."),
                shape.lowlandThreshold01, 0.15f, 0.65f);
            shape.valleyCarveStrength = EditorGUILayout.Slider(
                new GUIContent("Valley Depth", "Carved rivers, canyons, ravines."),
                shape.valleyCarveStrength, 0f, 0.40f);

            WorldGenEditorUi.DrawSeparator();
            DrawGroupHeader("Coast & Islands");
            config.seaLevel01 = EditorGUILayout.Slider(
                new GUIContent("Sea Level", "Water line on the heightmap."),
                config.seaLevel01, 0.10f, 0.50f);
            shape.coastalFalloffStrength = EditorGUILayout.Slider(
                new GUIContent("Coast Falloff", "Push world edges toward water — island effect."),
                shape.coastalFalloffStrength, 0f, 0.75f);
            shape.coastalFalloffWidth01 = EditorGUILayout.Slider(
                new GUIContent("Coast Width", "How far inland shores extend."),
                shape.coastalFalloffWidth01, 0.05f, 0.40f);
            shape.continentInfluence = EditorGUILayout.Slider(
                new GUIContent("Continent Mask", "Large landmass vs ocean patches."),
                shape.continentInfluence, 0f, 0.55f);

            DrawGroupHeader("World Seed");
            config.worldSeed = EditorGUILayout.IntField("Seed", config.worldSeed);

            WorldGenEditorUi.DrawSeparator();
            DrawGroupHeader("Surface Detail");
            shape.detailStrength = EditorGUILayout.Slider(
                new GUIContent("Micro Detail", "Small bumps on slopes."),
                shape.detailStrength, 0f, 0.12f);
            config.heightNoise.frequency = EditorGUILayout.Slider(
                new GUIContent("Base Scale", "Lower = broader hills. Higher = more bumps."),
                config.heightNoise.frequency, 0.00035f, 0.0025f);
            config.heightNoise.octaves = EditorGUILayout.IntSlider(
                new GUIContent("Noise Octaves", "Fractal detail layers."),
                config.heightNoise.octaves, 2, 8);
            config.heightNoise.persistence = EditorGUILayout.Slider(
                new GUIContent("Persistence", "How much each octave contributes."),
                config.heightNoise.persistence, 0.25f, 0.70f);

            WorldGenEditorUi.DrawSeparator();
            showErosion = EditorGUILayout.Foldout(showErosion, "Bake Polish (erosion & smooth)", true);
            if (showErosion)
            {
                terrain.applyHeightmapSmoothing = EditorGUILayout.Toggle("Smooth Heightmap", terrain.applyHeightmapSmoothing);
                terrain.postProcessSmoothIterations = EditorGUILayout.IntSlider("Smooth Passes", terrain.postProcessSmoothIterations, 0, 3);
                terrain.erosionStrength = EditorGUILayout.Slider("Erosion", terrain.erosionStrength, 0f, 0.35f);
            }

            showAdvancedNoise = EditorGUILayout.Foldout(showAdvancedNoise, "Advanced Noise Layers", true);
            if (showAdvancedNoise)
            {
                shape.enableAdvancedShaping = EditorGUILayout.Toggle("Advanced Shaping", shape.enableAdvancedShaping);
                shape.ridgeNoise.frequency = EditorGUILayout.Slider("Ridge Frequency", shape.ridgeNoise.frequency, 0.0003f, 0.003f);
                shape.valleyNoise.frequency = EditorGUILayout.Slider("Valley Frequency", shape.valleyNoise.frequency, 0.0005f, 0.004f);
                shape.continentNoise.frequency = EditorGUILayout.Slider("Continent Frequency", shape.continentNoise.frequency, 0.00008f, 0.0006f);
            }

            EditorGUILayout.EndScrollView();

            if (EditorGUI.EndChangeCheck())
            {
                Undo.RecordObject(config, "Sculpt terrain");
                onChanged?.Invoke();
            }
        }

        internal static void ApplyQuickTweak(WorldGeneratorConfig config, QuickTweak tweak, Action onChanged)
        {
            if (config == null)
            {
                return;
            }

            WorldGenPresetLibrary.EnsureConfigSections(config);
            TerrainShapeSettings shape = config.terrainShape;
            Undo.RecordObject(config, "Quick terrain tweak");

            switch (tweak)
            {
                case QuickTweak.TallerMountains:
                    shape.mountainBoostStrength = Mathf.Min(0.65f, shape.mountainBoostStrength + 0.08f);
                    shape.mountainPeakPower = Mathf.Min(2.2f, shape.mountainPeakPower + 0.08f);
                    config.maxHeightMeters = Mathf.Min(520f, config.maxHeightMeters + 40f);
                    break;
                case QuickTweak.WiderPlains:
                    shape.lowlandFlattenStrength = Mathf.Min(0.85f, shape.lowlandFlattenStrength + 0.10f);
                    shape.lowlandThreshold01 = Mathf.Min(0.65f, shape.lowlandThreshold01 + 0.05f);
                    break;
                case QuickTweak.DeeperValleys:
                    shape.valleyCarveStrength = Mathf.Min(0.40f, shape.valleyCarveStrength + 0.06f);
                    shape.ridgeStrength = Mathf.Min(0.45f, shape.ridgeStrength + 0.04f);
                    break;
                case QuickTweak.IslandShores:
                    shape.coastalFalloffStrength = Mathf.Min(0.75f, shape.coastalFalloffStrength + 0.10f);
                    shape.continentInfluence = Mathf.Min(0.55f, shape.continentInfluence + 0.08f);
                    config.seaLevel01 = Mathf.Clamp(config.seaLevel01 + 0.02f, 0.10f, 0.50f);
                    break;
                case QuickTweak.SofterHills:
                    shape.mountainBoostStrength = Mathf.Max(0f, shape.mountainBoostStrength - 0.08f);
                    shape.ridgeStrength = Mathf.Max(0f, shape.ridgeStrength - 0.05f);
                    config.heightNoise.frequency = Mathf.Max(0.00035f, config.heightNoise.frequency - 0.00015f);
                    break;
                case QuickTweak.ResetSculpt:
                    WorldGenStudioPresets.ApplyHeightmapProfile(config, WorldGenStudioPresets.HeightmapProfileId.RollingMmo);
                    break;
            }

            EditorUtility.SetDirty(config);
            onChanged?.Invoke();
        }

        internal enum QuickTweak
        {
            TallerMountains,
            WiderPlains,
            DeeperValleys,
            IslandShores,
            SofterHills,
            ResetSculpt
        }

        private static void DrawQuickTweaks(WorldGeneratorConfig config, Action<QuickTweak> onTweak)
        {
            EditorGUILayout.LabelField("Quick Tweaks", EditorStyles.boldLabel);
            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("+ Mountains", GUILayout.Height(24f))) { onTweak?.Invoke(QuickTweak.TallerMountains); }
            if (GUILayout.Button("+ Plains", GUILayout.Height(24f))) { onTweak?.Invoke(QuickTweak.WiderPlains); }
            if (GUILayout.Button("+ Valleys", GUILayout.Height(24f))) { onTweak?.Invoke(QuickTweak.DeeperValleys); }
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Island", GUILayout.Height(24f))) { onTweak?.Invoke(QuickTweak.IslandShores); }
            if (GUILayout.Button("Softer", GUILayout.Height(24f))) { onTweak?.Invoke(QuickTweak.SofterHills); }
            if (GUILayout.Button("Reset", GUILayout.Height(24f))) { onTweak?.Invoke(QuickTweak.ResetSculpt); }
            EditorGUILayout.EndHorizontal();
        }

        private static void DrawGroupHeader(string title)
        {
            EditorGUILayout.Space(4f);
            EditorGUILayout.LabelField(title, EditorStyles.boldLabel);
        }
    }
}
#endif
