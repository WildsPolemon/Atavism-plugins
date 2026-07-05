using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public static class TerrainGenerator
    {
        public const string BakeEngineVersion = "incremental-v2";

        public enum TerrainBakePhase
        {
            Clearing = 0,
            BakingTiles = 1,
            Complete = 2
        }

        public sealed class TerrainGenerationResult
        {
            public int tilesX;
            public int tilesZ;
            public int heightmapResolution;
            public float tileSizeMeters;
            public List<Terrain> terrains = new List<Terrain>();
        }

        internal sealed class TerrainTileBuildState
        {
            public int tileX;
            public int tileZ;
            public float originX;
            public float originZ;
            public float tileWidth;
            public float tileLength;
            public float[,] heights;
            public int nextRow;
            public int smoothPassIndex;
            public bool erosionApplied;
            public byte stage;
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
            internal TerrainBakePhase phase;
            internal TerrainTileBuildState activeTile;

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
                    phase = TerrainBakePhase.Complete,
                    IsComplete = true
                };
            }

            float worldSizeMeters = config.worldSizeInChunks * config.chunkSizeMeters;
            float tileSize = Mathf.Max(32f, settings.terrainTileSizeMeters);
            int tilesPerAxis = Mathf.Max(1, Mathf.CeilToInt(worldSizeMeters / tileSize));
            int resolution = Mathf.Clamp(settings.heightmapResolution, 33, 4097);
            resolution = Mathf.ClosestPowerOfTwo(resolution - 1) + 1;

            TerrainBakePhase initialPhase = settings.clearTerrainBeforeGenerate && terrainRoot != null && terrainRoot.childCount > 0
                ? TerrainBakePhase.Clearing
                : TerrainBakePhase.BakingTiles;

            return new TerrainBakeSession
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
                phase = initialPhase,
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
        }

        public static TerrainBakeSession StepBake(TerrainBakeSession session, int maxTiles = 1)
        {
            if (session == null)
            {
                throw new ArgumentNullException(nameof(session));
            }

            int remaining = maxTiles;
            StepBakeBudget(session, () => remaining-- > 0);
            return session;
        }

        public static void StepBakeBudget(TerrainBakeSession session, Func<bool> shouldContinue)
        {
            if (session == null)
            {
                throw new ArgumentNullException(nameof(session));
            }

            if (session.IsComplete || session.CancelRequested)
            {
                session.IsComplete = true;
                return;
            }

            while (shouldContinue() && !session.IsComplete && !session.CancelRequested)
            {
                if (session.phase == TerrainBakePhase.Clearing)
                {
                    if (!StepClearTerrain(session))
                    {
                        session.phase = TerrainBakePhase.BakingTiles;
                    }

                    continue;
                }

                if (session.phase == TerrainBakePhase.BakingTiles)
                {
                    if (!StepActiveTile(session, shouldContinue))
                    {
                        session.IsComplete = true;
                        session.phase = TerrainBakePhase.Complete;
                    }

                    continue;
                }

                session.IsComplete = true;
            }

            if (session.CancelRequested)
            {
                session.IsComplete = true;
                session.phase = TerrainBakePhase.Complete;
            }
        }

        public static float GetProgress01(TerrainBakeSession session)
        {
            if (session == null || session.TotalTileSlots <= 0)
            {
                return session != null && session.IsComplete ? 1f : 0f;
            }

            if (session.phase == TerrainBakePhase.Clearing)
            {
                return 0f;
            }

            float tileProgress = session.CompletedTiles / (float)session.TotalTileSlots;
            if (session.activeTile != null && session.resolution > 1)
            {
                float partial = session.activeTile.nextRow / (float)session.resolution;
                tileProgress += partial / session.TotalTileSlots;
            }

            return Mathf.Clamp01(tileProgress);
        }

        private static bool StepClearTerrain(TerrainBakeSession session)
        {
            if (session.terrainRoot == null)
            {
                return false;
            }

            for (int i = session.terrainRoot.childCount - 1; i >= 0; i--)
            {
                Transform child = session.terrainRoot.GetChild(i);
                Terrain terrain = child.GetComponent<Terrain>();
                if (terrain == null)
                {
                    continue;
                }

                DestroyTerrainObject(child.gameObject, terrain.terrainData);
                return session.terrainRoot.childCount > 0;
            }

            return false;
        }

        private static bool StepActiveTile(TerrainBakeSession session, Func<bool> shouldContinue)
        {
            while (shouldContinue() && !session.CancelRequested)
            {
                if (session.activeTile == null)
                {
                    if (!TryBeginNextTile(session))
                    {
                        return false;
                    }
                }

                if (AdvanceTileBuild(session, shouldContinue))
                {
                    session.activeTile = null;
                }
            }

            return true;
        }

        private static bool TryBeginNextTile(TerrainBakeSession session)
        {
            while (session.nextTileIndex < session.TotalTileSlots)
            {
                int tileIndex = session.nextTileIndex++;
                int tx = tileIndex % session.tilesPerAxis;
                int tz = tileIndex / session.tilesPerAxis;
                float originX = tx * session.tileSize;
                float originZ = tz * session.tileSize;
                float effectiveTileWidth = Mathf.Min(session.tileSize, session.worldSizeMeters - originX);
                float effectiveTileLength = Mathf.Min(session.tileSize, session.worldSizeMeters - originZ);
                if (effectiveTileWidth <= 0.5f || effectiveTileLength <= 0.5f)
                {
                    continue;
                }

                session.activeTile = new TerrainTileBuildState
                {
                    tileX = tx,
                    tileZ = tz,
                    originX = originX,
                    originZ = originZ,
                    tileWidth = effectiveTileWidth,
                    tileLength = effectiveTileLength,
                    heights = new float[session.resolution, session.resolution],
                    nextRow = 0,
                    smoothPassIndex = 0,
                    erosionApplied = false,
                    stage = 0
                };
                return true;
            }

            return false;
        }

        private static bool AdvanceTileBuild(TerrainBakeSession session, Func<bool> shouldContinue)
        {
            TerrainTileBuildState tile = session.activeTile;
            if (tile == null)
            {
                return true;
            }

            if (tile.stage == 0)
            {
                tile.stage = 1;
            }

            if (tile.stage == 1)
            {
                while (tile.nextRow < session.resolution && shouldContinue())
                {
                    SampleHeightRow(session, tile, tile.nextRow);
                    tile.nextRow++;
                }

                if (tile.nextRow < session.resolution)
                {
                    return false;
                }

                tile.stage = 2;
            }

            if (tile.stage == 2)
            {
                if (session.settings.applyHeightmapSmoothing &&
                    session.settings.postProcessSmoothIterations > 0 &&
                    tile.smoothPassIndex < session.settings.postProcessSmoothIterations)
                {
                    if (shouldContinue())
                    {
                        HeightmapPostProcessor.SmoothPass(tile.heights);
                        tile.smoothPassIndex++;
                    }

                    if (tile.smoothPassIndex < session.settings.postProcessSmoothIterations)
                    {
                        return false;
                    }
                }

                if (!tile.erosionApplied && session.settings.erosionStrength > 0.001f)
                {
                    if (shouldContinue())
                    {
                        HeightmapPostProcessor.ErosionPass(tile.heights, session.settings.erosionStrength);
                        tile.erosionApplied = true;
                    }

                    if (!tile.erosionApplied)
                    {
                        return false;
                    }
                }

                tile.stage = 3;
            }

            if (tile.stage == 3)
            {
                if (!shouldContinue())
                {
                    return false;
                }

                Terrain terrain = CreateTerrainFromHeights(
                    session.config,
                    session.settings,
                    session.terrainRoot,
                    tile);
                if (terrain != null)
                {
                    session.Result.terrains.Add(terrain);
                }

                session.CompletedTiles++;
                tile.stage = 4;
                return true;
            }

            return true;
        }

        private static void SampleHeightRow(TerrainBakeSession session, TerrainTileBuildState tile, int z)
        {
            float vz = z / (float)(session.resolution - 1);
            float worldZ = tile.originZ + vz * tile.tileLength;
            for (int x = 0; x < session.resolution; x++)
            {
                float vx = x / (float)(session.resolution - 1);
                float worldX = tile.originX + vx * tile.tileWidth;
                tile.heights[z, x] = Mathf.Clamp01(session.sampleHeight01(worldX, worldZ));
            }
        }

        private static Terrain CreateTerrainFromHeights(
            WorldGeneratorConfig config,
            TerrainGenerationSettings settings,
            Transform terrainRoot,
            TerrainTileBuildState tile)
        {
            TerrainData data = new TerrainData
            {
                heightmapResolution = tile.heights.GetLength(0),
                size = new Vector3(tile.tileWidth, config.maxHeightMeters, tile.tileLength)
            };
            data.SetHeights(0, 0, tile.heights);

            Vector3 position = new Vector3(tile.originX, 0f, tile.originZ);
            GameObject terrainObject = Terrain.CreateTerrainGameObject(data);
            terrainObject.transform.position = position;
            Terrain terrain = terrainObject.GetComponent<Terrain>();
            terrain.name = $"Terrain_{tile.tileX}_{tile.tileZ}";
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
                StepBakeBudget(session, () => true);
            }

            return session.Result;
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

                DestroyTerrainObject(child.gameObject, terrain.terrainData);
            }
        }

        private static void DestroyTerrainObject(GameObject terrainObject, TerrainData data)
        {
            if (Application.isPlaying)
            {
                UnityEngine.Object.Destroy(terrainObject);
                if (data != null)
                {
                    UnityEngine.Object.Destroy(data);
                }
            }
            else
            {
                UnityEngine.Object.DestroyImmediate(terrainObject);
                if (data != null)
                {
                    UnityEngine.Object.DestroyImmediate(data);
                }
            }
        }
    }
}
