using AaaWorldGen;
using UnityEngine;

namespace RUSt.World
{
    /// <summary>Procedural terrain using AaaWorldGen noise (seed from server).</summary>
    public class TerrainBootstrap : MonoBehaviour
    {
        [SerializeField] private int terrainSize = 256;
        [SerializeField] private int heightmapResolution = 257;
        [SerializeField] private float maxHeight = 40f;

        private Terrain _terrain;

        public void GenerateTerrain(int seed)
        {
            if (_terrain != null)
            {
                Destroy(_terrain.gameObject);
                _terrain = null;
            }

            var terrainData = new TerrainData
            {
                heightmapResolution = heightmapResolution,
                size = new Vector3(terrainSize, maxHeight, terrainSize)
            };

            var heights = new float[heightmapResolution, heightmapResolution];
            for (int z = 0; z < heightmapResolution; z++)
            {
                for (int x = 0; x < heightmapResolution; x++)
                {
                    float wx = (x / (float)(heightmapResolution - 1) - 0.5f) * terrainSize;
                    float wz = (z / (float)(heightmapResolution - 1) - 0.5f) * terrainSize;
                    heights[z, x] = DeterministicNoise.SampleFbm01(wx, wz, seed,
                        new NoiseLayerSettings(0.008f, 4, 2f, 0.5f, 0f, 0f));
                }
            }
            terrainData.SetHeights(0, 0, heights);

            var go = Terrain.CreateTerrainGameObject(terrainData);
            go.name = "RUSt_Terrain";
            go.transform.position = new Vector3(-terrainSize * 0.5f, 0f, -terrainSize * 0.5f);
            _terrain = go.GetComponent<Terrain>();

            var col = go.GetComponent<TerrainCollider>();
            if (col != null) col.terrainData = terrainData;
        }
    }
}
