#!/usr/bin/env python3
import argparse
import json
import math
import random
from pathlib import Path


def smoothstep(t: float) -> float:
    return t * t * (3.0 - 2.0 * t)


def hash01(x: int, z: int, seed: int) -> float:
    h = seed & 0xFFFFFFFF
    h ^= (x * 0x9E3779B9) & 0xFFFFFFFF
    h = ((h << 13) | (h >> 19)) & 0xFFFFFFFF
    h ^= (z * 0x85EBCA6B) & 0xFFFFFFFF
    h ^= (h >> 15)
    h = (h * 0xC2B2AE35) & 0xFFFFFFFF
    h ^= (h >> 16)
    return (h & 0x00FFFFFF) / 16777215.0


def value_noise(x: float, z: float, seed: int) -> float:
    x0 = math.floor(x)
    z0 = math.floor(z)
    x1 = x0 + 1
    z1 = z0 + 1

    tx = x - x0
    tz = z - z0

    v00 = hash01(x0, z0, seed)
    v10 = hash01(x1, z0, seed)
    v01 = hash01(x0, z1, seed)
    v11 = hash01(x1, z1, seed)

    sx = smoothstep(tx)
    sz = smoothstep(tz)

    xa = v00 + (v10 - v00) * sx
    xb = v01 + (v11 - v01) * sx
    return xa + (xb - xa) * sz


def fbm01(x: float, z: float, seed: int, layer: dict) -> float:
    frequency = layer["frequency"]
    octaves = layer["octaves"]
    lacunarity = layer["lacunarity"]
    persistence = layer["persistence"]
    ox = layer["offset_x"]
    oz = layer["offset_z"]

    amp = 1.0
    amp_sum = 0.0
    total = 0.0
    for octave in range(octaves):
        nx = (x + ox + seed * 0.017) * frequency
        nz = (z + oz - seed * 0.013) * frequency
        total += value_noise(nx, nz, seed + octave * 971) * amp
        amp_sum += amp
        amp *= persistence
        frequency *= lacunarity
    return max(0.0, min(1.0, total / max(amp_sum, 1e-6)))


DEFAULT_BIOME_CLIMATE = {
    "latitude_temperature_influence": 0.28,
    "elevation_temperature_drop": 0.22,
    "coastal_moisture_boost": 0.18,
    "variation_strength": 0.08,
    "variation_noise": {
        "frequency": 0.0032,
        "octaves": 3,
        "lacunarity": 2.0,
        "persistence": 0.5,
        "offset_x": 57.0,
        "offset_z": -33.0,
    },
}


DEFAULT_RUNTIME_OPTIMIZATION = {
    "enable_distance_streaming": True,
    "streaming_radius_meters": 1400.0,
    "unload_padding_meters": 260.0,
    "cell_size_meters": 220.0,
    "refresh_interval_seconds": 0.35,
    "max_active_objects": 6000,
    "max_active_resources": 2600,
    "keep_cities_always_loaded": True,
}


DEFAULT_SECTOR_SETTINGS = {
    "enable_sectors": True,
    "sector_size_meters": 768.0,
    "neighbor_load_radius": 1,
    "max_resources_per_sector": 1800,
    "max_npc_spawns_per_sector": 96,
    "max_mob_zones_per_sector": 48,
}


DEFAULT_TERRAIN_SHAPE = {
    "enable_advanced_shaping": True,
    "continent_influence": 0.22,
    "continent_noise": {
        "frequency": 0.00022,
        "octaves": 3,
        "lacunarity": 2.0,
        "persistence": 0.5,
        "offset_x": 201.0,
        "offset_z": -144.0,
    },
    "ridge_strength": 0.19,
    "ridge_noise": {
        "frequency": 0.00092,
        "octaves": 4,
        "lacunarity": 2.1,
        "persistence": 0.5,
        "offset_x": -77.0,
        "offset_z": 129.0,
    },
    "lowland_flatten_strength": 0.35,
    "lowland_threshold01": 0.38,
    "mountain_boost_start01": 0.62,
    "mountain_boost_strength": 0.24,
}


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def build_terrain_shape_cfg(config: dict) -> dict:
    shape_cfg = dict(DEFAULT_TERRAIN_SHAPE)
    shape_cfg.update(config.get("terrain_shape", {}))
    shape_cfg["continent_noise"] = dict(DEFAULT_TERRAIN_SHAPE["continent_noise"])
    shape_cfg["continent_noise"].update(config.get("terrain_shape", {}).get("continent_noise", {}))
    shape_cfg["ridge_noise"] = dict(DEFAULT_TERRAIN_SHAPE["ridge_noise"])
    shape_cfg["ridge_noise"].update(config.get("terrain_shape", {}).get("ridge_noise", {}))
    return shape_cfg


def apply_terrain_shape(base_height, x, z, seed, shape_cfg):
    h = clamp01(base_height)
    if not shape_cfg.get("enable_advanced_shaping", True):
        return h

    continent = fbm01(x, z, seed + 211, shape_cfg["continent_noise"])
    h += (continent - 0.5) * shape_cfg["continent_influence"]
    h = clamp01(h)

    ridge_source = fbm01(x, z, seed + 389, shape_cfg["ridge_noise"])
    ridged = 1.0 - abs(ridge_source * 2.0 - 1.0)
    h += (ridged - 0.5) * shape_cfg["ridge_strength"]
    h = clamp01(h)

    lowland_threshold = max(1e-6, shape_cfg["lowland_threshold01"])
    lowland_mask = 1.0 - clamp01((h - lowland_threshold) / lowland_threshold)
    smooth_h = smoothstep(h)
    h = h + (smooth_h - h) * (shape_cfg["lowland_flatten_strength"] * lowland_mask)
    h = clamp01(h)

    mountain_start = min(0.999, max(0.0, shape_cfg["mountain_boost_start01"]))
    mountain_mask = clamp01((h - mountain_start) / max(1e-6, 1.0 - mountain_start))
    h += (mountain_mask ** 2) * shape_cfg["mountain_boost_strength"]
    return clamp01(h)


def sample_height01(config: dict, x: float, z: float, shape_cfg: dict = None) -> float:
    if shape_cfg is None:
        shape_cfg = build_terrain_shape_cfg(config)
    base = fbm01(x, z, config["world_seed"], config["noise"]["height"])
    return apply_terrain_shape(base, x, z, config["world_seed"], shape_cfg)


def poisson(bounds_w: float, bounds_h: float, min_dist: float, seed: int, k: int = 30):
    if min_dist <= 0:
        return []
    rng = random.Random(seed)
    cell = min_dist / math.sqrt(2)
    grid_w = int(math.ceil(bounds_w / cell))
    grid_h = int(math.ceil(bounds_h / cell))
    grid = [[-1 for _ in range(grid_w)] for _ in range(grid_h)]

    points = []
    active = []

    first = (rng.random() * bounds_w, rng.random() * bounds_h)
    points.append(first)
    active.append(first)
    gx = int(first[0] / cell)
    gy = int(first[1] / cell)
    grid[gy][gx] = 0

    while active:
        idx = rng.randrange(len(active))
        cx, cz = active[idx]
        accepted = False
        for _ in range(k):
            angle = rng.random() * math.tau
            radius = min_dist * (1.0 + rng.random())
            px = cx + math.cos(angle) * radius
            pz = cz + math.sin(angle) * radius
            if px < 0 or pz < 0 or px > bounds_w or pz > bounds_h:
                continue

            pgx = int(px / cell)
            pgy = int(pz / cell)
            ok = True
            for yy in range(max(0, pgy - 2), min(grid_h - 1, pgy + 2) + 1):
                for xx in range(max(0, pgx - 2), min(grid_w - 1, pgx + 2) + 1):
                    pi = grid[yy][xx]
                    if pi < 0:
                        continue
                    qx, qz = points[pi]
                    if (qx - px) ** 2 + (qz - pz) ** 2 < min_dist * min_dist:
                        ok = False
                        break
                if not ok:
                    break
            if ok:
                points.append((px, pz))
                active.append((px, pz))
                grid[pgy][pgx] = len(points) - 1
                accepted = True
                break
        if not accepted:
            active.pop(idx)
    return points


def resolve_biome(height, moisture, temperature, biomes):
    best = None
    best_score = 1e9
    for biome in biomes:
        if not (biome["min_height01"] <= height <= biome["max_height01"]):
            continue
        score = (abs(moisture - biome["ideal_moisture01"]) + abs(temperature - biome["ideal_temperature01"])) / max(1e-4, biome["blend_weight"])
        if score < best_score:
            best_score = score
            best = biome
    return best or biomes[0]


def apply_biome_climate(height, moisture, temperature, x, z, world_size, sea_level, seed, climate_cfg):
    latitude = abs((z / max(1.0, world_size)) * 2.0 - 1.0)
    temperature -= latitude * climate_cfg["latitude_temperature_influence"]

    height_above_sea = max(0.0, height - sea_level)
    temperature -= height_above_sea * climate_cfg["elevation_temperature_drop"]

    coast_proximity = clamp01(1.0 - abs(height - sea_level) / 0.22)
    moisture += coast_proximity * climate_cfg["coastal_moisture_boost"]

    variation = fbm01(x, z, seed + 97, climate_cfg["variation_noise"]) - 0.5
    moisture += variation * climate_cfg["variation_strength"]
    temperature += variation * climate_cfg["variation_strength"] * 0.45
    return clamp01(moisture), clamp01(temperature)


def estimate_runtime_streaming(result, config):
    opt = dict(DEFAULT_RUNTIME_OPTIMIZATION)
    opt.update(config.get("runtime_optimization", {}))
    sectors = dict(DEFAULT_SECTOR_SETTINGS)
    sectors.update(config.get("sector_settings", {}))

    full_total = (
        result["city_count"]
        + result["road_count"]
        + result["cave_count"]
        + result["resource_count"]
        + result["player_spawn_count"]
        + result["npc_spawn_count"]
        + result["mob_zone_count"]
    )

    if not opt["enable_distance_streaming"]:
        return {
            "enabled": False,
            "full_total": full_total,
            "active_total": full_total,
            "active_resources": result["resource_count"],
        }

    center = result["world_size"] * 0.5
    focus = (center, center)
    streaming_radius = opt["streaming_radius_meters"]
    if sectors["enable_sectors"] and sectors["neighbor_load_radius"] > 0:
        sector_based = (sectors["neighbor_load_radius"] + 0.5) * max(64.0, sectors["sector_size_meters"])
        streaming_radius = max(streaming_radius, sector_based)
    radius_sq = streaming_radius ** 2
    keep_cities = bool(opt["keep_cities_always_loaded"])
    max_active = max(100, int(opt["max_active_objects"]))
    max_resources = max(0, int(opt["max_active_resources"]))

    candidates = []
    priority = {
        "city": 1200,
        "cave": 980,
        "player": 900,
        "npc": 820,
        "mob_zone": 540,
        "road": 520,
        "resource": 180,
    }

    for city in result["cities"]:
        x, _, z = city["center"]
        dist_sq = (x - focus[0]) ** 2 + (z - focus[1]) ** 2
        if keep_cities or dist_sq <= radius_sq:
            candidates.append(("city", dist_sq))

    for cave in result["caves"]:
        x, _, z = cave["entrance"]
        dist_sq = (x - focus[0]) ** 2 + (z - focus[1]) ** 2
        if dist_sq <= radius_sq:
            candidates.append(("cave", dist_sq))

    for node in result["resources"]:
        x, _, z = node["position"]
        dist_sq = (x - focus[0]) ** 2 + (z - focus[1]) ** 2
        if dist_sq <= radius_sq:
            candidates.append(("resource", dist_sq))

    for point in result["player_spawns"]:
        x, _, z = point["position"]
        dist_sq = (x - focus[0]) ** 2 + (z - focus[1]) ** 2
        if dist_sq <= radius_sq:
            candidates.append(("player", dist_sq))

    for point in result["npc_spawns"]:
        x, _, z = point["position"]
        dist_sq = (x - focus[0]) ** 2 + (z - focus[1]) ** 2
        if dist_sq <= radius_sq:
            candidates.append(("npc", dist_sq))

    for zone in result["mob_zones"]:
        x, _, z = zone["center"]
        dist_sq = (x - focus[0]) ** 2 + (z - focus[1]) ** 2
        if dist_sq <= radius_sq:
            candidates.append(("mob_zone", dist_sq))

    for road in result["world_roads"]:
        ax, _, az = road["from"]
        bx, _, bz = road["to"]
        x = (ax + bx) * 0.5
        z = (az + bz) * 0.5
        dist_sq = (x - focus[0]) ** 2 + (z - focus[1]) ** 2
        if dist_sq <= radius_sq:
            candidates.append(("road", dist_sq))

    candidates.sort(key=lambda entry: (-priority[entry[0]], entry[1]))

    active_total = 0
    active_resources = 0
    for kind, _ in candidates:
        if active_total >= max_active:
            break
        if kind == "resource" and active_resources >= max_resources:
            continue

        active_total += 1
        if kind == "resource":
            active_resources += 1

    return {
        "enabled": True,
        "full_total": full_total,
        "active_total": active_total,
        "active_resources": active_resources,
    }


def build_sector_payload(result, config):
    settings = dict(DEFAULT_SECTOR_SETTINGS)
    settings.update(config.get("sector_settings", {}))
    if not settings["enable_sectors"]:
        return []

    world_size = result["world_size"]
    sector_size = max(64.0, settings["sector_size_meters"])
    sectors_x = max(1, int(math.ceil(world_size / sector_size)))
    sectors_z = max(1, int(math.ceil(world_size / sector_size)))
    max_resources = max(0, int(settings["max_resources_per_sector"]))
    max_npc = max(0, int(settings["max_npc_spawns_per_sector"]))
    max_mob = max(0, int(settings["max_mob_zones_per_sector"]))

    sectors = []
    for z in range(sectors_z):
        for x in range(sectors_x):
            sectors.append(
                {
                    "sector_id": f"sector_{x}_{z}",
                    "sector_x": x,
                    "sector_z": z,
                    "min": [x * sector_size, z * sector_size],
                    "max": [min(world_size, (x + 1) * sector_size), min(world_size, (z + 1) * sector_size)],
                    "city_count": 0,
                    "road_count": 0,
                    "cave_count": 0,
                    "resource_count": 0,
                    "npc_spawn_count": 0,
                    "player_spawn_count": 0,
                    "mob_zone_count": 0,
                    "resource_overflow": 0,
                    "npc_overflow": 0,
                    "mob_zone_overflow": 0,
                }
            )

    def sector_for_point(x, z):
        sx = min(max(int(math.floor(x / sector_size)), 0), sectors_x - 1)
        sz = min(max(int(math.floor(z / sector_size)), 0), sectors_z - 1)
        return sectors[sz * sectors_x + sx]

    for city in result["cities"]:
        x, _, z = city["center"]
        sector_for_point(x, z)["city_count"] += 1

    for road in result["world_roads"]:
        ax, _, az = road["from"]
        bx, _, bz = road["to"]
        mx = (ax + bx) * 0.5
        mz = (az + bz) * 0.5
        sector_for_point(mx, mz)["road_count"] += 1

    for cave in result["caves"]:
        x, _, z = cave["entrance"]
        sector_for_point(x, z)["cave_count"] += 1

    for node in result["resources"]:
        x, _, z = node["position"]
        sector = sector_for_point(x, z)
        if sector["resource_count"] < max_resources:
            sector["resource_count"] += 1
        else:
            sector["resource_overflow"] += 1

    for point in result["player_spawns"]:
        x, _, z = point["position"]
        sector_for_point(x, z)["player_spawn_count"] += 1

    for point in result["npc_spawns"]:
        x, _, z = point["position"]
        sector = sector_for_point(x, z)
        if sector["npc_spawn_count"] < max_npc:
            sector["npc_spawn_count"] += 1
        else:
            sector["npc_overflow"] += 1

    for zone in result["mob_zones"]:
        x, _, z = zone["center"]
        sector = sector_for_point(x, z)
        if sector["mob_zone_count"] < max_mob:
            sector["mob_zone_count"] += 1
        else:
            sector["mob_zone_overflow"] += 1

    return sectors


def pair_key(a: int, b: int):
    return (a, b) if a < b else (b, a)


def build_intercity_roads(cities, sample_height, max_height, cfg, seed):
    if len(cities) < 2:
        return []

    roads = []
    connected = set()

    # MST backbone
    in_tree = {0}
    while len(in_tree) < len(cities):
        best = None
        best_pair = None
        for i in in_tree:
            ax, _, az = cities[i]["center"]
            for j in range(len(cities)):
                if j in in_tree or i == j:
                    continue
                bx, _, bz = cities[j]["center"]
                d = (ax - bx) ** 2 + (az - bz) ** 2
                if best is None or d < best:
                    best = d
                    best_pair = (i, j)
        if best_pair is None:
            break
        in_tree.add(best_pair[1])
        add_curved_road(cities, sample_height, max_height, cfg, seed, best_pair[0], best_pair[1], connected, roads)

    # Extra nearest-neighbor links
    extra = max(0, cfg.get("extra_connections_per_city", 0))
    for i in range(len(cities)):
        ax, _, az = cities[i]["center"]
        neighbors = []
        for j in range(len(cities)):
            if i == j:
                continue
            bx, _, bz = cities[j]["center"]
            d = (ax - bx) ** 2 + (az - bz) ** 2
            neighbors.append((d, j))
        neighbors.sort(key=lambda x: x[0])
        for _, j in neighbors[:extra]:
            add_curved_road(cities, sample_height, max_height, cfg, seed, i, j, connected, roads)
    return roads


def add_curved_road(cities, sample_height, max_height, cfg, seed, a_idx, b_idx, connected, roads):
    key = pair_key(a_idx, b_idx)
    if key in connected:
        return
    connected.add(key)

    ax, _, az = cities[a_idx]["center"]
    bx, _, bz = cities[b_idx]["center"]
    dx = bx - ax
    dz = bz - az
    length = math.sqrt(dx * dx + dz * dz)
    if length <= 1e-3:
        return

    dirx = dx / length
    dirz = dz / length
    perpx = -dirz
    perpz = dirx
    curvature_ratio = cfg.get("max_curvature_ratio", 0.08)
    h = math.sin((a_idx + 1) * 12.9898 + (b_idx + 1) * 78.233 + seed * 0.131)
    curve = length * curvature_ratio * max(-1.0, min(1.0, h))

    mx = (ax + bx) * 0.5 + perpx * curve
    mz = (az + bz) * 0.5 + perpz * curve
    y_off = cfg.get("road_height_offset", 0.5)

    a = [ax, sample_height(ax, az) * max_height + y_off, az]
    m = [mx, sample_height(mx, mz) * max_height + y_off, mz]
    b = [bx, sample_height(bx, bz) * max_height + y_off, bz]
    roads.append({"from": a, "to": m, "type": "intercity"})
    roads.append({"from": m, "to": b, "type": "intercity"})


def generate_spawns(config, cities, caves, sample_height, sample_biome):
    spawn_cfg = config["spawns"]
    player_spawns = []
    npc_spawns = []
    mob_zones = []

    # City player + npc spawns
    for city in cities:
        city_index = city["city_index"]
        cx, _, cz = city["center"]
        player_spawns.append({
            "city_index": city_index,
            "biome_id": city["biome_id"],
            "spawn_type": "Player",
            "position": [cx, sample_height(cx, cz) * config["max_height_meters"] + 1.0, cz],
            "yaw": 0.0,
        })

        extra = max(0, spawn_cfg["player_spawns_per_city"] - 1)
        for p in range(extra):
            angle = (p / max(1, extra)) * math.tau
            px = cx + math.cos(angle) * max(city["core_radius"] * 0.8, 15.0)
            pz = cz + math.sin(angle) * max(city["core_radius"] * 0.8, 15.0)
            player_spawns.append({
                "city_index": city_index,
                "biome_id": city["biome_id"],
                "spawn_type": "Player",
                "position": [px, sample_height(px, pz) * config["max_height_meters"] + 1.0, pz],
                "yaw": math.degrees(angle) + 180.0,
            })

        lots = city.get("lots", [])
        for lot in lots[: spawn_cfg["npc_spawns_per_city"]]:
            lx, lz = lot["center"]
            npc_spawns.append({
                "city_index": city_index,
                "biome_id": city["biome_id"],
                "spawn_type": "NPC",
                "position": [lx, sample_height(lx, lz) * config["max_height_meters"] + 1.0, lz],
                "yaw": float(lot["district_index"] * 90),
            })

    # Wilderness mob zones
    world_size = config["world_size_chunks"] * config["chunk_size_meters"]
    spacing = max(spawn_cfg["mob_zone_radius"] * 1.6, 20.0)
    points = poisson(world_size, world_size, spacing, config["world_seed"] + 4507, k=24)
    city_r2 = spawn_cfg["city_spawn_exclusion_radius"] ** 2
    cave_r2 = spawn_cfg["cave_spawn_exclusion_radius"] ** 2

    for x, z in points:
        if len(mob_zones) >= spawn_cfg["max_mob_zones"]:
            break

        blocked = False
        for city in cities:
            cx, _, cz = city["center"]
            if (cx - x) ** 2 + (cz - z) ** 2 < city_r2:
                blocked = True
                break
        if blocked:
            continue

        for cave in caves:
            ex, _, ez = cave["entrance"]
            if (ex - x) ** 2 + (ez - z) ** 2 < cave_r2:
                blocked = True
                break
        if blocked:
            continue

        h = sample_height(x, z)
        if h < config["sea_level01"] + 0.01:
            continue

        nearest = min(
            math.sqrt((city["center"][0] - x) ** 2 + (city["center"][2] - z) ** 2)
            for city in cities
        )
        tier = 3 if nearest > 3500 else 2 if nearest > 1800 else 1
        biome = sample_biome(x, z)
        mob_zones.append({
            "biome_id": biome["biome_id"],
            "tier": tier,
            "center": [x, h * config["max_height_meters"], z],
            "radius": spawn_cfg["mob_zone_radius"],
        })

    return player_spawns, npc_spawns, mob_zones


def generate_world(config: dict):
    seed = config["world_seed"]
    world_size = config["world_size_chunks"] * config["chunk_size_meters"]
    sea = config["sea_level01"]

    n_moist = config["noise"]["moisture"]
    n_temp = config["noise"]["temperature"]
    climate_cfg = dict(DEFAULT_BIOME_CLIMATE)
    climate_cfg.update(config.get("biome_climate", {}))
    climate_cfg["variation_noise"] = dict(DEFAULT_BIOME_CLIMATE["variation_noise"])
    climate_cfg["variation_noise"].update(config.get("biome_climate", {}).get("variation_noise", {}))
    terrain_shape_cfg = build_terrain_shape_cfg(config)

    def sample_height(x, z):
        return sample_height01(config, x, z, terrain_shape_cfg)

    def sample_biome(x, z):
        h = sample_height(x, z)
        m = fbm01(x, z, seed + 17, n_moist)
        t = fbm01(x, z, seed + 53, n_temp)
        m, t = apply_biome_climate(h, m, t, x, z, world_size, sea, seed, climate_cfg)
        return resolve_biome(h, m, t, config["biomes"])

    # Cities
    city_cfg = config["cities"]
    city_candidates = poisson(world_size, world_size, city_cfg["min_distance_between_cities"], seed + 1103)
    ranked = []
    min_city_h = sea + city_cfg.get("min_height_above_sea01", 0.025)
    shoreline_buffer = city_cfg.get("shoreline_buffer01", 0.06)
    min_area_h = sea + city_cfg.get("min_area_height_above_sea01", 0.04)
    proximity_samples = max(8, int(city_cfg.get("water_proximity_samples", 24)))

    def has_nearby_water(cx, cz):
        radii = [
            max(40.0, city_cfg["city_core_radius"] * 0.45),
            max(80.0, city_cfg["city_core_radius"] * 0.9),
            max(120.0, city_cfg["district_ring_radius"] * 0.65),
            max(180.0, city_cfg["district_ring_radius"] * 0.95),
        ]
        for radius in radii:
            for i in range(proximity_samples):
                angle = (i / max(1, proximity_samples)) * math.tau
                x = cx + math.cos(angle) * radius
                z = cz + math.sin(angle) * radius
                if sample_height(x, z) < min_area_h:
                    return True
        return False

    for x, z in city_candidates:
        c = sample_height(x, z)
        if c < min_city_h:
            continue
        if has_nearby_water(x, z):
            continue
        slope = abs(c - sample_height(x + 35, z)) + abs(c - sample_height(x - 35, z)) + abs(c - sample_height(x, z + 35)) + abs(c - sample_height(x, z - 35))
        shoreline_distance = abs(c - sea)
        shoreline_penalty = (shoreline_buffer - shoreline_distance) * 7 if shoreline_distance < shoreline_buffer else 0.0
        score = slope * 2 + shoreline_penalty
        ranked.append((score, x, z))
    ranked.sort(key=lambda v: v[0])

    cities = []
    for idx, (_, x, z) in enumerate(ranked[: city_cfg["max_cities"]]):
        b = sample_biome(x, z)
        cities.append({
            "city_index": idx,
            "city_tier": "Capital" if idx == 0 else "MajorCity" if idx < 5 else "Town" if idx < 12 else "Village",
            "biome_id": b["biome_id"],
            "center": [x, sample_height(x, z) * config["max_height_meters"], z],
            "core_radius": city_cfg["city_core_radius"],
            "district_radius": city_cfg["district_ring_radius"],
            "lots": [],
        })

    # Minimal district lots for spawn planning
    lot_rng = random.Random(seed + 2049)
    for city in cities:
        cx, _, cz = city["center"]
        inner = city["core_radius"] + city_cfg["road_block_size"]
        outer = city["district_radius"] - city_cfg["road_block_size"]
        for _ in range(city_cfg["target_lots_per_city"]):
            angle = lot_rng.random() * math.tau
            radius = inner + (outer - inner) * lot_rng.random()
            lx = cx + math.cos(angle) * radius
            lz = cz + math.sin(angle) * radius
            district = int((angle / (math.pi / 2)) % 4)
            city["lots"].append({"center": [lx, lz], "district_index": district})

    road_cfg = config.get("roads", {"extra_connections_per_city": 1, "road_height_offset": 0.5, "max_curvature_ratio": 0.08})
    world_roads = build_intercity_roads(cities, sample_height, config["max_height_meters"], road_cfg, seed)

    # Caves Variant A
    cave_cfg = config["caves_variant_a"]
    cave_candidates = poisson(world_size, world_size, cave_cfg["min_distance_between_entrances"], seed + 3901, k=28)
    caves = []
    rng = random.Random(seed + 9017)

    weights = [max(0.0, c["weight"]) for c in cave_cfg["stamp_presets"]]
    total_w = sum(weights)

    def pick_stamp():
        if total_w <= 0:
            return cave_cfg["stamp_presets"][0]
        ticket = rng.random() * total_w
        acc = 0.0
        for stamp, w in zip(cave_cfg["stamp_presets"], weights):
            acc += w
            if ticket <= acc:
                return stamp
        return cave_cfg["stamp_presets"][-1]

    def near_city(px, pz):
        r2 = cave_cfg["city_exclusion_radius"] ** 2
        for city in cities:
            cx, _, cz = city["center"]
            if (cx - px) ** 2 + (cz - pz) ** 2 < r2:
                return True
        return False

    for x, z in cave_candidates:
        if len(caves) >= cave_cfg["max_caves"]:
            break
        if near_city(x, z):
            continue
        c = sample_height(x, z)
        slope = abs(c - sample_height(x + 10, z)) + abs(c - sample_height(x, z + 10))
        if slope < cave_cfg["min_slope_delta"]:
            continue
        stamp = pick_stamp()
        yaw = rng.random() * 360.0
        biome = sample_biome(x, z)
        caves.append({
            "biome_id": biome["biome_id"],
            "stamp_id": stamp["stamp_id"],
            "entrance": [x, sample_height(x, z) * config["max_height_meters"] + 1.5, z],
            "yaw": yaw,
        })

    # Resources
    resource_cfg = config["resources"]
    resource_points = poisson(world_size, world_size, resource_cfg["base_node_spacing"], seed + 8201, k=20)
    rules = resource_cfg["biome_rules"]
    world_area_km2 = (world_size * world_size) / 1_000_000.0

    resources = []
    for x, z in resource_points:
        biome = sample_biome(x, z)
        bid = biome["biome_id"]
        if bid not in rules:
            continue
        rule = rules[bid]
        target = rule["nodes_per_square_km"] * world_area_km2
        keep = min(1.0, target / max(1.0, len(resource_points)))
        if rng.random() > keep:
            continue

        blocked = False
        city_r2 = resource_cfg["city_resource_exclusion_radius"] ** 2
        for city in cities:
            cx, _, cz = city["center"]
            if (cx - x) ** 2 + (cz - z) ** 2 < city_r2:
                blocked = True
                break
        if blocked:
            continue

        cave_r2 = resource_cfg["cave_resource_exclusion_radius"] ** 2
        for cave in caves:
            ex, _, ez = cave["entrance"]
            if (ex - x) ** 2 + (ez - z) ** 2 < cave_r2:
                blocked = True
                break
        if blocked:
            continue

        entries = rule["entries"]
        tw = sum(max(0.0, e["weight"]) for e in entries)
        ticket = rng.random() * max(tw, 1e-6)
        acc = 0.0
        selected = entries[0]
        for entry in entries:
            acc += max(0.0, entry["weight"])
            if ticket <= acc:
                selected = entry
                break

        resources.append({
            "biome_id": bid,
            "resource_id": selected["resource_id"],
            "position": [x, sample_height(x, z) * config["max_height_meters"], z],
            "yaw": rng.random() * 360.0,
        })

    player_spawns, npc_spawns, mob_zones = generate_spawns(config, cities, caves, sample_height, sample_biome)

    result = {
        "world_seed": seed,
        "world_size": world_size,
        "city_count": len(cities),
        "road_count": len(world_roads),
        "cave_count": len(caves),
        "resource_count": len(resources),
        "player_spawn_count": len(player_spawns),
        "npc_spawn_count": len(npc_spawns),
        "mob_zone_count": len(mob_zones),
        "cities": cities,
        "world_roads": world_roads,
        "caves": caves,
        "resources": resources,
        "player_spawns": player_spawns,
        "npc_spawns": npc_spawns,
        "mob_zones": mob_zones,
    }
    result["runtime_estimate"] = estimate_runtime_streaming(result, config)
    result["sectors"] = build_sector_payload(result, config)
    return result


def main():
    parser = argparse.ArgumentParser(description="Generate AAA world preview payload")
    parser.add_argument("--config", required=True, help="Path to JSON config")
    parser.add_argument("--out", required=True, help="Output JSON path")
    args = parser.parse_args()

    with Path(args.config).open("r", encoding="utf-8") as f:
        cfg = json.load(f)

    result = generate_world(cfg)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

    print(f"world_seed={result['world_seed']}")
    print(f"city_count={result['city_count']}")
    print(f"road_count={result['road_count']}")
    print(f"cave_count={result['cave_count']}")
    print(f"resource_count={result['resource_count']}")
    print(f"player_spawn_count={result['player_spawn_count']}")
    print(f"npc_spawn_count={result['npc_spawn_count']}")
    print(f"mob_zone_count={result['mob_zone_count']}")
    print(f"runtime_active_total_estimate={result['runtime_estimate']['active_total']}")
    print(f"runtime_full_total={result['runtime_estimate']['full_total']}")
    print(f"sector_count={len(result['sectors'])}")


if __name__ == "__main__":
    main()
