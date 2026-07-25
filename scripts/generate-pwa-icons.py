from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


THEMES = {
    "okashi": {
        "source": PUBLIC / "pieces/sweets/wagashi/lion.png",
        "top": (255, 238, 221),
        "bottom": (244, 148, 139),
        "halo": (255, 250, 228, 238),
        "ring": (178, 66, 55, 170),
        "accent": (255, 255, 255, 48),
        "scale": 0.70,
        "offset_y": 0.035,
    },
    "samurai": {
        "source": PUBLIC / "pieces/samurai/lion-mounted-sword.png",
        "top": (112, 43, 31),
        "bottom": (42, 29, 25),
        "halo": (238, 196, 103, 230),
        "ring": (255, 224, 145, 185),
        "accent": (255, 231, 171, 42),
        "scale": 0.72,
        "offset_y": 0.025,
    },
}


def vertical_gradient(size: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGB", (size, size))
    pixels = image.load()
    for y in range(size):
        ratio = y / max(size - 1, 1)
        color = tuple(round(a + (b - a) * ratio) for a, b in zip(top, bottom))
        for x in range(size):
            pixels[x, y] = color
    return image.convert("RGBA")


def make_icon(theme_name: str, size: int) -> Image.Image:
    theme = THEMES[theme_name]
    icon = vertical_gradient(size, theme["top"], theme["bottom"])
    decoration = Image.new("RGBA", icon.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(decoration)

    dot = max(3, round(size * 0.018))
    spacing = max(24, round(size * 0.16))
    for y in range(spacing // 2, size, spacing):
        for x in range(spacing // 2, size, spacing):
            draw.ellipse((x - dot, y - dot, x + dot, y + dot), fill=theme["accent"])

    halo_margin = round(size * 0.115)
    ring_width = max(2, round(size * 0.014))
    draw.ellipse(
        (halo_margin, halo_margin, size - halo_margin, size - halo_margin),
        fill=theme["halo"],
        outline=theme["ring"],
        width=ring_width,
    )
    icon = Image.alpha_composite(icon, decoration)

    source = Image.open(theme["source"]).convert("RGBA")
    target = round(size * theme["scale"])
    source.thumbnail((target, target), Image.Resampling.LANCZOS)

    shadow = Image.new("RGBA", icon.size, (0, 0, 0, 0))
    shadow_alpha = source.getchannel("A").filter(ImageFilter.GaussianBlur(max(2, size * 0.018)))
    shadow_alpha = shadow_alpha.point(lambda value: round(value * 0.34))
    shadow_piece = Image.new("RGBA", source.size, (45, 22, 14, 0))
    shadow_piece.putalpha(shadow_alpha)

    x = (size - source.width) // 2
    y = (size - source.height) // 2 + round(size * theme["offset_y"])
    shadow.alpha_composite(shadow_piece, (x, y + round(size * 0.035)))
    icon = Image.alpha_composite(icon, shadow)
    icon.alpha_composite(source, (x, y))
    return icon.convert("RGB")


def main() -> None:
    for theme_name in THEMES:
        output = PUBLIC / theme_name
        output.mkdir(parents=True, exist_ok=True)
        for filename, size in (
            ("apple-touch-icon.png", 180),
            ("icon-192.png", 192),
            ("icon-512.png", 512),
            ("icon-maskable-512.png", 512),
        ):
            make_icon(theme_name, size).save(output / filename, "PNG", optimize=True)


if __name__ == "__main__":
    main()
