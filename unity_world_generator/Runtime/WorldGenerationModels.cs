using System;
using System.Collections.Generic;
using UnityEngine;

namespace AaaWorldGen
{
    [Serializable]
    public sealed class WorldGenerationResult
    {
        public int worldSeed;
        public float worldWidth;
        public float worldLength;
        public List<CityPlacement> cities = new List<CityPlacement>();
        public List<CavePlacement> caves = new List<CavePlacement>();
        public List<ResourceNodePlacement> resources = new List<ResourceNodePlacement>();
    }

    [Serializable]
    public sealed class CityPlacement
    {
        public string biomeId;
        public Vector3 center;
        public float coreRadius;
        public float districtRadius;
        public List<RoadSegment> roads = new List<RoadSegment>();
        public List<DistrictLot> lots = new List<DistrictLot>();
    }

    [Serializable]
    public sealed class RoadSegment
    {
        public Vector3 from;
        public Vector3 to;
    }

    [Serializable]
    public sealed class DistrictLot
    {
        public Vector3 center;
        public Vector2 size;
        public int districtIndex;
    }

    [Serializable]
    public sealed class CavePlacement
    {
        public string biomeId;
        public string stampId;
        public Vector3 entrance;
        public float yaw;
        public List<Vector3> corridorPoints = new List<Vector3>();
    }

    [Serializable]
    public sealed class ResourceNodePlacement
    {
        public string biomeId;
        public string resourceId;
        public Vector3 position;
        public float yaw;
    }
}
