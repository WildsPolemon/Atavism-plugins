using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    [CreateAssetMenu(menuName = "World Generation/AAA World Generator Config", fileName = "WorldGeneratorConfig")]
    public sealed class WorldGeneratorConfig : ScriptableObject
    {
        [Header("World Shape")]
        public int worldSeed = 77317;
        public int worldSizeInChunks = 48;
        public int chunkSizeMeters = 256;
        public float maxHeightMeters = 280f;
        [Range(0f, 1f)] public float seaLevel01 = 0.32f;

        [Header("Noise")]
        public NoiseLayerSettings heightNoise = new NoiseLayerSettings(0.0012f, 5, 2f, 0.5f, 0f, 0f);
        public NoiseLayerSettings moistureNoise = new NoiseLayerSettings(0.0015f, 4, 2.15f, 0.52f, 113f, 71f);
        public NoiseLayerSettings temperatureNoise = new NoiseLayerSettings(0.0011f, 4, 2.05f, 0.49f, -91f, 44f);

        [Header("Biome Definitions")]
        public List<BiomeDefinition> biomes = new List<BiomeDefinition>();

        [Header("Cities")]
        public CityGenerationSettings citySettings = new CityGenerationSettings();

        [Header("Caves Variant A")]
        public CaveGenerationSettings caveSettings = new CaveGenerationSettings();

        [Header("Resources")]
        public ResourceGenerationSettings resourceSettings = new ResourceGenerationSettings();

        [Header("Spawn Parents")]
        public Transform cityRoot;
        public Transform caveRoot;
        public Transform resourceRoot;

        [Header("Runtime")]
        public bool clearRootsBeforeSpawn = true;
    }

    [Serializable]
    public sealed class NoiseLayerSettings
    {
        public float frequency;
        public int octaves;
        public float lacunarity;
        public float persistence;
        public float offsetX;
        public float offsetZ;

        public NoiseLayerSettings(float frequency, int octaves, float lacunarity, float persistence, float offsetX, float offsetZ)
        {
            this.frequency = frequency;
            this.octaves = octaves;
            this.lacunarity = lacunarity;
            this.persistence = persistence;
            this.offsetX = offsetX;
            this.offsetZ = offsetZ;
        }
    }

    [Serializable]
    public sealed class BiomeDefinition
    {
        public string biomeId = "forest";
        [Range(0f, 1f)] public float minHeight01 = 0f;
        [Range(0f, 1f)] public float maxHeight01 = 1f;
        [Range(0f, 1f)] public float idealMoisture01 = 0.5f;
        [Range(0f, 1f)] public float idealTemperature01 = 0.5f;
        [Range(0f, 2f)] public float blendWeight = 1f;

        [Header("Synty Prefab Pools")]
        public GameObject[] cityPrefabs;
        public GameObject[] caveEntrancePrefabs;
        public GameObject[] resourcePrefabs;
    }

    [Serializable]
    public sealed class CityGenerationSettings
    {
        public int maxCities = 18;
        public float minDistanceBetweenCities = 850f;
        public float cityCoreRadius = 220f;
        public float districtRingRadius = 480f;
        public float roadBlockSize = 40f;
        public int lotPadding = 2;
        public int targetLotsPerCity = 120;
    }

    [Serializable]
    public sealed class CaveGenerationSettings
    {
        public int maxCaves = 220;
        public float minDistanceBetweenEntrances = 180f;
        public float cityExclusionRadius = 360f;
        public float minSlopeDelta = 0.01f;
        public float entranceYOffset = 1.5f;
        public List<CaveStampPreset> stampPresets = new List<CaveStampPreset>();
    }

    [Serializable]
    public sealed class CaveStampPreset
    {
        public string stampId = "cave_small_a";
        public float weight = 1f;
        public int corridorSegments = 4;
        public float segmentLength = 24f;
        public float maxYawChange = 34f;
    }

    [Serializable]
    public sealed class ResourceGenerationSettings
    {
        public float cityResourceExclusionRadius = 280f;
        public float caveResourceExclusionRadius = 120f;
        public float baseNodeSpacing = 30f;
        public List<BiomeResourceRule> biomeRules = new List<BiomeResourceRule>();
    }

    [Serializable]
    public sealed class BiomeResourceRule
    {
        public string biomeId = "forest";
        public int nodesPerSquareKm = 450;
        public ResourceEntry[] entries;
    }

    [Serializable]
    public sealed class ResourceEntry
    {
        public string resourceId = "wood_t1";
        [Range(0f, 1f)] public float weight = 1f;
        public GameObject prefab;
    }
}
