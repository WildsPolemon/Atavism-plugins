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
        private const double FrameBudgetSeconds = 0.02d;

        private enum RunMode
        {
            Idle,
            Layout,
            Terrain,
            TerrainOnly,
            Finalize
        }

        private static WorldGenerator activeGenerator;
        private static TerrainGenerator.TerrainBakeSession activeSession;
        private static RunMode activeMode;
        private static Action onComplete;
        private static Action<WorldGenerationResult> onWorldComplete;
        private static Action<string> onStatus;
        private static bool subscribed;
        private static bool pendingStart;
        private static bool layoutStarted;

        public static bool IsRunning => pendingStart || subscribed || (activeSession != null && !activeSession.IsComplete);

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
            ScheduleStart(StartTerrainOnlyDeferred);
        }

        public static void RunFullWorld(
            WorldGenerator generator,
            Action<WorldGenerationResult> completeCallback = null,
            Action<string> statusCallback = null)
        {
            if (!TryBeginRun(generator, RunMode.Layout, statusCallback))
            {
                return;
            }

            onWorldComplete = completeCallback;
            ScheduleStart(StartFullWorldDeferred);
        }

        private static void ScheduleStart(Action startAction)
        {
            pendingStart = true;
            EditorApplication.delayCall += () =>
            {
                pendingStart = false;
                try
                {
                    startAction();
                }
                catch (Exception ex)
                {
                    Cleanup();
                    Debug.LogException(ex);
                    EditorUtility.DisplayDialog("World Generation", "Generation failed. See console.", "OK");
                }
            };
        }

        private static void StartTerrainOnlyDeferred()
        {
            Debug.Log($"[WorldGen] Terrain bake engine {TerrainGenerator.BakeEngineVersion}");
            onStatus?.Invoke("Preparing terrain bake...");
            StartTerrainBake();
        }

        private static void StartFullWorldDeferred()
        {
            Debug.Log($"[WorldGen] World generation engine {TerrainGenerator.BakeEngineVersion}");
            activeMode = RunMode.Layout;
            layoutStarted = false;
            onStatus?.Invoke("Generating world layout...");
            Subscribe();
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
                string actionLabel = mode == RunMode.Layout ? "Generate" : "Bake";
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

        private static void StartTerrainBake()
        {
            activeSession = activeGenerator.BeginTerrainOnlyBake();
            activeMode = RunMode.Terrain;
            Subscribe();
            onStatus?.Invoke($"Baking terrain — 0 / {activeSession.TotalTileSlots} tiles");
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
            if (activeGenerator == null)
            {
                Cleanup();
                return;
            }

            double deadline = EditorApplication.timeSinceStartup + FrameBudgetSeconds;

            if (activeMode == RunMode.Layout)
            {
                TickLayout(deadline);
                return;
            }

            if (activeSession == null)
            {
                Cleanup();
                return;
            }

            if (activeSession.CancelRequested)
            {
                CancelRun(activeMode == RunMode.TerrainOnly ? "Terrain bake cancelled." : "World generation cancelled.");
                return;
            }

            string title = activeMode == RunMode.TerrainOnly ? "Baking terrain" : "Generating world";
            string phaseLabel = activeSession.phase == TerrainGenerator.TerrainBakePhase.Clearing
                ? "Clearing old terrain tiles..."
                : $"Terrain tile {Mathf.Min(activeSession.CompletedTiles + 1, activeSession.TotalTileSlots)} / {activeSession.TotalTileSlots}";
            float progress = TerrainGenerator.GetProgress01(activeSession);
            if (EditorUtility.DisplayCancelableProgressBar(title, phaseLabel, progress))
            {
                activeSession.CancelRequested = true;
                CancelRun(activeMode == RunMode.TerrainOnly ? "Terrain bake cancelled." : "World generation cancelled.");
                return;
            }

            TerrainGenerator.StepBakeBudget(activeSession, () => EditorApplication.timeSinceStartup < deadline);

            if (activeSession.phase == TerrainGenerator.TerrainBakePhase.Clearing)
            {
                onStatus?.Invoke("Clearing old terrain tiles...");
            }
            else
            {
                onStatus?.Invoke($"Baking terrain — {activeSession.CompletedTiles} / {activeSession.TotalTileSlots} tiles");
            }

            if (!activeSession.IsComplete)
            {
                return;
            }

            EditorUtility.ClearProgressBar();
            try
            {
                if (activeMode == RunMode.TerrainOnly)
                {
                    TerrainGenerator.TerrainGenerationResult result = activeGenerator.CompleteTerrainOnlyBake(activeSession);
                    onStatus?.Invoke($"Terrain baked — {result.terrains.Count} tiles");
                    onComplete?.Invoke();
                }
                else
                {
                    activeMode = RunMode.Finalize;
                    CompleteFullWorld(activeGenerator, includeTerrain: true);
                }
            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
                onStatus?.Invoke(activeMode == RunMode.TerrainOnly ? "Terrain bake failed." : "World generation failed.");
                string dialogTitle = activeMode == RunMode.TerrainOnly ? "Terrain Only" : "Generate World";
                EditorUtility.DisplayDialog(dialogTitle, "Generation failed. See console.", "OK");
            }
            finally
            {
                Cleanup();
            }
        }

        private static void TickLayout(double deadline)
        {
            if (EditorUtility.DisplayCancelableProgressBar(
                    "Generating world",
                    "Building cities, roads, resources...",
                    0.08f))
            {
                CancelRun("World generation cancelled.");
                return;
            }

            if (layoutStarted)
            {
                return;
            }

            layoutStarted = true;
            try
            {
                WorldGenerationResult layout = activeGenerator.GenerateLayout();
                onStatus?.Invoke(
                    $"Layout ready — {layout.cities.Count} cities, {layout.resources.Count} resources. Baking terrain...");

                TerrainGenerationSettings terrainSettings =
                    activeGenerator.Config.terrainGeneration ?? new TerrainGenerationSettings();
                if (!terrainSettings.enableTerrainGeneration)
                {
                    EditorUtility.ClearProgressBar();
                    CompleteFullWorld(activeGenerator, includeTerrain: false);
                    Cleanup();
                    return;
                }

                StartTerrainBake();
            }
            catch (Exception ex)
            {
                EditorUtility.ClearProgressBar();
                Cleanup();
                Debug.LogException(ex);
                EditorUtility.DisplayDialog("Generate World", "World generation failed. See console.", "OK");
            }
            finally
            {
                layoutStarted = false;
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
            pendingStart = false;
            layoutStarted = false;
            activeMode = RunMode.Idle;
        }
    }
}
#endif
