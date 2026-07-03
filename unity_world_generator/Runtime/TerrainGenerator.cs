using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public static class TerrainGenerator
    {
        public sealed class TerrainGenerationResult
        {
            public int tilesX;
            public int tilesZ;
            public int heightmapResolution;
            public float tileSizeMeters;
            public List<Terrain> terrains = new List<Terrain>();
        }

        public static TerrainGenerationResult Generate(
            WorldGeneratorConfig config,
            Func<float, float, float> sampleHeight01,
            Transform terrainRoot)
        {
            if (config == null)
            {
                throw new ArgumentNullException(nameof(config));
            }

            if (sampleHeight01 == null)
            {
                throw new ArgumentNullException(nameof(sampleHeight01));
            }

            TerrainGenerationSettings settings = config.terrainGeneration ?? new TerrainGenerationSettings();
            if (!settings.enableTerrainGeneration)
            {
                return new TerrainGenerationResult();
            }

            float worldSizeMeters = config.worldSizeInChunks * config.chunkSizeMeters;
            float tileSize = Mathf.Max(32f, settings.terrainTileSizeMeters);
            int tilesPerAxis = Mathf.Max(1, Mathf.CeilToInt(worldSizeMeters / tileSize));
            int resolution = Mathf.Clamp(settings.heightmapResolution, 33, 4097);
            // Unity terrains expect 2^n + 1 resolutions.
            resolution = Mathf.ClosestPowerOfTwo(resolution - 1) + 1;

            if (settings.clearTerrainBeforeGenerate && terrainRoot != null)
            {
                ClearTerrainChildren(terrainRoot);
            }

            TerrainGenerationResult result = new TerrainGenerationResult
            {
                tilesX = tilesPerAxis,
                tilesZ = tilesPerAxis,
                heightmapResolution = resolution,
                tileSizeMeters = tileSize
            };

            for (int tz = 0; tz < tilesPerAxis; tz++)
            {
                for (int tx = 0; tx < tilesPerAxis; tx++)
                {
                    float originX = tx * tileSize;
                    float originZ = tz * tileSize;
                    float effectiveTileWidth = Mathf.Min(tileSize, worldSizeMeters - originX);
                    float effectiveTileLength = Mathf.Min(tileSize, worldSizeMeters - originZ);
                    if (effectiveTileWidth <= 0.5f || effectiveTileLength <= 0.5f)
                    {
                        continue;
                    }

                    Terrain terrain = CreateTerrainTile(
                        config,
                        sampleHeight01,
                        settings,
                        terrainRoot,
                        tx,
                        tz,
                        originX,
                        originZ,
                        effectiveTileWidth,
                        effectiveTileLength,
                        resolution);
                    if (terrain != null)
                    {
                        result.terrains.Add(terrain);
                    }
                }
            }

            return result;
        }

        private static Terrain CreateTerrainTile(
            WorldGeneratorConfig config,
            Func<float, float, float> sampleHeight01,
            TerrainGenerationSettings settings,
            Transform terrainRoot,
            int tileX,
            int tileZ,
            float originX,
            float originZ,
            float tileWidth,
            float tileLength,
            int resolution)
        {
            TerrainData data = new TerrainData
            {
                heightmapResolution = resolution,
                size = new Vector3(tileWidth, config.maxHeightMeters, tileLength)
            };

            float[,] heights = new float[resolution, resolution];
            for (int z = 0; z < resolution; z++)
            {
                float vz = z / (float)(resolution - 1);
                float worldZ = originZ + vz * tileLength;
                for (int x = 0; x < resolution; x++)
                {
                    float vx = x / (float)(resolution - 1);
                    float worldX = originX + vx * tileWidth;
                    heights[z, x] = Mathf.Clamp01(sampleHeight01(worldX, worldZ));
                }
            }

            HeightmapPostProcessor.Apply(heights, settings);
            data.SetHeights(0, 0, heights);

            Vector3 position = new Vector3(originX, 0f, originZ);
            Terrain terrain = Terrain.CreateTerrain(data, position);
            terrain.name = $"Terrain_{tileX}_{tileZ}";
            terrain.drawInstanced = settings.drawInstanced;

            if (settings.terrainMaterial != null)
            {
                terrain.materialTemplate = settings.terrainMaterial;
            }

            if (terrainRoot != null)
            {
                terrain.transform.SetParent(terrainRoot, true);
            }

            TerrainCollider collider = terrain.GetComponent<TerrainCollider>();
            if (collider != null)
            {
                collider.terrainData = data;
            }

            return terrain;
        }

        public static void ClearTerrainChildren(Transform terrainRoot)
        {
            if (terrainRoot == null)
            {
                return;
            }

            for (int i = terrainRoot.childCount - 1; i >= 0; i--)
            {
                Transform child = terrainRoot.GetChild(i);
                Terrain terrain = child.GetComponent<Terrain>();
                if (terrain == null)
                {
                    continue;
                }

                TerrainData data = terrain.terrainData;
                if (Application.isPlaying)
                {
                    UnityEngine.Object.Destroy(child.gameObject);
                }
                else
                {
                    UnityEngine.Object.DestroyImmediate(child.gameObject);
                }

                if (data != null)
                {
                    if (Application.isPlaying)
                    {
                        UnityEngine.Object.Destroy(data);
                    }
                    else
                    {
                        UnityEngine.Object.DestroyImmediate(data);
                    }
                }
            }
        }
    }
}
