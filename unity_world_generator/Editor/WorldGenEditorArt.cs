#if UNITY_EDITOR
using UnityEngine;

namespace AaaWorldGen.Editor
{
    /// <summary>Procedural banner and step art for WorldGen Studio — no external image assets required.</summary>
    internal static class WorldGenEditorArt
    {
        private static Texture2D heroBanner;
        private static Texture2D cardGlow;
        private static Texture2D previewFrame;
        private static Texture2D[] stepIcons;

        internal static Texture2D HeroBanner
        {
            get
            {
                if (heroBanner == null)
                {
                    heroBanner = BuildHeroBanner(1024, 140);
                }

                return heroBanner;
            }
        }

        internal static Texture2D CardGlow
        {
            get
            {
                if (cardGlow == null)
                {
                    cardGlow = BuildRadialGlow(64, new Color(0.24f, 0.62f, 1f, 0.35f));
                }

                return cardGlow;
            }
        }

        internal static Texture2D PreviewFrame
        {
            get
            {
                if (previewFrame == null)
                {
                    previewFrame = BuildFrameTexture(8, WorldGenEditorUi.Border, WorldGenEditorUi.BgPanel);
                }

                return previewFrame;
            }
        }

        internal static Texture2D GetStepIcon(int index)
        {
            if (stepIcons == null || stepIcons.Length < 6)
            {
                stepIcons = new Texture2D[6];
                Color[] palette =
                {
                    new Color(0.32f, 0.78f, 0.48f),
                    new Color(0.72f, 0.82f, 0.95f),
                    new Color(0.45f, 0.82f, 0.42f),
                    new Color(0.86f, 0.58f, 0.32f),
                    new Color(0.92f, 0.38f, 0.38f),
                    new Color(0.24f, 0.62f, 1f)
                };

                for (int i = 0; i < stepIcons.Length; i++)
                {
                    stepIcons[i] = BuildStepIcon(48, palette[i % palette.Length], i);
                }
            }

            index = Mathf.Clamp(index, 0, stepIcons.Length - 1);
            return stepIcons[index];
        }

        private static Texture2D BuildHeroBanner(int width, int height)
        {
            Texture2D tex = new Texture2D(width, height, TextureFormat.RGBA32, false)
            {
                wrapMode = TextureWrapMode.Clamp,
                filterMode = FilterMode.Bilinear,
                hideFlags = HideFlags.HideAndDontSave
            };

            Color left = new Color(0.06f, 0.10f, 0.18f);
            Color mid = new Color(0.10f, 0.18f, 0.32f);
            Color right = new Color(0.14f, 0.10f, 0.24f);
            Color accent = new Color(0.24f, 0.62f, 1f, 0.18f);

            for (int y = 0; y < height; y++)
            {
                float vy = y / (float)(height - 1);
                for (int x = 0; x < width; x++)
                {
                    float vx = x / (float)(width - 1);
                    Color baseColor = Color.Lerp(Color.Lerp(left, mid, vx), right, vx * vx);
                    float hill = Mathf.PerlinNoise(vx * 3.2f, vy * 1.8f) * 0.08f;
                    float glow = Mathf.Exp(-Mathf.Pow((vx - 0.72f) * 3.5f, 2f)) * 0.35f;
                    Color c = baseColor;
                    c.r += hill + glow * accent.r;
                    c.g += hill * 0.5f + glow * accent.g;
                    c.b += hill * 0.25f + glow * accent.b;
                    if (y >= height - 3)
                    {
                        c = Color.Lerp(c, WorldGenEditorUi.Accent, (y - (height - 4)) / 3f);
                    }

                    tex.SetPixel(x, y, c);
                }
            }

            tex.Apply();
            return tex;
        }

        private static Texture2D BuildRadialGlow(int size, Color centerColor)
        {
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false)
            {
                hideFlags = HideFlags.HideAndDontSave
            };
            float half = size * 0.5f;
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dx = (x - half) / half;
                    float dy = (y - half) / half;
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    float a = Mathf.Clamp01(1f - d) * centerColor.a;
                    tex.SetPixel(x, y, new Color(centerColor.r, centerColor.g, centerColor.b, a));
                }
            }

            tex.Apply();
            return tex;
        }

        private static Texture2D BuildFrameTexture(int border, Color borderColor, Color fillColor)
        {
            int size = border * 2 + 4;
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false)
            {
                hideFlags = HideFlags.HideAndDontSave
            };
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    bool edge = x < border || y < border || x >= size - border || y >= size - border;
                    tex.SetPixel(x, y, edge ? borderColor : fillColor);
                }
            }

            tex.Apply();
            return tex;
        }

        private static Texture2D BuildStepIcon(int size, Color accent, int variant)
        {
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false)
            {
                hideFlags = HideFlags.HideAndDontSave
            };

            float half = size * 0.5f;
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dx = (x - half) / half;
                    float dy = (y - half) / half;
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    Color c = new Color(0.12f, 0.12f, 0.14f, 1f);
                    if (d < 0.92f)
                    {
                        float n = Mathf.PerlinNoise(x * 0.14f + variant * 2.1f, y * 0.14f);
                        c = Color.Lerp(new Color(0.16f, 0.16f, 0.18f), accent, 0.35f + n * 0.45f);
                        if (variant % 2 == 0 && dy > 0.1f && Mathf.Abs(dx) < 0.35f)
                        {
                            c = Color.Lerp(c, accent, 0.55f);
                        }

                        if (variant == 5 && d < 0.35f)
                        {
                            c = Color.Lerp(accent, Color.white, 0.35f);
                        }
                    }

                    if (d > 0.88f && d < 0.98f)
                    {
                        c = accent;
                    }

                    tex.SetPixel(x, y, c);
                }
            }

            tex.Apply();
            return tex;
        }
    }
}
#endif
