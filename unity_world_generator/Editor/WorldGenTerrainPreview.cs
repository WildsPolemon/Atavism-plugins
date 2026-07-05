#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    /// <summary>
    /// Fast 2D biome/height preview for editor — live refresh on config changes.
    /// </summary>
    internal static class WorldGenTerrainPreview
    {
        private static Texture2D cachedTexture;
        private static int cachedHash;
        private static int cachedSize;
        private static WorldGenLivePreview.PreviewMode cachedMode;

        internal static void DrawPreview(WorldGeneratorConfig config, int previewSize = 320)
        {
            if (config == null)
            {
                EditorGUILayout.HelpBox("Assign a config to preview terrain.", MessageType.Info);
                return;
            }

            EditorGUILayout.BeginHorizontal();
            WorldGenLivePreview.LiveEnabled = EditorGUILayout.ToggleLeft("Live", WorldGenLivePreview.LiveEnabled, GUILayout.Width(52f));
            WorldGenLivePreview.Mode = (WorldGenLivePreview.PreviewMode)EditorGUILayout.EnumPopup(WorldGenLivePreview.Mode, GUILayout.Width(100f));
            WorldGenLivePreview.PreviewResolution = EditorGUILayout.IntPopup(
                WorldGenLivePreview.PreviewResolution,
                new[] { "192", "256", "320", "384" },
                new[] { 192, 256, 320, 384 },
                GUILayout.Width(64f));

            if (GUILayout.Button("Refresh", GUILayout.Height(22f), GUILayout.Width(64f)))
            {
                Invalidate();
            }

            if (GUILayout.Button("Terrain Only", GUILayout.Height(22f), GUILayout.Width(88f)))
            {
                TryGenerateTerrainOnly(config);
            }
            EditorGUILayout.EndHorizontal();

            int size = WorldGenLivePreview.PreviewResolution;
            Texture2D tex = GetOrBuild(config, size, WorldGenLivePreview.Mode);
            Rect rect = GUILayoutUtility.GetRect(size, size, GUILayout.ExpandWidth(false));
            EditorGUI.DrawRect(rect, WorldGenEditorUi.BgCard);
            GUI.DrawTexture(new Rect(rect.x + 2f, rect.y + 2f, rect.width - 4f, rect.height - 4f), tex, ScaleMode.StretchToFill);

            if (WorldGenLivePreview.LiveEnabled)
            {
                WorldGenEditorUi.DrawStatusChip("LIVE", WorldGenEditorUi.Success);
            }

            DrawLegend(config);
        }

        internal static void Invalidate()
        {
            if (cachedTexture != null)
            {
                UnityEngine.Object.DestroyImmediate(cachedTexture);
                cachedTexture = null;
            }

            cachedHash = 0;
        }

        private static Texture2D GetOrBuild(WorldGeneratorConfig config, int size, WorldGenLivePreview.PreviewMode mode)
        {
            int hash = ComputeConfigHash(config);
            if (cachedTexture != null && cachedHash == hash && cachedSize == size && cachedMode == mode)
            {
                return cachedTexture;
            }

            Invalidate();
            cachedTexture = BuildTexture(config, size, mode);
            cachedHash = hash;
            cachedSize = size;
            cachedMode = mode;
            return cachedTexture;
        }

        private static int ComputeConfigHash(WorldGeneratorConfig config)
        {
            unchecked
            {
                int h = 17;
                h = h * 31 + config.worldSeed;
                h = h * 31 + config.worldSizeInChunks;
                h = h * 31 + config.chunkSizeMeters;
                h = h * 31 + config.maxHeightMeters.GetHashCode();
                h = h * 31 + config.seaLevel01.GetHashCode();
                h = h * 31 + (config.terrainShape?.enableAdvancedShaping == true ? 1 : 0);
                h = h * 31 + (int)WorldGenLivePreview.Mode;
                h = h * 31 + (config.biomes?.Count ?? 0);
                if (config.heightNoise != null)
                {
                    h = h * 31 + config.heightNoise.frequency.GetHashCode();
                    h = h * 31 + config.heightNoise.octaves;
                }

                if (config.terrainShape != null)
                {
                    TerrainShapeSettings s = config.terrainShape;
                    h = h * 31 + s.mountainBoostStrength.GetHashCode();
                    h = h * 31 + s.mountainBoostStart01.GetHashCode();
                    h = h * 31 + s.mountainPeakPower.GetHashCode();
                    h = h * 31 + s.ridgeStrength.GetHashCode();
                    h = h * 31 + s.lowlandFlattenStrength.GetHashCode();
                    h = h * 31 + s.lowlandThreshold01.GetHashCode();
                    h = h * 31 + s.valleyCarveStrength.GetHashCode();
                    h = h * 31 + s.coastalFalloffStrength.GetHashCode();
                    h = h * 31 + s.continentInfluence.GetHashCode();
                    h = h * 31 + s.detailStrength.GetHashCode();
                }

                if (config.biomes != null)
                {
                    for (int i = 0; i < config.biomes.Count; i++)
                    {
                        BiomeDefinition b = config.biomes[i];
                        if (b == null) continue;
                        h = h * 31 + (b.biomeId?.GetHashCode() ?? 0);
                        h = h * 31 + b.previewColor.GetHashCode();
                    }
                }

                return h;
            }
        }

        private static Texture2D BuildTexture(WorldGeneratorConfig config, int size, WorldGenLivePreview.PreviewMode mode)
        {
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false)
            {
                filterMode = FilterMode.Bilinear,
                wrapMode = TextureWrapMode.Clamp
            };

            Func<float, float, float> sampleHeight = HeightSampler.BuildHeight01Sampler(config);
            Func<float, float, BiomeDefinition> sampleBiome = BiomeClimateSampler.BuildSampler(config);
            float world = config.worldSizeInChunks * config.chunkSizeMeters;
            float sea = config.seaLevel01;
            Color[] pixels = new Color[size * size];

            for (int py = 0; py < size; py++)
            {
                float z = (py / (float)(size - 1)) * world;
                for (int px = 0; px < size; px++)
                {
                    float x = (px / (float)(size - 1)) * world;
                    float h = sampleHeight(x, z);
                    BiomeDefinition biome = sampleBiome(x, z);
                    pixels[py * size + px] = mode switch
                    {
                        WorldGenLivePreview.PreviewMode.Height => HeightToColor(h, sea),
                        WorldGenLivePreview.PreviewMode.Biomes => BiomeToColor(biome, h, sea),
                        _ => Color.Lerp(BiomeToColor(biome, h, sea), HeightToColor(h, sea), 0.35f)
                    };
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            return tex;
        }

        private static Color BiomeToColor(BiomeDefinition biome, float h, float sea)
        {
            if (h < sea - 0.02f)
            {
                return new Color(0.10f, 0.24f, 0.48f);
            }

            Color biomeColor = BiomePalette.ResolvePreviewColor(biome);
            if (h > 0.72f)
            {
                return Color.Lerp(biomeColor, new Color(0.88f, 0.90f, 0.94f), (h - 0.72f) / 0.28f);
            }

            return biomeColor;
        }

        private static Color HeightToColor(float h, float sea)
        {
            if (h < sea - 0.02f)
            {
                return new Color(0.12f, 0.28f, 0.52f);
            }

            if (h < sea + 0.04f)
            {
                return Color.Lerp(new Color(0.18f, 0.42f, 0.62f), new Color(0.22f, 0.48f, 0.28f), (h - (sea - 0.02f)) / 0.06f);
            }

            if (h < 0.55f)
            {
                return Color.Lerp(new Color(0.20f, 0.50f, 0.24f), new Color(0.36f, 0.52f, 0.22f), (h - sea) / 0.35f);
            }

            if (h < 0.72f)
            {
                return Color.Lerp(new Color(0.42f, 0.44f, 0.30f), new Color(0.52f, 0.46f, 0.34f), (h - 0.55f) / 0.17f);
            }

            return Color.Lerp(new Color(0.58f, 0.54f, 0.48f), new Color(0.92f, 0.92f, 0.95f), (h - 0.72f) / 0.28f);
        }

        private static void DrawLegend(WorldGeneratorConfig config)
        {
            EditorGUILayout.BeginHorizontal();
            if (WorldGenLivePreview.Mode == WorldGenLivePreview.PreviewMode.Height)
            {
                WorldGenEditorUi.DrawStatusChip("Water", new Color(0.12f, 0.28f, 0.52f));
                WorldGenEditorUi.DrawStatusChip("Lowlands", new Color(0.22f, 0.48f, 0.28f));
                WorldGenEditorUi.DrawStatusChip("Hills", new Color(0.42f, 0.44f, 0.30f));
                WorldGenEditorUi.DrawStatusChip("Peaks", new Color(0.92f, 0.92f, 0.95f));
            }
            else if (config.biomes != null)
            {
                int shown = Mathf.Min(6, config.biomes.Count);
                for (int i = 0; i < shown; i++)
                {
                    BiomeDefinition biome = config.biomes[i];
                    WorldGenEditorUi.DrawStatusChip(biome.biomeId, BiomePalette.ResolvePreviewColor(biome));
                }
            }

            GUILayout.FlexibleSpace();
            EditorGUILayout.LabelField($"seed {config.worldSeed}", EditorStyles.miniLabel, GUILayout.Width(100f));
            EditorGUILayout.EndHorizontal();
        }

        private static void TryGenerateTerrainOnly(WorldGeneratorConfig config)
        {
            WorldGenerator generator = UnityEngine.Object.FindObjectOfType<WorldGenerator>();
            if (generator == null)
            {
                EditorUtility.DisplayDialog("Terrain Only", "Add a WorldGenerator to the scene first.", "OK");
                return;
            }

            try
            {
                Undo.RecordObject(generator, "Generate terrain");
                generator.Config = config;
                TerrainBakeEditorRunner.RunTerrainOnly(
                    generator,
                    () => EditorUtility.DisplayDialog("Terrain", "Terrain tiles baked into scene.", "OK"));
            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
                EditorUtility.DisplayDialog("Terrain", "Terrain generation failed. See console.", "OK");
            }
        }
    }
}
#endif
