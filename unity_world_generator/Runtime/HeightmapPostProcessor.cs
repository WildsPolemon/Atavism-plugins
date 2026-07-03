using UnityEngine;

namespace AaaWorldGen
{
    /// <summary>
    /// Lightweight heightmap polish: seam-safe smoothing and thermal erosion.
    /// </summary>
    public static class HeightmapPostProcessor
    {
        public static void Apply(float[,] heights, TerrainGenerationSettings settings)
        {
            if (heights == null || settings == null)
            {
                return;
            }

            int iterations = settings.postProcessSmoothIterations;
            if (settings.applyHeightmapSmoothing && iterations > 0)
            {
                for (int i = 0; i < iterations; i++)
                {
                    SmoothPass(heights);
                }
            }

            if (settings.erosionStrength > 0.001f)
            {
                ErosionPass(heights, settings.erosionStrength);
            }
        }

        private static void SmoothPass(float[,] heights)
        {
            int resZ = heights.GetLength(0);
            int resX = heights.GetLength(1);
            float[,] copy = (float[,])heights.Clone();

            for (int z = 1; z < resZ - 1; z++)
            {
                for (int x = 1; x < resX - 1; x++)
                {
                    float avg = (
                        copy[z - 1, x] + copy[z + 1, x] +
                        copy[z, x - 1] + copy[z, x + 1] +
                        copy[z, x] * 2f) / 6f;
                    heights[z, x] = Mathf.Lerp(copy[z, x], avg, 0.55f);
                }
            }
        }

        private static void ErosionPass(float[,] heights, float strength)
        {
            int resZ = heights.GetLength(0);
            int resX = heights.GetLength(1);
            float talus = 1.5f / Mathf.Max(resX, resZ);
            float[,] copy = (float[,])heights.Clone();

            for (int z = 1; z < resZ - 1; z++)
            {
                for (int x = 1; x < resX - 1; x++)
                {
                    float center = copy[z, x];
                    float lowest = center;
                    lowest = Mathf.Min(lowest, copy[z - 1, x]);
                    lowest = Mathf.Min(lowest, copy[z + 1, x]);
                    lowest = Mathf.Min(lowest, copy[z, x - 1]);
                    lowest = Mathf.Min(lowest, copy[z, x + 1]);

                    float delta = center - lowest;
                    if (delta > talus)
                    {
                        heights[z, x] = center - (delta - talus) * strength;
                    }
                }
            }
        }
    }
}
