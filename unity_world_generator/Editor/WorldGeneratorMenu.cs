#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    public static class WorldGeneratorMenu
    {
        [MenuItem("Tools/World Generation/Create Default Config")]
        private static void CreateDefaultConfig()
        {
            WorldGeneratorConfig config = ScriptableObject.CreateInstance<WorldGeneratorConfig>();
            string path = EditorUtility.SaveFilePanelInProject(
                "Create World Generator Config",
                "WorldGeneratorConfig",
                "asset",
                "Select location for WorldGeneratorConfig asset");

            if (string.IsNullOrEmpty(path))
            {
                return;
            }

            AssetDatabase.CreateAsset(config, path);
            AssetDatabase.SaveAssets();
            Selection.activeObject = config;
        }
    }
}
#endif
