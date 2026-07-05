#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    internal static class WorldGenEditorUi
    {
        internal static readonly Color BgDark = new Color(0.118f, 0.118f, 0.118f, 1f);
        internal static readonly Color BgPanel = new Color(0.145f, 0.145f, 0.145f, 1f);
        internal static readonly Color BgCard = new Color(0.176f, 0.176f, 0.176f, 1f);
        internal static readonly Color BgSidebar = new Color(0.098f, 0.098f, 0.098f, 1f);
        internal static readonly Color Accent = new Color(0.24f, 0.62f, 1.00f, 1f);
        internal static readonly Color AccentSoft = new Color(0.24f, 0.62f, 1.00f, 0.18f);
        internal static readonly Color Success = new Color(0.32f, 0.78f, 0.48f, 1f);
        internal static readonly Color Warning = new Color(0.95f, 0.72f, 0.28f, 1f);
        internal static readonly Color Danger = new Color(0.92f, 0.38f, 0.38f, 1f);
        internal static readonly Color TextPrimary = new Color(0.92f, 0.92f, 0.92f, 1f);
        internal static readonly Color TextMuted = new Color(0.62f, 0.64f, 0.68f, 1f);
        internal static readonly Color Border = new Color(0.28f, 0.28f, 0.28f, 1f);

        private static GUIStyle titleStyle;
        private static GUIStyle subtitleStyle;
        private static GUIStyle sectionTitleStyle;
        private static GUIStyle metricValueStyle;
        private static GUIStyle metricLabelStyle;
        private static GUIStyle navButtonStyle;
        private static GUIStyle navButtonActiveStyle;
        private static GUIStyle chipStyle;
        private static bool stylesReady;

        internal static void EnsureStyles()
        {
            if (stylesReady)
            {
                return;
            }

            titleStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 20,
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

            metricValueStyle = new GUIStyle(EditorStyles.boldLabel)
            {
                fontSize = 18,
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
                padding = new RectOffset(14, 8, 8, 8),
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
                padding = new RectOffset(8, 8, 3, 3)
            };

            stylesReady = true;
        }

        internal static void DrawTopBanner(string title, string subtitle)
        {
            Rect rect = EditorGUILayout.GetControlRect(false, 72f);
            EditorGUI.DrawRect(rect, BgSidebar);
            EditorGUI.DrawRect(new Rect(rect.x, rect.yMax - 3f, rect.width, 3f), Accent);
            GUI.Label(new Rect(rect.x + 18f, rect.y + 14f, rect.width - 36f, 28f), title, titleStyle);
            GUI.Label(new Rect(rect.x + 18f, rect.y + 40f, rect.width - 36f, 24f), subtitle, subtitleStyle);
        }

        internal static bool DrawSidebarNav(string label, bool active, float width)
        {
            EnsureStyles();
            GUIStyle style = active ? navButtonActiveStyle : navButtonStyle;
            Rect rect = GUILayoutUtility.GetRect(width, 34f, GUILayout.Width(width));
            if (active)
            {
                EditorGUI.DrawRect(new Rect(rect.x, rect.y + 4f, 3f, rect.height - 8f), Accent);
            }

            if (GUI.Button(rect, label, style))
            {
                return true;
            }

            return false;
        }

        internal static void DrawMetricCard(string label, string value, string hint, Color accent)
        {
            EnsureStyles();
            EditorGUILayout.BeginVertical();
            Rect rect = EditorGUILayout.GetControlRect(false, 68f);
            EditorGUI.DrawRect(rect, BgCard);
            EditorGUI.DrawRect(new Rect(rect.x, rect.y, 4f, rect.height), accent);
            GUI.Label(new Rect(rect.x + 14f, rect.y + 10f, rect.width - 20f, 22f), value, metricValueStyle);
            GUI.Label(new Rect(rect.x + 14f, rect.y + 34f, rect.width - 20f, 14f), label, metricLabelStyle);
            if (!string.IsNullOrEmpty(hint))
            {
                GUI.Label(new Rect(rect.x + 14f, rect.y + 48f, rect.width - 20f, 14f), hint, metricLabelStyle);
            }
            EditorGUILayout.EndVertical();
        }

        internal static void BeginPanel(string title, string description = null)
        {
            EnsureStyles();
            EditorGUILayout.BeginVertical();
            Rect header = EditorGUILayout.GetControlRect(false, string.IsNullOrEmpty(description) ? 28f : 44f);
            EditorGUI.DrawRect(header, BgCard);
            GUI.Label(new Rect(header.x + 12f, header.y + 6f, header.width - 24f, 18f), title, sectionTitleStyle);
            if (!string.IsNullOrEmpty(description))
            {
                GUI.Label(new Rect(header.x + 12f, header.y + 24f, header.width - 24f, 16f), description, subtitleStyle);
            }

            EditorGUILayout.BeginVertical(EditorStyles.helpBox);
        }

        internal static void EndPanel()
        {
            EditorGUILayout.EndVertical();
            EditorGUILayout.EndVertical();
            EditorGUILayout.Space(8f);
        }

        internal static bool DrawPrimaryButton(string label, float height = 42f)
        {
            Color old = GUI.backgroundColor;
            GUI.backgroundColor = Accent;
            bool clicked = GUILayout.Button(label, GUILayout.Height(height));
            GUI.backgroundColor = old;
            return clicked;
        }

        internal static bool DrawPresetCard(string title, string description, bool compact = false)
        {
            return DrawPresetCard(title, description, Accent, compact);
        }

        internal static bool DrawPresetCard(string title, string description, Color accent, bool compact = false)
        {
            EnsureStyles();
            float h = compact ? 54f : 64f;
            Rect rect = EditorGUILayout.GetControlRect(false, h);
            EditorGUI.DrawRect(rect, BgCard);
            EditorGUI.DrawRect(new Rect(rect.x, rect.y, 4f, rect.height), accent);
            EditorGUI.DrawRect(new Rect(rect.xMax - 1f, rect.y, 1f, rect.height), Border);
            GUI.Label(new Rect(rect.x + 10f, rect.y + 8f, rect.width - 20f, 18f), title, sectionTitleStyle);
            GUI.Label(new Rect(rect.x + 10f, rect.y + 28f, rect.width - 20f, 28f), description, subtitleStyle);
            return GUI.Button(rect, GUIContent.none, GUIStyle.none);
        }

        internal static bool DrawMiniButton(string label, bool active = false)
        {
            Color old = GUI.backgroundColor;
            GUI.backgroundColor = active ? Accent : BgCard;
            bool clicked = GUILayout.Button(label, GUILayout.Height(24f));
            GUI.backgroundColor = old;
            return clicked;
        }

        internal static void DrawStatusChip(string text, Color color)
        {
            EnsureStyles();
            Color old = GUI.backgroundColor;
            GUI.backgroundColor = new Color(color.r, color.g, color.b, 0.25f);
            GUILayout.Label(text, chipStyle, GUILayout.Height(22f));
            GUI.backgroundColor = old;
        }

        internal static void DrawSeparator()
        {
            Rect rect = EditorGUILayout.GetControlRect(false, 1f);
            EditorGUI.DrawRect(rect, Border);
            EditorGUILayout.Space(4f);
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
