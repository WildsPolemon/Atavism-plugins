using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public static class RoadNetworkGenerator
    {
        public static List<RoadSegment> GenerateIntercityRoads(
            WorldGeneratorConfig config,
            List<CityPlacement> cities,
            Func<float, float, float> sampleHeight01)
        {
            List<RoadSegment> roads = new List<RoadSegment>();
            if (cities == null || cities.Count < 2)
            {
                return roads;
            }

            HashSet<long> connected = new HashSet<long>();
            BuildMinimumSpanningTree(config, cities, sampleHeight01, roads, connected);
            AddExtraConnections(config, cities, sampleHeight01, roads, connected);
            return roads;
        }

        private static void BuildMinimumSpanningTree(
            WorldGeneratorConfig config,
            List<CityPlacement> cities,
            Func<float, float, float> sampleHeight01,
            List<RoadSegment> roads,
            HashSet<long> connected)
        {
            int count = cities.Count;
            bool[] inTree = new bool[count];
            inTree[0] = true;
            int connectedCount = 1;

            while (connectedCount < count)
            {
                float best = float.MaxValue;
                int from = -1;
                int to = -1;

                for (int i = 0; i < count; i++)
                {
                    if (!inTree[i])
                    {
                        continue;
                    }

                    for (int j = 0; j < count; j++)
                    {
                        if (inTree[j] || i == j)
                        {
                            continue;
                        }

                        float d = (cities[i].center - cities[j].center).sqrMagnitude;
                        if (d < best)
                        {
                            best = d;
                            from = i;
                            to = j;
                        }
                    }
                }

                if (from < 0 || to < 0)
                {
                    break;
                }

                inTree[to] = true;
                connectedCount++;
                AddCurvedRoad(config, cities[from], cities[to], sampleHeight01, roads, connected);
            }
        }

        private static void AddExtraConnections(
            WorldGeneratorConfig config,
            List<CityPlacement> cities,
            Func<float, float, float> sampleHeight01,
            List<RoadSegment> roads,
            HashSet<long> connected)
        {
            int extra = Mathf.Max(0, config.roadSettings.extraConnectionsPerCity);
            if (extra == 0)
            {
                return;
            }

            for (int i = 0; i < cities.Count; i++)
            {
                List<(float dist, int idx)> neighbors = new List<(float dist, int idx)>();
                for (int j = 0; j < cities.Count; j++)
                {
                    if (i == j)
                    {
                        continue;
                    }

                    float dist = (cities[i].center - cities[j].center).sqrMagnitude;
                    neighbors.Add((dist, j));
                }

                neighbors.Sort((a, b) => a.dist.CompareTo(b.dist));
                for (int k = 0; k < Mathf.Min(extra, neighbors.Count); k++)
                {
                    int j = neighbors[k].idx;
                    AddCurvedRoad(config, cities[i], cities[j], sampleHeight01, roads, connected);
                }
            }
        }

        private static void AddCurvedRoad(
            WorldGeneratorConfig config,
            CityPlacement a,
            CityPlacement b,
            Func<float, float, float> sampleHeight01,
            List<RoadSegment> roads,
            HashSet<long> connected)
        {
            long key = PairKey(a.cityIndex, b.cityIndex);
            if (!connected.Add(key))
            {
                return;
            }

            Vector3 start = a.center;
            Vector3 end = b.center;

            Vector3 flat = new Vector3(end.x - start.x, 0f, end.z - start.z);
            float length = flat.magnitude;
            if (length <= Mathf.Epsilon)
            {
                return;
            }

            Vector3 dir = flat / length;
            Vector3 perp = new Vector3(-dir.z, 0f, dir.x);
            float hash = Mathf.Sin((a.cityIndex + 1) * 12.9898f + (b.cityIndex + 1) * 78.233f + config.worldSeed * 0.131f);
            float curveSigned = Mathf.Clamp(hash, -1f, 1f);
            float curveAmount = length * config.roadSettings.maxCurvatureRatio * curveSigned;
            Vector3 midpoint = (start + end) * 0.5f + perp * curveAmount;

            start.y = sampleHeight01(start.x, start.z) * config.maxHeightMeters + config.roadSettings.roadHeightOffset;
            midpoint.y = sampleHeight01(midpoint.x, midpoint.z) * config.maxHeightMeters + config.roadSettings.roadHeightOffset;
            end.y = sampleHeight01(end.x, end.z) * config.maxHeightMeters + config.roadSettings.roadHeightOffset;

            roads.Add(new RoadSegment { from = start, to = midpoint });
            roads.Add(new RoadSegment { from = midpoint, to = end });
        }

        private static long PairKey(int a, int b)
        {
            int min = Math.Min(a, b);
            int max = Math.Max(a, b);
            return ((long)min << 32) | (uint)max;
        }
    }
}
