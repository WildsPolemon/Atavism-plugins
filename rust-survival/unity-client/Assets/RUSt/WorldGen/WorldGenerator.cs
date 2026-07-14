using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public sealed class WorldGenerator : MonoBehaviour
    {
        [SerializeField] private WorldGeneratorConfig config;
        [SerializeField] private bool spawnRuntimePrefabs = true;
        [SerializeField] private bool exportJsonAfterGeneration = false;
        [SerializeField] private string exportFileName = "generated_world_layout.json";

        private WorldGenerationResult lastResult;

        public WorldGeneratorConfig Config
        {
            get => config;
            set => config = value;
        }

        public WorldGenerationResult LastResult => lastResult;

        public WorldGenerationResult GenerateNow()
        {
            if (config == null)
            {
                throw new InvalidOperationException("WorldGeneratorConfig is missing.");
            }

            Func<float, float, float> sampleHeight01 = (x, z) =>
                DeterministicNoise.SampleFbm01(x, z, config.worldSeed, config.heightNoise);

            Func<float, float, BiomeDefinition> sampleBiome = (x, z) =>
            {
                float h = sampleHeight01(x, z);
                float m = DeterministicNoise.SampleFbm01(x, z, config.worldSeed + 17, config.moistureNoise);
                float t = DeterministicNoise.SampleFbm01(x, z, config.worldSeed + 53, config.temperatureNoise);
                return BiomeResolver.Resolve(h, m, t, config.biomes);
            };

            List<CityPlacement> cities = CityGenerator.Generate(config, sampleHeight01, sampleBiome);
            List<RoadSegment> worldRoads = RoadNetworkGenerator.GenerateIntercityRoads(config, cities, sampleHeight01);
            List<CavePlacement> caves = CaveStampGenerator.GenerateVariantA(config, cities, sampleHeight01, sampleBiome);
            List<ResourceNodePlacement> resources = ResourceGenerator.Generate(config, cities, caves, sampleBiome, sampleHeight01);
            SpawnGenerator.Generate(
                config,
                cities,
                caves,
                sampleHeight01,
                sampleBiome,
                out List<SpawnPointPlacement> playerSpawns,
                out List<SpawnPointPlacement> npcSpawns,
                out List<SpawnZonePlacement> mobSpawnZones);

            lastResult = new WorldGenerationResult
            {
                worldSeed = config.worldSeed,
                worldWidth = config.worldSizeInChunks * config.chunkSizeMeters,
                worldLength = config.worldSizeInChunks * config.chunkSizeMeters,
                cities = cities,
                worldRoads = worldRoads,
                caves = caves,
                resources = resources,
                playerSpawns = playerSpawns,
                npcSpawns = npcSpawns,
                mobSpawnZones = mobSpawnZones
            };

            if (spawnRuntimePrefabs)
            {
                SpawnRuntime(lastResult);
            }

            if (exportJsonAfterGeneration)
            {
                string path = System.IO.Path.Combine(Application.persistentDataPath, exportFileName);
                WorldJsonExporter.Export(path, lastResult);
                Debug.Log($"World layout exported to {path}");
            }

            return lastResult;
        }

        [ContextMenu("Generate World")]
        private void GenerateFromContext()
        {
            GenerateNow();
        }

        public void ExportLastResultJson(string absolutePath)
        {
            if (string.IsNullOrWhiteSpace(absolutePath))
            {
                throw new ArgumentException("Export path is empty.", nameof(absolutePath));
            }

            if (lastResult == null)
            {
                GenerateNow();
            }

            WorldJsonExporter.Export(absolutePath, lastResult);
        }

        private void SpawnRuntime(WorldGenerationResult result)
        {
            if (config.clearRootsBeforeSpawn)
            {
                ClearRoot(config.cityRoot);
                ClearRoot(config.caveRoot);
                ClearRoot(config.resourceRoot);
                ClearRoot(config.roadRoot);
                ClearRoot(config.spawnRoot);
            }

            SpawnCities(result.cities);
            SpawnRoads(result.worldRoads);
            SpawnCaves(result.caves);
            SpawnResources(result.resources);
            SpawnPoints(result.playerSpawns, config.playerSpawnMarkerPrefab, "player_spawn");
            SpawnPoints(result.npcSpawns, config.npcSpawnMarkerPrefab, "npc_spawn");
            SpawnMobZones(result.mobSpawnZones);
        }

        private void SpawnCities(List<CityPlacement> cities)
        {
            for (int i = 0; i < cities.Count; i++)
            {
                CityPlacement city = cities[i];
                BiomeDefinition biome = config.biomes.Find(b => b.biomeId == city.biomeId);
                if (biome == null || biome.cityPrefabs == null || biome.cityPrefabs.Length == 0)
                {
                    continue;
                }

                GameObject prefab = biome.cityPrefabs[i % biome.cityPrefabs.Length];
                Instantiate(prefab, city.center, Quaternion.identity, config.cityRoot);
            }
        }

        private void SpawnCaves(List<CavePlacement> caves)
        {
            for (int i = 0; i < caves.Count; i++)
            {
                CavePlacement cave = caves[i];
                BiomeDefinition biome = config.biomes.Find(b => b.biomeId == cave.biomeId);
                if (biome == null || biome.caveEntrancePrefabs == null || biome.caveEntrancePrefabs.Length == 0)
                {
                    continue;
                }

                GameObject prefab = biome.caveEntrancePrefabs[i % biome.caveEntrancePrefabs.Length];
                Quaternion rot = Quaternion.Euler(0f, cave.yaw, 0f);
                Instantiate(prefab, cave.entrance, rot, config.caveRoot);
            }
        }

        private void SpawnResources(List<ResourceNodePlacement> resources)
        {
            for (int i = 0; i < resources.Count; i++)
            {
                ResourceNodePlacement node = resources[i];
                BiomeDefinition biome = config.biomes.Find(b => b.biomeId == node.biomeId);
                if (biome == null || biome.resourcePrefabs == null || biome.resourcePrefabs.Length == 0)
                {
                    continue;
                }

                GameObject prefab = biome.resourcePrefabs[i % biome.resourcePrefabs.Length];
                Quaternion rot = Quaternion.Euler(0f, node.yaw, 0f);
                Instantiate(prefab, node.position, rot, config.resourceRoot);
            }
        }

        private void SpawnRoads(List<RoadSegment> roads)
        {
            if (roads == null || roads.Count == 0 || config.roadMarkerPrefab == null)
            {
                return;
            }

            for (int i = 0; i < roads.Count; i++)
            {
                RoadSegment seg = roads[i];
                Vector3 mid = (seg.from + seg.to) * 0.5f;
                Vector3 dir = (seg.to - seg.from);
                if (dir.sqrMagnitude < 0.0001f)
                {
                    continue;
                }

                Quaternion rot = Quaternion.LookRotation(new Vector3(dir.x, 0f, dir.z));
                Instantiate(config.roadMarkerPrefab, mid, rot, config.roadRoot);
            }
        }

        private void SpawnPoints(List<SpawnPointPlacement> points, GameObject prefab, string fallbackName)
        {
            if (points == null || points.Count == 0)
            {
                return;
            }

            if (prefab == null)
            {
                for (int i = 0; i < points.Count; i++)
                {
                    SpawnPointPlacement p = points[i];
                    GameObject marker = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    marker.name = $"{fallbackName}_{i}";
                    marker.transform.SetParent(config.spawnRoot, true);
                    marker.transform.position = p.position;
                    marker.transform.rotation = Quaternion.Euler(0f, p.yaw, 0f);
                    marker.transform.localScale = new Vector3(2f, 1.5f, 2f);
                }

                return;
            }

            for (int i = 0; i < points.Count; i++)
            {
                SpawnPointPlacement p = points[i];
                Quaternion rot = Quaternion.Euler(0f, p.yaw, 0f);
                Instantiate(prefab, p.position, rot, config.spawnRoot);
            }
        }

        private void SpawnMobZones(List<SpawnZonePlacement> zones)
        {
            if (zones == null || zones.Count == 0)
            {
                return;
            }

            for (int i = 0; i < zones.Count; i++)
            {
                SpawnZonePlacement zone = zones[i];
                if (config.mobZoneMarkerPrefab != null)
                {
                    GameObject go = Instantiate(config.mobZoneMarkerPrefab, zone.center, Quaternion.identity, config.spawnRoot);
                    go.transform.localScale = new Vector3(zone.radius * 2f, go.transform.localScale.y, zone.radius * 2f);
                }
                else
                {
                    GameObject marker = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                    marker.name = $"mob_zone_{i}_t{zone.tier}";
                    marker.transform.SetParent(config.spawnRoot, true);
                    marker.transform.position = zone.center;
                    marker.transform.localScale = new Vector3(zone.radius * 2f, 1f, zone.radius * 2f);
                }
            }
        }

        private static void ClearRoot(Transform root)
        {
            if (root == null)
            {
                return;
            }

            for (int i = root.childCount - 1; i >= 0; i--)
            {
                GameObject child = root.GetChild(i).gameObject;
                if (Application.isPlaying)
                {
                    Destroy(child);
                }
                else
                {
                    DestroyImmediate(child);
                }
            }
        }
    }
}
