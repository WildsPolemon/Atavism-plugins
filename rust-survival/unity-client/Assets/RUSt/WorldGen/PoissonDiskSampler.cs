using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public static class PoissonDiskSampler
    {
        public static List<Vector2> Sample(Rect bounds, float minDistance, int seed, int maxAttempts = 30)
        {
            List<Vector2> points = new List<Vector2>();
            if (bounds.width <= 0 || bounds.height <= 0 || minDistance <= 0)
            {
                return points;
            }

            float cellSize = minDistance / Mathf.Sqrt(2f);
            int gridW = Mathf.CeilToInt(bounds.width / cellSize);
            int gridH = Mathf.CeilToInt(bounds.height / cellSize);
            int[] grid = new int[gridW * gridH];
            for (int i = 0; i < grid.Length; i++)
            {
                grid[i] = -1;
            }

            System.Random rng = new System.Random(seed);
            List<Vector2> active = new List<Vector2>();

            Vector2 first = new Vector2(
                bounds.xMin + (float)rng.NextDouble() * bounds.width,
                bounds.yMin + (float)rng.NextDouble() * bounds.height);
            points.Add(first);
            active.Add(first);
            RegisterPoint(first, 0, bounds, cellSize, grid, gridW);

            while (active.Count > 0)
            {
                int activeIndex = rng.Next(active.Count);
                Vector2 center = active[activeIndex];
                bool accepted = false;

                for (int attempt = 0; attempt < maxAttempts; attempt++)
                {
                    float angle = (float)rng.NextDouble() * Mathf.PI * 2f;
                    float radius = minDistance * (1f + (float)rng.NextDouble());
                    Vector2 candidate = center + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * radius;

                    if (!bounds.Contains(candidate))
                    {
                        continue;
                    }

                    if (IsValid(candidate, points, minDistance, bounds, cellSize, grid, gridW, gridH))
                    {
                        points.Add(candidate);
                        active.Add(candidate);
                        RegisterPoint(candidate, points.Count - 1, bounds, cellSize, grid, gridW);
                        accepted = true;
                        break;
                    }
                }

                if (!accepted)
                {
                    active.RemoveAt(activeIndex);
                }
            }

            return points;
        }

        private static bool IsValid(Vector2 candidate, List<Vector2> points, float minDistance, Rect bounds, float cellSize, int[] grid, int gridW, int gridH)
        {
            int gx = Mathf.Clamp((int)((candidate.x - bounds.xMin) / cellSize), 0, gridW - 1);
            int gy = Mathf.Clamp((int)((candidate.y - bounds.yMin) / cellSize), 0, gridH - 1);

            int minX = Mathf.Max(0, gx - 2);
            int maxX = Mathf.Min(gridW - 1, gx + 2);
            int minY = Mathf.Max(0, gy - 2);
            int maxY = Mathf.Min(gridH - 1, gy + 2);

            float sqrDistance = minDistance * minDistance;
            for (int y = minY; y <= maxY; y++)
            {
                for (int x = minX; x <= maxX; x++)
                {
                    int pointIndex = grid[y * gridW + x];
                    if (pointIndex < 0)
                    {
                        continue;
                    }

                    if ((points[pointIndex] - candidate).sqrMagnitude < sqrDistance)
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        private static void RegisterPoint(Vector2 point, int pointIndex, Rect bounds, float cellSize, int[] grid, int gridW)
        {
            int gx = (int)((point.x - bounds.xMin) / cellSize);
            int gy = (int)((point.y - bounds.yMin) / cellSize);
            grid[gy * gridW + gx] = pointIndex;
        }
    }
}
