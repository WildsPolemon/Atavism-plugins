import json
import statistics
import unittest
from pathlib import Path

from unity_world_generator.tools.worldgen_preview import generate_world


class WorldGenPreviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config_path = Path("/workspace/unity_world_generator/Samples~/Configs/example_world_config.json")
        cls.config = json.loads(config_path.read_text(encoding="utf-8"))

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


if __name__ == "__main__":
    unittest.main()
