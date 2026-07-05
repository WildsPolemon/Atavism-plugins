using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public static class ResourceGenerator
    {
        public static List<ResourceNodePlacement> Generate(
            WorldGeneratorConfig config,
            List<CityPlacement> cities,
            List<CavePlacement> caves,
            Func<float, float, BiomeDefinition> sampleBiome,
            Func<float, float, float> sampleHeight01)
        {
            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            float worldAreaKm2 = (worldSize * worldSize) / 1_000_000f;
            System.Random rng = new System.Random(config.worldSeed + 7399);
            List<ResourceNodePlacement> output = new List<ResourceNodePlacement>();

            Dictionary<string, BiomeResourceRule> rules = new Dictionary<string, BiomeResourceRule>();
            for (int i = 0; i < config.resourceSettings.biomeRules.Count; i++)
            {
                BiomeResourceRule rule = config.resourceSettings.biomeRules[i];
                rules[rule.biomeId] = rule;
            }

            float spacing = Mathf.Max(5f, config.resourceSettings.baseNodeSpacing);
            const int maxCandidates = 18000;
            float minSpacingForWorld = Mathf.Sqrt((worldSize * worldSize) / maxCandidates);
            if (minSpacingForWorld > spacing)
            {
                spacing = minSpacingForWorld;
            }

            List<Vector2> points = PoissonDiskSampler.Sample(new Rect(0, 0, worldSize, worldSize), spacing, config.worldSeed + 8201, 20);

            for (int i = 0; i < points.Count; i++)
            {
                Vector2 p = points[i];
                BiomeDefinition biome = sampleBiome(p.x, p.y);
                if (biome == null || !rules.TryGetValue(biome.biomeId, out BiomeResourceRule rule))
                {
                    continue;
                }

                float targetNodes = rule.nodesPerSquareKm * worldAreaKm2;
                float keepChance = Mathf.Clamp01(targetNodes / Mathf.Max(1f, points.Count));
                if ((float)rng.NextDouble() > keepChance)
                {
                    continue;
                }

                if (InsideCityExclusion(p, cities, config.resourceSettings.cityResourceExclusionRadius))
                {
                    continue;
                }

                if (InsideCaveExclusion(p, caves, config.resourceSettings.caveResourceExclusionRadius))
                {
                    continue;
                }

                ResourceEntry entry = WeightedEntry(rule.entries, rng);
                if (entry == null)
                {
                    continue;
                }

                float h = sampleHeight01(p.x, p.y) * config.maxHeightMeters;
                output.Add(new ResourceNodePlacement
                {
                    biomeId = biome.biomeId,
                    resourceId = entry.resourceId,
                    position = new Vector3(p.x, h, p.y),
                    yaw = (float)rng.NextDouble() * 360f
                });
            }

            return output;
        }

        private static bool InsideCityExclusion(Vector2 p, List<CityPlacement> cities, float radius)
        {
            float r2 = radius * radius;
            for (int i = 0; i < cities.Count; i++)
            {
                Vector3 c = cities[i].center;
                float dx = c.x - p.x;
                float dz = c.z - p.y;
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
                float dx = c.x - p.x;
                float dz = c.z - p.y;
                if (dx * dx + dz * dz < r2)
                {
                    return true;
                }
            }

            return false;
        }

        private static ResourceEntry WeightedEntry(ResourceEntry[] entries, System.Random rng)
        {
            if (entries == null || entries.Length == 0)
            {
                return null;
            }

            float total = 0f;
            for (int i = 0; i < entries.Length; i++)
            {
                total += Mathf.Max(0f, entries[i].weight);
            }

            if (total <= 0f)
            {
                return entries[0];
            }

            float pick = (float)rng.NextDouble() * total;
            float accum = 0f;
            for (int i = 0; i < entries.Length; i++)
            {
                accum += Mathf.Max(0f, entries[i].weight);
                if (pick <= accum)
                {
                    return entries[i];
                }
            }

            return entries[entries.Length - 1];
        }
    }
}
