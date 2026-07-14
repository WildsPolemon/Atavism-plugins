using RUSt.Network;
using UnityEngine;

namespace RUSt.Player
{
    public class RemotePlayer : MonoBehaviour
    {
        [SerializeField] private float lerpSpeed = 12f;

        private Vector3 _targetPos;
        private float _targetYaw;
        private string _displayName = "";
        private TextMesh _label;

        public int PlayerId { get; private set; }

        private void Awake()
        {
            _label = gameObject.AddComponent<TextMesh>();
            _label.fontSize = 24;
            _label.characterSize = 0.08f;
            _label.anchor = TextAnchor.LowerCenter;
            _label.color = Color.white;
            _label.transform.localPosition = new Vector3(0f, 1.2f, 0f);
        }

        public void ApplyState(PlayerStateData state)
        {
            PlayerId = state.id;
            _displayName = state.name;
            _targetPos = state.Position;
            _targetYaw = state.yaw;
            if (_label != null) _label.text = state.alive ? state.name : $"{state.name} (dead)";
            gameObject.SetActive(state.alive);
        }

        private void Update()
        {
            transform.position = Vector3.Lerp(transform.position, _targetPos, Time.deltaTime * lerpSpeed);
            var yaw = Mathf.LerpAngle(transform.eulerAngles.y, _targetYaw, Time.deltaTime * lerpSpeed);
            transform.rotation = Quaternion.Euler(0f, yaw, 0f);
        }
    }
}
