using RUSt.Network;
using RUSt.World;
using UnityEngine;
using UnityEngine.InputSystem;

namespace RUSt.Player
{
    /// <summary>Gather resources (E) and attack players (LMB) when in range.</summary>
    public class PlayerInteractor : MonoBehaviour
    {
        [SerializeField] private NetworkClient networkClient;
        [SerializeField] private FirstPersonController player;
        [SerializeField] private float interactDistance = 4f;
        [SerializeField] private LayerMask interactMask = ~0;

        private void Awake()
        {
            if (networkClient == null) networkClient = FindFirstObjectByType<NetworkClient>();
            if (player == null) player = FindFirstObjectByType<FirstPersonController>();
        }

        private void Update()
        {
            if (networkClient == null || !networkClient.IsConnected || player == null) return;
            if (Keyboard.current == null || Mouse.current == null) return;

            var cam = player.CameraRoot != null ? player.CameraRoot : player.transform;
            if (!Physics.Raycast(cam.position, cam.forward, out var hit, interactDistance, interactMask))
                return;

            if (Keyboard.current.eKey.wasPressedThisFrame)
            {
                var node = hit.collider.GetComponentInParent<ResourceNodeView>();
                if (node != null)
                    networkClient.SendGather(node.NodeId);
            }

            if (Mouse.current.leftButton.wasPressedThisFrame)
            {
                var remote = hit.collider.GetComponentInParent<RemotePlayer>();
                if (remote != null && remote.PlayerId > 0)
                    networkClient.SendAttack(remote.PlayerId);
            }
        }
    }
}
