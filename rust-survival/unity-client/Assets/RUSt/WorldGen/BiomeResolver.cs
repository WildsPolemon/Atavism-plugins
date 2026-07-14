using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public static class BiomeResolver
    {
        public static BiomeDefinition Resolve(float height01, float moisture01, float temperature01, List<BiomeDefinition> biomes)
        {
            if (biomes == null || biomes.Count == 0)
            {
                return null;
            }

            BiomeDefinition best = null;
            float bestScore = float.MaxValue;

            for (int i = 0; i < biomes.Count; i++)
            {
                BiomeDefinition biome = biomes[i];
                if (height01 < biome.minHeight01 || height01 > biome.maxHeight01)
                {
                    continue;
                }

                float moistureDelta = Mathf.Abs(moisture01 - biome.idealMoisture01);
                float tempDelta = Mathf.Abs(temperature01 - biome.idealTemperature01);
                float score = (moistureDelta + tempDelta) / Mathf.Max(0.0001f, biome.blendWeight);

                if (score < bestScore)
                {
                    bestScore = score;
                    best = biome;
                }
            }

            return best ?? biomes[0];
        }
    }
}
