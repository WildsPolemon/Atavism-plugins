import json
import math
import statistics
import unittest
from pathlib import Path

from unity_world_generator.tools.worldgen_preview import fbm01, generate_world, sample_height01


class WorldGenPreviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config_path = Path("/workspace/unity_world_generator/Samples~/Configs/example_world_config.json")
        cls.config = json.loads(config_path.read_text(encoding="utf-8"))
        wow_config_path = Path("/workspace/unity_world_generator/Samples~/Configs/wow_like_world_config.json")
        cls.wow_config = json.loads(wow_config_path.read_text(encoding="utf-8"))

    def test_generation_is_deterministic(self):
        first = generate_world(self.config)
        second = generate_world(self.config)
        self.assertEqual(first["city_count"], second["city_count"])
        self.assertEqual(first["cave_count"], second["cave_count"])
        self.assertEqual(first["resource_count"], second["resource_count"])
        self.assertEqual(first["cities"][0]["center"], second["cities"][0]["center"])

    def test_city_spacing_respected(self):
        result = generate_world(self.config)
        cities = result["cities"]
        min_dist = self.config["cities"]["min_distance_between_cities"]
        for i in range(len(cities)):
            for j in range(i + 1, len(cities)):
                ax, _, az = cities[i]["center"]
                bx, _, bz = cities[j]["center"]
                dist_sq = (ax - bx) ** 2 + (az - bz) ** 2
                self.assertGreaterEqual(dist_sq, min_dist ** 2 * 0.85)

    def test_cities_are_above_sea_safety_margin(self):
        result = generate_world(self.config)
        min_margin = self.config["cities"].get("min_height_above_sea01", 0.0)
        sea = self.config["sea_level01"]
        max_h = self.config["max_height_meters"]
        for city in result["cities"]:
            h01 = city["center"][1] / max_h
            self.assertGreaterEqual(h01, sea + min_margin)

    def test_cities_are_not_adjacent_to_water_ring(self):
        result = generate_world(self.config)
        sea = self.config["sea_level01"]
        min_area = self.config["cities"].get("min_area_height_above_sea01", 0.0)
        min_allowed = sea + min_area
        ring_radius = self.config["cities"]["district_ring_radius"] * 0.95
        sample_count = max(8, int(self.config["cities"].get("water_proximity_samples", 24)))
        for city in result["cities"]:
            cx, _, cz = city["center"]
            for i in range(sample_count):
                angle = (i / sample_count) * 2.0 * math.pi
                x = cx + math.cos(angle) * ring_radius
                z = cz + math.sin(angle) * ring_radius
                h01 = sample_height01(self.config, x, z)
                self.assertGreaterEqual(h01, min_allowed)

    def test_terrain_shape_changes_height_profile(self):
        shape_cfg = self.config.get("terrain_shape", {})
        if not shape_cfg.get("enable_advanced_shaping", True):
            self.skipTest("Terrain shaping is disabled in this config.")

        height_noise = self.config["noise"]["height"]
        seed = self.config["world_seed"]
        points = [
            (1530.0, 1910.0),
            (4420.0, 5130.0),
            (7900.0, 3820.0),
            (10200.0, 10800.0),
        ]
        deltas = []
        for x, z in points:
            shaped = sample_height01(self.config, x, z)
            raw = fbm01(x, z, seed, height_noise)
            deltas.append(abs(shaped - raw))

        self.assertGreater(max(deltas), 0.01)

    def test_wow_like_has_broad_plains_and_highlands(self):
        world_size = self.wow_config["world_size_chunks"] * self.wow_config["chunk_size_meters"]
        lowland_threshold = self.wow_config["terrain_shape"]["lowland_threshold01"]
        mountain_start = self.wow_config["terrain_shape"]["mountain_boost_start01"]

        plains = 0
        highlands = 0
        samples = 0
        for iz in range(28):
            for ix in range(28):
                x = (ix + 0.5) * (world_size / 28.0)
                z = (iz + 0.5) * (world_size / 28.0)
                h = sample_height01(self.wow_config, x, z)
                samples += 1
                if h <= lowland_threshold:
                    plains += 1
                if h >= mountain_start:
                    highlands += 1

        self.assertGreater(plains / samples, 0.25)
        self.assertGreater(highlands / samples, 0.08)

    def test_caves_are_outside_city_exclusion(self):
        result = generate_world(self.config)
        exclusion = self.config["caves_variant_a"]["city_exclusion_radius"]
        for cave in result["caves"]:
            ex, _, ez = cave["entrance"]
            for city in result["cities"]:
                cx, _, cz = city["center"]
                dist_sq = (ex - cx) ** 2 + (ez - cz) ** 2
                self.assertGreaterEqual(dist_sq, exclusion ** 2)

    def test_resources_generated(self):
        result = generate_world(self.config)
        self.assertGreater(result["resource_count"], 100)

    def test_intercity_roads_generated(self):
        result = generate_world(self.config)
        self.assertGreater(result["road_count"], 10)

    def test_mmorpg_spawns_generated(self):
        result = generate_world(self.config)
        self.assertGreaterEqual(result["player_spawn_count"], result["city_count"])
        self.assertGreater(result["npc_spawn_count"], result["city_count"])
        self.assertGreater(result["mob_zone_count"], 50)

    def test_resource_biome_variety_present(self):
        result = generate_world(self.config)
        biome_ids = {node["biome_id"] for node in result["resources"]}
        self.assertGreaterEqual(len(biome_ids), 3)

    def test_tundra_is_more_polar_than_desert_in_resources(self):
        result = generate_world(self.config)
        world_center_z = (self.config["world_size_chunks"] * self.config["chunk_size_meters"]) * 0.5
        tundra_latitudes = [
            abs(node["position"][2] - world_center_z)
            for node in result["resources"]
            if node["biome_id"] == "tundra"
        ]
        desert_latitudes = [
            abs(node["position"][2] - world_center_z)
            for node in result["resources"]
            if node["biome_id"] == "desert"
        ]
        if not tundra_latitudes or not desert_latitudes:
            self.skipTest("Expected tundra and desert resources for latitude comparison.")

        self.assertGreater(statistics.mean(tundra_latitudes), statistics.mean(desert_latitudes))

    def test_runtime_streaming_budget_reduces_active_objects(self):
        result = generate_world(self.config)
        runtime = result["runtime_estimate"]
        runtime_cfg = self.config["runtime_optimization"]
        self.assertTrue(runtime["enabled"])
        self.assertLess(runtime["active_total"], runtime["full_total"])
        self.assertLessEqual(runtime["active_total"], runtime_cfg["max_active_objects"])
        self.assertLessEqual(runtime["active_resources"], runtime_cfg["max_active_resources"])

    def test_sector_payload_generated(self):
        result = generate_world(self.config)
        sectors = result["sectors"]
        self.assertGreater(len(sectors), 20)
        self.assertEqual(sum(sector["city_count"] for sector in sectors), result["city_count"])

    def test_sector_spawn_caps_respected(self):
        result = generate_world(self.config)
        sectors = result["sectors"]
        caps = self.config["sector_settings"]
        for sector in sectors:
            self.assertLessEqual(sector["resource_count"], caps["max_resources_per_sector"])
            self.assertLessEqual(sector["npc_spawn_count"], caps["max_npc_spawns_per_sector"])
            self.assertLessEqual(sector["mob_zone_count"], caps["max_mob_zones_per_sector"])


if __name__ == "__main__":
    unittest.main()
