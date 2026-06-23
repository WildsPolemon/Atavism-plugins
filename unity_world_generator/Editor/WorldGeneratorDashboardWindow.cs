#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    public sealed class WorldGeneratorDashboardWindow : EditorWindow
    {
        private static readonly string[] Tabs = { "Overview", "Biomes", "Cities + Caves + Roads", "Resources + Spawns", "Diagnostics" };

        private WorldGenerator generator;
        private WorldGeneratorConfig config;
        private SerializedObject configSerializedObject;
        private Vector2 scroll;
        private int selectedTab;
        private string statusLine = "Ready";
        private List<string> validationMessages = new List<string>();

        private GUIStyle heroTitleStyle;
        private GUIStyle heroSubtitleStyle;
        private GUIStyle cardTitleStyle;
        private GUIStyle dimLabelStyle;
        private bool stylesInitialized;

        [MenuItem("Window/World Generation/AAA Generator Dashboard")]
        public static void Open()
        {
            WorldGeneratorDashboardWindow window = GetWindow<WorldGeneratorDashboardWindow>();
            window.titleContent = new GUIContent("AAA WorldGen");
            window.minSize = new Vector2(820f, 560f);
            window.Show();
        }

        private void OnEnable()
        {
            if (generator == null)
            {
                generator = FindObjectOfType<WorldGenerator>();
            }

            if (generator != null && config == null)
            {
                config = generator.Config;
            }

            EnsureSerializedObject();
            RefreshValidation();
        }

        private void OnGUI()
        {
            EnsureStyles();
            DrawHero();
            DrawSelections();
            DrawActionBar();
            DrawTabs();

            if (config == null)
            {
                EditorGUILayout.HelpBox("Assign a WorldGeneratorConfig to start editing and generating the world.", MessageType.Info);
                return;
            }

            EnsureSerializedObject();
            configSerializedObject.Update();

            scroll = EditorGUILayout.BeginScrollView(scroll);
            switch (selectedTab)
            {
                case 0:
                    DrawOverviewTab();
                    break;
                case 1:
                    DrawBiomesTab();
                    break;
                case 2:
                    DrawCitiesAndCavesTab();
                    break;
                case 3:
                    DrawResourcesTab();
                    break;
                case 4:
                    DrawDiagnosticsTab();
                    break;
            }
            EditorGUILayout.EndScrollView();

            if (configSerializedObject.ApplyModifiedProperties())
            {
                EditorUtility.SetDirty(config);
            }
        }

        private void DrawHero()
        {
            Rect rect = EditorGUILayout.GetControlRect(false, 76f);
            EditorGUI.DrawRect(rect, new Color(0.10f, 0.13f, 0.18f, 1f));

            Rect accent = new Rect(rect.x, rect.yMax - 4f, rect.width, 4f);
            EditorGUI.DrawRect(accent, new Color(0.20f, 0.58f, 0.95f, 1f));

            GUI.Label(new Rect(rect.x + 16f, rect.y + 10f, rect.width - 32f, 28f), "AAA World Generator Dashboard", heroTitleStyle);
            GUI.Label(new Rect(rect.x + 16f, rect.y + 38f, rect.width - 32f, 20f), "Manage biomes, cities, caves (Variant A), resources, and one-click generation.", heroSubtitleStyle);
        }

        private void DrawSelections()
        {
            EditorGUILayout.Space(6f);
            EditorGUILayout.BeginHorizontal();
            generator = (WorldGenerator)EditorGUILayout.ObjectField("World Generator", generator, typeof(WorldGenerator), true);
            config = (WorldGeneratorConfig)EditorGUILayout.ObjectField("Config", config, typeof(WorldGeneratorConfig), false);
            EditorGUILayout.EndHorizontal();

            if (generator != null && config != null && generator.Config != config)
            {
                Undo.RecordObject(generator, "Assign World Generator Config");
                generator.Config = config;
                EditorUtility.SetDirty(generator);
            }
        }

        private void DrawActionBar()
        {
            EditorGUILayout.Space(4f);
            EditorGUILayout.BeginHorizontal(EditorStyles.helpBox);

            if (GUILayout.Button("Generate World", GUILayout.Height(28f)))
            {
                TryGenerateWorld();
            }

            if (GUILayout.Button("Export JSON", GUILayout.Height(28f)))
            {
                TryExportJson();
            }

            if (GUILayout.Button("Validate Config", GUILayout.Height(28f)))
            {
                RefreshValidation();
            }

            GUILayout.FlexibleSpace();
            GUILayout.Label(statusLine, dimLabelStyle);
            EditorGUILayout.EndHorizontal();
        }

        private void DrawTabs()
        {
            selectedTab = GUILayout.Toolbar(selectedTab, Tabs, GUILayout.Height(26f));
            EditorGUILayout.Space(6f);
        }

        private void DrawOverviewTab()
        {
            DrawCard("World Shape", () =>
            {
                DrawProperty("worldSeed");
                DrawProperty("worldSizeInChunks");
                DrawProperty("chunkSizeMeters");
                DrawProperty("maxHeightMeters");
                DrawProperty("seaLevel01");
            });

            DrawCard("Noise Layers", () =>
            {
                DrawProperty("heightNoise");
                DrawProperty("moistureNoise");
                DrawProperty("temperatureNoise");
            });

            DrawCard("Runtime + Roots", () =>
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
            });
        }

        private void DrawBiomesTab()
        {
            DrawCard("Biome Studio", () =>
            {
                EditorGUILayout.HelpBox("Configure biome thresholds and assign Synty prefab pools per biome.", MessageType.None);
                DrawProperty("biomes");
            });
        }

        private void DrawCitiesAndCavesTab()
        {
            DrawCard("City Generation", () =>
            {
                DrawProperty("citySettings");
            });

            DrawCard("Intercity Roads", () =>
            {
                EditorGUILayout.HelpBox("Road network auto-builds an MST backbone plus extra city connections.", MessageType.None);
                DrawProperty("roadSettings");
            });

            DrawCard("Cave Generation (Variant A)", () =>
            {
                EditorGUILayout.HelpBox("Stamp-based cave entrances and corridor chains with weighted presets.", MessageType.None);
                DrawProperty("caveSettings");
            });
        }

        private void DrawResourcesTab()
        {
            DrawCard("Resource Distribution", () =>
            {
                DrawProperty("resourceSettings");
            });

            DrawCard("MMORPG Spawn Generation", () =>
            {
                EditorGUILayout.HelpBox("Auto-generates player, NPC, and wilderness mob spawn zones for full MMO loops.", MessageType.None);
                DrawProperty("spawnSettings");
            });
        }

        private void DrawDiagnosticsTab()
        {
            DrawCard("Validation", () =>
            {
                if (validationMessages.Count == 0)
                {
                    EditorGUILayout.HelpBox("Config is valid.", MessageType.Info);
                }
                else
                {
                    for (int i = 0; i < validationMessages.Count; i++)
                    {
                        EditorGUILayout.HelpBox(validationMessages[i], MessageType.Warning);
                    }
                }
            });

            DrawCard("Last Generation", () =>
            {
                if (generator == null || generator.LastResult == null)
                {
                    EditorGUILayout.HelpBox("No generation has been run yet.", MessageType.None);
                    return;
                }

                WorldGenerationResult result = generator.LastResult;
                EditorGUILayout.LabelField("Seed", result.worldSeed.ToString());
                EditorGUILayout.LabelField("World Size", $"{result.worldWidth:0}m x {result.worldLength:0}m");
                EditorGUILayout.LabelField("Cities", result.cities.Count.ToString());
                EditorGUILayout.LabelField("Intercity Roads", result.worldRoads.Count.ToString());
                EditorGUILayout.LabelField("Caves", result.caves.Count.ToString());
                EditorGUILayout.LabelField("Resources", result.resources.Count.ToString());
                EditorGUILayout.LabelField("Player Spawns", result.playerSpawns.Count.ToString());
                EditorGUILayout.LabelField("NPC Spawns", result.npcSpawns.Count.ToString());
                EditorGUILayout.LabelField("Mob Zones", result.mobSpawnZones.Count.ToString());
            });
        }

        private void TryGenerateWorld()
        {
            if (generator == null)
            {
                statusLine = "No WorldGenerator in scene.";
                return;
            }

            if (config == null)
            {
                statusLine = "No config selected.";
                return;
            }

            try
            {
                Undo.RecordObject(generator, "Generate World");
                generator.Config = config;
                WorldGenerationResult result = generator.GenerateNow();
                statusLine = $"Generated: {result.cities.Count} cities, {result.worldRoads.Count} roads, {result.caves.Count} caves, {result.resources.Count} resources, {result.mobSpawnZones.Count} mob zones.";
            }
            catch (Exception ex)
            {
                statusLine = "Generation failed.";
                Debug.LogException(ex);
            }
        }

        private void TryExportJson()
        {
            if (generator == null)
            {
                statusLine = "No WorldGenerator in scene.";
                return;
            }

            string path = EditorUtility.SaveFilePanel("Export Generated World JSON", Application.dataPath, "generated_world_layout", "json");
            if (string.IsNullOrEmpty(path))
            {
                statusLine = "Export canceled.";
                return;
            }

            try
            {
                generator.Config = config;
                generator.ExportLastResultJson(path);
                statusLine = $"Exported JSON: {path}";
            }
            catch (Exception ex)
            {
                statusLine = "Export failed.";
                Debug.LogException(ex);
            }
        }

        private void RefreshValidation()
        {
            validationMessages = config != null ? config.GetValidationMessages() : new List<string>();
            statusLine = validationMessages.Count == 0 ? "Config validation passed." : $"Validation warnings: {validationMessages.Count}";
        }

        private void DrawCard(string title, Action content)
        {
            EditorGUILayout.BeginVertical(EditorStyles.helpBox);
            GUILayout.Label(title, cardTitleStyle);
            EditorGUILayout.Space(4f);
            content?.Invoke();
            EditorGUILayout.EndVertical();
            EditorGUILayout.Space(6f);
        }

        private void DrawProperty(string propertyName)
        {
            SerializedProperty property = configSerializedObject.FindProperty(propertyName);
            if (property != null)
            {
                EditorGUILayout.PropertyField(property, true);
            }
        }

        private void EnsureSerializedObject()
        {
            if (config == null)
            {
                configSerializedObject = null;
                return;
            }

            if (configSerializedObject == null || configSerializedObject.targetObject != config)
            {
                configSerializedObject = new SerializedObject(config);
            }
        }

        private void EnsureStyles()
        {
            if (stylesInitialized)
            {
                return;
            }

            heroTitleStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 18,
                normal = { textColor = Color.white }
            };

            heroSubtitleStyle = new GUIStyle(EditorStyles.label)
            {
                fontSize = 11,
                normal = { textColor = new Color(0.80f, 0.86f, 0.94f, 1f) }
            };

            cardTitleStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 13
            };

            dimLabelStyle = new GUIStyle(EditorStyles.miniLabel)
            {
                normal = { textColor = new Color(0.72f, 0.75f, 0.80f, 1f) }
            };

            stylesInitialized = true;
        }
    }
}
#endif
