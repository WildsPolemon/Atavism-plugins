using RUSt.Bootstrap;
using RUSt.Building;
using RUSt.Network;
using RUSt.Player;
using RUSt.UI;
using RUSt.World;
using UnityEngine;

namespace RUSt.Bootstrap
{
    /// <summary>Creates all gameplay objects at runtime if scene is empty.</summary>
    [DefaultExecutionOrder(-100)]
    public class RuntimeAutoSetup : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AutoBootstrap()
        {
            if (FindFirstObjectByType<GameBootstrap>() != null) return;
            if (FindFirstObjectByType<NetworkClient>() != null) return;

            var root = new GameObject("RUSt_AutoSetup");
            root.AddComponent<RuntimeAutoSetup>();
        }

        private void Awake()
        {
            Setup();
            Destroy(this);
        }

        private void Setup()
        {
            var netGo = new GameObject("NetworkClient");
            netGo.AddComponent<NetworkClient>();

            var playerGo = new GameObject("LocalPlayer");
            playerGo.transform.position = new Vector3(0f, 5f, 0f);
            var cc = playerGo.AddComponent<CharacterController>();
            cc.height = 1.8f;
            cc.radius = 0.4f;
            cc.center = new Vector3(0f, 0.9f, 0f);
            playerGo.AddComponent<FirstPersonController>();
            playerGo.AddComponent<PlayerInteractor>();

            var camGo = new GameObject("Camera");
            camGo.transform.SetParent(playerGo.transform);
            camGo.transform.localPosition = new Vector3(0f, 1.6f, 0f);
            camGo.AddComponent<Camera>();
            camGo.AddComponent<AudioListener>();

            var worldGo = new GameObject("World");
            worldGo.AddComponent<WorldRenderer>();
            worldGo.AddComponent<TerrainBootstrap>();

            var remoteGo = new GameObject("RemotePlayers");
            remoteGo.AddComponent<RemotePlayerManager>();

            var buildGo = new GameObject("Building");
            buildGo.AddComponent<BuildingPlacer>();

            var uiGo = new GameObject("UI");
            uiGo.AddComponent<InventoryHUD>();
            uiGo.AddComponent<ConnectionPanel>();

            var bootGo = new GameObject("GameBootstrap");
            bootGo.AddComponent<GameBootstrap>();

            var lightGo = new GameObject("Directional Light");
            var light = lightGo.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.2f;
            lightGo.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

            Debug.Log("[RUSt] Runtime auto-setup complete");
        }
    }
}
