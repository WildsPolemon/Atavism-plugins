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

            float worldSizeMeters = config.worldSizeInChunks * config.chunkSizeMeters;
            Func<float, float, float> sampleBaseHeight01 = (x, z) =>
                DeterministicNoise.SampleFbm01(x, z, config.worldSeed, config.heightNoise);
            TerrainShapeSettings terrainShape = config.terrainShape ?? new TerrainShapeSettings();
            return (x, z) => ApplyTerrainShaping(config, terrainShape, worldSizeMeters, x, z, sampleBaseHeight01(x, z));
        }

        public static float SampleHeightMeters(WorldGeneratorConfig config, float x, float z)
        {
            Func<float, float, float> sample = BuildHeight01Sampler(config);
            return sample(x, z) * config.maxHeightMeters;
        }

        public static float ApplyTerrainShaping(
            WorldGeneratorConfig worldConfig,
            TerrainShapeSettings shape,
            float worldSizeMeters,
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

            if (shape.valleyCarveStrength > 0.001f)
            {
                NoiseLayerSettings valleyNoise = shape.valleyNoise ?? new NoiseLayerSettings(0.0018f, 3, 2.05f, 0.48f, 88f, -41f);
                float valleySource = DeterministicNoise.SampleFbm01(x, z, worldConfig.worldSeed + 467, valleyNoise);
                float valley = Mathf.Pow(1f - Mathf.Abs(valleySource * 2f - 1f), 1.6f);
                float midlandMask = 1f - Mathf.Clamp01((h - shape.mountainBoostStart01) / Mathf.Max(0.0001f, 1f - shape.mountainBoostStart01));
                midlandMask *= Mathf.Clamp01(h / Mathf.Max(0.0001f, shape.lowlandThreshold01));
                h -= valley * shape.valleyCarveStrength * midlandMask;
                h = Mathf.Clamp01(h);
            }

            float lowlandMask = 1f - Mathf.Clamp01((h - shape.lowlandThreshold01) / Mathf.Max(0.0001f, shape.lowlandThreshold01));
            float flattened = Mathf.Lerp(h, Mathf.SmoothStep(0f, 1f, h), shape.lowlandFlattenStrength * lowlandMask);
            h = Mathf.Clamp01(flattened);

            float mountainMask = Mathf.Clamp01((h - shape.mountainBoostStart01) / Mathf.Max(0.0001f, 1f - shape.mountainBoostStart01));
            float boosted = h + mountainMask * mountainMask * shape.mountainBoostStrength;
            h = Mathf.Pow(Mathf.Clamp01(boosted), 1f / Mathf.Max(1f, shape.mountainPeakPower));

            if (shape.detailStrength > 0.001f)
            {
                NoiseLayerSettings detailNoise = shape.detailNoise ?? new NoiseLayerSettings(0.0065f, 2, 2.2f, 0.42f, -33f, 67f);
                float detail = DeterministicNoise.SampleFbm01(x, z, worldConfig.worldSeed + 523, detailNoise) - 0.5f;
                float detailMask = 1f - lowlandMask * 0.65f;
                h += detail * shape.detailStrength * detailMask;
                h = Mathf.Clamp01(h);
            }

            if (shape.coastalFalloffStrength > 0.001f && worldSizeMeters > 1f)
            {
                float edgeX = Mathf.Min(x, worldSizeMeters - x) / worldSizeMeters;
                float edgeZ = Mathf.Min(z, worldSizeMeters - z) / worldSizeMeters;
                float edge01 = Mathf.Min(edgeX, edgeZ);
                float width = Mathf.Max(0.05f, shape.coastalFalloffWidth01);
                float coastMask = 1f - Mathf.SmoothStep(0f, width, edge01);
                h = Mathf.Lerp(h, worldConfig.seaLevel01 * 0.85f, coastMask * shape.coastalFalloffStrength);
            }

            return Mathf.Clamp01(h);
        }
    }
}
