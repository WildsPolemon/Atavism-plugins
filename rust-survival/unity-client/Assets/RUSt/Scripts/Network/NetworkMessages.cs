using System;
using System.Collections.Generic;
using UnityEngine;

namespace RUSt.Network
{
    [Serializable]
    public class Vec3
    {
        public float x, y, z;
        public Vector3 ToVector3() => new Vector3(x, y, z);
        public static Vec3 From(Vector3 v) => new Vec3 { x = v.x, y = v.y, z = v.z };
    }

    [Serializable]
    public class ResourceNodeData
    {
        public int id;
        public string type;
        public float x, y, z;
        public int hp;
        public int maxHp;
        public Vector3 Position => new Vector3(x, y, z);
    }

    [Serializable]
    public class BuildingData
    {
        public int id;
        public string type;
        public float x, y, z, yaw;
        public int ownerId;
        public int hp;
        public Vector3 Position => new Vector3(x, y, z);
    }

    [Serializable]
    public class PlayerStateData
    {
        public int id;
        public string name;
        public float x, y, z, yaw;
        public float hp;
        public float hunger;
        public bool alive;
        public Vector3 Position => new Vector3(x, y, z);
    }

    [Serializable]
    public class InventoryData
    {
        public int wood, stone, metal, sulfur, cloth;
        public int hotbar;
    }

    [Serializable]
    public class WelcomeMessage
    {
        public string t;
        public int playerId;
        public int worldSeed;
        public Vec3 spawn;
    }

    [Serializable]
    public class WorldMessage
    {
        public string t;
        public ResourceNodeData[] nodes;
        public BuildingData[] buildings;
    }

    [Serializable]
    public class PlayersMessage
    {
        public string t;
        public PlayerStateData[] players;
    }

    [Serializable]
    public class InventoryMessage
    {
        public string t;
        public InventoryData slots;
        public int hotbar;
    }

    [Serializable]
    public class EventMessage
    {
        public string t;
        public string type;
        public BuildingData building;
        public int killer;
        public int victim;
    }

    [Serializable]
    public class ErrorMessage
    {
        public string t;
        public string message;
    }
}
