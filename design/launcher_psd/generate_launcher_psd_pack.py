#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
from pytoshop import enums
from pytoshop.user.nested_layers import Image as PsdImageLayer
from pytoshop.user.nested_layers import nested_layers_to_psd


ROOT = Path("/workspace")
SOURCE = Path("/home/ubuntu/.cursor/projects/workspace/assets/ec8c81a5-7abd-4a02-a63b-acc94c97de2e.png")
OUT_DIR = ROOT / "design" / "launcher_psd"
CANVAS_SIZE = (1920, 1080)
COLS = 6
ROWS = 4

SCREEN_META: List[Tuple[str, str]] = [
    ("home_dashboard", "Головна / Home"),
    ("library_games", "Бібліотека / Library"),
    ("shop_store_front", "Магазин / Store"),
    ("shop_product_page", "Картка товару / Product"),
    ("news_hub", "Новини / News"),
    ("friends_list", "Друзі / Friends"),
    ("chat_window", "Чат / Chat"),
    ("notifications", "Сповіщення / Notifications"),
    ("user_profile", "Профіль / Profile"),
    ("settings", "Налаштування / Settings"),
    ("download_manager", "Завантаження / Downloads"),
    ("install_options", "Опції інсталяції / Install"),
    ("patch_notes", "Нотатки оновлення / Patch Notes"),
    ("server_selection", "Вибір сервера / Server Select"),
    ("ui_components", "UI Компоненти / UI Components"),
    ("two_factor_auth", "2FA / Two-factor"),
    ("login_screen", "Логін / Login"),
    ("registration_screen", "Реєстрація / Register"),
    ("forgot_password", "Забув пароль / Forgot Password"),
    ("alerts_states", "Стани алертів / Alerts"),
    ("ui_elements_extra", "UI Елементи / Extra"),
    ("achievements", "Досягнення / Achievements"),
    ("chat_emoji_picker", "Емоджі / Emoji Picker"),
    ("design_tokens", "Токени стилю / Tokens"),
]


def rgba_to_channels(image: Image.Image) -> Dict[int, np.ndarray]:
    rgba = np.array(image.convert("RGBA"), dtype=np.uint8)
    return {
        0: rgba[:, :, 0],
        1: rgba[:, :, 1],
        2: rgba[:, :, 2],
        -1: rgba[:, :, 3],
    }


def make_grid_layer(size: Tuple[int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 12-col grid + rows to make frontend slicing easier.
    col_w = w // 12
    for i in range(1, 12):
        x = i * col_w
        draw.line((x, 0, x, h), fill=(99, 145, 235, 90), width=1)
    row_h = h // 12
    for i in range(1, 12):
        y = i * row_h
        draw.line((0, y, w, y), fill=(99, 145, 235, 75), width=1)

    # Safe area border.
    m = 32
    draw.rectangle((m, m, w - m, h - m), outline=(130, 186, 255, 140), width=2)
    return img


def make_title_layer(file_slug: str, label_ua_en: str, size: Tuple[int, int]) -> Image.Image:
    w, _ = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, w, 74), fill=(8, 12, 23, 215))
    draw.rectangle((0, 72, w, 74), fill=(61, 127, 227, 255))

    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 28)
        font_small = ImageFont.truetype("DejaVuSans.ttf", 20)
    except OSError:
        font = ImageFont.load_default()
        font_small = ImageFont.load_default()

    draw.text((24, 18), f"Mystfall Launcher • {label_ua_en}", fill=(229, 238, 255, 255), font=font)
    draw.text((24, 44), f"Layer set: {file_slug} • 1920x1080", fill=(153, 178, 220, 255), font=font_small)
    return img


def crop_tile(reference: Image.Image, index: int) -> Image.Image:
    src_w, src_h = reference.size
    cell_w = src_w / COLS
    cell_h = src_h / ROWS
    row, col = divmod(index, COLS)

    # Trim panel gutters and top caption text.
    x0 = int(col * cell_w + 5)
    y0 = int(row * cell_h + 16)
    x1 = int((col + 1) * cell_w - 5)
    y1 = int((row + 1) * cell_h - 5)
    tile = reference.crop((x0, y0, x1, y1))
    return ImageOps.fit(tile, CANVAS_SIZE, method=Image.Resampling.LANCZOS)


def save_psd(path: Path, layers: List[PsdImageLayer], size: Tuple[int, int]) -> None:
    psd = nested_layers_to_psd(
        layers=layers,
        color_mode=enums.ColorMode.rgb,
        compression=enums.Compression.raw,
        size=(size[0], size[1]),
    )
    with path.open("wb") as f:
        psd.write(f)


def build_package() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    reference = Image.open(SOURCE).convert("RGB")
    grid = make_grid_layer(CANVAS_SIZE)

    md_lines = [
        "# Mystfall Launcher PSD Pack",
        "",
        "- Resolution: `1920x1080` per screen",
        "- Language support: `UA + EN` (title overlays + naming)",
        "- Style: based on provided reference board",
        "- Layer order: `screen_bitmap` -> `title_overlay` -> `layout_grid`",
        "",
        "## Screens",
        "",
    ]

    for idx, (slug, ua_en_label) in enumerate(SCREEN_META, start=1):
        base = crop_tile(reference, idx - 1)
        title = make_title_layer(slug, ua_en_label, CANVAS_SIZE)
        file_name = f"{idx:02d}_{slug}.psd"
        output_psd = OUT_DIR / file_name

        layers = [
            PsdImageLayer(
                name="screen_bitmap",
                top=0,
                left=0,
                channels=rgba_to_channels(base.convert("RGBA")),
                color_mode=enums.ColorMode.rgb,
            ),
            PsdImageLayer(
                name="title_overlay_ua_en",
                top=0,
                left=0,
                channels=rgba_to_channels(title),
                color_mode=enums.ColorMode.rgb,
            ),
            PsdImageLayer(
                name="layout_grid_12col",
                top=0,
                left=0,
                channels=rgba_to_channels(grid),
                color_mode=enums.ColorMode.rgb,
            ),
        ]
        save_psd(output_psd, layers, CANVAS_SIZE)
        md_lines.append(f"- `{file_name}` — {ua_en_label}")

    (OUT_DIR / "README.md").write_text("\n".join(md_lines), encoding="utf-8")


if __name__ == "__main__":
    build_package()
