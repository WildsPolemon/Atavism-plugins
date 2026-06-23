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


def generate_world(config: dict):
    seed = config["world_seed"]
    world_size = config["world_size_chunks"] * config["chunk_size_meters"]
    sea = config["sea_level01"]

    n_height = config["noise"]["height"]
    n_moist = config["noise"]["moisture"]
    n_temp = config["noise"]["temperature"]

    def sample_height(x, z):
        return fbm01(x, z, seed, n_height)

    def sample_biome(x, z):
        h = sample_height(x, z)
        m = fbm01(x, z, seed + 17, n_moist)
        t = fbm01(x, z, seed + 53, n_temp)
        return resolve_biome(h, m, t, config["biomes"])

    # Cities
    city_cfg = config["cities"]
    city_candidates = poisson(world_size, world_size, city_cfg["min_distance_between_cities"], seed + 1103)
    ranked = []
    for x, z in city_candidates:
        c = sample_height(x, z)
        slope = abs(c - sample_height(x + 35, z)) + abs(c - sample_height(x - 35, z)) + abs(c - sample_height(x, z + 35)) + abs(c - sample_height(x, z - 35))
        score = slope * 2 + abs(c - sea)
        ranked.append((score, x, z))
    ranked.sort(key=lambda v: v[0])

    cities = []
    for _, x, z in ranked[: city_cfg["max_cities"]]:
        b = sample_biome(x, z)
        cities.append({
            "biome_id": b["biome_id"],
            "center": [x, sample_height(x, z) * config["max_height_meters"], z],
            "core_radius": city_cfg["city_core_radius"],
            "district_radius": city_cfg["district_ring_radius"],
        })

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

    return {
        "world_seed": seed,
        "world_size": world_size,
        "city_count": len(cities),
        "cave_count": len(caves),
        "resource_count": len(resources),
        "cities": cities,
        "caves": caves,
        "resources": resources,
    }


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
    print(f"cave_count={result['cave_count']}")
    print(f"resource_count={result['resource_count']}")


if __name__ == "__main__":
    main()
