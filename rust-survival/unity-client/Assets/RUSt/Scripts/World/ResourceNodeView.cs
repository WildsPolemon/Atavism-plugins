using RUSt.Network;
using UnityEngine;

namespace RUSt.World
{
    [RequireComponent(typeof(Collider))]
    public class ResourceNodeView : MonoBehaviour
    {
        public int NodeId { get; private set; }
        public string NodeType { get; private set; }

        private Renderer _renderer;

        public void Apply(ResourceNodeData data)
        {
            NodeId = data.id;
            NodeType = data.type;
            transform.position = data.Position;

            if (_renderer == null)
            {
                var primitive = PrimitiveForType(data.type);
                var mesh = GameObject.CreatePrimitive(primitive);
                mesh.transform.SetParent(transform, false);
                _renderer = mesh.GetComponent<Renderer>();
                var mat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                mat.color = ColorForType(data.type);
                _renderer.sharedMaterial = mat;
                var col = GetComponent<Collider>();
                if (col == null) gameObject.AddComponent<BoxCollider>();
            }

            var scale = data.type == "tree" ? new Vector3(1f, 2.5f, 1f) : Vector3.one * 1.2f;
            if (transform.childCount > 0)
                transform.GetChild(0).localScale = scale;
        }

        private static PrimitiveType PrimitiveForType(string type) =>
            type switch
            {
                "tree" => PrimitiveType.Cylinder,
                "hemp" => PrimitiveType.Capsule,
                _ => PrimitiveType.Cube
            };

        private static Color ColorForType(string type) =>
            type switch
            {
                "tree" => new Color(0.2f, 0.55f, 0.15f),
                "stone" => new Color(0.55f, 0.55f, 0.55f),
                "metal" => new Color(0.7f, 0.5f, 0.2f),
                "sulfur" => new Color(0.9f, 0.85f, 0.2f),
                "hemp" => new Color(0.3f, 0.7f, 0.3f),
                _ => Color.gray
            };
    }
}
