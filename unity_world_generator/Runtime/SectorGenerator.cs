using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    public static class SectorGenerator
    {
        public static List<WorldSector> Build(
            WorldGeneratorConfig config,
            List<CityPlacement> cities,
            List<RoadSegment> roads,
            List<CavePlacement> caves,
            List<ResourceNodePlacement> resources,
            List<SpawnPointPlacement> playerSpawns,
            List<SpawnPointPlacement> npcSpawns,
            List<SpawnZonePlacement> mobSpawnZones)
        {
            SectorGenerationSettings settings = config.sectorSettings ?? new SectorGenerationSettings();
            float worldSize = config.worldSizeInChunks * config.chunkSizeMeters;
            float sectorSize = Mathf.Max(64f, settings.sectorSizeMeters);
            int sectorsX = Mathf.Max(1, Mathf.CeilToInt(worldSize / sectorSize));
            int sectorsZ = Mathf.Max(1, Mathf.CeilToInt(worldSize / sectorSize));
            int maxResources = Mathf.Max(0, settings.maxResourcesPerSector);
            int maxNpcSpawns = Mathf.Max(0, settings.maxNpcSpawnsPerSector);
            int maxMobZones = Mathf.Max(0, settings.maxMobZonesPerSector);

            List<WorldSector> sectors = new List<WorldSector>(sectorsX * sectorsZ);
            for (int z = 0; z < sectorsZ; z++)
            {
                for (int x = 0; x < sectorsX; x++)
                {
                    Vector2 min = new Vector2(x * sectorSize, z * sectorSize);
                    Vector2 max = new Vector2(
                        Mathf.Min(worldSize, (x + 1) * sectorSize),
                        Mathf.Min(worldSize, (z + 1) * sectorSize));

                    sectors.Add(new WorldSector
                    {
                        sectorX = x,
                        sectorZ = z,
                        sectorId = $"sector_{x}_{z}",
                        min = min,
                        max = max
                    });
                }
            }

            WorldSector sector;
            for (int i = 0; i < cities.Count; i++)
            {
                if (TryGetSectorForPosition(cities[i].center, sectors, sectorsX, sectorsZ, sectorSize, out sector))
                {
                    sector.cities.Add(cities[i]);
                }
            }

            for (int i = 0; i < roads.Count; i++)
            {
                RoadSegment road = roads[i];
                Vector3 midpoint = (road.from + road.to) * 0.5f;
                if (TryGetSectorForPosition(midpoint, sectors, sectorsX, sectorsZ, sectorSize, out sector))
                {
                    sector.roads.Add(road);
                }
            }

            for (int i = 0; i < caves.Count; i++)
            {
                if (TryGetSectorForPosition(caves[i].entrance, sectors, sectorsX, sectorsZ, sectorSize, out sector))
                {
                    sector.caves.Add(caves[i]);
                }
            }

            for (int i = 0; i < resources.Count; i++)
            {
                if (!TryGetSectorForPosition(resources[i].position, sectors, sectorsX, sectorsZ, sectorSize, out sector))
                {
                    continue;
                }

                if (sector.resources.Count < maxResources)
                {
                    sector.resources.Add(resources[i]);
                }
                else
                {
                    sector.resourceOverflow++;
                }
            }

            for (int i = 0; i < playerSpawns.Count; i++)
            {
                if (TryGetSectorForPosition(playerSpawns[i].position, sectors, sectorsX, sectorsZ, sectorSize, out sector))
                {
                    sector.playerSpawns.Add(playerSpawns[i]);
                }
            }

            for (int i = 0; i < npcSpawns.Count; i++)
            {
                if (!TryGetSectorForPosition(npcSpawns[i].position, sectors, sectorsX, sectorsZ, sectorSize, out sector))
                {
                    continue;
                }

                if (sector.npcSpawns.Count < maxNpcSpawns)
                {
                    sector.npcSpawns.Add(npcSpawns[i]);
                }
                else
                {
                    sector.npcOverflow++;
                }
            }

            for (int i = 0; i < mobSpawnZones.Count; i++)
            {
                if (!TryGetSectorForPosition(mobSpawnZones[i].center, sectors, sectorsX, sectorsZ, sectorSize, out sector))
                {
                    continue;
                }

                if (sector.mobSpawnZones.Count < maxMobZones)
                {
                    sector.mobSpawnZones.Add(mobSpawnZones[i]);
                }
                else
                {
                    sector.mobZoneOverflow++;
                }
            }

            return sectors;
        }

        private static bool TryGetSectorForPosition(
            Vector3 position,
            List<WorldSector> sectors,
            int sectorsX,
            int sectorsZ,
            float sectorSize,
            out WorldSector sector)
        {
            int x = Mathf.Clamp(Mathf.FloorToInt(position.x / sectorSize), 0, sectorsX - 1);
            int z = Mathf.Clamp(Mathf.FloorToInt(position.z / sectorSize), 0, sectorsZ - 1);
            int index = z * sectorsX + x;
            if (index < 0 || index >= sectors.Count)
            {
                sector = null;
                return false;
            }

            sector = sectors[index];
            return true;
        }
    }
}
