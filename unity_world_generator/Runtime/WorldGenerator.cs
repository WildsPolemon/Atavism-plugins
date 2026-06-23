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
            List<CavePlacement> caves = CaveStampGenerator.GenerateVariantA(config, cities, sampleHeight01, sampleBiome);
            List<ResourceNodePlacement> resources = ResourceGenerator.Generate(config, cities, caves, sampleBiome, sampleHeight01);

            lastResult = new WorldGenerationResult
            {
                worldSeed = config.worldSeed,
                worldWidth = config.worldSizeInChunks * config.chunkSizeMeters,
                worldLength = config.worldSizeInChunks * config.chunkSizeMeters,
                cities = cities,
                caves = caves,
                resources = resources
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

        private void SpawnRuntime(WorldGenerationResult result)
        {
            if (config.clearRootsBeforeSpawn)
            {
                ClearRoot(config.cityRoot);
                ClearRoot(config.caveRoot);
                ClearRoot(config.resourceRoot);
            }

            SpawnCities(result.cities);
            SpawnCaves(result.caves);
            SpawnResources(result.resources);
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

        private static void ClearRoot(Transform root)
        {
            if (root == null)
            {
                return;
            }

            for (int i = root.childCount - 1; i >= 0; i--)
            {
                DestroyImmediate(root.GetChild(i).gameObject);
            }
        }
    }
}
