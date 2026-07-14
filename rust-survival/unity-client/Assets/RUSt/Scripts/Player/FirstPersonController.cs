using RUSt.Network;
using UnityEngine;
using UnityEngine.InputSystem;

namespace RUSt.Player
{
    [RequireComponent(typeof(CharacterController))]
    public class FirstPersonController : MonoBehaviour
    {
        [SerializeField] private float walkSpeed = 6f;
        [SerializeField] private float sprintSpeed = 10f;
        [SerializeField] private float jumpForce = 7f;
        [SerializeField] private float gravity = -20f;
        [SerializeField] private float mouseSensitivity = 2f;
        [SerializeField] private Transform cameraRoot;
        [SerializeField] private float sendInterval = 0.1f;

        private CharacterController _cc;
        private Vector3 _velocity;
        private float _pitch;
        private float _sendTimer;
        private NetworkClient _net;
        private bool _cursorLocked;

        public Transform CameraRoot => cameraRoot;
        public int LocalPlayerId => _net != null ? _net.PlayerId : -1;

        private void Awake()
        {
            _cc = GetComponent<CharacterController>();
            if (cameraRoot == null)
            {
                var cam = GetComponentInChildren<Camera>();
                if (cam != null) cameraRoot = cam.transform;
            }
        }

        public void BindNetwork(NetworkClient net)
        {
            _net = net;
            LockCursor(true);
        }

        public void Teleport(Vector3 pos, float yaw)
        {
            _cc.enabled = false;
            transform.position = pos;
            transform.rotation = Quaternion.Euler(0f, yaw, 0f);
            _cc.enabled = true;
            _velocity = Vector3.zero;
        }

        private void Update()
        {
            if (_net == null || !_net.IsConnected) return;
            HandleLook();
            HandleMove();
            _sendTimer += Time.deltaTime;
            if (_sendTimer >= sendInterval)
            {
                _sendTimer = 0f;
                _net.SendMove(transform.position, transform.eulerAngles.y);
            }
            if (Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame)
                LockCursor(!_cursorLocked);
        }

        private void HandleLook()
        {
            if (!_cursorLocked || Mouse.current == null) return;
            var delta = Mouse.current.delta.ReadValue() * mouseSensitivity * 0.1f;
            _pitch = Mathf.Clamp(_pitch - delta.y, -85f, 85f);
            if (cameraRoot != null)
                cameraRoot.localRotation = Quaternion.Euler(_pitch, 0f, 0f);
            transform.Rotate(Vector3.up, delta.x);
        }

        private void HandleMove()
        {
            if (Keyboard.current == null) return;
            var input = Vector2.zero;
            if (Keyboard.current.wKey.isPressed) input.y += 1f;
            if (Keyboard.current.sKey.isPressed) input.y -= 1f;
            if (Keyboard.current.aKey.isPressed) input.x -= 1f;
            if (Keyboard.current.dKey.isPressed) input.x += 1f;

            var speed = Keyboard.current.leftShiftKey.isPressed ? sprintSpeed : walkSpeed;
            var move = transform.right * input.x + transform.forward * input.y;
            _cc.Move(move * speed * Time.deltaTime);

            if (_cc.isGrounded && _velocity.y < 0f) _velocity.y = -2f;
            if (_cc.isGrounded && Keyboard.current.spaceKey.wasPressedThisFrame)
                _velocity.y = jumpForce;
            _velocity.y += gravity * Time.deltaTime;
            _cc.Move(_velocity * Time.deltaTime);
        }

        private void LockCursor(bool locked)
        {
            _cursorLocked = locked;
            Cursor.lockState = locked ? CursorLockMode.Locked : CursorLockMode.None;
            Cursor.visible = !locked;
        }
    }
}
