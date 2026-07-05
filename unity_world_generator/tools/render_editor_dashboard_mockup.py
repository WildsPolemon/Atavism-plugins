#!/usr/bin/env python3
"""Render WorldGen Studio v6 mockups for README and releases."""

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

BG_DARK = (26, 28, 31)
BG_PANEL = (34, 36, 40)
BG_CARD = (42, 45, 50)
BG_SIDEBAR = (20, 21, 24)
ACCENT = (71, 168, 255)
ACCENT_DEEP = (41, 107, 199)
SUCCESS = (92, 209, 138)
WARNING = (245, 189, 77)
PURPLE = (184, 122, 245)
TEXT_PRIMARY = (240, 242, 247)
TEXT_MUTED = (148, 154, 166)
BORDER = (61, 66, 74)


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


def render_height_preview(config: dict, size: int = 392) -> Image.Image:
    img = Image.new("RGB", (size, size), BG_CARD)
    world = config.get("world_size_in_chunks", config.get("world_size_chunks", 12)) * config["chunk_size_meters"]
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


def draw_hero(draw: ImageDraw.ImageDraw, width: int):
    for y in range(108):
        for x in range(width):
            t = x / max(1, width - 1)
            base = (
                int(16 + 20 * t + 8 * math.sin(t * 4)),
                int(26 + 18 * t),
                int(46 + 30 * (1 - t)),
            )
            draw.point((x, y), fill=base)
    draw.rectangle((0, 106, width, 108), fill=ACCENT)
    draw.text((24, 18), "WorldGen Studio", font=load_font(24, True), fill=TEXT_PRIMARY)
    draw.text((24, 52), "Procedural MMO worlds — zone builder, terrain sculpt, biomes, Synty kits", font=load_font(11), fill=TEXT_MUTED)
    draw.rectangle((width - 148, 22, width - 24, 46), fill=(0, 0, 0, 80))
    draw.rectangle((width - 148, 22, width - 145, 46), fill=ACCENT)
    draw.text((width - 136, 28), "engine studio-v6.0", font=load_font(10, True), fill=TEXT_PRIMARY)


def draw_sidebar(draw, top: int, height: int, active: int):
    draw.rectangle((0, top, 220, height - 24), fill=BG_SIDEBAR)
    items = ["Home", "Build Location", "Terrain Studio", "World Layout", "Biomes", "Spawns", "Results"]
    icons = ["⌂", "◎", "⛰", "🗺", "🌿", "⚡", "📊"]
    y = top + 12
    for i, (icon, label) in enumerate(zip(icons, items)):
        if i == active:
            draw.rectangle((8, y + 4, 11, y + 34), fill=ACCENT)
            draw.rounded_rectangle((12, y, 208, y + 38), radius=4, fill=(35, 70, 110))
            draw.text((24, y + 10), icon, font=load_font(14), fill=ACCENT)
            draw.text((48, y + 11), label, font=load_font(12, True), fill=TEXT_PRIMARY)
        else:
            draw.text((24, y + 10), icon, font=load_font(14), fill=TEXT_MUTED)
            draw.text((48, y + 11), label, font=load_font(12), fill=TEXT_MUTED)
        y += 42


def render_location_wizard(config: dict, width: int = 1920, height: int = 1080) -> Image.Image:
    img = Image.new("RGB", (width, height), BG_DARK)
    draw = ImageDraw.Draw(img)
    draw_hero(draw, width)

    rail_y = 116
    draw.rounded_rectangle((16, rail_y, 220, rail_y + 44), radius=6, fill=ACCENT_DEEP)
    draw.text((42, rail_y + 13), "GENERATE WORLD", font=load_font(12, True), fill=TEXT_PRIMARY)
    for label, x, w in [("Terrain Only", 232, 108), ("Validate", 348, 84), ("Random Seed", 440, 104)]:
        draw.rounded_rectangle((x, rail_y, x + w, rail_y + 44), radius=6, fill=BG_CARD, outline=BORDER)
        draw.text((x + 14, rail_y + 14), label, font=load_font(11), fill=TEXT_PRIMARY)
    draw.rounded_rectangle((580, rail_y + 10, 760, rail_y + 34), radius=4, fill=(35, 90, 60))
    draw.text((592, rail_y + 15), "Ready", font=load_font(10, True), fill=SUCCESS)

    content_top = rail_y + 58
    draw_sidebar(draw, content_top, height, active=1)

    mx = 236
    my = content_top + 10
    metrics = [("3.1 km²", "World Area"), ("1", "Cities"), ("16", "Terrain Tiles"), ("~1–2 min", "Bake ETA")]
    for i, (value, label) in enumerate(metrics):
        x = mx + i * 168
        draw.rounded_rectangle((x, my, x + 156, my + 76), radius=6, fill=BG_CARD, outline=BORDER)
        draw.rectangle((x, my, x + 4, my + 76), fill=ACCENT if i < 3 else SUCCESS)
        draw.text((x + 14, my + 12), value, font=load_font(20, True), fill=TEXT_PRIMARY)
        draw.text((x + 14, my + 42), label, font=load_font(10), fill=TEXT_MUTED)

    steps_y = my + 90
    step_labels = ["Zone", "Terrain", "Biomes", "Synty", "POI", "Build"]
    step_w = (width - mx - 20) / len(step_labels)
    draw.rounded_rectangle((mx, steps_y, width - 16, steps_y + 54), radius=6, fill=BG_PANEL, outline=BORDER)
    for i, label in enumerate(step_labels):
        sx = mx + 8 + i * step_w
        color = ACCENT if i == 1 else SUCCESS if i == 0 else BORDER
        draw.rectangle((sx + 4, steps_y + 40, sx + step_w - 12, steps_y + 43), fill=color)
        draw.text((sx + step_w * 0.22, steps_y + 14), label, font=load_font(10, True if i == 1 else False), fill=TEXT_PRIMARY if i == 1 else TEXT_MUTED)

    body_y = steps_y + 66
    preview = render_height_preview(config, 392)
    draw.rounded_rectangle((mx, body_y, mx + 420, body_y + 470), radius=8, fill=BG_PANEL, outline=BORDER)
    draw.text((mx + 14, body_y + 10), "Live Map Preview", font=load_font(13, True), fill=TEXT_PRIMARY)
    img.paste(preview, (mx + 14, body_y + 42))

    rx = mx + 436
    draw.rounded_rectangle((rx, body_y, width - 16, body_y + 180), radius=8, fill=BG_PANEL, outline=BORDER)
    draw.text((rx + 14, body_y + 10), "Step 2 — Terrain Style", font=load_font(13, True), fill=TEXT_PRIMARY)
    for i, (title, sub, color, selected) in enumerate([
        ("Alpine Peaks", "Sharp ridges, tall peaks", (184, 209, 242), False),
        ("Heroic WoW", "Classic adventure MMO", PURPLE, True),
    ]):
        cx = rx + 14 + i * 250
        cy = body_y + 42
        draw.rounded_rectangle((cx, cy, cx + 236, cy + 58), radius=6, fill=BG_CARD, outline=color if selected else BORDER)
        draw.rectangle((cx, cy, cx + 4, cy + 58), fill=color)
        if selected:
            draw.rectangle((cx, cy, cx + 236, cy + 2), fill=color)
        draw.text((cx + 12, cy + 10), title, font=load_font(12, True), fill=TEXT_PRIMARY)
        draw.text((cx + 12, cy + 30), sub, font=load_font(10), fill=TEXT_MUTED)

    draw.rounded_rectangle((rx, body_y + 196, width - 16, body_y + 320), radius=8, fill=BG_PANEL, outline=BORDER)
    draw.text((rx + 14, body_y + 204), "Step 4 — Synty Kits", font=load_font(13, True), fill=TEXT_PRIMARY)
    kits = [("Forest", "meadow, forest, jungle"), ("Ruins", "volcanic/alpine caves"), ("Road", "pieces to boss arena")]
    for i, (title, sub) in enumerate(kits):
        ky = body_y + 236 + i * 28
        draw.rounded_rectangle((rx + 14, ky, width - 30, ky + 24), radius=4, fill=BG_CARD)
        draw.rectangle((rx + 14, ky, rx + 17, ky + 24), fill=PURPLE)
        draw.text((rx + 24, ky + 5), title, font=load_font(10, True), fill=TEXT_PRIMARY)
        draw.text((rx + 90, ky + 6), sub, font=load_font(9), fill=TEXT_MUTED)

    draw.rounded_rectangle((rx, body_y + 334, width - 16, body_y + 470), radius=8, fill=BG_PANEL, outline=BORDER)
    draw.text((rx + 14, body_y + 342), "Step 5 — POI Markers", font=load_font(13, True), fill=TEXT_PRIMARY)
    draw.text((rx + 14, body_y + 368), "POI_SpawnHub  ·  POI_Ruins  ·  POI_BossArena  ·  RoadHints", font=load_font(11), fill=TEXT_MUTED)
    draw.rounded_rectangle((rx + 14, body_y + 404, rx + 280, body_y + 448), radius=6, fill=ACCENT_DEEP)
    draw.text((rx + 48, body_y + 418), "BUILD ZONE LOCATION", font=load_font(12, True), fill=TEXT_PRIMARY)

    draw.rectangle((0, height - 24, width, height), fill=BG_SIDEBAR)
    draw.text((12, height - 18), "WorldGen Studio  |  bake studio-v6.0  |  Build Location", font=load_font(10), fill=TEXT_MUTED)
    return img


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-o", type=Path, default=Path("releases/editor_media_2026-07-05/worldgen_studio_v6_location.png"))
    parser.add_argument("--config", type=Path, default=ROOT / "Samples~/Configs/wow_like_world_config.json")
    args = parser.parse_args()

    config = json.loads(args.config.read_text(encoding="utf-8"))
    config["world_size_in_chunks"] = 12
    config["chunk_size_meters"] = 256
    img = render_location_wizard(config)
    args.o.parent.mkdir(parents=True, exist_ok=True)
    img.save(args.o, optimize=True)
    print(f"Saved {args.o}")


if __name__ == "__main__":
    main()
