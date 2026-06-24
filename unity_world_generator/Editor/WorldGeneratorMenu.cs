#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    public static class WorldGeneratorMenu
    {
        [MenuItem("Tools/World Generation/Open Generator Dashboard")]
        private static void OpenDashboard()
        {
            WorldGeneratorDashboardWindow.Open();
        }

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

        [MenuItem("Tools/World Generation/Create Generator In Scene")]
        private static void CreateGeneratorInScene()
        {
            GameObject go = new GameObject("WorldGenerator");
            go.AddComponent<WorldGenerator>();
            Selection.activeObject = go;
            EditorGUIUtility.PingObject(go);
            Debug.Log($"Created {go.name} with component {nameof(WorldGenerator)}.");
        }

        [MenuItem("Tools/World Generation/Validate Selected Config")]
        private static void ValidateSelectedConfig()
        {
            WorldGeneratorConfig config = Selection.activeObject as WorldGeneratorConfig;
            if (config == null)
            {
                EditorUtility.DisplayDialog("Validation", "Select a WorldGeneratorConfig asset first.", "OK");
                return;
            }

            System.Collections.Generic.List<string> messages = config.GetValidationMessages();
            if (messages.Count == 0)
            {
                EditorUtility.DisplayDialog("Validation", "Config is valid.", "OK");
            }
            else
            {
                EditorUtility.DisplayDialog("Validation Warnings", string.Join("\n", messages), "OK");
            }
        }
    }
}
#endif
