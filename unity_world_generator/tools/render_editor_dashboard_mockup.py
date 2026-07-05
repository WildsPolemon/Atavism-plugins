#!/usr/bin/env python3
"""Render WorldGen Studio mockup + terrain height preview."""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent))

from unity_world_generator.tools.worldgen_preview import build_terrain_shape_cfg, sample_height01


BG_DARK = (30, 30, 30)
BG_PANEL = (37, 37, 37)
BG_CARD = (45, 45, 45)
BG_SIDEBAR = (25, 25, 25)
ACCENT = (61, 158, 255)
SUCCESS = (82, 199, 122)
TEXT_PRIMARY = (235, 235, 235)
TEXT_MUTED = (158, 163, 173)
BORDER = (71, 71, 71)
BTN_PRIMARY = (48, 120, 200)
BTN_SECONDARY = (55, 55, 55)


def load_font(size: int, bold: bool = False):
    path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    if Path(path).exists():
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


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


def render_height_preview(config: dict, size: int = 220) -> Image.Image:
    img = Image.new("RGB", (size, size), BG_CARD)
    world = config.get("world_size_in_chunks", config.get("world_size_chunks", 48)) * config["chunk_size_meters"]
    sea = config.get("sea_level01", 0.32)
    shape = build_terrain_shape_cfg(config)
    pixels = []
    for py in range(size):
        z = (py / (size - 1)) * world
        for px in range(size):
            x = (px / (size - 1)) * world
            h = sample_height01(config, x, z, shape)
            pixels.append(height_color(h, sea))
    img.putdata(pixels)
    return img


def render_dashboard(config: dict, width: int = 1920, height: int = 1080) -> Image.Image:
    img = Image.new("RGB", (width, height), BG_DARK)
    draw = ImageDraw.Draw(img)

    draw.rectangle((0, 0, width, 28), fill=(38, 38, 38))
    draw.text((12, 6), "WorldGen Studio", font=load_font(11), fill=TEXT_MUTED)

    banner_y = 28
    draw.rectangle((0, banner_y, width, banner_y + 72), fill=BG_SIDEBAR)
    draw.rectangle((0, banner_y + 69, width, banner_y + 72), fill=ACCENT)
    draw.text((20, banner_y + 14), "WorldGen Studio", font=load_font(22, True), fill=TEXT_PRIMARY)
    draw.text((20, banner_y + 42), "Procedural MMO worlds — terrain, biomes, cities, caves, spawns", font=load_font(11), fill=TEXT_MUTED)

    rail_y = banner_y + 82
    draw.rounded_rectangle((16, rail_y, 250, rail_y + 48), radius=6, fill=BTN_PRIMARY)
    draw.text((38, rail_y + 14), "GENERATE WORLD", font=load_font(13, True), fill=TEXT_PRIMARY)
    for label, x, w in [("Terrain Only", 262, 96), ("Validate", 368, 72), ("Random Seed", 448, 96)]:
        draw.rounded_rectangle((x, rail_y, x + w, rail_y + 48), radius=6, fill=BTN_SECONDARY, outline=BORDER)
        draw.text((x + 12, rail_y + 16), label, font=load_font(11), fill=TEXT_PRIMARY)

    content_top = rail_y + 62
    sidebar_w = 188
    draw.rectangle((0, content_top, sidebar_w, height - 24), fill=BG_SIDEBAR)
    sections = ["Setup", "Terrain", "World Layout", "Biomes", "Spawns & Perf", "Results"]
    sy = content_top + 12
    for i, sec in enumerate(sections):
        active = i == 1
        if active:
            draw.rectangle((8, sy + 4, 11, sy + 30), fill=ACCENT)
            draw.rounded_rectangle((14, sy, sidebar_w - 8, sy + 34), radius=4, fill=(35, 70, 110))
            draw.text((26, sy + 9), f"  {sec}", font=load_font(12, True), fill=TEXT_PRIMARY)
        else:
            draw.text((26, sy + 9), f"  {sec}", font=load_font(12), fill=TEXT_MUTED)
        sy += 36

    mx = sidebar_w + 16
    my = content_top + 8
    metrics = [("World Area", "20.3 km²"), ("Cities", "16"), ("Terrain Tiles", "784"), ("Validation", "OK")]
    card_w = 220
    for i, (label, value) in enumerate(metrics):
        x = mx + i * (card_w + 12)
        draw.rounded_rectangle((x, my, x + card_w, my + 68), radius=6, fill=BG_CARD, outline=BORDER)
        draw.rectangle((x, my, x + 4, my + 68), fill=ACCENT if i != 3 else SUCCESS)
        draw.text((x + 14, my + 10), value, font=load_font(18, True), fill=TEXT_PRIMARY)
        draw.text((x + 14, my + 36), label, font=load_font(10), fill=TEXT_MUTED)
    my += 84

    # Height preview panel
    preview = render_height_preview(config, 280)
    draw.rounded_rectangle((mx, my, mx + 320, my + 360), radius=8, fill=BG_PANEL, outline=BORDER)
    draw.text((mx + 14, my + 8), "Height Preview", font=load_font(13, True), fill=TEXT_PRIMARY)
    draw.text((mx + 14, my + 26), "Live 2D map — tweak seed/shape then Refresh", font=load_font(10), fill=TEXT_MUTED)
    img.paste(preview, (mx + 18, my + 48))

    # Settings panel right
    rx = mx + 336
    draw.rounded_rectangle((rx, my, width - 16, my + 180), radius=8, fill=BG_PANEL, outline=BORDER)
    draw.text((rx + 14, my + 8), "Unity Terrain", font=load_font(13, True), fill=TEXT_PRIMARY)
    lines = [
        "enableTerrainGeneration: true",
        "terrainTileSizeMeters: 512",
        "heightmapResolution: 257",
        "applyHeightmapSmoothing: true",
        "erosionStrength: 0.16",
        "valleyCarveStrength: 0.14",
        "coastalFalloffStrength: 0.32",
    ]
    for i, line in enumerate(lines):
        draw.text((rx + 14, my + 36 + i * 18), line, font=load_font(11), fill=TEXT_MUTED)

    draw.rounded_rectangle((rx, my + 196, width - 16, my + 360), radius=8, fill=BG_PANEL, outline=BORDER)
    draw.text((rx + 14, my + 204), "Terrain Shape", font=load_font(13, True), fill=TEXT_PRIMARY)
    shape_lines = [
        "continentInfluence: 0.28",
        "ridgeStrength: 0.24",
        "lowlandFlattenStrength: 0.42",
        "mountainPeakPower: 1.42",
        "detailStrength: 0.05",
    ]
    for i, line in enumerate(shape_lines):
        draw.text((rx + 14, my + 232 + i * 18), line, font=load_font(11), fill=TEXT_MUTED)

    draw.rectangle((0, height - 24, width, height), fill=BG_SIDEBAR)
    draw.text((12, height - 18), "Terrain preview ready — no export, bake directly in scene.", font=load_font(10), fill=TEXT_MUTED)
    return img


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-o", type=Path, default=Path("releases/editor_media_2026-07-03/worldgen_studio_terrain_tab.png"))
    parser.add_argument("--config", type=Path, default=ROOT / "Samples~/Configs/wow_like_world_config.json")
    args = parser.parse_args()

    config = json.loads(args.config.read_text(encoding="utf-8"))
    img = render_dashboard(config)
    args.o.parent.mkdir(parents=True, exist_ok=True)
    img.save(args.o, optimize=True)
    print(f"Saved {args.o}")


if __name__ == "__main__":
    main()
