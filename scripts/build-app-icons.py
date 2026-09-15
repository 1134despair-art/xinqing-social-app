#!/usr/bin/env python3
"""从 static/image.png 生成 manifest.json 所需的各尺寸 App 图标。"""

from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("请先安装 Pillow: pip3 install Pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "static/image.png"

TARGETS: dict[str, int] = {
    "static/app-icons/app-icon-1024.png": 1024,
    "static/app-icons/android/hdpi.png": 72,
    "static/app-icons/android/xhdpi.png": 96,
    "static/app-icons/android/xxhdpi.png": 144,
    "static/app-icons/android/xxxhdpi.png": 192,
    "static/app-icons/ios/appstore.png": 1024,
    "static/app-icons/ios/iphone/app@2x.png": 120,
    "static/app-icons/ios/iphone/app@3x.png": 180,
    "static/app-icons/ios/iphone/spotlight@2x.png": 80,
    "static/app-icons/ios/iphone/spotlight@3x.png": 120,
    "static/app-icons/ios/iphone/settings@2x.png": 58,
    "static/app-icons/ios/iphone/settings@3x.png": 87,
    "static/app-icons/ios/iphone/notification@2x.png": 40,
    "static/app-icons/ios/iphone/notification@3x.png": 60,
    "static/app-icons/ios/ipad/app.png": 76,
    "static/app-icons/ios/ipad/app@2x.png": 152,
    "static/app-icons/ios/ipad/proapp@2x.png": 167,
    "static/app-icons/ios/ipad/spotlight.png": 40,
    "static/app-icons/ios/ipad/spotlight@2x.png": 80,
    "static/app-icons/ios/ipad/settings.png": 29,
    "static/app-icons/ios/ipad/settings@2x.png": 58,
    "static/app-icons/ios/ipad/notification.png": 20,
    "static/app-icons/ios/ipad/notification@2x.png": 40,
}


def sample_background(img: Image.Image) -> tuple[int, int, int]:
    w, h = img.size
    samples = [
        img.getpixel((0, 0)),
        img.getpixel((w - 1, 0)),
        img.getpixel((0, h - 1)),
        img.getpixel((w - 1, h - 1)),
    ]
    r = sum(p[0] for p in samples) // 4
    g = sum(p[1] for p in samples) // 4
    b = sum(p[2] for p in samples) // 4
    return (r, g, b)


def load_source(path: Path) -> tuple[Image.Image, tuple[int, int, int]]:
    img = Image.open(path).convert("RGBA")
    bg_color = sample_background(img.convert("RGB"))
    canvas = Image.new("RGB", img.size, bg_color)
    canvas.paste(img, mask=img.split()[3])
    return canvas, bg_color


def make_icon(src: Image.Image, size: int, bg_color: tuple[int, int, int]) -> Image.Image:
    canvas = Image.new("RGB", (size, size), bg_color)
    sw, sh = src.size
    scale = min(size / sw, size / sh)
    nw, nh = max(1, int(round(sw * scale))), max(1, int(round(sh * scale)))
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2))
    return canvas


def main() -> None:
    if not SRC.exists():
        print(f"源图不存在: {SRC}", file=sys.stderr)
        sys.exit(1)

    src, bg_color = load_source(SRC)
    for rel, size in TARGETS.items():
        out = ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        make_icon(src, size, bg_color).save(out, "PNG", optimize=True)
        print(f"✓ {rel} ({size}x{size})")

    print(f"\n已生成 {len(TARGETS)} 个图标")


if __name__ == "__main__":
    main()
