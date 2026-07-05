#!/usr/bin/env python3
"""Render clean Unity-style WorldGen Studio v7 mockup."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent))

from unity_world_generator.tools.worldgen_preview import build_terrain_shape_cfg, sample_height01

# Unity dark theme
BG = (43, 43, 43)
BG_NAV = (56, 56, 56)
BG_PANEL = (60, 60, 60)
BG_PREVIEW = (50, 50, 50)
BORDER = (26, 26, 26)
BTN = (48, 48, 48)
BTN_PRIMARY = (42, 95, 158)
BTN_ACTIVE = (42, 95, 158)
TEXT = (224, 224, 224)
TEXT_DIM = (154, 154, 154)
ACCENT = (76, 142, 217)


def font(size: int, bold: bool = False):
    p = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    return ImageFont.truetype(p, size) if Path(p).exists() else ImageFont.load_default()


def height_color(h: float, sea: float):
    if h < sea - 0.02:
        return (31, 71, 133)
    if h < sea + 0.04:
        t = (h - (sea - 0.02)) / 0.06
        return tuple(int(a + (b - a) * t) for a, b in zip((46, 107, 158), (56, 122, 71)))
    if h < 0.55:
        t = (h - sea) / 0.35
        return tuple(int(a + (b - a) * t) for a, b in zip((51, 128, 61), (92, 133, 56)))
    if h < 0.72:
        t = (h - 0.55) / 0.17
        return tuple(int(a + (b - a) * t) for a, b in zip((107, 112, 77), (133, 117, 87)))
    t = (h - 0.72) / 0.28
    return tuple(int(a + (b - a) * t) for a, b in zip((148, 138, 122), (235, 235, 242)))


def preview(config: dict, size: int = 380) -> Image.Image:
    img = Image.new("RGB", (size, size), BG_PREVIEW)
    world = config.get("world_size_in_chunks", 12) * config["chunk_size_meters"]
    sea = config.get("sea_level01", 0.32)
    shape = build_terrain_shape_cfg(config)
    px = []
    for py in range(size):
        z = (py / (size - 1)) * world
        for px_ in range(size):
            x = (px_ / (size - 1)) * world
            px.append(height_color(sample_height01(config, x, z, shape), sea))
    img.putdata(px)
    return img


def render(width=1600, height=900, config=None) -> Image.Image:
    img = Image.new("RGB", (width, height), BG)
    d = ImageDraw.Draw(img)

    # Toolbar
    d.rectangle((0, 0, width, 38), fill=BG_NAV)
    d.rectangle((0, 37, width, 38), fill=BORDER)
    d.rounded_rectangle((10, 6, 130, 32), radius=3, fill=BTN_PRIMARY)
    d.text((22, 11), "Generate World", font=font(11, True), fill=TEXT)
    for lbl, x, w in [("Terrain Only", 138, 96), ("Validate", 240, 72), ("Random Seed", 318, 92)]:
        d.rounded_rectangle((x, 6, x + w, 32), radius=3, fill=BTN, outline=BORDER)
        d.text((x + 10, 11), lbl, font=font(10), fill=TEXT)
    d.text((width - 200, 12), "Ready", font=font(10), fill=TEXT_DIM)
    d.text((width - 88, 12), "studio-v7.0", font=font(9), fill=TEXT_DIM)

    nav_w = 196
    top = 38
    d.rectangle((0, top, nav_w, height - 22), fill=BG_NAV)
    d.rectangle((nav_w, top, nav_w + 1, height - 22), fill=BORDER)

    pages = ["Build Location", "Terrain", "Biomes", "World Layout", "Spawns", "Results"]
    y = top + 10
    for i, p in enumerate(pages):
        if i == 0:
            d.rectangle((0, y + 2, 3, y + 30), fill=ACCENT)
            d.rectangle((0, y, nav_w, y + 32), fill=(69, 69, 69))
            d.text((16, y + 8), p, font=font(11, True), fill=TEXT)
        else:
            d.text((16, y + 8), p, font=font(11), fill=TEXT_DIM)
        y += 34

    d.rectangle((0, height - 120, nav_w, height - 22), fill=BG_NAV)
    d.rectangle((0, height - 121, nav_w, height - 120), fill=BORDER)
    d.text((12, height - 108), "Scene", font=font(9, True), fill=TEXT_DIM)
    d.rectangle((12, height - 92, nav_w - 12, height - 68), fill=BTN, outline=BORDER)
    d.text((18, height - 86), "WorldGenerator", font=font(9), fill=TEXT_DIM)
    d.rectangle((12, height - 62, nav_w - 12, height - 38), fill=BTN, outline=BORDER)
    d.text((18, height - 56), "WorldGeneratorConfig", font=font(9), fill=TEXT_DIM)

    mx = nav_w + 16
    my = top + 12
    for i, (val, lbl) in enumerate([("3.1 km²", "World Area"), ("1", "Cities"), ("16", "Terrain Tiles"), ("~1–2 min", "Bake ETA")]):
        x = mx + i * 148
        d.rectangle((x, my, x + 136, my + 52), fill=BG_PANEL, outline=BORDER)
        d.text((x + 10, my + 8), val, font=font(15, True), fill=TEXT)
        d.text((x + 10, my + 30), lbl, font=font(9), fill=TEXT_DIM)

    my += 64
    d.text((mx, my), "Build Location", font=font(14, True), fill=TEXT)
    d.text((mx, my + 20), "Zone map, terrain, biomes, Synty kits, POI markers — one workflow.", font=font(10), fill=TEXT_DIM)
    my += 44

    # Split: preview | form
    split_x = mx + 420
    d.rectangle((mx, my, split_x - 8, height - 34), fill=BG_PREVIEW, outline=BORDER)
    pv = preview(config or {}, 380)
    img.paste(pv, (mx + 12, my + 12))

    d.rectangle((split_x, my, width - 16, height - 34), fill=BG)
    fy = my + 8
    folds = [
        ("General", ["Location Name    Boss Zone"]),
        ("1. Zone (3 km)", ["12 chunks × 256 m, 16 terrain tiles", "[ Apply Zone Size ]"]),
        ("2. Terrain Style", ["[ Alpine ]  [ Heroic WoW ]", "Mountain Boost  ———○———"]),
        ("3. Biomes & Textures", ["[ Apply 10-Biome Template ]", "Grass  [    ]  Stone  [    ]"]),
        ("4. Synty Kits", ["Forest  [ POLYGON/... ]", "Ruins   [ POLYGON/... ]"]),
    ]
    for title, lines in folds:
        d.text((split_x + 12, fy), f"▼ {title}", font=font(11, True), fill=TEXT)
        fy += 18
        for line in lines:
            d.text((split_x + 20, fy), line, font=font(9), fill=TEXT_DIM)
            fy += 16
        fy += 6

    d.rounded_rectangle((split_x + 12, height - 78, split_x + 220, height - 46), radius=3, fill=BTN_PRIMARY)
    d.text((split_x + 36, height - 68), "Build Zone Location", font=font(11, True), fill=TEXT)

    d.rectangle((0, height - 22, width, height), fill=BG_NAV)
    d.text((12, height - 17), "Ready  |  bake studio-v7.0", font=font(9), fill=TEXT_DIM)
    return img


def main():
    p = argparse.ArgumentParser()
    p.add_argument("-o", type=Path, default=Path("releases/editor_media_2026-07-05/worldgen_studio_v7.png"))
    p.add_argument("--config", type=Path, default=ROOT / "Samples~/Configs/wow_like_world_config.json")
    args = p.parse_args()
    cfg = json.loads(args.config.read_text(encoding="utf-8"))
    cfg["world_size_in_chunks"] = 12
    cfg["chunk_size_meters"] = 256
    img = render(config=cfg)
    args.o.parent.mkdir(parents=True, exist_ok=True)
    img.save(args.o, optimize=True)
    print(f"Saved {args.o}")


if __name__ == "__main__":
    main()
