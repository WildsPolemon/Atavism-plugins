#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    /// <summary>
    /// Fast 2D height preview for editor — no full terrain bake required.
    /// </summary>
    internal static class WorldGenTerrainPreview
    {
        private static Texture2D cachedTexture;
        private static int cachedSeed;
        private static int cachedHash;

        internal static void DrawPreview(WorldGeneratorConfig config, int previewSize = 280)
        {
            if (config == null)
            {
                EditorGUILayout.HelpBox("Assign a config to preview terrain.", MessageType.Info);
                return;
            }

            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Refresh Preview", GUILayout.Height(26f)))
            {
                Invalidate();
            }

            if (GUILayout.Button("Generate Terrain Only", GUILayout.Height(26f)))
            {
                TryGenerateTerrainOnly(config);
            }
            EditorGUILayout.EndHorizontal();

            Texture2D tex = GetOrBuild(config, previewSize);
            Rect rect = GUILayoutUtility.GetRect(previewSize, previewSize, GUILayout.ExpandWidth(false));
            EditorGUI.DrawRect(rect, WorldGenEditorUi.BgCard);
            GUI.DrawTexture(new Rect(rect.x + 2f, rect.y + 2f, rect.width - 4f, rect.height - 4f), tex, ScaleMode.StretchToFill);

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

        private static Texture2D GetOrBuild(WorldGeneratorConfig config, int size)
        {
            int hash = ComputeConfigHash(config);
            if (cachedTexture != null && cachedHash == hash && cachedTexture.width == size)
            {
                return cachedTexture;
            }

            Invalidate();
            cachedTexture = BuildTexture(config, size);
            cachedHash = hash;
            cachedSeed = config.worldSeed;
            return cachedTexture;
        }

        private static int ComputeConfigHash(WorldGeneratorConfig config)
        {
            unchecked
            {
                int h = 17;
                h = h * 31 + config.worldSeed;
                h = h * 31 + config.worldSizeInChunks;
                h = h * 31 + config.chunkSizeMeters.GetHashCode();
                h = h * 31 + config.maxHeightMeters.GetHashCode();
                h = h * 31 + config.seaLevel01.GetHashCode();
                h = h * 31 + (config.terrainShape?.enableAdvancedShaping == true ? 1 : 0);
                return h;
            }
        }

        private static Texture2D BuildTexture(WorldGeneratorConfig config, int size)
        {
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false)
            {
                filterMode = FilterMode.Bilinear,
                wrapMode = TextureWrapMode.Clamp
            };

            Func<float, float, float> sample = HeightSampler.BuildHeight01Sampler(config);
            float world = config.worldSizeInChunks * config.chunkSizeMeters;
            float sea = config.seaLevel01;
            Color[] pixels = new Color[size * size];

            for (int py = 0; py < size; py++)
            {
                float z = (py / (float)(size - 1)) * world;
                for (int px = 0; px < size; px++)
                {
                    float x = (px / (float)(size - 1)) * world;
                    float h = sample(x, z);
                    pixels[py * size + px] = HeightToColor(h, sea);
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            return tex;
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
            WorldGenEditorUi.DrawStatusChip("Water", new Color(0.12f, 0.28f, 0.52f));
            WorldGenEditorUi.DrawStatusChip("Lowlands", new Color(0.22f, 0.48f, 0.28f));
            WorldGenEditorUi.DrawStatusChip("Hills", new Color(0.42f, 0.44f, 0.30f));
            WorldGenEditorUi.DrawStatusChip("Peaks", new Color(0.92f, 0.92f, 0.95f));
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
