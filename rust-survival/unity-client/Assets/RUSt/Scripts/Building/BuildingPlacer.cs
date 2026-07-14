using RUSt.Network;
using RUSt.Player;
using RUSt.World;
using UnityEngine;
using UnityEngine.InputSystem;

namespace RUSt.Building
{
    public class BuildingPlacer : MonoBehaviour
    {
        [SerializeField] private NetworkClient networkClient;
        [SerializeField] private FirstPersonController player;
        [SerializeField] private string[] buildTypes = { "foundation", "wall", "door" };
        [SerializeField] private float placeDistance = 6f;
        [SerializeField] private LayerMask groundMask = ~0;

        private int _selectedIndex;
        private GameObject _ghost;

        private void Awake()
        {
            if (networkClient == null) networkClient = FindFirstObjectByType<NetworkClient>();
            if (player == null) player = FindFirstObjectByType<FirstPersonController>();
            _ghost = GameObject.CreatePrimitive(PrimitiveType.Cube);
            _ghost.name = "BuildGhost";
            var col = _ghost.GetComponent<Collider>();
            if (col != null) Destroy(col);
            var r = _ghost.GetComponent<Renderer>();
            var mat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
            mat.color = new Color(0.2f, 0.8f, 1f, 0.4f);
            r.sharedMaterial = mat;
            _ghost.SetActive(false);
        }

        private void Update()
        {
            if (networkClient == null || !networkClient.IsConnected || player == null) return;

            if (Keyboard.current != null)
            {
                if (Keyboard.current.digit1Key.wasPressedThisFrame) _selectedIndex = 0;
                if (Keyboard.current.digit2Key.wasPressedThisFrame) _selectedIndex = 1;
                if (Keyboard.current.digit3Key.wasPressedThisFrame) _selectedIndex = 2;
            }

            var cam = player.CameraRoot != null ? player.CameraRoot : player.transform;
            if (Physics.Raycast(cam.position, cam.forward, out var hit, placeDistance, groundMask))
            {
                var pos = hit.point;
                pos.y = Mathf.Round(pos.y);
                _ghost.SetActive(true);
                _ghost.transform.position = pos;
                _ghost.transform.rotation = Quaternion.Euler(0f, Mathf.Round(player.transform.eulerAngles.y / 90f) * 90f, 0f);

                if (Mouse.current != null && Mouse.current.rightButton.wasPressedThisFrame)
                {
                    networkClient.SendPlaceBuilding(
                        buildTypes[Mathf.Clamp(_selectedIndex, 0, buildTypes.Length - 1)],
                        pos,
                        _ghost.transform.eulerAngles.y);
                }
            }
            else
            {
                _ghost.SetActive(false);
            }
        }
    }
}
