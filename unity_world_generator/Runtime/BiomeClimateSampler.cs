using System;
using UnityEngine;

namespace AaaWorldGen
{
    /// <summary>Shared height/moisture/temperature → biome sampling for runtime and editor preview.</summary>
    public static class BiomeClimateSampler
    {
        public static Func<float, float, BiomeDefinition> BuildSampler(WorldGeneratorConfig config)
        {
            if (config == null)
            {
                throw new ArgumentNullException(nameof(config));
            }

            Func<float, float, float> sampleHeight01 = HeightSampler.BuildHeight01Sampler(config);
            float worldSizeMeters = config.worldSizeInChunks * config.chunkSizeMeters;
            BiomeClimateSettings climate = config.biomeClimate ?? new BiomeClimateSettings();
            NoiseLayerSettings variationNoise = climate.variationNoise ??
                                                new NoiseLayerSettings(0.0032f, 3, 2f, 0.5f, 57f, -33f);

            return (x, z) =>
            {
                float h = sampleHeight01(x, z);
                float m = DeterministicNoise.SampleFbm01(x, z, config.worldSeed + 17, config.moistureNoise);
                float t = DeterministicNoise.SampleFbm01(x, z, config.worldSeed + 53, config.temperatureNoise);

                float latitude01 = Mathf.Abs((z / Mathf.Max(1f, worldSizeMeters)) * 2f - 1f);
                t -= latitude01 * climate.latitudeTemperatureInfluence;

                float heightAboveSea = Mathf.Max(0f, h - config.seaLevel01);
                t -= heightAboveSea * climate.elevationTemperatureDrop;

                float coastProximity = Mathf.Clamp01(1f - Mathf.Abs(h - config.seaLevel01) / 0.22f);
                m += coastProximity * climate.coastalMoistureBoost;

                float variation = DeterministicNoise.SampleFbm01(x, z, config.worldSeed + 97, variationNoise) - 0.5f;
                m += variation * climate.variationStrength;
                t += variation * climate.variationStrength * 0.45f;

                m = Mathf.Clamp01(m);
                t = Mathf.Clamp01(t);
                return BiomeResolver.Resolve(h, m, t, config.biomes);
            };
        }
    }
}
