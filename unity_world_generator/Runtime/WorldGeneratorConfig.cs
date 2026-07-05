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

        [Header("Terrain Shape")]
        public TerrainShapeSettings terrainShape = new TerrainShapeSettings();

        [Header("Unity Terrain")]
        public TerrainGenerationSettings terrainGeneration = new TerrainGenerationSettings();

        [Header("Biome Climate")]
        public BiomeClimateSettings biomeClimate = new BiomeClimateSettings();

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

        [Header("Sectors")]
        public SectorGenerationSettings sectorSettings = new SectorGenerationSettings();

        [Header("Location Wizard")]
        public LocationKitSettings locationKit = new LocationKitSettings();

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
        public RuntimeOptimizationSettings runtimeOptimization = new RuntimeOptimizationSettings();

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

            if (terrainGeneration == null)
            {
                messages.Add("terrainGeneration should be assigned.");
            }
            else if (terrainGeneration.enableTerrainGeneration)
            {
                if (terrainGeneration.terrainTileSizeMeters < 32f)
                {
                    messages.Add("terrainGeneration.terrainTileSizeMeters should be >= 32.");
                }

                if (terrainGeneration.heightmapResolution < 33)
                {
                    messages.Add("terrainGeneration.heightmapResolution should be >= 33.");
                }

                int terrainTiles = TerrainGenerator.EstimateTileCount(this);
                if (terrainTiles > 64)
                {
                    messages.Add(
                        $"terrainGeneration will create {terrainTiles} tiles — increase terrainTileSizeMeters for faster bakes.");
                }
            }

            if (biomeClimate == null)
            {
                messages.Add("biomeClimate should be assigned.");
            }

            if (terrainShape == null)
            {
                messages.Add("terrainShape should be assigned.");
            }
            else
            {
                if (terrainShape.lowlandThreshold01 >= terrainShape.mountainBoostStart01)
                {
                    messages.Add("terrainShape.lowlandThreshold01 should be < terrainShape.mountainBoostStart01.");
                }

                if (terrainShape.continentNoise == null)
                {
                    messages.Add("terrainShape.continentNoise should be assigned.");
                }
                else if (terrainShape.continentNoise.frequency <= 0f)
                {
                    messages.Add("terrainShape.continentNoise.frequency should be > 0.");
                }

                if (terrainShape.ridgeNoise == null)
                {
                    messages.Add("terrainShape.ridgeNoise should be assigned.");
                }
                else if (terrainShape.ridgeNoise.frequency <= 0f)
                {
                    messages.Add("terrainShape.ridgeNoise.frequency should be > 0.");
                }
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

            if (citySettings.minHeightAboveSea01 < 0f)
            {
                messages.Add("citySettings.minHeightAboveSea01 should be >= 0.");
            }

            if (citySettings.shorelineBuffer01 < 0f)
            {
                messages.Add("citySettings.shorelineBuffer01 should be >= 0.");
            }

            if (citySettings.minAreaHeightAboveSea01 < 0f)
            {
                messages.Add("citySettings.minAreaHeightAboveSea01 should be >= 0.");
            }

            if (citySettings.waterProximitySamples < 8)
            {
                messages.Add("citySettings.waterProximitySamples should be >= 8.");
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

            if (sectorSettings == null)
            {
                messages.Add("sectorSettings should be assigned.");
            }
            else
            {
                if (sectorSettings.sectorSizeMeters < 64f)
                {
                    messages.Add("sectorSettings.sectorSizeMeters should be >= 64.");
                }

                if (sectorSettings.maxResourcesPerSector < 0)
                {
                    messages.Add("sectorSettings.maxResourcesPerSector should be >= 0.");
                }

                if (sectorSettings.maxNpcSpawnsPerSector < 0)
                {
                    messages.Add("sectorSettings.maxNpcSpawnsPerSector should be >= 0.");
                }

                if (sectorSettings.maxMobZonesPerSector < 0)
                {
                    messages.Add("sectorSettings.maxMobZonesPerSector should be >= 0.");
                }
            }

            if (runtimeOptimization == null)
            {
                messages.Add("runtimeOptimization should be assigned.");
            }
            else
            {
                if (runtimeOptimization.cellSizeMeters < 10f)
                {
                    messages.Add("runtimeOptimization.cellSizeMeters should be >= 10.");
                }

                if (runtimeOptimization.streamingRadiusMeters < 50f)
                {
                    messages.Add("runtimeOptimization.streamingRadiusMeters should be >= 50.");
                }

                if (runtimeOptimization.maxActiveObjects < 100)
                {
                    messages.Add("runtimeOptimization.maxActiveObjects should be >= 100.");
                }

                if (runtimeOptimization.maxActiveResources < 0)
                {
                    messages.Add("runtimeOptimization.maxActiveResources should be >= 0.");
                }
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
    public sealed class TerrainGenerationSettings
    {
        public bool enableTerrainGeneration = true;
        public Transform terrainRoot;
        public float terrainTileSizeMeters = 512f;
        public int heightmapResolution = 257;
        public bool clearTerrainBeforeGenerate = true;
        public bool drawInstanced = true;
        public Material terrainMaterial;
        [Tooltip("Fallback ground texture when biome has no terrainDiffuse.")]
        public Texture2D defaultTerrainDiffuse;
        public Texture2D defaultTerrainNormal;
        public float defaultTerrainTileSize = 15f;
        [Tooltip("Paint terrain splat maps from biome climate during bake.")]
        public bool paintBiomeTerrainLayers = true;
        [Tooltip("Softens heightmap before baking to reduce harsh noise.")]
        public bool applyHeightmapSmoothing = true;
        [Range(0, 3)] public int postProcessSmoothIterations = 1;
        [Range(0f, 0.5f)] public float erosionStrength = 0.14f;
    }

    [Serializable]
    public sealed class TerrainShapeSettings
    {
        public bool enableAdvancedShaping = true;
        [Range(0f, 1f)] public float continentInfluence = 0.22f;
        public NoiseLayerSettings continentNoise = new NoiseLayerSettings(0.00022f, 3, 2f, 0.5f, 201f, -144f);
        [Range(0f, 1f)] public float ridgeStrength = 0.19f;
        public NoiseLayerSettings ridgeNoise = new NoiseLayerSettings(0.00092f, 4, 2.1f, 0.5f, -77f, 129f);
        [Range(0f, 0.35f)] public float valleyCarveStrength = 0.12f;
        public NoiseLayerSettings valleyNoise = new NoiseLayerSettings(0.0018f, 3, 2.05f, 0.48f, 88f, -41f);
        [Range(0f, 0.12f)] public float detailStrength = 0.045f;
        public NoiseLayerSettings detailNoise = new NoiseLayerSettings(0.0065f, 2, 2.2f, 0.42f, -33f, 67f);
        [Range(0f, 1f)] public float coastalFalloffStrength = 0.35f;
        [Range(0.05f, 0.45f)] public float coastalFalloffWidth01 = 0.18f;
        [Range(0f, 1f)] public float lowlandFlattenStrength = 0.35f;
        [Range(0f, 1f)] public float lowlandThreshold01 = 0.38f;
        [Range(0f, 1f)] public float mountainBoostStart01 = 0.62f;
        [Range(0f, 1f)] public float mountainBoostStrength = 0.24f;
        [Range(1f, 2.4f)] public float mountainPeakPower = 1.35f;
    }

    [Serializable]
    public sealed class BiomeClimateSettings
    {
        [Range(0f, 1f)] public float latitudeTemperatureInfluence = 0.28f;
        [Range(0f, 1f)] public float elevationTemperatureDrop = 0.22f;
        [Range(0f, 1f)] public float coastalMoistureBoost = 0.18f;
        public NoiseLayerSettings variationNoise = new NoiseLayerSettings(0.0032f, 3, 2f, 0.5f, 57f, -33f);
        [Range(0f, 1f)] public float variationStrength = 0.08f;
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

        [Header("Editor Preview & Terrain Paint")]
        public Color previewColor = new Color(0f, 0f, 0f, 0f);
        public Texture2D terrainDiffuse;
        public Texture2D terrainNormal;
        public float terrainTileSize = 15f;
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
        [Range(0f, 0.2f)] public float minHeightAboveSea01 = 0.025f;
        [Range(0f, 0.3f)] public float shorelineBuffer01 = 0.06f;
        [Range(0f, 0.3f)] public float minAreaHeightAboveSea01 = 0.04f;
        [Range(8, 64)] public int waterProximitySamples = 24;
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
    public sealed class SectorGenerationSettings
    {
        public bool enableSectors = true;
        public float sectorSizeMeters = 768f;
        public int neighborLoadRadius = 1;
        public int maxResourcesPerSector = 1800;
        public int maxNpcSpawnsPerSector = 96;
        public int maxMobZonesPerSector = 48;
    }

    [Serializable]
    public sealed class LocationKitSettings
    {
        public string locationName = "Boss Zone";
        public bool spawnPoiMarkers = true;
        public Transform poiRoot;
        public int roadHintSteps = 6;

        [Tooltip("Synty forest props — assigned to meadow/forest/jungle resource pools.")]
        public string forestKitFolder;
        [Tooltip("Synty ruins props — assigned to volcanic/alpine caves and ruins POI.")]
        public string ruinsKitFolder;
        [Tooltip("Synty road pieces — first prefab becomes road marker; rest for manual polish.")]
        public string roadKitFolder;

        public Texture2D grassDiffuse;
        public Texture2D grassNormal;
        public Texture2D stoneDiffuse;
        public Texture2D stoneNormal;

        public Vector2 spawnHub01 = new Vector2(0.18f, 0.20f);
        public Vector2 ruins01 = new Vector2(0.52f, 0.48f);
        public Vector2 bossArena01 = new Vector2(0.82f, 0.76f);
    }

    [Serializable]
    public sealed class RuntimeOptimizationSettings
    {
        public bool enableDistanceStreaming = true;
        public Transform streamingTarget;
        public float streamingRadiusMeters = 1400f;
        public float unloadPaddingMeters = 260f;
        public float cellSizeMeters = 220f;
        public float refreshIntervalSeconds = 0.35f;
        public int maxActiveObjects = 6000;
        public int maxActiveResources = 2600;
        public bool keepCitiesAlwaysLoaded = true;
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
