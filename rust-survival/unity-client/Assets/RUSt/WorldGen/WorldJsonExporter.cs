using System.IO;
using UnityEngine;

namespace AaaWorldGen
{
    public static class WorldJsonExporter
    {
        public static void Export(string outputPath, WorldGenerationResult result)
        {
            string json = JsonUtility.ToJson(result, true);
            File.WriteAllText(outputPath, json);
        }
    }
}
