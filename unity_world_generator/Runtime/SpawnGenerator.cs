using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public static class SpawnGenerator
    {
        public static void Generate(
            WorldGeneratorConfig config,
            List<CityPlacement> cities,
            List<CavePlacement> caves,
            Func<float, float, float> sampleHeight01,
            Func<float, float, BiomeDefinition> sampleBiome,
            out List<SpawnPointPlacement> playerSpawns,
            out List<SpawnPointPlacement> npcSpawns,
            out List<SpawnZonePlacement> mobZones)
        {
            playerSpawns = new List<SpawnPointPlacement>();
            npcSpawns = new List<SpawnPointPlacement>();
            mobZones = new List<SpawnZonePlacement>();

            BuildCitySpawns(config, cities, sampleHeight01, playerSpawns, npcSpawns);
            BuildWildernessMobZones(config, cities, caves, sampleHeight01, sampleBiome, mobZones);
        }

        private static void BuildCitySpawns(
            WorldGeneratorConfig config,
            List<CityPlacement> cities,
            Func<float, float, float> sampleHeight01,
            List<SpawnPointPlacement> playerSpawns,
            List<SpawnPointPlacement> npcSpawns)
        {
            for (int i = 0; i < cities.Count; i++)
            {
                CityPlacement city = cities[i];

                // Main player spawn in city core.
                playerSpawns.Add(new SpawnPointPlacement
                {
                    biomeId = city.biomeId,
                    spawnType = "Player",
                    cityIndex = city.cityIndex,
                    position = city.center + Vector3.up * 1f,
                    yaw = 0f
                });

                // Additional gate-like player spawns around city ring.
                int extraPlayer = Mathf.Max(0, config.spawnSettings.playerSpawnsPerCity - 1);
                for (int p = 0; p < extraPlayer; p++)
                {
                    float angle = (p / (float)Mathf.Max(1, extraPlayer)) * Mathf.PI * 2f;
                    Vector2 dir = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
                    Vector3 pos = city.center + new Vector3(dir.x, 0f, dir.y) * Mathf.Max(city.coreRadius * 0.8f, 15f);
                    pos.y = sampleHeight01(pos.x, pos.z) * config.maxHeightMeters + 1f;

                    playerSpawns.Add(new SpawnPointPlacement
                    {
                        biomeId = city.biomeId,
                        spawnType = "Player",
                        cityIndex = city.cityIndex,
                        position = pos,
                        yaw = angle * Mathf.Rad2Deg + 180f
                    });
                }

                // NPC spawns on district lots.
                int npcCount = Mathf.Min(config.spawnSettings.npcSpawnsPerCity, city.lots.Count);
                for (int n = 0; n < npcCount; n++)
                {
                    DistrictLot lot = city.lots[n];
                    Vector3 pos = lot.center;
                    pos.y = sampleHeight01(pos.x, pos.z) * config.maxHeightMeters + 1f;

                    npcSpawns.Add(new SpawnPointPlacement
                    {
                        biomeId = city.biomeId,
                        spawnType = "NPC",
                        cityIndex = city.cityIndex,
                        position = pos,
                        yaw = lot.districtIndex * 90f
                    });
                }
            }
        }

        private static void BuildWildernessMobZones(
            WorldGeneratorConfig config,
            List<CityPlacement> cities,
            List<CavePlacement> caves,
            Func<float, float, float> sampleHeight01,
            Func<float, float, BiomeDefinition> sampleBiome,
            List<SpawnZonePlacement> zones)
        {
            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            float spacing = Mathf.Max(config.spawnSettings.mobZoneRadius * 1.6f, 20f);
            List<Vector2> candidates = PoissonDiskSampler.Sample(new Rect(0f, 0f, worldSize, worldSize), spacing, config.worldSeed + 4507, 24);

            for (int i = 0; i < candidates.Count; i++)
            {
                if (zones.Count >= config.spawnSettings.maxMobZones)
                {
                    break;
                }

                Vector2 p = candidates[i];
                if (InsideCityExclusion(p, cities, config.spawnSettings.citySpawnExclusionRadius))
                {
                    continue;
                }

                if (InsideCaveExclusion(p, caves, config.spawnSettings.caveSpawnExclusionRadius))
                {
                    continue;
                }

                float h = sampleHeight01(p.x, p.y);
                if (h < config.seaLevel01 + 0.01f)
                {
                    continue;
                }

                BiomeDefinition biome = sampleBiome(p.x, p.y);
                int tier = DetermineTier(p, cities);
                zones.Add(new SpawnZonePlacement
                {
                    biomeId = biome != null ? biome.biomeId : "unknown",
                    tier = tier,
                    center = new Vector3(p.x, h * config.maxHeightMeters, p.y),
                    radius = config.spawnSettings.mobZoneRadius
                });
            }
        }

        private static int DetermineTier(Vector2 p, List<CityPlacement> cities)
        {
            float nearest = float.MaxValue;
            for (int i = 0; i < cities.Count; i++)
            {
                Vector3 c = cities[i].center;
                float d = Vector2.Distance(p, new Vector2(c.x, c.z));
                if (d < nearest)
                {
                    nearest = d;
                }
            }

            if (nearest > 3500f)
            {
                return 3;
            }

            if (nearest > 1800f)
            {
                return 2;
            }

            return 1;
        }

        private static bool InsideCityExclusion(Vector2 p, List<CityPlacement> cities, float radius)
        {
            float r2 = radius * radius;
            for (int i = 0; i < cities.Count; i++)
            {
                Vector3 c = cities[i].center;
                float dx = p.x - c.x;
                float dz = p.y - c.z;
                if (dx * dx + dz * dz < r2)
                {
                    return true;
                }
            }

            return false;
        }

        private static bool InsideCaveExclusion(Vector2 p, List<CavePlacement> caves, float radius)
        {
            float r2 = radius * radius;
            for (int i = 0; i < caves.Count; i++)
            {
                Vector3 c = caves[i].entrance;
                float dx = p.x - c.x;
                float dz = p.y - c.z;
                if (dx * dx + dz * dz < r2)
                {
                    return true;
                }
            }

            return false;
        }
    }
}
