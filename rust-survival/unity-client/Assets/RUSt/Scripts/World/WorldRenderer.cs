using System.Collections.Generic;
using RUSt.Network;
using UnityEngine;

namespace RUSt.World
{
    public class WorldRenderer : MonoBehaviour
    {
        [SerializeField] private Transform nodesRoot;
        [SerializeField] private Transform buildingsRoot;

        private readonly Dictionary<int, ResourceNodeView> _nodes = new();
        private readonly Dictionary<int, BuildingView> _buildings = new();

        private void Awake()
        {
            if (nodesRoot == null)
            {
                var go = new GameObject("ResourceNodes");
                go.transform.SetParent(transform);
                nodesRoot = go.transform;
            }
            if (buildingsRoot == null)
            {
                var go = new GameObject("Buildings");
                go.transform.SetParent(transform);
                buildingsRoot = go.transform;
            }
        }

        public void ApplyWorld(WorldMessage msg)
        {
            if (msg == null) return;
            SyncNodes(msg.nodes);
            SyncBuildings(msg.buildings);
        }

        private void SyncNodes(ResourceNodeData[] nodes)
        {
            var seen = new HashSet<int>();
            if (nodes != null)
            {
                foreach (var n in nodes)
                {
                    seen.Add(n.id);
                    if (!_nodes.TryGetValue(n.id, out var view))
                    {
                        var go = new GameObject($"Node_{n.id}_{n.type}");
                        go.transform.SetParent(nodesRoot);
                        view = go.AddComponent<ResourceNodeView>();
                        _nodes[n.id] = view;
                    }
                    view.Apply(n);
                }
            }
            RemoveMissing(_nodes, seen);
        }

        private void SyncBuildings(BuildingData[] buildings)
        {
            var seen = new HashSet<int>();
            if (buildings != null)
            {
                foreach (var b in buildings)
                {
                    seen.Add(b.id);
                    if (!_buildings.TryGetValue(b.id, out var view))
                    {
                        var go = new GameObject($"Building_{b.id}_{b.type}");
                        go.transform.SetParent(buildingsRoot);
                        view = go.AddComponent<BuildingView>();
                        _buildings[b.id] = view;
                    }
                    view.Apply(b);
                }
            }
            RemoveMissing(_buildings, seen);
        }

        private static void RemoveMissing<T>(Dictionary<int, T> dict, HashSet<int> seen) where T : Component
        {
            var remove = new List<int>();
            foreach (var kv in dict)
                if (!seen.Contains(kv.Key)) remove.Add(kv.Key);
            foreach (var id in remove)
            {
                if (dict[id] != null) Destroy(dict[id].gameObject);
                dict.Remove(id);
            }
        }
    }
}
