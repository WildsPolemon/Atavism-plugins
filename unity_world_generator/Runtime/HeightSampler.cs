using System;
using UnityEngine;

namespace AaaWorldGen
{
    /// <summary>
    /// Shared height sampling used by terrain tiles and world layout generators.
    /// </summary>
    public static class HeightSampler
    {
        public static Func<float, float, float> BuildHeight01Sampler(WorldGeneratorConfig config)
        {
            if (config == null)
            {
                throw new ArgumentNullException(nameof(config));
            }

            Func<float, float, float> sampleBaseHeight01 = (x, z) =>
                DeterministicNoise.SampleFbm01(x, z, config.worldSeed, config.heightNoise);
            TerrainShapeSettings terrainShape = config.terrainShape ?? new TerrainShapeSettings();
            return (x, z) => ApplyTerrainShaping(config, terrainShape, x, z, sampleBaseHeight01(x, z));
        }

        public static float SampleHeightMeters(WorldGeneratorConfig config, float x, float z)
        {
            Func<float, float, float> sample = BuildHeight01Sampler(config);
            return sample(x, z) * config.maxHeightMeters;
        }

        public static float ApplyTerrainShaping(
            WorldGeneratorConfig worldConfig,
            TerrainShapeSettings shape,
            float x,
            float z,
            float baseHeight01)
        {
            float h = Mathf.Clamp01(baseHeight01);
            if (shape == null || !shape.enableAdvancedShaping)
            {
                return h;
            }

            NoiseLayerSettings continentNoise = shape.continentNoise ?? new NoiseLayerSettings(0.00022f, 3, 2f, 0.5f, 201f, -144f);
            float continent = DeterministicNoise.SampleFbm01(x, z, worldConfig.worldSeed + 211, continentNoise);
            h += (continent - 0.5f) * shape.continentInfluence;
            h = Mathf.Clamp01(h);

            NoiseLayerSettings ridgeNoise = shape.ridgeNoise ?? new NoiseLayerSettings(0.00092f, 4, 2.1f, 0.5f, -77f, 129f);
            float ridgeSource = DeterministicNoise.SampleFbm01(x, z, worldConfig.worldSeed + 389, ridgeNoise);
            float ridged = 1f - Mathf.Abs(ridgeSource * 2f - 1f);
            h += (ridged - 0.5f) * shape.ridgeStrength;
            h = Mathf.Clamp01(h);

            float lowlandMask = 1f - Mathf.Clamp01((h - shape.lowlandThreshold01) / Mathf.Max(0.0001f, shape.lowlandThreshold01));
            float flattened = Mathf.Lerp(h, Mathf.SmoothStep(0f, 1f, h), shape.lowlandFlattenStrength * lowlandMask);
            h = Mathf.Clamp01(flattened);

            float mountainMask = Mathf.Clamp01((h - shape.mountainBoostStart01) / Mathf.Max(0.0001f, 1f - shape.mountainBoostStart01));
            h += mountainMask * mountainMask * shape.mountainBoostStrength;
            return Mathf.Clamp01(h);
        }
    }
}
