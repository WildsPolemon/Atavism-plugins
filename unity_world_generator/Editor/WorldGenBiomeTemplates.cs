#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    internal static class WorldGenBiomeTemplates
    {
        internal static void ApplyRichWorldTemplate(WorldGeneratorConfig config)
        {
            if (config == null)
            {
                return;
            }

            WorldGenPresetLibrary.EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply 10-biome template");

            config.biomes = BuildTenBiomes();
            config.resourceSettings.biomeRules = BuildResourceRules();
            config.caveSettings.stampPresets = BuildCaveStamps();
            config.biomeClimate.variationStrength = 0.11f;

            EditorUtility.SetDirty(config);
            WorldGenLivePreview.NotifyConfigChanged(config);
        }

        internal static void AssignPrefabFolder(WorldGeneratorConfig config, DefaultAsset folder, string biomeIdFilter = null)
        {
            if (config == null || folder == null)
            {
                return;
            }

            string path = AssetDatabase.GetAssetPath(folder);
            if (string.IsNullOrEmpty(path))
            {
                return;
            }

            string[] guids = AssetDatabase.FindAssets("t:Prefab", new[] { path });
            List<GameObject> prefabs = new List<GameObject>();
            for (int i = 0; i < guids.Length; i++)
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(guids[i]);
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
                if (prefab != null)
                {
                    prefabs.Add(prefab);
                }
            }

            if (prefabs.Count == 0)
            {
                EditorUtility.DisplayDialog("Biome Prefabs", "No prefabs found in selected folder.", "OK");
                return;
            }

            Undo.RecordObject(config, "Assign biome prefabs");
            for (int i = 0; i < config.biomes.Count; i++)
            {
                BiomeDefinition biome = config.biomes[i];
                if (!string.IsNullOrEmpty(biomeIdFilter) &&
                    !biome.biomeId.Equals(biomeIdFilter, System.StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                biome.resourcePrefabs = prefabs.ToArray();
            }

            EditorUtility.SetDirty(config);
            WorldGenLivePreview.NotifyConfigChanged(config);
        }

        internal static void AssignTerrainTextureToAllBiomes(WorldGeneratorConfig config, Texture2D diffuse, Texture2D normal = null)
        {
            if (config == null || diffuse == null)
            {
                return;
            }

            Undo.RecordObject(config, "Assign biome terrain textures");
            for (int i = 0; i < config.biomes.Count; i++)
            {
                config.biomes[i].terrainDiffuse = diffuse;
                config.biomes[i].terrainNormal = normal;
            }

            config.terrainGeneration.defaultTerrainDiffuse = diffuse;
            config.terrainGeneration.defaultTerrainNormal = normal;
            EditorUtility.SetDirty(config);
            WorldGenLivePreview.NotifyConfigChanged(config);
        }

        private static List<BiomeDefinition> BuildTenBiomes()
        {
            return new List<BiomeDefinition>
            {
                Biome("meadow", 0.04f, 0.48f, 0.55f, 0.58f, 0.62f, 1.0f),
                Biome("forest", 0.08f, 0.68f, 0.72f, 0.54f, 0.58f, 1.25f),
                Biome("jungle", 0.02f, 0.52f, 0.92f, 0.78f, 0.70f, 1.15f),
                Biome("swamp", 0.00f, 0.34f, 0.90f, 0.62f, 0.58f, 1.2f),
                Biome("desert", 0.06f, 0.58f, 0.12f, 0.90f, 0.86f, 0.9f),
                Biome("savanna", 0.05f, 0.55f, 0.35f, 0.82f, 0.74f, 1.0f),
                Biome("tundra", 0.22f, 0.95f, 0.38f, 0.22f, 0.16f, 1.15f),
                Biome("volcanic", 0.30f, 0.88f, 0.18f, 0.55f, 0.72f, 0.85f),
                Biome("coastal", 0.00f, 0.38f, 0.78f, 0.66f, 0.60f, 1.1f),
                Biome("alpine", 0.58f, 1.00f, 0.42f, 0.35f, 0.12f, 1.3f),
            };
        }

        private static BiomeDefinition Biome(
            string id,
            float minH,
            float maxH,
            float moisture,
            float temp,
            float idealTemp,
            float weight)
        {
            return new BiomeDefinition
            {
                biomeId = id,
                minHeight01 = minH,
                maxHeight01 = maxH,
                idealMoisture01 = moisture,
                idealTemperature01 = idealTemp,
                blendWeight = weight,
                previewColor = BiomePalette.GetPreviewColor(id),
                terrainTileSize = id == "desert" || id == "savanna" ? 20f : 15f
            };
        }

        private static List<BiomeResourceRule> BuildResourceRules()
        {
            return new List<BiomeResourceRule>
            {
                Rule("meadow", 520, Entry("herb_t1", 0.35f), Entry("flower_t1", 0.25f), Entry("wood_t1", 0.25f), Entry("fiber_t1", 0.15f)),
                Rule("forest", 680, Entry("wood_t1", 0.40f), Entry("wood_t2", 0.20f), Entry("mushroom_t1", 0.15f), Entry("fiber_t1", 0.25f)),
                Rule("jungle", 720, Entry("wood_t2", 0.30f), Entry("vine_t1", 0.25f), Entry("herb_t2", 0.20f), Entry("fiber_t2", 0.25f)),
                Rule("swamp", 560, Entry("fiber_t1", 0.35f), Entry("reed_t1", 0.30f), Entry("mushroom_t1", 0.20f), Entry("wood_t1", 0.15f)),
                Rule("desert", 460, Entry("ore_t1", 0.30f), Entry("crystal_t1", 0.20f), Entry("stone_t1", 0.30f), Entry("cactus_t1", 0.20f)),
                Rule("savanna", 500, Entry("wood_t1", 0.25f), Entry("herb_t1", 0.25f), Entry("ore_t1", 0.25f), Entry("stone_t1", 0.25f)),
                Rule("tundra", 380, Entry("ore_t2", 0.35f), Entry("crystal_t1", 0.20f), Entry("wood_t1", 0.20f), Entry("ice_shard_t1", 0.25f)),
                Rule("volcanic", 420, Entry("ore_t2", 0.40f), Entry("sulfur_t1", 0.25f), Entry("stone_t2", 0.20f), Entry("crystal_t1", 0.15f)),
                Rule("coastal", 540, Entry("shell_t1", 0.25f), Entry("kelp_t1", 0.25f), Entry("stone_t1", 0.25f), Entry("wood_t1", 0.25f)),
                Rule("alpine", 360, Entry("ore_t1", 0.30f), Entry("stone_t2", 0.35f), Entry("crystal_t1", 0.15f), Entry("ice_shard_t1", 0.20f)),
            };
        }

        private static List<CaveStampPreset> BuildCaveStamps()
        {
            return new List<CaveStampPreset>
            {
                new CaveStampPreset { stampId = "cave_tight_a", weight = 1.1f, corridorSegments = 3, segmentLength = 20f, maxYawChange = 38f },
                new CaveStampPreset { stampId = "cave_small_a", weight = 1.2f, corridorSegments = 4, segmentLength = 24f, maxYawChange = 34f },
                new CaveStampPreset { stampId = "cave_medium_b", weight = 0.9f, corridorSegments = 7, segmentLength = 27f, maxYawChange = 28f },
                new CaveStampPreset { stampId = "cave_wet_swamp", weight = 0.7f, corridorSegments = 5, segmentLength = 22f, maxYawChange = 32f },
                new CaveStampPreset { stampId = "cave_large_c", weight = 0.45f, corridorSegments = 10, segmentLength = 30f, maxYawChange = 22f },
                new CaveStampPreset { stampId = "cave_volcanic", weight = 0.35f, corridorSegments = 8, segmentLength = 26f, maxYawChange = 24f },
            };
        }

        private static BiomeResourceRule Rule(string biomeId, int perKm, params ResourceEntry[] entries)
        {
            return new BiomeResourceRule
            {
                biomeId = biomeId,
                nodesPerSquareKm = perKm,
                entries = entries
            };
        }

        private static ResourceEntry Entry(string id, float weight)
        {
            return new ResourceEntry { resourceId = id, weight = weight };
        }
    }
}
#endif
