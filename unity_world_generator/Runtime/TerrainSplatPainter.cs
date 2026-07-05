using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    /// <summary>Paints Unity terrain alphamaps from biome climate sampling.</summary>
    public static class TerrainSplatPainter
    {
        public static bool HasPaintableLayers(WorldGeneratorConfig config)
        {
            if (config?.biomes == null)
            {
                return false;
            }

            TerrainGenerationSettings settings = config.terrainGeneration ?? new TerrainGenerationSettings();
            if (settings.defaultTerrainDiffuse != null)
            {
                return true;
            }

            for (int i = 0; i < config.biomes.Count; i++)
            {
                BiomeDefinition biome = config.biomes[i];
                if (biome != null && biome.terrainDiffuse != null)
                {
                    return true;
                }
            }

            return false;
        }

        public static void ApplyBiomeAlphamap(
            TerrainData data,
            WorldGeneratorConfig config,
            float originX,
            float originZ,
            float tileWidth,
            float tileLength,
            Func<float, float, BiomeDefinition> sampleBiome)
        {
            if (data == null || config == null || sampleBiome == null || !HasPaintableLayers(config))
            {
                return;
            }

            List<BiomeDefinition> paintedBiomes = new List<BiomeDefinition>();
            Dictionary<string, int> layerByBiomeId = new Dictionary<string, int>();
            List<TerrainLayer> layers = new List<TerrainLayer>();

            TerrainGenerationSettings settings = config.terrainGeneration ?? new TerrainGenerationSettings();
            if (settings.defaultTerrainDiffuse != null)
            {
                layers.Add(CreateLayer(settings.defaultTerrainDiffuse, settings.defaultTerrainNormal, settings.defaultTerrainTileSize));
                layerByBiomeId[string.Empty] = 0;
            }

            for (int i = 0; i < config.biomes.Count; i++)
            {
                BiomeDefinition biome = config.biomes[i];
                if (biome == null || biome.terrainDiffuse == null || layerByBiomeId.ContainsKey(biome.biomeId))
                {
                    continue;
                }

                layerByBiomeId[biome.biomeId] = layers.Count;
                paintedBiomes.Add(biome);
                layers.Add(CreateLayer(biome.terrainDiffuse, biome.terrainNormal, biome.terrainTileSize));
            }

            if (layers.Count == 0)
            {
                return;
            }

            data.terrainLayers = layers.ToArray();
            data.alphamapResolution = Mathf.Max(16, data.heightmapResolution);
            int alphaRes = data.alphamapResolution;
            float[,,] alphas = new float[alphaRes, alphaRes, layers.Count];

            for (int z = 0; z < alphaRes; z++)
            {
                float vz = z / (float)(alphaRes - 1);
                float worldZ = originZ + vz * tileLength;
                for (int x = 0; x < alphaRes; x++)
                {
                    float vx = x / (float)(alphaRes - 1);
                    float worldX = originX + vx * tileWidth;
                    BiomeDefinition biome = sampleBiome(worldX, worldZ);
                    int layer = ResolveLayer(layerByBiomeId, biome);
                    alphas[z, x, layer] = 1f;
                }
            }

            data.SetAlphamaps(0, 0, alphas);
        }

        private static int ResolveLayer(Dictionary<string, int> layerByBiomeId, BiomeDefinition biome)
        {
            if (biome != null && layerByBiomeId.TryGetValue(biome.biomeId, out int layer))
            {
                return layer;
            }

            return layerByBiomeId.TryGetValue(string.Empty, out int fallback) ? fallback : 0;
        }

        private static TerrainLayer CreateLayer(Texture2D diffuse, Texture2D normal, float tileSize)
        {
            TerrainLayer layer = new TerrainLayer
            {
                diffuseTexture = diffuse,
                normalMapTexture = normal,
                tileSize = new Vector2(Mathf.Max(4f, tileSize), Mathf.Max(4f, tileSize))
            };
            return layer;
        }
    }
}
