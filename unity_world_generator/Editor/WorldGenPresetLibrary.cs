#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    internal static class WorldGenPresetLibrary
    {
        internal enum PresetId
        {
            BalancedMmo,
            Cinematic,
            Performance,
            MegaWorld,
            WowLike
        }

        internal static readonly string[] Names =
        {
            "Balanced MMO",
            "Cinematic World",
            "Performance First",
            "Mega World",
            "WoW-like Adventure"
        };

        internal static void Apply(WorldGeneratorConfig config, PresetId preset)
        {
            if (config == null)
            {
                return;
            }

            EnsureConfigSections(config);
            switch (preset)
            {
                case PresetId.BalancedMmo:
                    ApplyBalancedMmo(config);
                    break;
                case PresetId.Cinematic:
                    ApplyCinematic(config);
                    break;
                case PresetId.Performance:
                    ApplyPerformance(config);
                    break;
                case PresetId.MegaWorld:
                    ApplyMegaWorld(config);
                    break;
                case PresetId.WowLike:
                    ApplyWowLike(config);
                    break;
            }

            EditorUtility.SetDirty(config);
        }

        internal static void EnsureConfigSections(WorldGeneratorConfig target)
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
            if (target.terrainShape.valleyNoise == null) { target.terrainShape.valleyNoise = new NoiseLayerSettings(0.0018f, 3, 2.05f, 0.48f, 88f, -41f); }
            if (target.terrainShape.detailNoise == null) { target.terrainShape.detailNoise = new NoiseLayerSettings(0.0065f, 2, 2.2f, 0.42f, -33f, 67f); }
            if (target.terrainGeneration == null) { target.terrainGeneration = new TerrainGenerationSettings(); }
            if (target.biomeClimate == null) { target.biomeClimate = new BiomeClimateSettings(); }
            if (target.biomes == null) { target.biomes = new List<BiomeDefinition>(); }
        }

        private static void ApplyBalancedMmo(WorldGeneratorConfig config)
        {
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
            config.terrainGeneration.enableTerrainGeneration = true;
            config.terrainGeneration.terrainTileSizeMeters = 512f;
        }

        private static void ApplyCinematic(WorldGeneratorConfig config)
        {
            Undo.RecordObject(config, "Apply cinematic preset");
            config.citySettings.maxCities = 24;
            config.caveSettings.maxCaves = 300;
            config.resourceSettings.baseNodeSpacing = 24f;
            config.spawnSettings.maxMobZones = 460;
            config.runtimeOptimization.maxActiveObjects = 9000;
            config.runtimeOptimization.maxActiveResources = 4200;
            config.runtimeOptimization.streamingRadiusMeters = 1800f;
            config.biomeClimate.variationStrength = 0.11f;
            config.terrainGeneration.heightmapResolution = 513;
        }

        private static void ApplyPerformance(WorldGeneratorConfig config)
        {
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
            config.terrainGeneration.heightmapResolution = 129;
            config.terrainGeneration.terrainTileSizeMeters = 1024f;
        }

        private static void ApplyMegaWorld(WorldGeneratorConfig config)
        {
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
            config.terrainGeneration.terrainTileSizeMeters = 1024f;
        }

        private static void ApplyWowLike(WorldGeneratorConfig config)
        {
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
            config.terrainShape.mountainPeakPower = 1.42f;
            config.terrainShape.valleyCarveStrength = 0.14f;
            config.terrainShape.detailStrength = 0.05f;
            config.terrainShape.coastalFalloffStrength = 0.32f;
            config.terrainShape.coastalFalloffWidth01 = 0.16f;
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
            config.terrainGeneration.enableTerrainGeneration = true;
            config.terrainGeneration.terrainTileSizeMeters = 512f;
            config.terrainGeneration.heightmapResolution = 257;
            config.terrainGeneration.applyHeightmapSmoothing = true;
            config.terrainGeneration.postProcessSmoothIterations = 1;
            config.terrainGeneration.erosionStrength = 0.16f;
        }
    }
}
#endif
