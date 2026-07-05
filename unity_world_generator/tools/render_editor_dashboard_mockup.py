#!/usr/bin/env python3
"""WorldGen Studio classic IMGUI mockup."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent))
from unity_world_generator.tools.worldgen_preview import build_terrain_shape_cfg, sample_height01

BG = (30, 30, 30)
SIDEBAR = (25, 25, 25)
CARD = (45, 45, 45)
PANEL = (37, 37, 37)
BORDER = (28, 28, 28)
ACCENT = (61, 158, 255)
TEXT = (235, 235, 235)
MUTED = (158, 163, 173)


def f(sz, bold=False):
    p = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    return ImageFont.truetype(p, sz) if Path(p).exists() else ImageFont.load_default()


def height_color(h, sea):
    if h < sea: return (46, 107, 158)
    if h < 0.55: return (56, 122, 71)
    if h < 0.72: return (133, 117, 87)
    return (220, 220, 230)


def preview(cfg, n=360):
    img = Image.new("RGB", (n, n), CARD)
    w = cfg.get("world_size_in_chunks", 12) * cfg["chunk_size_meters"]
    sea = cfg.get("sea_level01", 0.32)
    shape = build_terrain_shape_cfg(cfg)
    px = []
    for py in range(n):
        z = py / (n - 1) * w
        for px_ in range(n):
            x = px_ / (n - 1) * w
            px.append(height_color(sample_height01(cfg, x, z, shape), sea))
    img.putdata(px)
    return img


def render(cfg, W=1600, H=900):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)

    # Banner
    d.rectangle((0, 0, W, 72), fill=SIDEBAR)
    d.rectangle((0, 69, W, 72), fill=ACCENT)
    d.text((18, 14), "WorldGen Studio", font=f(20, True), fill=TEXT)
    d.text((18, 40), "Zone builder · Terrain sculpt · Biomes · Generate World", font=f(11), fill=MUTED)

    # Command rail
    y0 = 82
    d.rounded_rectangle((16, y0, 200, y0 + 42), 4, fill=(48, 120, 200))
    d.text((34, y0 + 12), "GENERATE WORLD", font=f(11, True), fill=TEXT)
    for lbl, x, w in [("Terrain Only", 210, 96), ("Validate", 312, 72), ("Random Seed", 392, 96)]:
        d.rounded_rectangle((x, y0, x + w, y0 + 42), 4, fill=CARD, outline=BORDER)
        d.text((x + 12, y0 + 13), lbl, font=f(10), fill=TEXT)

    top = y0 + 54
    sw = 188
    d.rectangle((0, top, sw, H - 24), fill=SIDEBAR)
    tabs = ["  Setup", "  Location Wizard", "  Terrain Studio", "  World Layout", "  Biomes", "  Spawns & Perf", "  Results"]
    ty = top + 10
    for i, t in enumerate(tabs):
        if i == 1:
            d.rectangle((8, ty + 4, 11, ty + 30), fill=ACCENT)
            d.text((26, ty + 9), t, font=f(11, True), fill=TEXT)
        else:
            d.text((26, ty + 9), t, font=f(11), fill=MUTED)
        ty += 34

    mx = sw + 16
    my = top + 8
    for i, (val, lbl) in enumerate([("3.1 km²", "World Area"), ("1", "Cities"), ("16", "Tiles"), ("~2 min", "Bake")]):
        x = mx + i * 155
        d.rectangle((x, my, x + 145, my + 68), fill=CARD, outline=BORDER)
        d.rectangle((x, my, x + 4, my + 68), fill=ACCENT)
        d.text((x + 12, my + 10), val, font=f(17, True), fill=TEXT)
        d.text((x + 12, my + 36), lbl, font=f(9), fill=MUTED)

    my += 80
    # Location split
    d.rectangle((mx, my, mx + 380, my + 420), fill=PANEL, outline=BORDER)
    d.text((mx + 12, my + 8), "Map Preview", font=f(12, True), fill=TEXT)
    im.paste(preview(cfg), (mx + 12, my + 32))

    rx = mx + 396
    d.rectangle((rx, my, W - 16, my + 420), fill=PANEL, outline=BORDER)
    d.text((rx + 12, my + 8), "Location Wizard", font=f(12, True), fill=TEXT)
    lines = [
        "Location Name:  Boss Zone",
        "",
        "1. Setup — Zone (3 km, 16 tiles)",
        "2. Terrain — [Alpine] [Heroic WoW]",
        "3. Biomes — Grass / Stone textures",
        "4. Synty — Forest / Ruins / Road folders",
        "5. POI — Spawn, Ruins, Boss markers",
        "",
        "[ Apply Setup Only ]   [ BUILD ZONE LOCATION ]",
    ]
    ly = my + 32
    for line in lines:
        d.text((rx + 12, ly), line, font=f(10), fill=MUTED if line else TEXT)
        ly += 18

    d.rectangle((0, H - 24, W, H), fill=SIDEBAR)
    d.text((12, H - 17), "Ready  |  bake studio-v7.2", font=f(9), fill=MUTED)
    return im


def main():
    p = argparse.ArgumentParser()
    p.add_argument("-o", default="releases/editor_media_2026-07-05/worldgen_studio_classic.png")
    p.add_argument("--config", type=Path, default=ROOT / "Samples~/Configs/wow_like_world_config.json")
    a = p.parse_args()
    cfg = json.loads(a.config.read_text())
    cfg["world_size_in_chunks"] = 12
    cfg["chunk_size_meters"] = 256
    out = Path(a.o)
    out.parent.mkdir(parents=True, exist_ok=True)
    render(cfg).save(out, optimize=True)
    print(f"Saved {out}")


if __name__ == "__main__":
    main()
