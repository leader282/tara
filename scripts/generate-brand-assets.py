"""Generates Tara's icon, adaptive icon, splash, and in-app brand mark PNGs.

Run from the repository root: python3 scripts/generate-brand-assets.py
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parent.parent / "assets"
SUPERSAMPLE = 4

GRADIENT_START = (201, 103, 91)
GRADIENT_END = (74, 45, 76)
MARK_COLOR = (255, 248, 245, 255)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def gradient(size):
    image = Image.new("RGB", (size, size))
    pixels = image.load()
    for y in range(size):
        for x in range(size):
            t = min(1.0, max(0.0, (x * 0.55 + y * 0.85) / (size * 1.4)))
            pixels[x, y] = lerp(GRADIENT_START, GRADIENT_END, t)
    return image


def sparkle(cx, cy, radius, exponent=3.2, steps=1440):
    points = []
    for index in range(steps):
        angle = 2 * math.pi * index / steps
        cos_a, sin_a = math.cos(angle), math.sin(angle)
        x = math.copysign(abs(cos_a) ** exponent, cos_a)
        y = math.copysign(abs(sin_a) ** exponent, sin_a)
        points.append((cx + radius * x, cy + radius * y))
    return points


def draw_mark(size, scale=1.0, color=MARK_COLOR):
    big = size * SUPERSAMPLE
    layer = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    unit = big * scale
    center = big / 2
    draw.polygon(sparkle(center - unit * 0.06, center + unit * 0.05, unit * 0.29), fill=color)
    draw.polygon(sparkle(center + unit * 0.24, center - unit * 0.22, unit * 0.12), fill=color)
    dot_radius = unit * 0.016
    dot_x, dot_y = center + unit * 0.21, center + unit * 0.24
    draw.ellipse([dot_x - dot_radius, dot_y - dot_radius, dot_x + dot_radius, dot_y + dot_radius], fill=color)
    return layer.resize((size, size), Image.LANCZOS)


def rounded_tile(size, radius_ratio=0.23):
    tile = gradient(size).convert("RGBA")
    mask = Image.new("L", (size * SUPERSAMPLE, size * SUPERSAMPLE), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size * SUPERSAMPLE - 1, size * SUPERSAMPLE - 1],
        radius=size * SUPERSAMPLE * radius_ratio,
        fill=255,
    )
    tile.putalpha(mask.resize((size, size), Image.LANCZOS))
    return tile


def main():
    icon = gradient(1024).convert("RGBA")
    icon.alpha_composite(draw_mark(1024, 0.9))
    icon.convert("RGB").save(ASSETS / "icon.png")

    gradient(1024).save(ASSETS / "adaptive-icon-background.png")
    draw_mark(1024, 0.6).save(ASSETS / "adaptive-icon.png")
    draw_mark(1024, 0.6, (0, 0, 0, 255)).save(ASSETS / "adaptive-icon-monochrome.png")

    splash = Image.new("RGBA", (1152, 1152), (0, 0, 0, 0))
    tile = rounded_tile(880)
    tile.alpha_composite(draw_mark(880, 0.9))
    splash.alpha_composite(tile, (136, 136))
    splash.save(ASSETS / "splash-icon.png")

    draw_mark(512, 1.0).save(ASSETS / "brand-mark.png")


if __name__ == "__main__":
    main()
