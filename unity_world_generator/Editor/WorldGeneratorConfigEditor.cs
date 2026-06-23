#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    [CustomEditor(typeof(WorldGeneratorConfig))]
    public sealed class WorldGeneratorConfigEditor : UnityEditor.Editor
    {
        private bool showShape = true;
        private bool showNoise = true;
        private bool showBiomes = true;
        private bool showCityCave = true;
        private bool showResources = true;
        private bool showSpawns = true;
        private bool showRuntime = true;

        public override void OnInspectorGUI()
        {
            serializedObject.Update();
            WorldGeneratorConfig config = (WorldGeneratorConfig)target;

            DrawHeader();
            DrawTopActions(config);

            showShape = EditorGUILayout.BeginFoldoutHeaderGroup(showShape, "World Shape");
            if (showShape)
            {
                DrawProperty("worldSeed");
                DrawProperty("worldSizeInChunks");
                DrawProperty("chunkSizeMeters");
                DrawProperty("maxHeightMeters");
                DrawProperty("seaLevel01");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showNoise = EditorGUILayout.BeginFoldoutHeaderGroup(showNoise, "Noise");
            if (showNoise)
            {
                DrawProperty("heightNoise");
                DrawProperty("moistureNoise");
                DrawProperty("temperatureNoise");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showBiomes = EditorGUILayout.BeginFoldoutHeaderGroup(showBiomes, "Biome Definitions");
            if (showBiomes)
            {
                DrawProperty("biomes");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showCityCave = EditorGUILayout.BeginFoldoutHeaderGroup(showCityCave, "Cities + Caves + Roads");
            if (showCityCave)
            {
                DrawProperty("citySettings");
                DrawProperty("roadSettings");
                DrawProperty("caveSettings");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showResources = EditorGUILayout.BeginFoldoutHeaderGroup(showResources, "Resources");
            if (showResources)
            {
                DrawProperty("resourceSettings");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showSpawns = EditorGUILayout.BeginFoldoutHeaderGroup(showSpawns, "MMORPG Spawns");
            if (showSpawns)
            {
                DrawProperty("spawnSettings");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            showRuntime = EditorGUILayout.BeginFoldoutHeaderGroup(showRuntime, "Runtime");
            if (showRuntime)
            {
                DrawProperty("cityRoot");
                DrawProperty("caveRoot");
                DrawProperty("resourceRoot");
                DrawProperty("roadRoot");
                DrawProperty("spawnRoot");
                DrawProperty("clearRootsBeforeSpawn");
                DrawProperty("roadMarkerPrefab");
                DrawProperty("playerSpawnMarkerPrefab");
                DrawProperty("npcSpawnMarkerPrefab");
                DrawProperty("mobZoneMarkerPrefab");
            }
            EditorGUILayout.EndFoldoutHeaderGroup();

            serializedObject.ApplyModifiedProperties();
        }

        private void DrawHeader()
        {
            Rect rect = EditorGUILayout.GetControlRect(false, 56f);
            EditorGUI.DrawRect(rect, new Color(0.12f, 0.15f, 0.20f, 1f));
            EditorGUI.DrawRect(new Rect(rect.x, rect.yMax - 3f, rect.width, 3f), new Color(0.20f, 0.58f, 0.95f, 1f));
            GUI.Label(new Rect(rect.x + 12f, rect.y + 8f, rect.width - 24f, 20f), "AAA World Generator Config", EditorStyles.boldLabel);
            GUI.Label(new Rect(rect.x + 12f, rect.y + 30f, rect.width - 24f, 18f), "Synty-ready world setup (biomes, cities, caves A, resources)", EditorStyles.miniLabel);
            EditorGUILayout.Space(6f);
        }

        private void DrawTopActions(WorldGeneratorConfig config)
        {
            EditorGUILayout.BeginHorizontal(EditorStyles.helpBox);
            if (GUILayout.Button("Open Dashboard", GUILayout.Height(24f)))
            {
                WorldGeneratorDashboardWindow.Open();
            }

            if (GUILayout.Button("Validate", GUILayout.Height(24f)))
            {
                List<string> messages = config.GetValidationMessages();
                if (messages.Count == 0)
                {
                    EditorUtility.DisplayDialog("Validation", "Config is valid.", "OK");
                }
                else
                {
                    EditorUtility.DisplayDialog("Validation Warnings", string.Join("\n", messages), "OK");
                }
            }

            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space(2f);
        }

        private void DrawProperty(string propertyName)
        {
            SerializedProperty property = serializedObject.FindProperty(propertyName);
            if (property != null)
            {
                EditorGUILayout.PropertyField(property, true);
            }
        }
    }
}
#endif
