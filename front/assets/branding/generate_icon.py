"""One-off generator for the Ask.me app icon + splash mark.

Not part of the build — run manually when the brand mark changes:
  py -3 assets/branding/generate_icon.py

Produces:
  assets/branding/icon.png              (1024x1024, gradient bg + white mark — app icon source)
  assets/branding/icon_foreground.png   (1024x1024, transparent bg + white mark — Android adaptive icon)
  assets/branding/splash_logo.png       (512x512, transparent bg + gradient-colored mark — splash screen)
"""
from PIL import Image, ImageDraw

PRIMARY = (124, 58, 237)      # AppColors.primary
PINK = (236, 72, 153)         # heroGradient end
SURFACE = (251, 249, 255)     # AppColors.surface

SIZE = 1024


def gradient_bg(size=SIZE):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            r = int(PRIMARY[0] + (PINK[0] - PRIMARY[0]) * t)
            g = int(PRIMARY[1] + (PINK[1] - PRIMARY[1]) * t)
            b = int(PRIMARY[2] + (PINK[2] - PRIMARY[2]) * t)
            px[x, y] = (r, g, b)
    return img


def draw_mark(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float, bubble_fill, pin_fill):
    """Speech bubble containing a location pin — 'ask' (chat) + 'me' (place)."""
    r = 300 * scale
    bubble_box = [cx - r, cy - r * 1.05, cx + r, cy + r * 0.75]
    draw.rounded_rectangle(bubble_box, radius=110 * scale, fill=bubble_fill)

    tail = [
        (cx - r * 0.35, cy + r * 0.55),
        (cx - r * 0.05, cy + r * 0.55),
        (cx - r * 0.55, cy + r * 1.15),
    ]
    draw.polygon(tail, fill=bubble_fill)

    pin_cx, pin_cy = cx, cy - r * 0.18
    pin_r = 95 * scale
    draw.ellipse(
        [pin_cx - pin_r, pin_cy - pin_r, pin_cx + pin_r, pin_cy + pin_r],
        fill=pin_fill,
    )
    tip_y = pin_cy + pin_r * 1.9
    draw.polygon(
        [
            (pin_cx - pin_r * 0.85, pin_cy + pin_r * 0.35),
            (pin_cx + pin_r * 0.85, pin_cy + pin_r * 0.35),
            (pin_cx, tip_y),
        ],
        fill=pin_fill,
    )
    hole_r = pin_r * 0.4
    draw.ellipse(
        [pin_cx - hole_r, pin_cy - hole_r, pin_cx + hole_r, pin_cy + hole_r],
        fill=bubble_fill,
    )


WHITE = (255, 255, 255)

# 1. Full icon: gradient background + white bubble + violet pin
icon = gradient_bg()
draw_mark(ImageDraw.Draw(icon), SIZE // 2, SIZE // 2, 1.0, WHITE, PRIMARY)
icon.save("assets/branding/icon.png")

# 2. Adaptive icon foreground: transparent background + white bubble + violet pin,
#    scaled down since Android crops adaptive icons to a smaller safe zone.
fg = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw_mark(ImageDraw.Draw(fg), SIZE // 2, SIZE // 2, 0.62, WHITE, PRIMARY)
fg.save("assets/branding/icon_foreground.png")

# 3. Splash mark: transparent background, violet bubble + white pin (reads on the
#    app's light surface background used by flutter_native_splash).
splash = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
draw_mark(ImageDraw.Draw(splash), 256, 256, 0.62, PRIMARY, WHITE)
splash.save("assets/branding/splash_logo.png")

print("Gerado: icon.png, icon_foreground.png, splash_logo.png")
