using UnityEngine;

namespace AaaWorldGen
{
    public static class DeterministicNoise
    {
        public static float SampleFbm01(float x, float z, int seed, NoiseLayerSettings settings)
        {
            float frequency = settings.frequency;
            float amplitude = 1f;
            float amplitudeSum = 0f;
            float value = 0f;

            for (int octave = 0; octave < settings.octaves; octave++)
            {
                float nx = (x + settings.offsetX + seed * 0.017f) * frequency;
                float nz = (z + settings.offsetZ - seed * 0.013f) * frequency;
                float sample = ValueNoise01(nx, nz, seed + octave * 971);
                value += sample * amplitude;
                amplitudeSum += amplitude;
                amplitude *= settings.persistence;
                frequency *= settings.lacunarity;
            }

            if (amplitudeSum <= Mathf.Epsilon)
            {
                return 0f;
            }

            return Mathf.Clamp01(value / amplitudeSum);
        }

        private static float ValueNoise01(float x, float z, int seed)
        {
            int x0 = Mathf.FloorToInt(x);
            int z0 = Mathf.FloorToInt(z);
            int x1 = x0 + 1;
            int z1 = z0 + 1;

            float tx = x - x0;
            float tz = z - z0;

            float v00 = HashToUnit(x0, z0, seed);
            float v10 = HashToUnit(x1, z0, seed);
            float v01 = HashToUnit(x0, z1, seed);
            float v11 = HashToUnit(x1, z1, seed);

            float sx = SmoothStep(tx);
            float sz = SmoothStep(tz);

            float xa = Mathf.Lerp(v00, v10, sx);
            float xb = Mathf.Lerp(v01, v11, sx);
            return Mathf.Lerp(xa, xb, sz);
        }

        private static float HashToUnit(int x, int z, int seed)
        {
            unchecked
            {
                uint h = (uint)seed;
                h ^= (uint)x * 0x9E3779B9u;
                h = (h << 13) | (h >> 19);
                h ^= (uint)z * 0x85EBCA6Bu;
                h ^= h >> 15;
                h *= 0xC2B2AE35u;
                h ^= h >> 16;
                return (h & 0x00FFFFFF) / 16777215f;
            }
        }

        private static float SmoothStep(float t)
        {
            return t * t * (3f - 2f * t);
        }
    }
}
