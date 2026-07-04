#!/usr/bin/env python3
"""Mockup screenshot: Atavism Editor — Class Abilities by Level tab."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# Atavism-like dark editor palette
BG_APP = (30, 33, 38)
BG_SIDEBAR = (24, 26, 30)
BG_HEADER = (37, 40, 46)
BG_TABLE = (32, 35, 40)
BG_ROW_ALT = (36, 39, 45)
BG_ROW = (32, 35, 40)
BG_ACCENT = (0, 120, 215)
BG_ACCENT_HOVER = (0, 100, 180)
TEXT = (230, 232, 235)
TEXT_MUTED = (150, 156, 165)
BORDER = (55, 58, 66)
SUCCESS = (76, 175, 80)
HEADER_TEXT = (180, 188, 200)

ROWS = [
    ("1", "Warrior", "1", "Battle Stance", "Yes", "Yes", "10", "Active"),
    ("2", "Warrior", "1", "Heroic Strike", "Yes", "Yes", "20", "Active"),
    ("3", "Warrior", "4", "Charge", "Yes", "Yes", "10", "Active"),
    ("4", "Warrior", "6", "Rend", "Yes", "Yes", "10", "Active"),
    ("5", "Warrior", "8", "Thunder Clap", "Yes", "Yes", "10", "Active"),
    ("6", "Warrior", "10", "Bloodrage", "Yes", "Yes", "10", "Active"),
    ("7", "Warrior", "12", "Hamstring", "Yes", "Yes", "10", "Active"),
    ("8", "Warrior", "20", "Cleave", "Yes", "Yes", "10", "Active"),
    ("9", "Warrior", "20", "Slam", "Yes", "Yes", "20", "Active"),
    ("10", "Mage", "1", "Arcane Intellect", "Yes", "Yes", "10", "Active"),
]

COLUMNS = ["ID", "Class", "Player Level", "Ability", "Auto Learn", "Unlearn", "Sort", "Status"]


def load_font(size: int, bold: bool = False):
    path = (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    )
    if Path(path).exists():
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_rounded_rect(draw, xy, radius, fill, outline=None):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline)


def render(width: int = 1920, height: int = 1080) -> Image.Image:
    img = Image.new("RGB", (width, height), BG_APP)
    draw = ImageDraw.Draw(img)

    sidebar_w = 240
    draw.rectangle((0, 0, sidebar_w, height), fill=BG_SIDEBAR)

    # Logo / app title
    draw.text((18, 18), "Atavism Editor", font=load_font(14, True), fill=TEXT)
    draw.text((18, 38), "v10.13", font=load_font(10), fill=TEXT_MUTED)

    # Sidebar sections
    sections = [
        ("SERVER", ["Game Settings", "Database Actions", "Profiles"], False),
        (
            "CHARACTER",
            [
                "Player Templates",
                "Class Abilities by Level",
                "Level XP Profile",
                "Level XP Rewards",
                "PvP Ranks",
            ],
            True,
        ),
        ("COMBAT", ["Skills", "Skill Profiles", "Abilities"], False),
    ]

    sy = 72
    for section_name, items, is_char_section in sections:
        draw.text((18, sy), section_name, font=load_font(9, True), fill=TEXT_MUTED)
        sy += 20
        for item in items:
            active = item == "Class Abilities by Level"
            if active:
                draw.rectangle((8, sy, sidebar_w - 8, sy + 32), fill=(45, 55, 72))
                draw.rectangle((8, sy + 4, 11, sy + 28), fill=BG_ACCENT)
                draw.text((22, sy + 8), item, font=load_font(12, True), fill=TEXT)
            else:
                draw.text((22, sy + 8), item, font=load_font(12), fill=TEXT_MUTED)
            sy += 34
        sy += 8

    # Main content area
    mx = sidebar_w + 1
    draw.rectangle((mx, 0, width, 56), fill=BG_HEADER)
    draw.line((mx, 56, width, 56), fill=BORDER)

    title = "Class Abilities by Level"
    draw.text((mx + 24, 14), title, font=load_font(20, True), fill=TEXT)
    draw.text(
        (mx + 24, 36),
        "WoW-style spell book — abilities auto-learned at player level (separate from talents)",
        font=load_font(11),
        fill=TEXT_MUTED,
    )

    # Toolbar
    ty = 68
    draw.rectangle((mx, ty, width, ty + 48), fill=BG_TABLE)
    # Search box
    draw.rounded_rectangle((mx + 20, ty + 10, mx + 320, ty + 38), radius=4, fill=(42, 45, 52), outline=BORDER)
    draw.text((mx + 32, ty + 16), "Search class abilities by level...", font=load_font(11), fill=TEXT_MUTED)
    # Filter chips
    draw.rounded_rectangle((mx + 340, ty + 10, mx + 420, ty + 38), radius=4, fill=(42, 45, 52), outline=BORDER)
    draw.text((mx + 358, ty + 16), "Class ▾", font=load_font(11), fill=TEXT)
    draw.rounded_rectangle((mx + 432, ty + 10, mx + 500, ty + 38), radius=4, fill=(42, 45, 52), outline=BORDER)
    draw.text((mx + 448, ty + 16), "Active ▾", font=load_font(11), fill=TEXT)

    # Add button
    draw.rounded_rectangle((width - 160, ty + 8, width - 24, ty + 40), radius=4, fill=BG_ACCENT)
    draw.text((width - 138, ty + 16), "+ Add Class Ability", font=load_font(12, True), fill=(255, 255, 255))

    # Table
    table_top = ty + 56
    table_left = mx + 16
    table_right = width - 16
    col_widths = [50, 110, 100, 200, 90, 90, 60, 80]
    total_w = sum(col_widths)
    scale = (table_right - table_left) / total_w
    col_widths = [int(w * scale) for w in col_widths]

    # Header row
    hx = table_left
    draw.rectangle((table_left, table_top, table_right, table_top + 36), fill=(45, 48, 55))
    for i, col in enumerate(COLUMNS):
        cw = col_widths[i]
        draw.text((hx + 10, table_top + 10), col, font=load_font(11, True), fill=HEADER_TEXT)
        hx += cw

    # Data rows
    row_h = 38
    for ri, row in enumerate(ROWS):
        ry = table_top + 36 + ri * row_h
        bg = BG_ROW_ALT if ri % 2 else BG_ROW
        draw.rectangle((table_left, ry, table_right, ry + row_h), fill=bg)
        draw.line((table_left, ry + row_h, table_right, ry + row_h), fill=BORDER)
        cx = table_left
        for ci, cell in enumerate(row):
            cw = col_widths[ci]
            color = SUCCESS if cell == "Active" else TEXT
            if cell == "Yes":
                color = (120, 200, 130)
            font = load_font(11, ci == 3)
            draw.text((cx + 10, ry + 11), cell, font=font, fill=color)
            cx += cw

    # Edit dialog overlay (semi-transparent panel on right)
    dialog_w = 420
    dialog_h = 480
    dx = width - dialog_w - 40
    dy = table_top + 60
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, width, height), fill=(0, 0, 0, 90))
    od.rounded_rectangle((dx, dy, dx + dialog_w, dy + dialog_h), radius=8, fill=(40, 43, 50, 250), outline=(70, 74, 84))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle((dx, dy, dx + dialog_w, dy + dialog_h), radius=8, fill=(40, 43, 50), outline=BORDER)
    draw.text((dx + 20, dy + 16), "Add Class Ability", font=load_font(16, True), fill=TEXT)
    draw.line((dx + 16, dy + 44, dx + dialog_w - 16, dy + 44), fill=BORDER)
    draw.text(
        (dx + 20, dy + 54),
        "Class spell learned when the player reaches the specified level",
        font=load_font(10),
        fill=TEXT_MUTED,
    )

    fields = [
        ("Class", "Warrior"),
        ("Player Level", "4"),
        ("Ability", "Charge"),
        ("Auto Learn", "✓ Enabled"),
        ("Unlearn on Delevel", "✓ Enabled"),
        ("Sort Order", "10"),
    ]
    fy = dy + 82
    for label, value in fields:
        draw.text((dx + 20, fy), label, font=load_font(10), fill=TEXT_MUTED)
        draw.rounded_rectangle((dx + 20, fy + 16, dx + dialog_w - 20, fy + 44), radius=4, fill=(50, 53, 60), outline=BORDER)
        draw.text((dx + 30, fy + 24), value, font=load_font(12), fill=TEXT)
        fy += 58

    # Dialog buttons
    draw.rounded_rectangle((dx + dialog_w - 200, dy + dialog_h - 52, dx + dialog_w - 110, dy + dialog_h - 20), radius=4, fill=(55, 58, 66))
    draw.text((dx + dialog_w - 178, dy + dialog_h - 40), "Cancel", font=load_font(11), fill=TEXT)
    draw.rounded_rectangle((dx + dialog_w - 100, dy + dialog_h - 52, dx + dialog_w - 20, dy + dialog_h - 20), radius=4, fill=BG_ACCENT)
    draw.text((dx + dialog_w - 82, dy + dialog_h - 40), "Save", font=load_font(11, True), fill=(255, 255, 255))

    # Footer status
    draw.rectangle((mx, height - 28, width, height), fill=BG_SIDEBAR)
    draw.text((mx + 16, height - 20), "23 records · Warrior + Mage · CLASS_ABILITIES_BY_LEVEL_ENABLED=true", font=load_font(10), fill=TEXT_MUTED)

    return img


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-o",
        type=Path,
        default=Path("releases/editor_media_2026-07-04/class_abilities_by_level_editor.png"),
    )
    args = parser.parse_args()
    img = render()
    args.o.parent.mkdir(parents=True, exist_ok=True)
    img.save(args.o, optimize=True)
    print(f"Saved {args.o}")


if __name__ == "__main__":
    main()
