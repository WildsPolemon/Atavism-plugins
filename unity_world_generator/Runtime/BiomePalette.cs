using UnityEngine;

namespace AaaWorldGen
{
    /// <summary>Default preview / fallback colors for known biome ids.</summary>
    public static class BiomePalette
    {
        public static Color GetPreviewColor(string biomeId)
        {
            if (string.IsNullOrWhiteSpace(biomeId))
            {
                return new Color(0.45f, 0.45f, 0.45f);
            }

            switch (biomeId.ToLowerInvariant())
            {
                case "meadow": return new Color(0.42f, 0.72f, 0.34f);
                case "forest": return new Color(0.18f, 0.48f, 0.22f);
                case "jungle": return new Color(0.10f, 0.42f, 0.18f);
                case "swamp": return new Color(0.22f, 0.38f, 0.28f);
                case "desert": return new Color(0.82f, 0.72f, 0.42f);
                case "savanna": return new Color(0.62f, 0.58f, 0.28f);
                case "tundra": return new Color(0.72f, 0.78f, 0.82f);
                case "volcanic": return new Color(0.38f, 0.28f, 0.26f);
                case "coastal": return new Color(0.34f, 0.62f, 0.78f);
                case "alpine": return new Color(0.58f, 0.56f, 0.52f);
                case "mountains": return new Color(0.52f, 0.48f, 0.42f);
                default: return new Color(0.45f, 0.45f, 0.45f);
            }
        }

        public static Color ResolvePreviewColor(BiomeDefinition biome)
        {
            if (biome == null)
            {
                return new Color(0.45f, 0.45f, 0.45f);
            }

            if (biome.previewColor.a > 0.01f && biome.previewColor != default)
            {
                return biome.previewColor;
            }

            return GetPreviewColor(biome.biomeId);
        }
    }
}
