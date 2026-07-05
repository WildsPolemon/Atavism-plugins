#if UNITY_EDITOR
namespace AaaWorldGen.Editor
{
    /// <summary>Backward-compatible alias — use <see cref="WorldGenStudioWindow"/>.</summary>
    public static class WorldGeneratorDashboardWindow
    {
        public static void Open() => WorldGenStudioWindow.Open();
    }
}
#endif
