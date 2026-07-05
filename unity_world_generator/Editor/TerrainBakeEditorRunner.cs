#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace AaaWorldGen.Editor
{
    /// <summary>
    /// Incremental world/terrain generation on the editor main thread to avoid UI freezes.
    /// </summary>
    public static class TerrainBakeEditorRunner
    {
        private const int WarnTileCount = 64;
        private const int TilesPerEditorTick = 1;

        private enum RunMode
        {
            TerrainOnly,
            FullWorld
        }

        private static WorldGenerator activeGenerator;
        private static TerrainGenerator.TerrainBakeSession activeSession;
        private static RunMode activeMode;
        private static Action onComplete;
        private static Action<WorldGenerationResult> onWorldComplete;
        private static Action<string> onStatus;
        private static bool subscribed;

        public static bool IsRunning => activeSession != null && !activeSession.IsComplete;

        public static void RunTerrainOnly(
            WorldGenerator generator,
            Action completeCallback = null,
            Action<string> statusCallback = null)
        {
            if (!TryBeginRun(generator, RunMode.TerrainOnly, statusCallback))
            {
                return;
            }

            onComplete = completeCallback;
            StartTerrainBake(generator);
        }

        public static void RunFullWorld(
            WorldGenerator generator,
            Action<WorldGenerationResult> completeCallback = null,
            Action<string> statusCallback = null)
        {
            if (!TryBeginRun(generator, RunMode.FullWorld, statusCallback))
            {
                return;
            }

            onWorldComplete = completeCallback;

            try
            {
                onStatus?.Invoke("Generating world layout...");
                WorldGenerationResult layout = generator.GenerateLayout();
                onStatus?.Invoke(
                    $"Layout ready — {layout.cities.Count} cities, {layout.resources.Count} resources. Baking terrain...");

                TerrainGenerationSettings terrainSettings =
                    generator.Config.terrainGeneration ?? new TerrainGenerationSettings();
                if (!terrainSettings.enableTerrainGeneration)
                {
                    CompleteFullWorld(generator, includeTerrain: false);
                    Cleanup();
                    return;
                }

                StartTerrainBake(generator);
            }
            catch (Exception ex)
            {
                Cleanup();
                Debug.LogException(ex);
                EditorUtility.DisplayDialog("Generate World", "World generation failed. See console.", "OK");
            }
        }

        private static bool TryBeginRun(
            WorldGenerator generator,
            RunMode mode,
            Action<string> statusCallback)
        {
            if (generator == null)
            {
                throw new ArgumentNullException(nameof(generator));
            }

            if (IsRunning)
            {
                EditorUtility.DisplayDialog(
                    "World Generation",
                    "World or terrain generation is already in progress.",
                    "OK");
                return false;
            }

            WorldGeneratorConfig config = generator.Config;
            if (config == null)
            {
                EditorUtility.DisplayDialog("World Generation", "Assign a WorldGeneratorConfig first.", "OK");
                return false;
            }

            int tileCount = TerrainGenerator.EstimateTileCount(config);
            if (mode == RunMode.TerrainOnly && tileCount <= 0)
            {
                EditorUtility.DisplayDialog(
                    "Terrain Only",
                    "Terrain generation is disabled in config.",
                    "OK");
                return false;
            }

            if (tileCount > WarnTileCount &&
                (mode == RunMode.TerrainOnly ||
                 (config.terrainGeneration != null && config.terrainGeneration.enableTerrainGeneration)))
            {
                float worldMeters = config.worldSizeInChunks * config.chunkSizeMeters;
                float tileSize = Mathf.Max(32f, config.terrainGeneration.terrainTileSizeMeters);
                int perAxis = Mathf.CeilToInt(worldMeters / tileSize);
                string actionLabel = mode == RunMode.FullWorld ? "Generate" : "Bake";
                bool continueRun = EditorUtility.DisplayDialog(
                    "Large terrain bake",
                    $"This world will create about {tileCount} terrain tiles ({perAxis}x{perAxis}).\n\n" +
                    "Terrain baking runs incrementally so the editor stays responsive, but it can still take several minutes.\n\n" +
                    "For faster iteration, increase terrainTileSizeMeters (for example 1024 or 2048).\n\n" +
                    $"Start {actionLabel.ToLowerInvariant()} now?",
                    actionLabel,
                    "Cancel");
                if (!continueRun)
                {
                    return false;
                }
            }

            activeGenerator = generator;
            activeMode = mode;
            onStatus = statusCallback;
            return true;
        }

        private static void StartTerrainBake(WorldGenerator generator)
        {
            try
            {
                activeSession = generator.BeginTerrainOnlyBake();
                Subscribe();
                onStatus?.Invoke($"Baking terrain — 0 / {activeSession.TotalTileSlots} tiles");
            }
            catch (Exception ex)
            {
                Cleanup();
                Debug.LogException(ex);
                string title = activeMode == RunMode.FullWorld ? "Generate World" : "Terrain Only";
                EditorUtility.DisplayDialog(title, "Terrain generation failed. See console.", "OK");
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
                CancelRun(activeMode == RunMode.FullWorld ? "World generation cancelled." : "Terrain bake cancelled.");
                return;
            }

            float progress = activeSession.TotalTileSlots > 0
                ? activeSession.nextTileIndex / (float)activeSession.TotalTileSlots
                : 1f;
            string title = activeMode == RunMode.FullWorld ? "Generating world" : "Baking terrain";
            string label = $"Terrain tile {Mathf.Min(activeSession.nextTileIndex + 1, activeSession.TotalTileSlots)} / {activeSession.TotalTileSlots}";
            if (EditorUtility.DisplayCancelableProgressBar(title, label, progress))
            {
                activeSession.CancelRequested = true;
                CancelRun(activeMode == RunMode.FullWorld ? "World generation cancelled." : "Terrain bake cancelled.");
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
                if (activeMode == RunMode.FullWorld)
                {
                    CompleteFullWorld(activeGenerator, includeTerrain: true);
                }
                else
                {
                    TerrainGenerator.TerrainGenerationResult result = activeGenerator.CompleteTerrainOnlyBake(activeSession);
                    onStatus?.Invoke($"Terrain baked — {result.terrains.Count} tiles");
                    onComplete?.Invoke();
                }
            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
                onStatus?.Invoke(activeMode == RunMode.FullWorld ? "World generation failed." : "Terrain bake failed.");
                string title = activeMode == RunMode.FullWorld ? "Generate World" : "Terrain Only";
                EditorUtility.DisplayDialog(title, "Generation failed. See console.", "OK");
            }
            finally
            {
                Cleanup();
            }
        }

        private static void CompleteFullWorld(WorldGenerator generator, bool includeTerrain)
        {
            WorldGenerationResult result;
            if (includeTerrain && activeSession != null)
            {
                generator.CompleteTerrainOnlyBake(activeSession);
                onStatus?.Invoke("Spawning runtime objects...");
                result = generator.FinalizeWorldGeneration();
            }
            else
            {
                onStatus?.Invoke("Spawning runtime objects...");
                result = generator.CompleteWorldGenerationWithoutTerrain();
            }

            TerrainGenerator.TerrainGenerationResult terrain = generator.LastTerrainResult;
            string terrainInfo = terrain?.terrains != null ? $", {terrain.terrains.Count} terrain tiles" : string.Empty;
            onStatus?.Invoke($"Done — {result.cities.Count} cities, {result.resources.Count} resources{terrainInfo}");
            onWorldComplete?.Invoke(result);
        }

        private static void CancelRun(string status)
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
            onWorldComplete = null;
            onStatus = null;
        }
    }
}
#endif
