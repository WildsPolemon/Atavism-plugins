#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    /// <summary>
    /// Map-size and heightmap style presets for WorldGen Studio.
    /// </summary>
    internal static class WorldGenStudioPresets
    {
        internal enum MapSizeId
        {
            Prototype,
            Arena,
            Zone,
            Region,
            Continent,
            MegaWorld
        }

        internal enum HeightmapProfileId
        {
            SmoothHills,
            RollingMmo,
            AlpinePeaks,
            IslandCoast,
            Canyonlands,
            FlatQuestHubs,
            HeroicWow
        }

        internal static readonly string[] MapSizeNames =
        {
            "Prototype",
            "Arena",
            "Zone",
            "Region",
            "Continent",
            "Mega World"
        };

        internal static readonly string[] MapSizeHints =
        {
            "512m — instant iteration, 1–4 tiles",
            "1 km — combat test map, fast bake",
            "3 km — single dungeon zone",
            "6 km — open zone / chapter",
            "12 km — full MMO shard (balanced)",
            "16 km — epic continent scale"
        };

        internal static readonly string[] HeightmapNames =
        {
            "Smooth Hills",
            "Rolling MMO",
            "Alpine Peaks",
            "Island Coast",
            "Canyonlands",
            "Flat Quest Hubs",
            "Heroic WoW"
        };

        internal static readonly string[] HeightmapHints =
        {
            "Gentle slopes, soft lowlands, light erosion",
            "Balanced default — versatile production look",
            "Sharp ridges, tall peaks, dramatic silhouettes",
            "Continent mask + coastal shelves and beaches",
            "Deep valleys, mesas, carved badlands",
            "Wide flat plains for cities and quest hubs",
            "WoW-like shaping — adventure MMO classic"
        };

        internal static readonly Color[] HeightmapAccentColors =
        {
            new Color(0.45f, 0.78f, 0.52f),
            new Color(0.24f, 0.62f, 1.00f),
            new Color(0.72f, 0.82f, 0.95f),
            new Color(0.28f, 0.58f, 0.88f),
            new Color(0.86f, 0.58f, 0.32f),
            new Color(0.62f, 0.72f, 0.42f),
            new Color(0.78f, 0.52f, 0.92f)
        };

        internal static void ApplyMapSize(WorldGeneratorConfig config, MapSizeId size)
        {
            if (config == null)
            {
                return;
            }

            WorldGenPresetLibrary.EnsureConfigSections(config);

            switch (size)
            {
                case MapSizeId.Continent:
                    WorldGenPresetLibrary.Apply(config, WorldGenPresetLibrary.PresetId.BalancedMmo);
                    return;
                case MapSizeId.MegaWorld:
                    WorldGenPresetLibrary.Apply(config, WorldGenPresetLibrary.PresetId.MegaWorld);
                    return;
            }

            Undo.RecordObject(config, "Apply map size preset");

            switch (size)
            {
                case MapSizeId.Prototype:
                    config.worldSizeInChunks = 4;
                    config.chunkSizeMeters = 128;
                    config.maxHeightMeters = 180f;
                    config.citySettings.maxCities = 2;
                    config.caveSettings.maxCaves = 12;
                    config.spawnSettings.maxMobZones = 24;
                    config.resourceSettings.baseNodeSpacing = 48f;
                    config.terrainGeneration.terrainTileSizeMeters = 256f;
                    config.terrainGeneration.heightmapResolution = 129;
                    config.terrainGeneration.postProcessSmoothIterations = 1;
                    config.sectorSettings.sectorSizeMeters = 256f;
                    config.runtimeOptimization.streamingRadiusMeters = 420f;
                    config.runtimeOptimization.maxActiveObjects = 1200;
                    break;

                case MapSizeId.Arena:
                    config.worldSizeInChunks = 8;
                    config.chunkSizeMeters = 128;
                    config.maxHeightMeters = 220f;
                    config.citySettings.maxCities = 4;
                    config.caveSettings.maxCaves = 28;
                    config.spawnSettings.maxMobZones = 48;
                    config.resourceSettings.baseNodeSpacing = 40f;
                    config.terrainGeneration.terrainTileSizeMeters = 256f;
                    config.terrainGeneration.heightmapResolution = 129;
                    config.sectorSettings.sectorSizeMeters = 384f;
                    config.runtimeOptimization.streamingRadiusMeters = 650f;
                    config.runtimeOptimization.maxActiveObjects = 2200;
                    break;

                case MapSizeId.Zone:
                    config.worldSizeInChunks = 12;
                    config.chunkSizeMeters = 256;
                    config.maxHeightMeters = 260f;
                    config.citySettings.maxCities = 6;
                    config.caveSettings.maxCaves = 60;
                    config.spawnSettings.maxMobZones = 120;
                    config.resourceSettings.baseNodeSpacing = 36f;
                    config.terrainGeneration.terrainTileSizeMeters = 512f;
                    config.terrainGeneration.heightmapResolution = 257;
                    config.sectorSettings.sectorSizeMeters = 512f;
                    config.runtimeOptimization.streamingRadiusMeters = 950f;
                    config.runtimeOptimization.maxActiveObjects = 3800;
                    break;

                case MapSizeId.Region:
                    config.worldSizeInChunks = 24;
                    config.chunkSizeMeters = 256;
                    config.maxHeightMeters = 280f;
                    config.citySettings.maxCities = 10;
                    config.caveSettings.maxCaves = 120;
                    config.spawnSettings.maxMobZones = 220;
                    config.resourceSettings.baseNodeSpacing = 34f;
                    config.terrainGeneration.terrainTileSizeMeters = 512f;
                    config.terrainGeneration.heightmapResolution = 257;
                    config.sectorSettings.sectorSizeMeters = 640f;
                    config.runtimeOptimization.streamingRadiusMeters = 1200f;
                    config.runtimeOptimization.maxActiveObjects = 5200;
                    break;
            }

            EditorUtility.SetDirty(config);
        }

        internal static void ApplyHeightmapProfile(WorldGeneratorConfig config, HeightmapProfileId profile)
        {
            if (config == null)
            {
                return;
            }

            WorldGenPresetLibrary.EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply heightmap profile");

            switch (profile)
            {
                case HeightmapProfileId.SmoothHills:
                    ApplySmoothHills(config);
                    break;
                case HeightmapProfileId.RollingMmo:
                    ApplyRollingMmo(config);
                    break;
                case HeightmapProfileId.AlpinePeaks:
                    ApplyAlpinePeaks(config);
                    break;
                case HeightmapProfileId.IslandCoast:
                    ApplyIslandCoast(config);
                    break;
                case HeightmapProfileId.Canyonlands:
                    ApplyCanyonlands(config);
                    break;
                case HeightmapProfileId.FlatQuestHubs:
                    ApplyFlatQuestHubs(config);
                    break;
                case HeightmapProfileId.HeroicWow:
                    ApplyHeroicWowTerrain(config);
                    break;
            }

            EditorUtility.SetDirty(config);
        }

        internal static void ApplyHeightmapResolution(WorldGeneratorConfig config, int resolution)
        {
            if (config == null)
            {
                return;
            }

            WorldGenPresetLibrary.EnsureConfigSections(config);
            Undo.RecordObject(config, "Apply heightmap resolution");
            config.terrainGeneration.heightmapResolution = resolution;
            EditorUtility.SetDirty(config);
        }

        internal static string GetBakeTimeHint(WorldGeneratorConfig config)
        {
            int tiles = TerrainGenerator.EstimateTileCount(config);
            if (tiles <= 4) return "~30 sec";
            if (tiles <= 16) return "~1–2 min";
            if (tiles <= 64) return "~3–8 min";
            if (tiles <= 144) return "~8–20 min";
            return "~20+ min";
        }

        internal static string GetMapSizeLabel(WorldGeneratorConfig config)
        {
            float worldMeters = config.worldSizeInChunks * config.chunkSizeMeters;
            float areaKm2 = (worldMeters * worldMeters) / 1_000_000f;
            return $"{worldMeters:0}m ({areaKm2:0.0} km²)";
        }

        private static void ApplySmoothHills(WorldGeneratorConfig config)
        {
            config.seaLevel01 = 0.30f;
            config.maxHeightMeters = Mathf.Min(config.maxHeightMeters, 220f);
            config.heightNoise.frequency = 0.00058f;
            config.heightNoise.octaves = 4;
            config.heightNoise.lacunarity = 1.95f;
            config.heightNoise.persistence = 0.44f;
            config.terrainShape.enableAdvancedShaping = true;
            config.terrainShape.continentInfluence = 0.16f;
            config.terrainShape.ridgeStrength = 0.07f;
            config.terrainShape.valleyCarveStrength = 0.06f;
            config.terrainShape.detailStrength = 0.03f;
            config.terrainShape.lowlandFlattenStrength = 0.58f;
            config.terrainShape.lowlandThreshold01 = 0.48f;
            config.terrainShape.mountainBoostStart01 = 0.80f;
            config.terrainShape.mountainBoostStrength = 0.14f;
            config.terrainShape.mountainPeakPower = 1.22f;
            config.terrainShape.coastalFalloffStrength = 0.28f;
            config.terrainGeneration.applyHeightmapSmoothing = true;
            config.terrainGeneration.postProcessSmoothIterations = 2;
            config.terrainGeneration.erosionStrength = 0.08f;
        }

        private static void ApplyRollingMmo(WorldGeneratorConfig config)
        {
            config.seaLevel01 = 0.32f;
            config.heightNoise.frequency = 0.0012f;
            config.heightNoise.octaves = 5;
            config.heightNoise.lacunarity = 2f;
            config.heightNoise.persistence = 0.5f;
            config.terrainShape.enableAdvancedShaping = true;
            config.terrainShape.continentInfluence = 0.22f;
            config.terrainShape.ridgeStrength = 0.19f;
            config.terrainShape.valleyCarveStrength = 0.12f;
            config.terrainShape.detailStrength = 0.045f;
            config.terrainShape.lowlandFlattenStrength = 0.35f;
            config.terrainShape.lowlandThreshold01 = 0.38f;
            config.terrainShape.mountainBoostStart01 = 0.62f;
            config.terrainShape.mountainBoostStrength = 0.24f;
            config.terrainShape.mountainPeakPower = 1.35f;
            config.terrainShape.coastalFalloffStrength = 0.35f;
            config.terrainGeneration.applyHeightmapSmoothing = true;
            config.terrainGeneration.postProcessSmoothIterations = 1;
            config.terrainGeneration.erosionStrength = 0.14f;
        }

        private static void ApplyAlpinePeaks(WorldGeneratorConfig config)
        {
            config.seaLevel01 = 0.28f;
            config.maxHeightMeters = Mathf.Max(config.maxHeightMeters, 320f);
            config.heightNoise.frequency = 0.00135f;
            config.heightNoise.octaves = 6;
            config.heightNoise.lacunarity = 2.08f;
            config.heightNoise.persistence = 0.54f;
            config.terrainShape.continentInfluence = 0.18f;
            config.terrainShape.ridgeStrength = 0.34f;
            config.terrainShape.ridgeNoise.frequency = 0.00118f;
            config.terrainShape.ridgeNoise.octaves = 5;
            config.terrainShape.valleyCarveStrength = 0.10f;
            config.terrainShape.detailStrength = 0.06f;
            config.terrainShape.lowlandFlattenStrength = 0.18f;
            config.terrainShape.lowlandThreshold01 = 0.34f;
            config.terrainShape.mountainBoostStart01 = 0.58f;
            config.terrainShape.mountainBoostStrength = 0.42f;
            config.terrainShape.mountainPeakPower = 1.58f;
            config.terrainGeneration.postProcessSmoothIterations = 1;
            config.terrainGeneration.erosionStrength = 0.22f;
        }

        private static void ApplyIslandCoast(WorldGeneratorConfig config)
        {
            config.seaLevel01 = 0.36f;
            config.heightNoise.frequency = 0.00088f;
            config.heightNoise.octaves = 5;
            config.terrainShape.continentInfluence = 0.44f;
            config.terrainShape.continentNoise.frequency = 0.00018f;
            config.terrainShape.ridgeStrength = 0.12f;
            config.terrainShape.valleyCarveStrength = 0.08f;
            config.terrainShape.lowlandFlattenStrength = 0.40f;
            config.terrainShape.coastalFalloffStrength = 0.58f;
            config.terrainShape.coastalFalloffWidth01 = 0.24f;
            config.biomeClimate.coastalMoistureBoost = 0.26f;
            config.terrainGeneration.postProcessSmoothIterations = 2;
            config.terrainGeneration.erosionStrength = 0.12f;
        }

        private static void ApplyCanyonlands(WorldGeneratorConfig config)
        {
            config.seaLevel01 = 0.26f;
            config.maxHeightMeters = Mathf.Max(config.maxHeightMeters, 300f);
            config.heightNoise.frequency = 0.00105f;
            config.heightNoise.octaves = 5;
            config.terrainShape.ridgeStrength = 0.30f;
            config.terrainShape.ridgeNoise.frequency = 0.00125f;
            config.terrainShape.valleyCarveStrength = 0.30f;
            config.terrainShape.valleyNoise.frequency = 0.0024f;
            config.terrainShape.lowlandFlattenStrength = 0.12f;
            config.terrainShape.mountainBoostStart01 = 0.66f;
            config.terrainShape.mountainBoostStrength = 0.26f;
            config.terrainShape.detailStrength = 0.07f;
            config.terrainGeneration.postProcessSmoothIterations = 1;
            config.terrainGeneration.erosionStrength = 0.20f;
        }

        private static void ApplyFlatQuestHubs(WorldGeneratorConfig config)
        {
            config.seaLevel01 = 0.30f;
            config.maxHeightMeters = Mathf.Min(config.maxHeightMeters, 200f);
            config.heightNoise.frequency = 0.00072f;
            config.heightNoise.octaves = 4;
            config.heightNoise.persistence = 0.42f;
            config.terrainShape.continentInfluence = 0.20f;
            config.terrainShape.ridgeStrength = 0.05f;
            config.terrainShape.valleyCarveStrength = 0.04f;
            config.terrainShape.detailStrength = 0.02f;
            config.terrainShape.lowlandFlattenStrength = 0.72f;
            config.terrainShape.lowlandThreshold01 = 0.50f;
            config.terrainShape.mountainBoostStart01 = 0.82f;
            config.terrainShape.mountainBoostStrength = 0.10f;
            config.terrainShape.mountainPeakPower = 1.18f;
            config.citySettings.minDistanceBetweenCities = Mathf.Min(config.citySettings.minDistanceBetweenCities, 700f);
            config.terrainGeneration.postProcessSmoothIterations = 2;
            config.terrainGeneration.erosionStrength = 0.06f;
        }

        private static void ApplyHeroicWowTerrain(WorldGeneratorConfig config)
        {
            config.maxHeightMeters = 340f;
            config.seaLevel01 = 0.28f;
            config.heightNoise.frequency = 0.00095f;
            config.heightNoise.octaves = 6;
            config.heightNoise.lacunarity = 2.05f;
            config.heightNoise.persistence = 0.53f;
            config.terrainShape.enableAdvancedShaping = true;
            config.terrainShape.continentInfluence = 0.28f;
            config.terrainShape.continentNoise.frequency = 0.00020f;
            config.terrainShape.ridgeStrength = 0.24f;
            config.terrainShape.ridgeNoise.frequency = 0.00105f;
            config.terrainShape.ridgeNoise.octaves = 4;
            config.terrainShape.lowlandFlattenStrength = 0.42f;
            config.terrainShape.lowlandThreshold01 = 0.53f;
            config.terrainShape.mountainBoostStart01 = 0.72f;
            config.terrainShape.mountainBoostStrength = 0.29f;
            config.terrainShape.mountainPeakPower = 1.42f;
            config.terrainShape.valleyCarveStrength = 0.14f;
            config.terrainShape.detailStrength = 0.05f;
            config.terrainShape.coastalFalloffStrength = 0.32f;
            config.terrainGeneration.applyHeightmapSmoothing = true;
            config.terrainGeneration.postProcessSmoothIterations = 1;
            config.terrainGeneration.erosionStrength = 0.16f;
            if (config.biomes == null || config.biomes.Count == 0)
            {
                config.biomes = new List<BiomeDefinition>
                {
                    new BiomeDefinition { biomeId = "forest", minHeight01 = 0.05f, maxHeight01 = 0.66f, idealMoisture01 = 0.66f, idealTemperature01 = 0.57f, blendWeight = 1.35f },
                    new BiomeDefinition { biomeId = "desert", minHeight01 = 0.06f, maxHeight01 = 0.60f, idealMoisture01 = 0.26f, idealTemperature01 = 0.86f, blendWeight = 0.85f },
                    new BiomeDefinition { biomeId = "tundra", minHeight01 = 0.34f, maxHeight01 = 1.00f, idealMoisture01 = 0.42f, idealTemperature01 = 0.20f, blendWeight = 1.20f },
                    new BiomeDefinition { biomeId = "swamp", minHeight01 = 0.00f, maxHeight01 = 0.32f, idealMoisture01 = 0.90f, idealTemperature01 = 0.64f, blendWeight = 0.95f },
                };
            }
        }
    }
}
#endif
