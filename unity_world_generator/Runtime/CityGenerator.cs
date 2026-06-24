using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public static class CityGenerator
    {
        public static List<CityPlacement> Generate(
            WorldGeneratorConfig config,
            Func<float, float, float> sampleHeight01,
            Func<float, float, BiomeDefinition> sampleBiome)
        {
            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            Rect bounds = new Rect(0f, 0f, worldSize, worldSize);
            List<Vector2> candidates = PoissonDiskSampler.Sample(bounds, config.citySettings.minDistanceBetweenCities, config.worldSeed + 1103);
            List<(Vector2 point, float score)> ranked = new List<(Vector2 point, float score)>();

            for (int i = 0; i < candidates.Count; i++)
            {
                Vector2 p = candidates[i];
                float centerHeight = sampleHeight01(p.x, p.y);
                float minCityHeight01 = config.seaLevel01 + config.citySettings.minHeightAboveSea01;
                if (centerHeight < minCityHeight01)
                {
                    // Reject low-lying candidates to keep cities away from rivers/lakes/shoreline flooding.
                    continue;
                }

                if (HasNearbyWater(p, config, sampleHeight01))
                {
                    continue;
                }

                float hN = sampleHeight01(p.x + 35f, p.y);
                float hS = sampleHeight01(p.x - 35f, p.y);
                float hE = sampleHeight01(p.x, p.y + 35f);
                float hW = sampleHeight01(p.x, p.y - 35f);
                float slopePenalty = Mathf.Abs(centerHeight - hN) + Mathf.Abs(centerHeight - hS) + Mathf.Abs(centerHeight - hE) + Mathf.Abs(centerHeight - hW);
                float shorelineDistance = Mathf.Abs(centerHeight - config.seaLevel01);
                float shorelinePenalty = 0f;
                if (shorelineDistance < config.citySettings.shorelineBuffer01)
                {
                    shorelinePenalty = (config.citySettings.shorelineBuffer01 - shorelineDistance) * 7f;
                }

                float score = slopePenalty * 2f + shorelinePenalty;
                ranked.Add((p, score));
            }

            ranked.Sort((a, b) => a.score.CompareTo(b.score));

            List<CityPlacement> cities = new List<CityPlacement>();
            int cityCount = Mathf.Min(config.citySettings.maxCities, ranked.Count);
            for (int i = 0; i < cityCount; i++)
            {
                Vector2 point = ranked[i].point;
                float h = sampleHeight01(point.x, point.y) * config.maxHeightMeters;
                BiomeDefinition biome = sampleBiome(point.x, point.y);

                CityPlacement city = new CityPlacement
                {
                    cityIndex = i,
                    cityTier = ResolveCityTier(i),
                    biomeId = biome != null ? biome.biomeId : "unknown",
                    center = new Vector3(point.x, h, point.y),
                    coreRadius = config.citySettings.cityCoreRadius,
                    districtRadius = config.citySettings.districtRingRadius
                };

                BuildRoadGrid(city, config.citySettings.roadBlockSize);
                BuildDistrictLots(city, config.citySettings.roadBlockSize, config.citySettings.targetLotsPerCity, config.citySettings.lotPadding);
                cities.Add(city);
            }

            return cities;
        }

        private static bool HasNearbyWater(
            Vector2 center,
            WorldGeneratorConfig config,
            Func<float, float, float> sampleHeight01)
        {
            float minAllowed = config.seaLevel01 + config.citySettings.minAreaHeightAboveSea01;
            int samples = Mathf.Clamp(config.citySettings.waterProximitySamples, 8, 64);
            float[] radii =
            {
                Mathf.Max(40f, config.citySettings.cityCoreRadius * 0.45f),
                Mathf.Max(80f, config.citySettings.cityCoreRadius * 0.9f),
                Mathf.Max(120f, config.citySettings.districtRingRadius * 0.65f),
                Mathf.Max(180f, config.citySettings.districtRingRadius * 0.95f),
            };

            for (int r = 0; r < radii.Length; r++)
            {
                float radius = radii[r];
                for (int i = 0; i < samples; i++)
                {
                    float angle = (i / (float)samples) * Mathf.PI * 2f;
                    float x = center.x + Mathf.Cos(angle) * radius;
                    float z = center.y + Mathf.Sin(angle) * radius;
                    float h = sampleHeight01(x, z);
                    if (h < minAllowed)
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        private static string ResolveCityTier(int sortedIndex)
        {
            if (sortedIndex == 0)
            {
                return "Capital";
            }

            if (sortedIndex < 5)
            {
                return "MajorCity";
            }

            if (sortedIndex < 12)
            {
                return "Town";
            }

            return "Village";
        }

        private static void BuildRoadGrid(CityPlacement city, float roadBlockSize)
        {
            float radius = city.districtRadius;
            int steps = Mathf.CeilToInt(radius / roadBlockSize);

            for (int i = -steps; i <= steps; i++)
            {
                float offset = i * roadBlockSize;
                city.roads.Add(new RoadSegment
                {
                    from = city.center + new Vector3(offset, 0f, -radius),
                    to = city.center + new Vector3(offset, 0f, radius)
                });

                city.roads.Add(new RoadSegment
                {
                    from = city.center + new Vector3(-radius, 0f, offset),
                    to = city.center + new Vector3(radius, 0f, offset)
                });
            }
        }

        private static void BuildDistrictLots(CityPlacement city, float roadBlockSize, int targetLots, int lotPadding)
        {
            System.Random rng = new System.Random(city.center.GetHashCode());
            float inner = city.coreRadius + roadBlockSize;
            float outer = city.districtRadius - roadBlockSize;

            for (int i = 0; i < targetLots; i++)
            {
                float angle = (float)rng.NextDouble() * Mathf.PI * 2f;
                float radius = Mathf.Lerp(inner, outer, (float)rng.NextDouble());
                Vector2 dir = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
                Vector3 center = city.center + new Vector3(dir.x, 0f, dir.y) * radius;
                int district = (int)Mathf.Repeat(angle / (Mathf.PI / 2f), 4);

                city.lots.Add(new DistrictLot
                {
                    center = center,
                    size = new Vector2(roadBlockSize * 0.8f - lotPadding, roadBlockSize * 0.8f - lotPadding),
                    districtIndex = district
                });
            }
        }
    }
}
