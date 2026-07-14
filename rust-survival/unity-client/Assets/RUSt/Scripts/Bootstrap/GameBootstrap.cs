using RUSt.Network;
using RUSt.Player;
using RUSt.UI;
using RUSt.World;
using UnityEngine;

namespace RUSt.Bootstrap
{
    /// <summary>Scene entry — wires network events to world/player/UI.</summary>
    public class GameBootstrap : MonoBehaviour
    {
        [SerializeField] private NetworkClient networkClient;
        [SerializeField] private FirstPersonController localPlayer;
        [SerializeField] private WorldRenderer worldRenderer;
        [SerializeField] private RemotePlayerManager remotePlayers;
        [SerializeField] private InventoryHUD inventoryHud;
        [SerializeField] private ConnectionPanel connectionPanel;
        [SerializeField] private TerrainBootstrap terrain;

        private void Awake()
        {
            if (networkClient == null) networkClient = FindFirstObjectByType<NetworkClient>();
            if (localPlayer == null) localPlayer = FindFirstObjectByType<FirstPersonController>();
            if (worldRenderer == null) worldRenderer = FindFirstObjectByType<WorldRenderer>();
            if (remotePlayers == null) remotePlayers = FindFirstObjectByType<RemotePlayerManager>();
            if (inventoryHud == null) inventoryHud = FindFirstObjectByType<InventoryHUD>();
            if (connectionPanel == null) connectionPanel = FindFirstObjectByType<ConnectionPanel>();
            if (terrain == null) terrain = FindFirstObjectByType<TerrainBootstrap>();
        }

        private void Start()
        {
            networkClient.OnWelcome += OnWelcome;
            networkClient.OnWorld += worldRenderer.ApplyWorld;
            networkClient.OnPlayers += remotePlayers.ApplyPlayers;
            networkClient.OnInventory += inventoryHud.ApplyInventory;
            networkClient.OnError += msg => connectionPanel.ShowError(msg);
            networkClient.OnDisconnected += () => connectionPanel.ShowDisconnected();

            if (connectionPanel != null)
                connectionPanel.OnConnectRequested += (url, name) =>
                {
                    networkClient.SetServerUrl(url);
                    networkClient.SetPlayerName(name);
                    networkClient.Connect();
                };
            else
                networkClient.Connect();
        }

        private void OnDestroy()
        {
            if (networkClient == null) return;
            networkClient.OnWelcome -= OnWelcome;
        }

        private void OnWelcome(WelcomeMessage msg)
        {
            connectionPanel?.Hide();
            var spawn = msg.spawn.ToVector3();
            localPlayer.Teleport(spawn, 0f);
            localPlayer.BindNetwork(networkClient);
            terrain?.GenerateTerrain(msg.worldSeed);
        }
    }
}
