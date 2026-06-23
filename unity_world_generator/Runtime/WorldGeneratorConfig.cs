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

        [Header("Intercity Roads")]
        public IntercityRoadSettings roadSettings = new IntercityRoadSettings();

        [Header("Caves Variant A")]
        public CaveGenerationSettings caveSettings = new CaveGenerationSettings();

        [Header("Resources")]
        public ResourceGenerationSettings resourceSettings = new ResourceGenerationSettings();

        [Header("MMORPG Spawns")]
        public SpawnGenerationSettings spawnSettings = new SpawnGenerationSettings();

        [Header("Spawn Parents")]
        public Transform cityRoot;
        public Transform caveRoot;
        public Transform resourceRoot;
        public Transform roadRoot;
        public Transform spawnRoot;

        [Header("Runtime")]
        public bool clearRootsBeforeSpawn = true;
        public GameObject roadMarkerPrefab;
        public GameObject playerSpawnMarkerPrefab;
        public GameObject npcSpawnMarkerPrefab;
        public GameObject mobZoneMarkerPrefab;

        public List<string> GetValidationMessages()
        {
            List<string> messages = new List<string>();

            if (worldSizeInChunks < 2)
            {
                messages.Add("worldSizeInChunks should be >= 2.");
            }

            if (chunkSizeMeters < 32)
            {
                messages.Add("chunkSizeMeters should be >= 32.");
            }

            if (maxHeightMeters <= 1f)
            {
                messages.Add("maxHeightMeters should be > 1.");
            }

            if (biomes == null || biomes.Count == 0)
            {
                messages.Add("At least one biome is required.");
            }
            else
            {
                HashSet<string> seen = new HashSet<string>();
                for (int i = 0; i < biomes.Count; i++)
                {
                    BiomeDefinition biome = biomes[i];
                    if (biome == null)
                    {
                        messages.Add($"Biome #{i} is null.");
                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(biome.biomeId))
                    {
                        messages.Add($"Biome #{i} has empty biomeId.");
                    }
                    else if (!seen.Add(biome.biomeId))
                    {
                        messages.Add($"Biome id '{biome.biomeId}' is duplicated.");
                    }

                    if (biome.maxHeight01 < biome.minHeight01)
                    {
                        messages.Add($"Biome '{biome.biomeId}' has maxHeight01 < minHeight01.");
                    }
                }
            }

            if (citySettings.maxCities < 0)
            {
                messages.Add("citySettings.maxCities should be >= 0.");
            }

            if (citySettings.minDistanceBetweenCities <= 0f)
            {
                messages.Add("citySettings.minDistanceBetweenCities should be > 0.");
            }

            if (caveSettings.maxCaves < 0)
            {
                messages.Add("caveSettings.maxCaves should be >= 0.");
            }

            if (caveSettings.stampPresets == null || caveSettings.stampPresets.Count == 0)
            {
                messages.Add("At least one cave stamp preset is required.");
            }

            if (roadSettings.extraConnectionsPerCity < 0)
            {
                messages.Add("roadSettings.extraConnectionsPerCity should be >= 0.");
            }

            if (resourceSettings.biomeRules == null || resourceSettings.biomeRules.Count == 0)
            {
                messages.Add("At least one resource biome rule is required.");
            }

            if (spawnSettings.playerSpawnsPerCity < 1)
            {
                messages.Add("spawnSettings.playerSpawnsPerCity should be >= 1.");
            }

            if (spawnSettings.maxMobZones < 0)
            {
                messages.Add("spawnSettings.maxMobZones should be >= 0.");
            }

            return messages;
        }
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
    public sealed class IntercityRoadSettings
    {
        public int extraConnectionsPerCity = 1;
        public float roadHeightOffset = 0.5f;
        public float maxCurvatureRatio = 0.08f;
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
    public sealed class SpawnGenerationSettings
    {
        public int playerSpawnsPerCity = 3;
        public int npcSpawnsPerCity = 24;
        public int maxMobZones = 360;
        public float mobZoneRadius = 55f;
        public float citySpawnExclusionRadius = 300f;
        public float caveSpawnExclusionRadius = 110f;
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
