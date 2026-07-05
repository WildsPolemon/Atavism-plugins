#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    internal static class WorldGenEditorUi
    {
        internal static readonly Color BgDark = new Color(0.105f, 0.108f, 0.114f, 1f);
        internal static readonly Color BgPanel = new Color(0.133f, 0.137f, 0.145f, 1f);
        internal static readonly Color BgCard = new Color(0.165f, 0.170f, 0.180f, 1f);
        internal static readonly Color BgCardHover = new Color(0.188f, 0.194f, 0.206f, 1f);
        internal static readonly Color BgSidebar = new Color(0.078f, 0.082f, 0.090f, 1f);
        internal static readonly Color Accent = new Color(0.28f, 0.66f, 1.00f, 1f);
        internal static readonly Color AccentSoft = new Color(0.28f, 0.66f, 1.00f, 0.22f);
        internal static readonly Color AccentDeep = new Color(0.16f, 0.42f, 0.78f, 1f);
        internal static readonly Color Success = new Color(0.36f, 0.82f, 0.54f, 1f);
        internal static readonly Color Warning = new Color(0.96f, 0.74f, 0.30f, 1f);
        internal static readonly Color Danger = new Color(0.94f, 0.40f, 0.42f, 1f);
        internal static readonly Color Purple = new Color(0.72f, 0.48f, 0.96f, 1f);
        internal static readonly Color TextPrimary = new Color(0.94f, 0.95f, 0.97f, 1f);
        internal static readonly Color TextMuted = new Color(0.58f, 0.62f, 0.68f, 1f);
        internal static readonly Color Border = new Color(0.24f, 0.26f, 0.30f, 1f);

        private static GUIStyle titleStyle;
        private static GUIStyle subtitleStyle;
        private static GUIStyle sectionTitleStyle;
        private static GUIStyle metricValueStyle;
        private static GUIStyle metricLabelStyle;
        private static GUIStyle navButtonStyle;
        private static GUIStyle navButtonActiveStyle;
        private static GUIStyle chipStyle;
        private static GUIStyle stepTitleStyle;
        private static GUIStyle heroTitleStyle;
        private static GUIStyle pillStyle;
        private static bool stylesReady;

        internal static void EnsureStyles()
        {
            if (stylesReady)
            {
                return;
            }

            titleStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 18,
                normal = { textColor = TextPrimary }
            };

            heroTitleStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 24,
                normal = { textColor = TextPrimary }
            };

            subtitleStyle = new GUIStyle(EditorStyles.label)
            {
                fontSize = 11,
                wordWrap = true,
                normal = { textColor = TextMuted }
            };

            sectionTitleStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 13,
                normal = { textColor = TextPrimary }
            };

            stepTitleStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 12,
                normal = { textColor = TextPrimary }
            };

            metricValueStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 20,
                alignment = TextAnchor.MiddleLeft,
                normal = { textColor = TextPrimary }
            };

            metricLabelStyle = new GUIStyle(EditorStyles.miniLabel)
            {
                fontSize = 10,
                normal = { textColor = TextMuted }
            };

            navButtonStyle = new GUIStyle(EditorStyles.label)
            {
                alignment = TextAnchor.MiddleLeft,
                padding = new RectOffset(42, 8, 10, 10),
                fontSize = 12,
                normal = { textColor = TextMuted }
            };

            navButtonActiveStyle = new GUIStyle(navButtonStyle)
            {
                normal = { textColor = TextPrimary, background = MakeTex(AccentSoft) },
                fontStyle = FontStyle.Bold
            };

            chipStyle = new GUIStyle(EditorStyles.miniButton)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 10,
                padding = new RectOffset(10, 10, 4, 4),
                fontStyle = FontStyle.Bold
            };

            pillStyle = new GUIStyle(EditorStyles.miniLabel)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 10,
                fontStyle = FontStyle.Bold,
                normal = { textColor = TextPrimary }
            };

            stylesReady = true;
        }

        internal static void DrawHeroBanner(string title, string subtitle, string versionChip)
        {
            EnsureStyles();
            Rect rect = EditorGUILayout.GetControlRect(false, 108f);
            GUI.DrawTexture(rect, WorldGenEditorArt.HeroBanner, ScaleMode.StretchToFill);
            EditorGUI.DrawRect(new Rect(rect.x, rect.yMax - 2f, rect.width, 2f), Accent);

            GUI.Label(new Rect(rect.x + 24f, rect.y + 18f, rect.width - 48f, 32f), title, heroTitleStyle);
            GUI.Label(new Rect(rect.x + 24f, rect.y + 52f, rect.width * 0.62f, 36f), subtitle, subtitleStyle);

            if (!string.IsNullOrEmpty(versionChip))
            {
                Rect chip = new Rect(rect.xMax - 148f, rect.y + 22f, 124f, 24f);
                EditorGUI.DrawRect(chip, new Color(0f, 0f, 0f, 0.28f));
                EditorGUI.DrawRect(new Rect(chip.x, chip.y, 3f, chip.height), Accent);
                GUI.Label(chip, versionChip, pillStyle);
            }
        }

        internal static void DrawTopBanner(string title, string subtitle)
        {
            DrawHeroBanner(title, subtitle, null);
        }

        internal static bool DrawSidebarNav(string icon, string label, bool active, float width, Texture2D stepArt = null)
        {
            EnsureStyles();
            GUIStyle style = active ? navButtonActiveStyle : navButtonStyle;
            Rect rect = GUILayoutUtility.GetRect(width, 40f, GUILayout.Width(width));

            if (active)
            {
                EditorGUI.DrawRect(new Rect(rect.x + 6f, rect.y + 6f, 3f, rect.height - 12f), Accent);
                EditorGUI.DrawRect(rect, AccentSoft);
            }

            Rect iconRect = new Rect(rect.x + 14f, rect.y + 8f, 24f, 24f);
            if (stepArt != null)
            {
                GUI.DrawTexture(iconRect, stepArt, ScaleMode.ScaleToFit);
            }
            else
            {
                GUI.Label(iconRect, icon, new GUIStyle(EditorStyles.label)
                {
                    fontSize = 14,
                    alignment = TextAnchor.MiddleCenter,
                    normal = { textColor = active ? Accent : TextMuted }
                });
            }

            GUI.Label(new Rect(rect.x + 42f, rect.y + 10f, rect.width - 50f, 20f), label, style);
            return GUI.Button(rect, GUIContent.none, GUIStyle.none);
        }

        internal static void DrawMetricCard(string label, string value, string hint, Color accent)
        {
            EnsureStyles();
            EditorGUILayout.BeginVertical(GUILayout.MinWidth(150f));
            Rect rect = EditorGUILayout.GetControlRect(false, 76f, GUILayout.ExpandWidth(true));
            EditorGUI.DrawRect(rect, BgCard);
            EditorGUI.DrawRect(new Rect(rect.x, rect.y, 4f, rect.height), accent);
            GUI.Label(new Rect(rect.x + 14f, rect.y + 12f, rect.width - 20f, 24f), value, metricValueStyle);
            GUI.Label(new Rect(rect.x + 14f, rect.y + 38f, rect.width - 20f, 14f), label, metricLabelStyle);
            if (!string.IsNullOrEmpty(hint))
            {
                GUI.Label(new Rect(rect.x + 14f, rect.y + 54f, rect.width - 20f, 14f), hint, metricLabelStyle);
            }
            EditorGUILayout.EndVertical();
        }

        internal static void BeginPanel(string title, string description = null)
        {
            EnsureStyles();
            EditorGUILayout.BeginVertical();
            float headerH = string.IsNullOrEmpty(description) ? 34f : 50f;
            Rect header = EditorGUILayout.GetControlRect(false, headerH);
            EditorGUI.DrawRect(header, BgCard);
            GUI.Label(new Rect(header.x + 14f, header.y + 8f, header.width - 28f, 18f), title, sectionTitleStyle);
            if (!string.IsNullOrEmpty(description))
            {
                GUI.Label(new Rect(header.x + 14f, header.y + 28f, header.width - 28f, 16f), description, subtitleStyle);
            }

            Rect body = EditorGUILayout.BeginVertical();
            EditorGUI.DrawRect(new Rect(body.x, body.y, body.width > 0 ? body.width : 1f, 1f), Border);
            EditorGUILayout.BeginVertical();
            EditorGUILayout.Space(6f);
        }

        internal static void EndPanel()
        {
            EditorGUILayout.Space(6f);
            EditorGUILayout.EndVertical();
            EditorGUILayout.EndVertical();
            EditorGUILayout.EndVertical();
            EditorGUILayout.Space(10f);
        }

        internal static bool DrawPrimaryButton(string label, float height = 44f)
        {
            Rect rect = EditorGUILayout.GetControlRect(false, height, GUILayout.ExpandWidth(true));
            EditorGUI.DrawRect(rect, AccentDeep);
            EditorGUI.DrawRect(new Rect(rect.x, rect.yMax - 2f, rect.width, 2f), Accent);
            GUIStyle style = new GUIStyle(EditorStyles.boldLabel)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 12,
                normal = { textColor = TextPrimary }
            };
            bool clicked = GUI.Button(rect, GUIContent.none, GUIStyle.none);
            GUI.Label(rect, label, style);
            return clicked;
        }

        internal static bool DrawSecondaryButton(string label, float width = 0f, float height = 44f)
        {
            Color old = GUI.backgroundColor;
            GUI.backgroundColor = BgCard;
            bool clicked = width > 0f
                ? GUILayout.Button(label, GUILayout.Width(width), GUILayout.Height(height))
                : GUILayout.Button(label, GUILayout.Height(height));
            GUI.backgroundColor = old;
            return clicked;
        }

        internal static bool DrawPresetCard(string title, string description, bool compact = false)
        {
            return DrawPresetCard(title, description, Accent, compact);
        }

        internal static bool DrawPresetCard(string title, string description, Color accent, bool compact = false)
        {
            return DrawPresetCard(title, description, accent, compact, false);
        }

        internal static bool DrawPresetCard(string title, string description, Color accent, bool compact, bool selected)
        {
            EnsureStyles();
            float h = compact ? 58f : 72f;
            Rect rect = EditorGUILayout.GetControlRect(false, h, GUILayout.MinWidth(120f));
            EditorGUI.DrawRect(rect, selected ? BgCardHover : BgCard);
            EditorGUI.DrawRect(new Rect(rect.x, rect.y, 4f, rect.height), accent);
            if (selected)
            {
                EditorGUI.DrawRect(new Rect(rect.x, rect.y, rect.width, 2f), accent);
            }

            GUI.Label(new Rect(rect.x + 12f, rect.y + 10f, rect.width - 20f, 18f), title, sectionTitleStyle);
            GUI.Label(new Rect(rect.x + 12f, rect.y + 30f, rect.width - 20f, h - 36f), description, subtitleStyle);
            return GUI.Button(rect, GUIContent.none, GUIStyle.none);
        }

        internal static bool DrawWorkflowCard(
            string stepLabel,
            string title,
            string description,
            Color accent,
            Texture2D art,
            bool selected)
        {
            EnsureStyles();
            Rect rect = EditorGUILayout.GetControlRect(false, 92f, GUILayout.MinWidth(180f));
            EditorGUI.DrawRect(rect, selected ? BgCardHover : BgCard);
            EditorGUI.DrawRect(new Rect(rect.x, rect.y, 4f, rect.height), accent);
            if (art != null)
            {
                GUI.DrawTexture(new Rect(rect.x + 10f, rect.y + 14f, 64f, 64f), art, ScaleMode.ScaleToFit);
            }

            GUI.Label(new Rect(rect.x + 82f, rect.y + 14f, rect.width - 92f, 14f), stepLabel, metricLabelStyle);
            GUI.Label(new Rect(rect.x + 82f, rect.y + 30f, rect.width - 92f, 18f), title, sectionTitleStyle);
            GUI.Label(new Rect(rect.x + 82f, rect.y + 50f, rect.width - 92f, 34f), description, subtitleStyle);
            return GUI.Button(rect, GUIContent.none, GUIStyle.none);
        }

        internal static void DrawStepRail(string[] labels, int activeIndex)
        {
            EnsureStyles();
            Rect rect = EditorGUILayout.GetControlRect(false, 54f);
            EditorGUI.DrawRect(rect, BgPanel);
            float stepW = rect.width / labels.Length;
            for (int i = 0; i < labels.Length; i++)
            {
                Rect step = new Rect(rect.x + i * stepW + 4f, rect.y + 6f, stepW - 8f, rect.height - 12f);
                bool active = i == activeIndex;
                bool done = i < activeIndex;
                Color c = active ? Accent : done ? Success : Border;
                EditorGUI.DrawRect(new Rect(step.x, step.yMax - 3f, step.width, 3f), c);
                GUIStyle s = new GUIStyle(EditorStyles.miniLabel)
                {
                    alignment = TextAnchor.MiddleCenter,
                    fontSize = 10,
                    fontStyle = active ? FontStyle.Bold : FontStyle.Normal,
                    normal = { textColor = active ? TextPrimary : TextMuted }
                };
                GUI.Label(step, labels[i], s);
            }
        }

        internal static void DrawTextureSlot(string label, ref Texture2D texture, float size = 72f)
        {
            EditorGUILayout.BeginVertical(GUILayout.Width(size + 8f));
            Rect rect = GUILayoutUtility.GetRect(size, size);
            EditorGUI.DrawRect(rect, BgCard);
            EditorGUI.DrawRect(new Rect(rect.x, rect.y, rect.width, 1f), Border);
            texture = (Texture2D)EditorGUI.ObjectField(rect, texture, typeof(Texture2D), false);
            GUI.Label(new Rect(rect.x, rect.yMax + 2f, rect.width, 16f), label, metricLabelStyle);
            EditorGUILayout.EndVertical();
        }

        internal static void DrawFolderSlot(string label, string hint, ref string folderPath)
        {
            EnsureStyles();
            Rect rect = EditorGUILayout.GetControlRect(false, 52f);
            EditorGUI.DrawRect(rect, BgCard);
            EditorGUI.DrawRect(new Rect(rect.x, rect.y, 4f, rect.height), Purple);
            DefaultAsset folder = string.IsNullOrEmpty(folderPath)
                ? null
                : AssetDatabase.LoadAssetAtPath<DefaultAsset>(folderPath);
            Rect field = new Rect(rect.x + 12f, rect.y + 8f, rect.width - 24f, 18f);
            GUI.Label(new Rect(rect.x + 12f, rect.y + 30f, rect.width - 24f, 14f), hint, metricLabelStyle);
            GUI.Label(new Rect(rect.x + 12f, rect.y + 8f, 80f, 18f), label, stepTitleStyle);
            DefaultAsset picked = (DefaultAsset)EditorGUI.ObjectField(
                new Rect(rect.x + 96f, rect.y + 6f, rect.width - 108f, 20f),
                folder,
                typeof(DefaultAsset),
                false);
            if (picked != folder)
            {
                folderPath = picked != null ? AssetDatabase.GetAssetPath(picked) : string.Empty;
            }
        }

        internal static void DrawBindingsCard(ref WorldGenerator generator, ref WorldGeneratorConfig config)
        {
            BeginPanel("Scene Bindings", "Link the scene generator and config asset.");
            generator = (WorldGenerator)EditorGUILayout.ObjectField("Generator", generator, typeof(WorldGenerator), true);
            config = (WorldGeneratorConfig)EditorGUILayout.ObjectField("Config", config, typeof(WorldGeneratorConfig), false);
            if (generator != null && config != null && generator.Config != config)
            {
                Undo.RecordObject(generator, "Assign World Generator Config");
                generator.Config = config;
                EditorUtility.SetDirty(generator);
            }
            EndPanel();
        }

        internal static void DrawEmptyState(string title, string body, string actionLabel, Action onAction)
        {
            EnsureStyles();
            Rect rect = EditorGUILayout.GetControlRect(false, 140f);
            EditorGUI.DrawRect(rect, BgPanel);
            GUI.Label(new Rect(rect.x + 20f, rect.y + 24f, rect.width - 40f, 24f), title, sectionTitleStyle);
            GUI.Label(new Rect(rect.x + 20f, rect.y + 52f, rect.width - 40f, 40f), body, subtitleStyle);
            Rect btn = new Rect(rect.x + 20f, rect.y + 100f, 180f, 28f);
            if (GUI.Button(btn, actionLabel))
            {
                onAction?.Invoke();
            }
        }

        internal static bool DrawMiniButton(string label, bool active = false)
        {
            Color old = GUI.backgroundColor;
            GUI.backgroundColor = active ? Accent : BgCard;
            bool clicked = GUILayout.Button(label, GUILayout.Height(26f), GUILayout.MinWidth(52f));
            GUI.backgroundColor = old;
            return clicked;
        }

        internal static void DrawStatusChip(string text, Color color)
        {
            EnsureStyles();
            Color old = GUI.backgroundColor;
            GUI.backgroundColor = new Color(color.r, color.g, color.b, 0.25f);
            GUILayout.Label(text, chipStyle, GUILayout.Height(24f));
            GUI.backgroundColor = old;
        }

        internal static void DrawSeparator()
        {
            EditorGUILayout.Space(4f);
            Rect rect = EditorGUILayout.GetControlRect(false, 1f);
            EditorGUI.DrawRect(rect, Border);
            EditorGUILayout.Space(6f);
        }

        internal static void DrawPreviewFrame(Rect rect, Texture preview)
        {
            EditorGUI.DrawRect(rect, BgSidebar);
            EditorGUI.DrawRect(new Rect(rect.x + 2f, rect.y + 2f, rect.width - 4f, rect.height - 4f), BgPanel);
            if (preview != null)
            {
                GUI.DrawTexture(
                    new Rect(rect.x + 6f, rect.y + 6f, rect.width - 12f, rect.height - 12f),
                    preview,
                    ScaleMode.ScaleToFit);
            }
        }

        private static Texture2D MakeTex(Color color)
        {
            Texture2D tex = new Texture2D(1, 1);
            tex.SetPixel(0, 0, color);
            tex.Apply();
            return tex;
        }
    }
}
#endif
