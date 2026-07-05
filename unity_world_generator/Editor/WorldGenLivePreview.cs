#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    /// <summary>Debounced live preview refresh when config changes in the dashboard.</summary>
    internal static class WorldGenLivePreview
    {
        internal enum PreviewMode
        {
            Biomes = 0,
            Height = 1,
            Hybrid = 2
        }

        private const double DebounceSeconds = 0.12d;

        internal static bool LiveEnabled = true;
        internal static PreviewMode Mode = PreviewMode.Biomes;
        internal static int PreviewResolution = 320;

        private static WorldGeneratorConfig watchedConfig;
        private static double lastChangeTime;
        private static bool pending;
        private static bool subscribed;

        internal static void NotifyConfigChanged(WorldGeneratorConfig config)
        {
            watchedConfig = config;
            lastChangeTime = EditorApplication.timeSinceStartup;
            pending = true;
            Subscribe();
        }

        internal static void ForceRefresh(WorldGeneratorConfig config)
        {
            watchedConfig = config;
            WorldGenTerrainPreview.Invalidate();
            RepaintDashboards();
        }

        private static void Subscribe()
        {
            if (subscribed)
            {
                return;
            }

            EditorApplication.update += Tick;
            subscribed = true;
        }

        private static void Unsubscribe()
        {
            if (!subscribed)
            {
                return;
            }

            EditorApplication.update -= Tick;
            subscribed = false;
        }

        private static void Tick()
        {
            if (!pending)
            {
                Unsubscribe();
                return;
            }

            if (EditorApplication.timeSinceStartup - lastChangeTime < DebounceSeconds)
            {
                return;
            }

            pending = false;
            if (LiveEnabled && watchedConfig != null)
            {
                WorldGenTerrainPreview.Invalidate();
                RepaintDashboards();
            }

            Unsubscribe();
        }

        private static void RepaintDashboards()
        {
            WorldGeneratorDashboardWindow[] windows = Resources.FindObjectsOfTypeAll<WorldGeneratorDashboardWindow>();
            for (int i = 0; i < windows.Length; i++)
            {
                windows[i].Repaint();
            }
        }
    }
}
#endif
