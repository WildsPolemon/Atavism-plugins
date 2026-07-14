using RUSt.Network;
using UnityEngine;

namespace RUSt.World
{
    public class BuildingView : MonoBehaviour
    {
        public void Apply(BuildingData data)
        {
            transform.position = data.Position;
            transform.rotation = Quaternion.Euler(0f, data.yaw, 0f);

            if (transform.childCount == 0)
            {
                var mesh = GameObject.CreatePrimitive(PrimitiveForType(data.type));
                mesh.transform.SetParent(transform, false);
                var renderer = mesh.GetComponent<Renderer>();
                var mat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                mat.color = data.type switch
                {
                    "foundation" => new Color(0.45f, 0.42f, 0.38f),
                    "wall" => new Color(0.55f, 0.4f, 0.25f),
                    "door" => new Color(0.35f, 0.25f, 0.15f),
                    _ => Color.gray
                };
                renderer.sharedMaterial = mat;
            }

            var scale = data.type switch
            {
                "foundation" => new Vector3(3f, 0.3f, 3f),
                "wall" => new Vector3(3f, 2.5f, 0.2f),
                "door" => new Vector3(1f, 2.2f, 0.15f),
                _ => Vector3.one
            };
            if (transform.childCount > 0)
                transform.GetChild(0).localScale = scale;
        }

        private static PrimitiveType PrimitiveForType(string type) => PrimitiveType.Cube;
    }
}
