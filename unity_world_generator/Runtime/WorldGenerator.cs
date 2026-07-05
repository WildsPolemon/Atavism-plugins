using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public sealed class WorldGenerator : MonoBehaviour
    {
        [SerializeField] private WorldGeneratorConfig config;
        [SerializeField] private bool spawnRuntimePrefabs = true;
        [HideInInspector] [SerializeField] private bool exportJsonAfterGeneration = false;
        [HideInInspector] [SerializeField] private string exportFileName = "generated_world_layout.json";

        private WorldGenerationResult lastResult;
        private TerrainGenerator.TerrainGenerationResult lastTerrainResult;
        private readonly Dictionary<int, GameObject> activeStreamingObjects = new Dictionary<int, GameObject>();
        private readonly Dictionary<int, RuntimeSpawnKind> activeStreamingKinds = new Dictionary<int, RuntimeSpawnKind>();
        private readonly Dictionary<Vector2Int, List<RuntimeSpawnInstruction>> instructionsByCell = new Dictionary<Vector2Int, List<RuntimeSpawnInstruction>>();
        private readonly List<RuntimeSpawnInstruction> alwaysLoadedInstructions = new List<RuntimeSpawnInstruction>();
        private readonly Dictionary<long, WorldSector> sectorsByCoord = new Dictionary<long, WorldSector>();
        private RuntimeOptimizationSettings runtimeOptimization;
        private bool streamingEnabled;
        private int nextStreamingInstructionId = 1;
        private float streamingRefreshTimer;
        private float effectiveStreamingCellSize = 220f;
        private float effectiveStreamingRadius = 1400f;

        private enum RuntimeSpawnKind
        {
            City,
            Cave,
            Resource,
            Road,
            PlayerSpawn,
            NpcSpawn,
            MobZone
        }

        private sealed class RuntimeSpawnInstruction
        {
            public int id;
            public RuntimeSpawnKind kind;
            public Vector3 position;
            public float yaw;
            public float scaleXZ = 1f;
            public bool absoluteScaleXZ;
            public bool alwaysLoaded;
            public int priority;
            public string fallbackName;
            public GameObject prefab;
            public Transform parent;
        }

        public WorldGeneratorConfig Config
        {
            get => config;
            set => config = value;
        }

        public WorldGenerationResult LastResult => lastResult;
        public TerrainGenerator.TerrainGenerationResult LastTerrainResult => lastTerrainResult;

        public bool TryGetSectorAt(Vector3 worldPosition, out WorldSector sector)
        {
            sector = null;
            if (lastResult == null || lastResult.sectors == null || lastResult.sectors.Count == 0 || config == null)
            {
                return false;
            }

            SectorGenerationSettings settings = config.sectorSettings ?? new SectorGenerationSettings();
            if (!settings.enableSectors)
            {
                return false;
            }

            float sectorSize = Mathf.Max(64f, settings.sectorSizeMeters);
            int sx = Mathf.FloorToInt(worldPosition.x / sectorSize);
            int sz = Mathf.FloorToInt(worldPosition.z / sectorSize);
            return sectorsByCoord.TryGetValue(MakeSectorKey(sx, sz), out sector);
        }

        public List<WorldSector> GetSectorsAround(Vector3 worldPosition, int neighborRadius)
        {
            List<WorldSector> output = new List<WorldSector>();
            if (!TryGetSectorAt(worldPosition, out WorldSector center))
            {
                return output;
            }

            int radius = Mathf.Max(0, neighborRadius);
            for (int z = -radius; z <= radius; z++)
            {
                for (int x = -radius; x <= radius; x++)
                {
                    int sx = center.sectorX + x;
                    int sz = center.sectorZ + z;
                    if (sectorsByCoord.TryGetValue(MakeSectorKey(sx, sz), out WorldSector sector))
                    {
                        output.Add(sector);
                    }
                }
            }

            return output;
        }

        private void Update()
        {
            if (!Application.isPlaying || !streamingEnabled || runtimeOptimization == null || !runtimeOptimization.enableDistanceStreaming)
            {
                return;
            }

            streamingRefreshTimer += Time.deltaTime;
            if (streamingRefreshTimer < Mathf.Max(0.05f, runtimeOptimization.refreshIntervalSeconds))
            {
                return;
            }

            streamingRefreshTimer = 0f;
            RefreshStreaming();
        }

        public WorldGenerationResult GenerateNow()
        {
            GenerateLayout();
            BakeTerrainSynchronously();
            return FinalizeWorldGeneration();
        }

        /// <summary>Builds cities, roads, caves, resources, spawns, and sectors without terrain or runtime spawning.</summary>
        public WorldGenerationResult GenerateLayout()
        {
            if (config == null)
            {
                throw new InvalidOperationException("WorldGeneratorConfig is missing.");
            }

            Func<float, float, float> sampleHeight01 = HeightSampler.BuildHeight01Sampler(config);

            float worldSizeMeters = config.worldSizeInChunks * config.chunkSizeMeters;
            BiomeClimateSettings climate = config.biomeClimate ?? new BiomeClimateSettings();
            NoiseLayerSettings variationNoise = climate.variationNoise ?? new NoiseLayerSettings(0.0032f, 3, 2f, 0.5f, 57f, -33f);

            Func<float, float, BiomeDefinition> sampleBiome = (x, z) =>
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

            List<CityPlacement> cities = CityGenerator.Generate(config, sampleHeight01, sampleBiome);
            List<RoadSegment> worldRoads = RoadNetworkGenerator.GenerateIntercityRoads(config, cities, sampleHeight01);
            List<CavePlacement> caves = CaveStampGenerator.GenerateVariantA(config, cities, sampleHeight01, sampleBiome);
            List<ResourceNodePlacement> resources = ResourceGenerator.Generate(config, cities, caves, sampleBiome, sampleHeight01);
            SpawnGenerator.Generate(
                config,
                cities,
                caves,
                sampleHeight01,
                sampleBiome,
                out List<SpawnPointPlacement> playerSpawns,
                out List<SpawnPointPlacement> npcSpawns,
                out List<SpawnZonePlacement> mobSpawnZones);
            List<WorldSector> sectors = SectorGenerator.Build(
                config,
                cities,
                worldRoads,
                caves,
                resources,
                playerSpawns,
                npcSpawns,
                mobSpawnZones);

            lastResult = new WorldGenerationResult
            {
                worldSeed = config.worldSeed,
                worldWidth = config.worldSizeInChunks * config.chunkSizeMeters,
                worldLength = config.worldSizeInChunks * config.chunkSizeMeters,
                cities = cities,
                worldRoads = worldRoads,
                caves = caves,
                resources = resources,
                playerSpawns = playerSpawns,
                npcSpawns = npcSpawns,
                mobSpawnZones = mobSpawnZones,
                sectors = sectors
            };
            BuildSectorLookup(lastResult.sectors);
            return lastResult;
        }

        /// <summary>Spawns runtime prefabs and exports JSON after layout when terrain is disabled.</summary>
        public WorldGenerationResult CompleteWorldGenerationWithoutTerrain()
        {
            lastTerrainResult = null;
            return FinalizeWorldGeneration();
        }

        /// <summary>Spawns runtime prefabs and exports JSON after layout and terrain are ready.</summary>
        public WorldGenerationResult FinalizeWorldGeneration()
        {
            if (lastResult == null)
            {
                throw new InvalidOperationException("GenerateLayout must run before FinalizeWorldGeneration.");
            }

            if (spawnRuntimePrefabs)
            {
                SpawnRuntime(lastResult);
            }

            if (exportJsonAfterGeneration)
            {
                string path = System.IO.Path.Combine(Application.persistentDataPath, exportFileName);
                WorldJsonExporter.Export(path, lastResult);
                Debug.Log($"World layout exported to {path}");
            }

            return lastResult;
        }

        private void BakeTerrainSynchronously()
        {
            TerrainGenerationSettings terrainSettings = config.terrainGeneration ?? new TerrainGenerationSettings();
            if (terrainSettings.enableTerrainGeneration)
            {
                TerrainGenerator.TerrainBakeSession session = BeginTerrainOnlyBake();
                while (!session.IsComplete)
                {
                    TerrainGenerator.StepBakeBudget(session, () => true);
                }

                CompleteTerrainOnlyBake(session);
                Debug.Log($"Terrain generated: {lastTerrainResult.terrains.Count} tiles " +
                          $"({lastTerrainResult.tilesX}x{lastTerrainResult.tilesZ}, res={lastTerrainResult.heightmapResolution}).");
            }
            else
            {
                lastTerrainResult = null;
            }
        }

        /// <summary>Bakes Unity terrain tiles only — fast iteration without layout/spawn pass.</summary>
        public TerrainGenerator.TerrainGenerationResult GenerateTerrainOnly()
        {
            TerrainGenerator.TerrainBakeSession session = BeginTerrainOnlyBake();
            while (!session.IsComplete)
            {
                TerrainGenerator.StepBakeBudget(session, () => true);
            }

            return CompleteTerrainOnlyBake(session);
        }

        public TerrainGenerator.TerrainBakeSession BeginTerrainOnlyBake()
        {
            if (config == null)
            {
                throw new InvalidOperationException("WorldGeneratorConfig is missing.");
            }

            TerrainGenerationSettings terrainSettings = config.terrainGeneration ?? new TerrainGenerationSettings();
            if (!terrainSettings.enableTerrainGeneration)
            {
                throw new InvalidOperationException("terrainGeneration.enableTerrainGeneration is disabled.");
            }

            Func<float, float, float> sampleHeight01 = HeightSampler.BuildHeight01Sampler(config);
            Transform terrainRoot = EnsureTerrainRoot(terrainSettings);
            return TerrainGenerator.BeginBake(config, sampleHeight01, terrainRoot);
        }

        public TerrainGenerator.TerrainGenerationResult CompleteTerrainOnlyBake(
            TerrainGenerator.TerrainBakeSession session)
        {
            if (session == null)
            {
                throw new ArgumentNullException(nameof(session));
            }

            if (!session.IsComplete)
            {
                throw new InvalidOperationException("Terrain bake session is not complete.");
            }

            lastTerrainResult = session.Result;
            Debug.Log($"Terrain-only bake: {lastTerrainResult.terrains.Count} tiles.");
            return lastTerrainResult;
        }

        private Transform EnsureTerrainRoot(TerrainGenerationSettings settings)
        {
            if (settings.terrainRoot != null)
            {
                return settings.terrainRoot;
            }

            Transform existing = transform.Find("TerrainRoot");
            if (existing != null)
            {
                settings.terrainRoot = existing;
                return existing;
            }

            GameObject root = new GameObject("TerrainRoot");
            root.transform.SetParent(transform, false);
            settings.terrainRoot = root.transform;
            return root.transform;
        }

        [ContextMenu("Generate World")]
        private void GenerateFromContext()
        {
            GenerateNow();
        }

        public void ExportLastResultJson(string absolutePath)
        {
            if (string.IsNullOrWhiteSpace(absolutePath))
            {
                throw new ArgumentException("Export path is empty.", nameof(absolutePath));
            }

            if (lastResult == null)
            {
                GenerateNow();
            }

            WorldJsonExporter.Export(absolutePath, lastResult);
        }

        private void SpawnRuntime(WorldGenerationResult result)
        {
            runtimeOptimization = config.runtimeOptimization ?? new RuntimeOptimizationSettings();
            effectiveStreamingCellSize = runtimeOptimization.cellSizeMeters;
            effectiveStreamingRadius = runtimeOptimization.streamingRadiusMeters;
            SectorGenerationSettings sectorSettings = config.sectorSettings ?? new SectorGenerationSettings();
            if (sectorSettings.enableSectors)
            {
                effectiveStreamingCellSize = Mathf.Max(64f, sectorSettings.sectorSizeMeters);
                if (sectorSettings.neighborLoadRadius > 0)
                {
                    float sectorBasedRadius = (sectorSettings.neighborLoadRadius + 0.5f) * effectiveStreamingCellSize;
                    effectiveStreamingRadius = Mathf.Max(effectiveStreamingRadius, sectorBasedRadius);
                }
            }

            ClearStreamingState(!config.clearRootsBeforeSpawn);

            if (config.clearRootsBeforeSpawn)
            {
                ClearRoot(config.cityRoot);
                ClearRoot(config.caveRoot);
                ClearRoot(config.resourceRoot);
                ClearRoot(config.roadRoot);
                ClearRoot(config.spawnRoot);
            }

            if (runtimeOptimization.enableDistanceStreaming)
            {
                BuildStreamingInstructions(result);
                RefreshStreaming();
                streamingEnabled = true;
                streamingRefreshTimer = 0f;
            }
            else
            {
                SpawnCities(result.cities);
                SpawnRoads(result.worldRoads);
                SpawnCaves(result.caves);
                SpawnResources(result.resources);
                SpawnPoints(result.playerSpawns, config.playerSpawnMarkerPrefab, "player_spawn");
                SpawnPoints(result.npcSpawns, config.npcSpawnMarkerPrefab, "npc_spawn");
                SpawnMobZones(result.mobSpawnZones);
                streamingEnabled = false;
            }
        }

        private void BuildStreamingInstructions(WorldGenerationResult result)
        {
            instructionsByCell.Clear();
            alwaysLoadedInstructions.Clear();
            nextStreamingInstructionId = 1;

            RegisterCityInstructions(result.cities);
            RegisterRoadInstructions(result.worldRoads);
            RegisterCaveInstructions(result.caves);
            RegisterResourceInstructions(result.resources);
            RegisterPointInstructions(result.playerSpawns, config.playerSpawnMarkerPrefab, "player_spawn", RuntimeSpawnKind.PlayerSpawn, 900);
            RegisterPointInstructions(result.npcSpawns, config.npcSpawnMarkerPrefab, "npc_spawn", RuntimeSpawnKind.NpcSpawn, 820);
            RegisterMobZoneInstructions(result.mobSpawnZones);
        }

        private void RegisterCityInstructions(List<CityPlacement> cities)
        {
            bool keepLoaded = runtimeOptimization != null && runtimeOptimization.keepCitiesAlwaysLoaded;
            for (int i = 0; i < cities.Count; i++)
            {
                CityPlacement city = cities[i];
                BiomeDefinition biome = config.biomes.Find(b => b.biomeId == city.biomeId);
                if (biome == null || biome.cityPrefabs == null || biome.cityPrefabs.Length == 0)
                {
                    continue;
                }

                GameObject prefab = biome.cityPrefabs[i % biome.cityPrefabs.Length];
                RegisterInstruction(new RuntimeSpawnInstruction
                {
                    kind = RuntimeSpawnKind.City,
                    position = city.center,
                    yaw = 0f,
                    prefab = prefab,
                    parent = config.cityRoot,
                    alwaysLoaded = keepLoaded,
                    priority = 1200,
                    fallbackName = "city"
                });
            }
        }

        private void RegisterCaveInstructions(List<CavePlacement> caves)
        {
            for (int i = 0; i < caves.Count; i++)
            {
                CavePlacement cave = caves[i];
                BiomeDefinition biome = config.biomes.Find(b => b.biomeId == cave.biomeId);
                if (biome == null || biome.caveEntrancePrefabs == null || biome.caveEntrancePrefabs.Length == 0)
                {
                    continue;
                }

                GameObject prefab = biome.caveEntrancePrefabs[i % biome.caveEntrancePrefabs.Length];
                RegisterInstruction(new RuntimeSpawnInstruction
                {
                    kind = RuntimeSpawnKind.Cave,
                    position = cave.entrance,
                    yaw = cave.yaw,
                    prefab = prefab,
                    parent = config.caveRoot,
                    priority = 980,
                    fallbackName = "cave"
                });
            }
        }

        private void RegisterResourceInstructions(List<ResourceNodePlacement> resources)
        {
            for (int i = 0; i < resources.Count; i++)
            {
                ResourceNodePlacement node = resources[i];
                BiomeDefinition biome = config.biomes.Find(b => b.biomeId == node.biomeId);
                if (biome == null || biome.resourcePrefabs == null || biome.resourcePrefabs.Length == 0)
                {
                    continue;
                }

                GameObject prefab = biome.resourcePrefabs[i % biome.resourcePrefabs.Length];
                RegisterInstruction(new RuntimeSpawnInstruction
                {
                    kind = RuntimeSpawnKind.Resource,
                    position = node.position,
                    yaw = node.yaw,
                    prefab = prefab,
                    parent = config.resourceRoot,
                    priority = 180,
                    fallbackName = "resource"
                });
            }
        }

        private void RegisterRoadInstructions(List<RoadSegment> roads)
        {
            if (roads == null || roads.Count == 0 || config.roadMarkerPrefab == null)
            {
                return;
            }

            for (int i = 0; i < roads.Count; i++)
            {
                RoadSegment seg = roads[i];
                Vector3 mid = (seg.from + seg.to) * 0.5f;
                Vector3 dir = seg.to - seg.from;
                if (dir.sqrMagnitude < 0.0001f)
                {
                    continue;
                }

                float yaw = Mathf.Atan2(dir.x, dir.z) * Mathf.Rad2Deg;
                RegisterInstruction(new RuntimeSpawnInstruction
                {
                    kind = RuntimeSpawnKind.Road,
                    position = mid,
                    yaw = yaw,
                    prefab = config.roadMarkerPrefab,
                    parent = config.roadRoot,
                    priority = 520,
                    fallbackName = "road"
                });
            }
        }

        private void RegisterPointInstructions(
            List<SpawnPointPlacement> points,
            GameObject prefab,
            string fallbackName,
            RuntimeSpawnKind kind,
            int priority)
        {
            if (points == null || points.Count == 0)
            {
                return;
            }

            for (int i = 0; i < points.Count; i++)
            {
                SpawnPointPlacement point = points[i];
                RegisterInstruction(new RuntimeSpawnInstruction
                {
                    kind = kind,
                    position = point.position,
                    yaw = point.yaw,
                    prefab = prefab,
                    parent = config.spawnRoot,
                    priority = priority,
                    fallbackName = fallbackName
                });
            }
        }

        private void RegisterMobZoneInstructions(List<SpawnZonePlacement> zones)
        {
            if (zones == null || zones.Count == 0)
            {
                return;
            }

            for (int i = 0; i < zones.Count; i++)
            {
                SpawnZonePlacement zone = zones[i];
                RegisterInstruction(new RuntimeSpawnInstruction
                {
                    kind = RuntimeSpawnKind.MobZone,
                    position = zone.center,
                    yaw = 0f,
                    prefab = config.mobZoneMarkerPrefab,
                    parent = config.spawnRoot,
                    priority = 540,
                    fallbackName = $"mob_zone_t{zone.tier}",
                    scaleXZ = zone.radius * 2f,
                    absoluteScaleXZ = true
                });
            }
        }

        private void RegisterInstruction(RuntimeSpawnInstruction instruction)
        {
            instruction.id = nextStreamingInstructionId++;

            if (instruction.alwaysLoaded)
            {
                alwaysLoadedInstructions.Add(instruction);
                return;
            }

            float cellSize = Mathf.Max(10f, effectiveStreamingCellSize);
            Vector2Int cell = WorldToCell(instruction.position, cellSize);
            if (!instructionsByCell.TryGetValue(cell, out List<RuntimeSpawnInstruction> list))
            {
                list = new List<RuntimeSpawnInstruction>();
                instructionsByCell[cell] = list;
            }

            list.Add(instruction);
        }

        private void RefreshStreaming()
        {
            if (runtimeOptimization == null)
            {
                return;
            }

            Vector3 focus = ResolveStreamingFocusPosition();
            float innerRadius = Mathf.Max(50f, effectiveStreamingRadius);
            float outerRadius = innerRadius + Mathf.Max(0f, runtimeOptimization.unloadPaddingMeters);
            float innerRadiusSq = innerRadius * innerRadius;
            float outerRadiusSq = outerRadius * outerRadius;
            float cellSize = Mathf.Max(10f, effectiveStreamingCellSize);
            int cellRadius = Mathf.CeilToInt(outerRadius / cellSize);
            Vector2Int centerCell = WorldToCell(focus, cellSize);

            HashSet<int> keepSet = new HashSet<int>();
            List<(RuntimeSpawnInstruction instruction, float dist2)> spawnCandidates = new List<(RuntimeSpawnInstruction instruction, float dist2)>();

            for (int i = 0; i < alwaysLoadedInstructions.Count; i++)
            {
                RuntimeSpawnInstruction instruction = alwaysLoadedInstructions[i];
                keepSet.Add(instruction.id);
                if (!activeStreamingObjects.ContainsKey(instruction.id))
                {
                    spawnCandidates.Add((instruction, 0f));
                }
            }

            for (int z = -cellRadius; z <= cellRadius; z++)
            {
                for (int x = -cellRadius; x <= cellRadius; x++)
                {
                    Vector2Int cell = new Vector2Int(centerCell.x + x, centerCell.y + z);
                    if (!instructionsByCell.TryGetValue(cell, out List<RuntimeSpawnInstruction> entries))
                    {
                        continue;
                    }

                    for (int i = 0; i < entries.Count; i++)
                    {
                        RuntimeSpawnInstruction instruction = entries[i];
                        bool isActive = activeStreamingObjects.ContainsKey(instruction.id);
                        Vector3 delta = instruction.position - focus;
                        float dist2 = delta.sqrMagnitude;
                        if (dist2 <= innerRadiusSq)
                        {
                            keepSet.Add(instruction.id);
                            if (!isActive)
                            {
                                spawnCandidates.Add((instruction, dist2));
                            }
                        }
                        else if (isActive && dist2 <= outerRadiusSq)
                        {
                            keepSet.Add(instruction.id);
                        }
                    }
                }
            }

            List<int> despawn = new List<int>();
            foreach (KeyValuePair<int, GameObject> kv in activeStreamingObjects)
            {
                if (!keepSet.Contains(kv.Key))
                {
                    despawn.Add(kv.Key);
                }
            }

            for (int i = 0; i < despawn.Count; i++)
            {
                DespawnInstruction(despawn[i]);
            }

            int maxActiveObjects = Mathf.Max(100, runtimeOptimization.maxActiveObjects);
            int maxActiveResources = Mathf.Max(0, runtimeOptimization.maxActiveResources);
            int activeResources = CountActiveKind(RuntimeSpawnKind.Resource);
            int activeObjects = activeStreamingObjects.Count;

            spawnCandidates.Sort((a, b) =>
            {
                int p = b.instruction.priority.CompareTo(a.instruction.priority);
                if (p != 0)
                {
                    return p;
                }

                return a.dist2.CompareTo(b.dist2);
            });

            for (int i = 0; i < spawnCandidates.Count; i++)
            {
                RuntimeSpawnInstruction instruction = spawnCandidates[i].instruction;
                if (activeStreamingObjects.ContainsKey(instruction.id))
                {
                    continue;
                }

                bool isResource = instruction.kind == RuntimeSpawnKind.Resource;
                if (!instruction.alwaysLoaded)
                {
                    if (activeObjects >= maxActiveObjects)
                    {
                        break;
                    }

                    if (isResource && activeResources >= maxActiveResources)
                    {
                        continue;
                    }
                }

                if (SpawnInstruction(instruction))
                {
                    activeObjects++;
                    if (isResource)
                    {
                        activeResources++;
                    }
                }
            }
        }

        private bool SpawnInstruction(RuntimeSpawnInstruction instruction)
        {
            GameObject created = null;
            if (instruction.prefab != null)
            {
                Quaternion rot = Quaternion.Euler(0f, instruction.yaw, 0f);
                created = Instantiate(instruction.prefab, instruction.position, rot, instruction.parent);
                ApplyInstructionScale(created, instruction);
            }
            else
            {
                created = CreateFallbackMarker(instruction);
            }

            if (created == null)
            {
                return false;
            }

            activeStreamingObjects[instruction.id] = created;
            activeStreamingKinds[instruction.id] = instruction.kind;
            return true;
        }

        private static void ApplyInstructionScale(GameObject created, RuntimeSpawnInstruction instruction)
        {
            if (created == null)
            {
                return;
            }

            if (instruction.absoluteScaleXZ)
            {
                Vector3 s = created.transform.localScale;
                created.transform.localScale = new Vector3(instruction.scaleXZ, s.y, instruction.scaleXZ);
                return;
            }

            if (Mathf.Abs(instruction.scaleXZ - 1f) > 0.0001f)
            {
                Vector3 s = created.transform.localScale;
                created.transform.localScale = new Vector3(s.x * instruction.scaleXZ, s.y, s.z * instruction.scaleXZ);
            }
        }

        private GameObject CreateFallbackMarker(RuntimeSpawnInstruction instruction)
        {
            PrimitiveType primitive = instruction.kind == RuntimeSpawnKind.MobZone ? PrimitiveType.Sphere : PrimitiveType.Cylinder;
            GameObject marker = GameObject.CreatePrimitive(primitive);
            marker.name = $"{instruction.fallbackName}_{instruction.id}";
            marker.transform.SetParent(instruction.parent, true);
            marker.transform.position = instruction.position;
            marker.transform.rotation = Quaternion.Euler(0f, instruction.yaw, 0f);

            if (instruction.kind == RuntimeSpawnKind.MobZone)
            {
                marker.transform.localScale = new Vector3(instruction.scaleXZ, 1f, instruction.scaleXZ);
            }
            else
            {
                marker.transform.localScale = new Vector3(2f, 1.5f, 2f);
            }

            return marker;
        }

        private int CountActiveKind(RuntimeSpawnKind kind)
        {
            int count = 0;
            foreach (KeyValuePair<int, RuntimeSpawnKind> kv in activeStreamingKinds)
            {
                if (kv.Value == kind)
                {
                    count++;
                }
            }

            return count;
        }

        private static Vector2Int WorldToCell(Vector3 position, float cellSize)
        {
            return new Vector2Int(
                Mathf.FloorToInt(position.x / Mathf.Max(0.0001f, cellSize)),
                Mathf.FloorToInt(position.z / Mathf.Max(0.0001f, cellSize)));
        }

        private Vector3 ResolveStreamingFocusPosition()
        {
            if (runtimeOptimization != null && runtimeOptimization.streamingTarget != null)
            {
                return runtimeOptimization.streamingTarget.position;
            }

            return transform.position;
        }

        private void DespawnInstruction(int id)
        {
            if (!activeStreamingObjects.TryGetValue(id, out GameObject go))
            {
                return;
            }

            if (go != null)
            {
                if (Application.isPlaying)
                {
                    Destroy(go);
                }
                else
                {
                    DestroyImmediate(go);
                }
            }

            activeStreamingObjects.Remove(id);
            activeStreamingKinds.Remove(id);
        }

        private void ClearStreamingState(bool destroyObjects)
        {
            if (destroyObjects)
            {
                List<int> ids = new List<int>(activeStreamingObjects.Keys);
                for (int i = 0; i < ids.Count; i++)
                {
                    DespawnInstruction(ids[i]);
                }
            }
            else
            {
                activeStreamingObjects.Clear();
                activeStreamingKinds.Clear();
            }

            instructionsByCell.Clear();
            alwaysLoadedInstructions.Clear();
            streamingEnabled = false;
            streamingRefreshTimer = 0f;
        }

        private void BuildSectorLookup(List<WorldSector> sectors)
        {
            sectorsByCoord.Clear();
            if (sectors == null)
            {
                return;
            }

            for (int i = 0; i < sectors.Count; i++)
            {
                WorldSector sector = sectors[i];
                sectorsByCoord[MakeSectorKey(sector.sectorX, sector.sectorZ)] = sector;
            }
        }

        private static long MakeSectorKey(int x, int z)
        {
            return ((long)x << 32) | (uint)z;
        }

        private void SpawnCities(List<CityPlacement> cities)
        {
            for (int i = 0; i < cities.Count; i++)
            {
                CityPlacement city = cities[i];
                BiomeDefinition biome = config.biomes.Find(b => b.biomeId == city.biomeId);
                if (biome == null || biome.cityPrefabs == null || biome.cityPrefabs.Length == 0)
                {
                    continue;
                }

                GameObject prefab = biome.cityPrefabs[i % biome.cityPrefabs.Length];
                Instantiate(prefab, city.center, Quaternion.identity, config.cityRoot);
            }
        }

        private void SpawnCaves(List<CavePlacement> caves)
        {
            for (int i = 0; i < caves.Count; i++)
            {
                CavePlacement cave = caves[i];
                BiomeDefinition biome = config.biomes.Find(b => b.biomeId == cave.biomeId);
                if (biome == null || biome.caveEntrancePrefabs == null || biome.caveEntrancePrefabs.Length == 0)
                {
                    continue;
                }

                GameObject prefab = biome.caveEntrancePrefabs[i % biome.caveEntrancePrefabs.Length];
                Quaternion rot = Quaternion.Euler(0f, cave.yaw, 0f);
                Instantiate(prefab, cave.entrance, rot, config.caveRoot);
            }
        }

        private void SpawnResources(List<ResourceNodePlacement> resources)
        {
            for (int i = 0; i < resources.Count; i++)
            {
                ResourceNodePlacement node = resources[i];
                BiomeDefinition biome = config.biomes.Find(b => b.biomeId == node.biomeId);
                if (biome == null || biome.resourcePrefabs == null || biome.resourcePrefabs.Length == 0)
                {
                    continue;
                }

                GameObject prefab = biome.resourcePrefabs[i % biome.resourcePrefabs.Length];
                Quaternion rot = Quaternion.Euler(0f, node.yaw, 0f);
                Instantiate(prefab, node.position, rot, config.resourceRoot);
            }
        }

        private void SpawnRoads(List<RoadSegment> roads)
        {
            if (roads == null || roads.Count == 0 || config.roadMarkerPrefab == null)
            {
                return;
            }

            for (int i = 0; i < roads.Count; i++)
            {
                RoadSegment seg = roads[i];
                Vector3 mid = (seg.from + seg.to) * 0.5f;
                Vector3 dir = (seg.to - seg.from);
                if (dir.sqrMagnitude < 0.0001f)
                {
                    continue;
                }

                Quaternion rot = Quaternion.LookRotation(new Vector3(dir.x, 0f, dir.z));
                Instantiate(config.roadMarkerPrefab, mid, rot, config.roadRoot);
            }
        }

        private void SpawnPoints(List<SpawnPointPlacement> points, GameObject prefab, string fallbackName)
        {
            if (points == null || points.Count == 0)
            {
                return;
            }

            if (prefab == null)
            {
                for (int i = 0; i < points.Count; i++)
                {
                    SpawnPointPlacement p = points[i];
                    GameObject marker = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    marker.name = $"{fallbackName}_{i}";
                    marker.transform.SetParent(config.spawnRoot, true);
                    marker.transform.position = p.position;
                    marker.transform.rotation = Quaternion.Euler(0f, p.yaw, 0f);
                    marker.transform.localScale = new Vector3(2f, 1.5f, 2f);
                }

                return;
            }

            for (int i = 0; i < points.Count; i++)
            {
                SpawnPointPlacement p = points[i];
                Quaternion rot = Quaternion.Euler(0f, p.yaw, 0f);
                Instantiate(prefab, p.position, rot, config.spawnRoot);
            }
        }

        private void SpawnMobZones(List<SpawnZonePlacement> zones)
        {
            if (zones == null || zones.Count == 0)
            {
                return;
            }

            for (int i = 0; i < zones.Count; i++)
            {
                SpawnZonePlacement zone = zones[i];
                if (config.mobZoneMarkerPrefab != null)
                {
                    GameObject go = Instantiate(config.mobZoneMarkerPrefab, zone.center, Quaternion.identity, config.spawnRoot);
                    go.transform.localScale = new Vector3(zone.radius * 2f, go.transform.localScale.y, zone.radius * 2f);
                }
                else
                {
                    GameObject marker = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                    marker.name = $"mob_zone_{i}_t{zone.tier}";
                    marker.transform.SetParent(config.spawnRoot, true);
                    marker.transform.position = zone.center;
                    marker.transform.localScale = new Vector3(zone.radius * 2f, 1f, zone.radius * 2f);
                }
            }
        }

        private static void ClearRoot(Transform root)
        {
            if (root == null)
            {
                return;
            }

            for (int i = root.childCount - 1; i >= 0; i--)
            {
                GameObject child = root.GetChild(i).gameObject;
                if (Application.isPlaying)
                {
                    Destroy(child);
                }
                else
                {
                    DestroyImmediate(child);
                }
            }
        }
    }
}
