using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public static class CaveStampGenerator
    {
        public static List<CavePlacement> GenerateVariantA(
            WorldGeneratorConfig config,
            List<CityPlacement> cities,
            Func<float, float, float> sampleHeight01,
            Func<float, float, BiomeDefinition> sampleBiome)
        {
            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            Rect bounds = new Rect(0f, 0f, worldSize, worldSize);
            List<Vector2> entranceCandidates = PoissonDiskSampler.Sample(
                bounds,
                config.caveSettings.minDistanceBetweenEntrances,
                config.worldSeed + 3901,
                28);

            List<CavePlacement> caves = new List<CavePlacement>();
            System.Random rng = new System.Random(config.worldSeed + 9017);

            for (int i = 0; i < entranceCandidates.Count; i++)
            {
                if (caves.Count >= config.caveSettings.maxCaves)
                {
                    break;
                }

                Vector2 p = entranceCandidates[i];
                if (IntersectsCityExclusion(p, cities, config.caveSettings.cityExclusionRadius))
                {
                    continue;
                }

                float hCenter = sampleHeight01(p.x, p.y);
                float hDx = sampleHeight01(p.x + 10f, p.y);
                float hDz = sampleHeight01(p.x, p.y + 10f);
                float slope = Mathf.Abs(hCenter - hDx) + Mathf.Abs(hCenter - hDz);
                if (slope < config.caveSettings.minSlopeDelta)
                {
                    continue;
                }

                CaveStampPreset stamp = WeightedStamp(config.caveSettings.stampPresets, rng);
                if (stamp == null)
                {
                    continue;
                }

                float yaw = (float)rng.NextDouble() * 360f;
                float worldHeight = hCenter * config.maxHeightMeters + config.caveSettings.entranceYOffset;
                BiomeDefinition biome = sampleBiome(p.x, p.y);

                CavePlacement cave = new CavePlacement
                {
                    biomeId = biome != null ? biome.biomeId : "unknown",
                    stampId = stamp.stampId,
                    entrance = new Vector3(p.x, worldHeight, p.y),
                    yaw = yaw
                };

                BuildCorridorChain(cave, stamp, rng);
                caves.Add(cave);
            }

            return caves;
        }

        private static bool IntersectsCityExclusion(Vector2 p, List<CityPlacement> cities, float radius)
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

        private static CaveStampPreset WeightedStamp(List<CaveStampPreset> presets, System.Random rng)
        {
            if (presets == null || presets.Count == 0)
            {
                return null;
            }

            float total = 0f;
            for (int i = 0; i < presets.Count; i++)
            {
                total += Mathf.Max(0f, presets[i].weight);
            }

            if (total <= 0f)
            {
                return presets[0];
            }

            float pick = (float)rng.NextDouble() * total;
            float accum = 0f;
            for (int i = 0; i < presets.Count; i++)
            {
                accum += Mathf.Max(0f, presets[i].weight);
                if (pick <= accum)
                {
                    return presets[i];
                }
            }

            return presets[presets.Count - 1];
        }

        private static void BuildCorridorChain(CavePlacement cave, CaveStampPreset stamp, System.Random rng)
        {
            float yaw = cave.yaw;
            Vector3 cursor = cave.entrance;
            cave.corridorPoints.Add(cursor);

            for (int i = 0; i < Mathf.Max(1, stamp.corridorSegments); i++)
            {
                float delta = ((float)rng.NextDouble() * 2f - 1f) * stamp.maxYawChange;
                yaw += delta;
                float rad = yaw * Mathf.Deg2Rad;
                Vector3 next = cursor + new Vector3(Mathf.Cos(rad), -0.35f, Mathf.Sin(rad)) * stamp.segmentLength;
                cave.corridorPoints.Add(next);
                cursor = next;
            }
        }
    }
}
