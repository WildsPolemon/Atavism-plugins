using System.Collections.Generic;
using RUSt.Network;
using UnityEngine;

namespace RUSt.Player
{
    public class RemotePlayerManager : MonoBehaviour
    {
        [SerializeField] private GameObject remotePlayerPrefab;
        [SerializeField] private NetworkClient networkClient;

        private readonly Dictionary<int, RemotePlayer> _remotes = new();

        private void Awake()
        {
            if (networkClient == null) networkClient = FindFirstObjectByType<NetworkClient>();
            if (remotePlayerPrefab == null)
                remotePlayerPrefab = CreateDefaultPrefab();
        }

        public void ApplyPlayers(PlayersMessage msg)
        {
            if (msg?.players == null) return;
            var localId = networkClient != null ? networkClient.PlayerId : -1;
            var seen = new HashSet<int>();

            foreach (var p in msg.players)
            {
                if (p.id == localId) continue;
                seen.Add(p.id);
                if (!_remotes.TryGetValue(p.id, out var rp))
                {
                    var go = Instantiate(remotePlayerPrefab, transform);
                    go.name = $"Player_{p.id}_{p.name}";
                    rp = go.GetComponent<RemotePlayer>();
                    if (rp == null) rp = go.AddComponent<RemotePlayer>();
                    _remotes[p.id] = rp;
                }
                rp.ApplyState(p);
            }

            var toRemove = new List<int>();
            foreach (var kv in _remotes)
                if (!seen.Contains(kv.Key)) toRemove.Add(kv.Key);
            foreach (var id in toRemove)
            {
                Destroy(_remotes[id].gameObject);
                _remotes.Remove(id);
            }
        }

        private static GameObject CreateDefaultPrefab()
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            go.name = "RemotePlayerPrefab";
            go.SetActive(false);
            var renderer = go.GetComponent<Renderer>();
            if (renderer != null)
            {
                var mat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                mat.color = new Color(0.9f, 0.35f, 0.2f);
                renderer.sharedMaterial = mat;
            }
            Destroy(go.GetComponent<Collider>());
            go.AddComponent<RemotePlayer>();
            return go;
        }
    }
}
