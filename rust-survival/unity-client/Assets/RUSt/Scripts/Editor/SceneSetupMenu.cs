using UnityEditor;
using UnityEngine;

namespace RUSt.Editor
{
    public static class SceneSetupMenu
    {
        [MenuItem("RUSt/Setup Main Scene")]
        public static void SetupMainScene()
        {
            // Network
            var netGo = new GameObject("NetworkClient");
            netGo.AddComponent<Network.NetworkClient>();

            // Player
            var playerGo = new GameObject("LocalPlayer");
            playerGo.transform.position = new Vector3(0f, 2f, 0f);
            var cc = playerGo.AddComponent<CharacterController>();
            cc.height = 1.8f;
            cc.radius = 0.4f;
            cc.center = new Vector3(0f, 0.9f, 0f);
            playerGo.AddComponent<Player.FirstPersonController>();
            playerGo.AddComponent<Player.PlayerInteractor>();

            var camGo = new GameObject("Camera");
            camGo.transform.SetParent(playerGo.transform);
            camGo.transform.localPosition = new Vector3(0f, 1.6f, 0f);
            camGo.AddComponent<Camera>();
            camGo.AddComponent<AudioListener>();

            // World
            var worldGo = new GameObject("World");
            worldGo.AddComponent<World.WorldRenderer>();
            worldGo.AddComponent<World.TerrainBootstrap>();

            // Remote players
            var remoteGo = new GameObject("RemotePlayers");
            remoteGo.AddComponent<Player.RemotePlayerManager>();

            // Building
            var buildGo = new GameObject("Building");
            buildGo.AddComponent<Building.BuildingPlacer>();

            // UI
            var uiGo = new GameObject("UI");
            uiGo.AddComponent<UI.InventoryHUD>();
            uiGo.AddComponent<UI.ConnectionPanel>();

            // Bootstrap
            var bootGo = new GameObject("GameBootstrap");
            bootGo.AddComponent<Bootstrap.GameBootstrap>();

            // Light
            var lightGo = new GameObject("Directional Light");
            var light = lightGo.AddComponent<Light>();
            light.type = LightType.Directional;
            lightGo.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

            Debug.Log("RUSt scene objects created. Save scene as Assets/RUSt/Scenes/Main.unity");
        }
    }
}
