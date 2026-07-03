#!/usr/bin/env python3
"""Render a high-fidelity mockup of the WorldGen Studio Unity editor window."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


# Palette aligned with WorldGenEditorUi.cs
BG_DARK = (30, 30, 30)
BG_PANEL = (37, 37, 37)
BG_CARD = (45, 45, 45)
BG_SIDEBAR = (25, 25, 25)
ACCENT = (61, 158, 255)
ACCENT_SOFT = (61, 158, 255, 46)
SUCCESS = (82, 199, 122)
WARNING = (242, 184, 71)
TEXT_PRIMARY = (235, 235, 235)
TEXT_MUTED = (158, 163, 173)
BORDER = (71, 71, 71)
BTN_PRIMARY = (48, 120, 200)
BTN_SECONDARY = (55, 55, 55)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def rounded_rect(draw: ImageDraw.ImageDraw, xy, radius: int, fill, outline=None, width: int = 1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_text(draw, xy, text, font, fill=TEXT_PRIMARY):
    draw.text(xy, text, font=font, fill=fill)


def draw_metric_card(draw, x, y, w, h, label, value, hint, accent):
    rounded_rect(draw, (x, y, x + w, y + h), 6, BG_CARD, BORDER)
    draw.rectangle((x, y, x + 4, y + h), fill=accent)
    draw_text(draw, (x + 14, y + 10), value, load_font(20, True))
    draw_text(draw, (x + 14, y + 36), label, load_font(11), TEXT_MUTED)
    draw_text(draw, (x + 14, y + 52), hint, load_font(10), TEXT_MUTED)


def draw_preset_card(draw, x, y, w, h, title, desc):
    rounded_rect(draw, (x, y, x + w, y + h), 6, BG_CARD, BORDER)
    draw_text(draw, (x + 12, y + 10), title, load_font(12, True))
    draw_text(draw, (x + 12, y + 30), desc, load_font(10), TEXT_MUTED)


def draw_panel(draw, x, y, w, h, title, subtitle=None):
    rounded_rect(draw, (x, y, x + w, y + h), 8, BG_PANEL, BORDER)
    header_h = 44 if subtitle else 30
    draw.rectangle((x + 1, y + 1, x + w - 1, y + header_h), fill=BG_CARD)
    draw_text(draw, (x + 14, y + 8), title, load_font(13, True))
    if subtitle:
        draw_text(draw, (x + 14, y + 26), subtitle, load_font(10), TEXT_MUTED)
    return y + header_h + 8


def draw_sidebar_item(draw, x, y, w, label, active=False):
    h = 34
    if active:
        draw.rectangle((x, y + 4, x + 3, y + h - 4), fill=ACCENT)
        rounded_rect(draw, (x + 6, y, x + w, y + h), 4, (61, 158, 255, 35))
        draw_text(draw, (x + 18, y + 9), label, load_font(12, True))
    else:
        draw_text(draw, (x + 18, y + 9), label, load_font(12), TEXT_MUTED)
    return y + h + 2


def render_dashboard(width: int = 1920, height: int = 1080) -> Image.Image:
    img = Image.new("RGB", (width, height), BG_DARK)
    draw = ImageDraw.Draw(img)

    # Title bar (Unity chrome hint)
    draw.rectangle((0, 0, width, 28), fill=(38, 38, 38))
    draw_text(draw, (12, 6), "WorldGen Studio", load_font(11), TEXT_MUTED)
    draw_text(draw, (width - 180, 6), "Unity 2022.3  |  Play", load_font(10), TEXT_MUTED)

    # Hero banner
    banner_y = 28
    banner_h = 72
    draw.rectangle((0, banner_y, width, banner_y + banner_h), fill=BG_SIDEBAR)
    draw.rectangle((0, banner_y + banner_h - 3, width, banner_y + banner_h), fill=ACCENT)
    draw_text(draw, (20, banner_y + 14), "WorldGen Studio", load_font(22, True))
    draw_text(
        draw,
        (20, banner_y + 42),
        "Procedural MMO worlds — terrain, biomes, cities, caves, spawns, sectors.",
        load_font(11),
        TEXT_MUTED,
    )

    # Command rail
    rail_y = banner_y + banner_h + 10
    rounded_rect(draw, (16, rail_y, 250, rail_y + 44), 6, BTN_PRIMARY)
    draw_text(draw, (38, rail_y + 12), "GENERATE WORLD", load_font(13, True))

    for i, (label, x) in enumerate([
        ("Generate + Export", 262),
        ("Validate", 410),
        ("Random Seed", 500),
    ]):
        rounded_rect(draw, (x, rail_y, x + (118 if i == 0 else 82 if i == 1 else 100), rail_y + 44), 6, BTN_SECONDARY, BORDER)
        draw_text(draw, (x + 12, rail_y + 14), label, load_font(11))

    # Binding fields (right)
    bind_x = width - 380
    rounded_rect(draw, (bind_x, rail_y, width - 16, rail_y + 44), 6, BG_CARD, BORDER)
    draw_text(draw, (bind_x + 12, rail_y + 6), "Generator", load_font(9), TEXT_MUTED)
    draw_text(draw, (bind_x + 90, rail_y + 6), "WorldGenerator", load_font(10))
    draw_text(draw, (bind_x + 12, rail_y + 24), "Config", load_font(9), TEXT_MUTED)
    draw_text(draw, (bind_x + 90, rail_y + 24), "WoW-like World Config", load_font(10), ACCENT)

    content_top = rail_y + 58
    sidebar_w = 188
    draw.rectangle((0, content_top, sidebar_w, height - 24), fill=BG_SIDEBAR)

    sections = ["Setup", "Terrain", "World Layout", "Biomes", "Spawns & Perf", "Results"]
    sy = content_top + 12
    for i, sec in enumerate(sections):
        sy = draw_sidebar_item(draw, 8, sy, sidebar_w - 16, f"  {sec}", active=(i == 0))

    # Main content
    mx = sidebar_w + 16
    my = content_top + 8
    content_w = width - mx - 16

    # Metrics
    card_w = (content_w - 36) // 4
    card_h = 68
    metrics = [
        ("World Area", "20.3 km²", "14336m square", ACCENT),
        ("Cities", "16", "target placements", SUCCESS),
        ("Terrain Tiles", "784", "res 257", ACCENT),
        ("Validation", "OK", "config health", SUCCESS),
    ]
    for i, (label, value, hint, color) in enumerate(metrics):
        draw_metric_card(draw, mx + i * (card_w + 12), my, card_w, card_h, label, value, hint, color)

    my += card_h + 16

    # Search bar
    rounded_rect(draw, (mx, my, width - 16, my + 26), 4, BG_CARD, BORDER)
    draw_text(draw, (mx + 10, my + 6), "Filter", load_font(10), TEXT_MUTED)
    draw_text(draw, (mx + 52, my + 6), "terrain, seed, biome...", load_font(10), TEXT_MUTED)
    my += 36

    # Quick Start panel
    panel_h = 200
    inner = draw_panel(draw, mx, my, content_w, panel_h, "Quick Start", "Pick a production profile, then generate.")
    preset_w = (content_w - 56) // 3
    preset_h = 58
    presets_row1 = [
        ("Balanced MMO", "48 chunks, 18 cities, streaming tuned"),
        ("WoW-like Adventure", "56 chunks, shaped terrain, 16 cities"),
        ("Performance", "Fewer objects, larger terrain tiles"),
    ]
    py = inner
    for i, (title, desc) in enumerate(presets_row1):
        draw_preset_card(draw, mx + 14 + i * (preset_w + 10), py, preset_w, preset_h, title, desc)
    py += preset_h + 10
    presets_row2 = [
        ("Cinematic", "Richer density + higher terrain res"),
        ("Mega World", "64 chunks, 28 cities, huge sectors"),
    ]
    for i, (title, desc) in enumerate(presets_row2):
        draw_preset_card(draw, mx + 14 + i * (preset_w + 10), py, preset_w, preset_h, title, desc)

    my += panel_h + 12

    # Pipeline panel
    pipe_h = 150
    inner2 = draw_panel(
        draw,
        mx,
        my,
        content_w,
        pipe_h,
        "Pipeline",
        "Generation order: terrain → biomes → cities → roads → caves → resources → spawns → sectors",
    )
    steps = [
        "1. Unity Terrain tiles (heightmap)",
        "2. City placement + road network",
        "3. Caves, resources, MMO spawn zones",
        "4. Sector grid for AOI / streaming",
    ]
    for i, step in enumerate(steps):
        draw_text(draw, (mx + 18, inner2 + i * 22), step, load_font(11))

    # Footer status
    draw.rectangle((0, height - 24, width, height), fill=BG_SIDEBAR)
    draw_text(draw, (12, height - 18), "Config valid.  |  WoW-like preset applied.", load_font(10), TEXT_MUTED)

    # Subtle right dock hint (Unity-style)
    draw.rectangle((width - 6, content_top, width, height - 24), fill=(34, 34, 34))

    return img


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("releases/editor_media_2026-07-03/worldgen_studio_dashboard.png"),
    )
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1080)
    args = parser.parse_args()

    img = render_dashboard(args.width, args.height)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    img.save(args.output, optimize=True)
    print(f"Saved {args.output} ({args.width}x{args.height})")


if __name__ == "__main__":
    main()
