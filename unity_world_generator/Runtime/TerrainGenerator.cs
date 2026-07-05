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

        public sealed class TerrainBakeSession
        {
            internal WorldGeneratorConfig config;
            internal Func<float, float, float> sampleHeight01;
            internal Transform terrainRoot;
            internal TerrainGenerationSettings settings;
            internal float worldSizeMeters;
            internal float tileSize;
            internal int tilesPerAxis;
            internal int resolution;
            internal int nextTileIndex;

            public TerrainGenerationResult Result { get; internal set; }
            public int TotalTileSlots { get; internal set; }
            public int CompletedTiles { get; internal set; }
            public bool IsComplete { get; internal set; }
            public bool CancelRequested { get; set; }
        }

        public static int EstimateTileCount(WorldGeneratorConfig config)
        {
            if (config == null)
            {
                return 0;
            }

            TerrainGenerationSettings settings = config.terrainGeneration ?? new TerrainGenerationSettings();
            if (!settings.enableTerrainGeneration)
            {
                return 0;
            }

            float worldSizeMeters = config.worldSizeInChunks * config.chunkSizeMeters;
            float tileSize = Mathf.Max(32f, settings.terrainTileSizeMeters);
            int tilesPerAxis = Mathf.Max(1, Mathf.CeilToInt(worldSizeMeters / tileSize));
            return tilesPerAxis * tilesPerAxis;
        }

        public static TerrainBakeSession BeginBake(
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
                return new TerrainBakeSession
                {
                    Result = new TerrainGenerationResult(),
                    IsComplete = true
                };
            }

            float worldSizeMeters = config.worldSizeInChunks * config.chunkSizeMeters;
            float tileSize = Mathf.Max(32f, settings.terrainTileSizeMeters);
            int tilesPerAxis = Mathf.Max(1, Mathf.CeilToInt(worldSizeMeters / tileSize));
            int resolution = Mathf.Clamp(settings.heightmapResolution, 33, 4097);
            resolution = Mathf.ClosestPowerOfTwo(resolution - 1) + 1;

            if (settings.clearTerrainBeforeGenerate && terrainRoot != null)
            {
                ClearTerrainChildren(terrainRoot);
            }

            TerrainBakeSession session = new TerrainBakeSession
            {
                config = config,
                sampleHeight01 = sampleHeight01,
                terrainRoot = terrainRoot,
                settings = settings,
                worldSizeMeters = worldSizeMeters,
                tileSize = tileSize,
                tilesPerAxis = tilesPerAxis,
                resolution = resolution,
                nextTileIndex = 0,
                TotalTileSlots = tilesPerAxis * tilesPerAxis,
                CompletedTiles = 0,
                Result = new TerrainGenerationResult
                {
                    tilesX = tilesPerAxis,
                    tilesZ = tilesPerAxis,
                    heightmapResolution = resolution,
                    tileSizeMeters = tileSize
                }
            };

            return session;
        }

        public static TerrainBakeSession StepBake(TerrainBakeSession session, int maxTiles = 1)
        {
            if (session == null)
            {
                throw new ArgumentNullException(nameof(session));
            }

            if (session.IsComplete || session.CancelRequested)
            {
                session.IsComplete = true;
                return session;
            }

            int processed = 0;
            while (processed < maxTiles && session.nextTileIndex < session.TotalTileSlots)
            {
                int tileIndex = session.nextTileIndex++;
                int tx = tileIndex % session.tilesPerAxis;
                int tz = tileIndex / session.tilesPerAxis;
                float originX = tx * session.tileSize;
                float originZ = tz * session.tileSize;
                float effectiveTileWidth = Mathf.Min(session.tileSize, session.worldSizeMeters - originX);
                float effectiveTileLength = Mathf.Min(session.tileSize, session.worldSizeMeters - originZ);
                if (effectiveTileWidth > 0.5f && effectiveTileLength > 0.5f)
                {
                    Terrain terrain = CreateTerrainTile(
                        session.config,
                        session.sampleHeight01,
                        session.settings,
                        session.terrainRoot,
                        tx,
                        tz,
                        originX,
                        originZ,
                        effectiveTileWidth,
                        effectiveTileLength,
                        session.resolution);
                    if (terrain != null)
                    {
                        session.Result.terrains.Add(terrain);
                    }

                    session.CompletedTiles++;
                }

                processed++;
            }

            if (session.nextTileIndex >= session.TotalTileSlots || session.CancelRequested)
            {
                session.IsComplete = true;
            }

            return session;
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

            TerrainBakeSession session = BeginBake(config, sampleHeight01, terrainRoot);
            while (!session.IsComplete)
            {
                session = StepBake(session, int.MaxValue);
            }

            return session.Result;
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
            GameObject terrainObject = Terrain.CreateTerrainGameObject(data);
            terrainObject.transform.position = position;
            Terrain terrain = terrainObject.GetComponent<Terrain>();
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
