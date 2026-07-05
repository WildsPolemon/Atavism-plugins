#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    /// <summary>
    /// Incremental terrain baking on the editor main thread to avoid UI freezes.
    /// </summary>
    public static class TerrainBakeEditorRunner
    {
        private const int WarnTileCount = 64;
        private const int TilesPerEditorTick = 1;

        private static WorldGenerator activeGenerator;
        private static TerrainGenerator.TerrainBakeSession activeSession;
        private static Action onComplete;
        private static Action<string> onStatus;
        private static bool subscribed;

        public static bool IsRunning => activeSession != null && !activeSession.IsComplete;

        public static void RunTerrainOnly(
            WorldGenerator generator,
            Action completeCallback = null,
            Action<string> statusCallback = null)
        {
            if (generator == null)
            {
                throw new ArgumentNullException(nameof(generator));
            }

            if (IsRunning)
            {
                EditorUtility.DisplayDialog(
                    "Terrain Only",
                    "Terrain baking is already in progress.",
                    "OK");
                return;
            }

            WorldGeneratorConfig config = generator.Config;
            if (config == null)
            {
                EditorUtility.DisplayDialog("Terrain Only", "Assign a WorldGeneratorConfig first.", "OK");
                return;
            }

            int tileCount = TerrainGenerator.EstimateTileCount(config);
            if (tileCount <= 0)
            {
                EditorUtility.DisplayDialog(
                    "Terrain Only",
                    "Terrain generation is disabled in config.",
                    "OK");
                return;
            }

            if (tileCount > WarnTileCount)
            {
                float worldMeters = config.worldSizeInChunks * config.chunkSizeMeters;
                float tileSize = Mathf.Max(32f, config.terrainGeneration.terrainTileSizeMeters);
                int perAxis = Mathf.CeilToInt(worldMeters / tileSize);
                bool continueBake = EditorUtility.DisplayDialog(
                    "Large terrain bake",
                    $"This world will create about {tileCount} terrain tiles ({perAxis}x{perAxis}).\n\n" +
                    "Baking runs incrementally so the editor stays responsive, but it can still take several minutes.\n\n" +
                    "For faster iteration, increase terrainTileSizeMeters (for example 1024 or 2048).\n\n" +
                    "Start baking now?",
                    "Bake",
                    "Cancel");
                if (!continueBake)
                {
                    return;
                }
            }

            try
            {
                activeGenerator = generator;
                activeSession = generator.BeginTerrainOnlyBake();
                onComplete = completeCallback;
                onStatus = statusCallback;
                Subscribe();
                onStatus?.Invoke($"Baking terrain — 0 / {tileCount} tiles");
            }
            catch (Exception ex)
            {
                Cleanup();
                Debug.LogException(ex);
                EditorUtility.DisplayDialog("Terrain Only", "Terrain generation failed. See console.", "OK");
            }
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
            if (activeSession == null || activeGenerator == null)
            {
                Cleanup();
                return;
            }

            if (activeSession.CancelRequested)
            {
                CancelBake("Terrain bake cancelled.");
                return;
            }

            float progress = activeSession.TotalTileSlots > 0
                ? activeSession.nextTileIndex / (float)activeSession.TotalTileSlots
                : 1f;
            string label = $"Terrain tile {Mathf.Min(activeSession.nextTileIndex + 1, activeSession.TotalTileSlots)} / {activeSession.TotalTileSlots}";
            if (EditorUtility.DisplayCancelableProgressBar("Baking terrain", label, progress))
            {
                activeSession.CancelRequested = true;
                CancelBake("Terrain bake cancelled.");
                return;
            }

            activeSession = TerrainGenerator.StepBake(activeSession, TilesPerEditorTick);
            onStatus?.Invoke($"Baking terrain — {activeSession.CompletedTiles} / {activeSession.TotalTileSlots} tiles");

            if (!activeSession.IsComplete)
            {
                return;
            }

            EditorUtility.ClearProgressBar();
            try
            {
                TerrainGenerator.TerrainGenerationResult result = activeGenerator.CompleteTerrainOnlyBake(activeSession);
                onStatus?.Invoke($"Terrain baked — {result.terrains.Count} tiles");
                onComplete?.Invoke();
            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
                onStatus?.Invoke("Terrain bake failed.");
                EditorUtility.DisplayDialog("Terrain Only", "Terrain generation failed. See console.", "OK");
            }
            finally
            {
                Cleanup();
            }
        }

        private static void CancelBake(string status)
        {
            EditorUtility.ClearProgressBar();
            onStatus?.Invoke(status);
            Cleanup();
        }

        private static void Cleanup()
        {
            Unsubscribe();
            activeGenerator = null;
            activeSession = null;
            onComplete = null;
            onStatus = null;
        }
    }
}
#endif
