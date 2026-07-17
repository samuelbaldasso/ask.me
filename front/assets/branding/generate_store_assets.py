"""One-off generator for Google Play Store listing graphics.

Reuses the same brand mark as generate_icon.py. Not part of the build —
run manually when needed:
  py -3 assets/branding/generate_store_assets.py

Produces:
  assets/branding/play_store_icon.png   (512x512, RGBA, opaque — Play Console hi-res icon)
  assets/branding/feature_graphic.png   (1024x500, RGB — Play Console feature graphic)
"""
from PIL import Image, ImageDraw, ImageFont

PRIMARY = (124, 58, 237)
PINK = (236, 72, 153)
WHITE = (255, 255, 255)


def gradient_bg(w, h):
    img = Image.new("RGB", (w, h))
    px = img.load()
    diag = w + h
    for y in range(h):
        for x in range(w):
            t = (x + y) / diag
            r = int(PRIMARY[0] + (PINK[0] - PRIMARY[0]) * t)
            g = int(PRIMARY[1] + (PINK[1] - PRIMARY[1]) * t)
            b = int(PRIMARY[2] + (PINK[2] - PRIMARY[2]) * t)
            px[x, y] = (r, g, b)
    return img


def draw_mark(draw, cx, cy, scale, bubble_fill, pin_fill):
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
    draw.ellipse([pin_cx - pin_r, pin_cy - pin_r, pin_cx + pin_r, pin_cy + pin_r], fill=pin_fill)
    tip_y = pin_cy + pin_r * 1.9
    draw.polygon(
        [(pin_cx - pin_r * 0.85, pin_cy + pin_r * 0.35), (pin_cx + pin_r * 0.85, pin_cy + pin_r * 0.35), (pin_cx, tip_y)],
        fill=pin_fill,
    )
    hole_r = pin_r * 0.4
    draw.ellipse([pin_cx - hole_r, pin_cy - hole_r, pin_cx + hole_r, pin_cy + hole_r], fill=bubble_fill)


# 1. Play Store hi-res icon — 512x512, RGBA, fully opaque
ICON_SIZE = 512
icon = gradient_bg(ICON_SIZE, ICON_SIZE).convert("RGBA")
draw_mark(ImageDraw.Draw(icon), ICON_SIZE // 2, ICON_SIZE // 2, ICON_SIZE / 1024, WHITE, PRIMARY)
icon.save("assets/branding/play_store_icon.png")

# 2. Feature graphic — 1024x500
FG_W, FG_H = 1024, 500
feature = gradient_bg(FG_W, FG_H)
draw = ImageDraw.Draw(feature)

mark_cx, mark_cy = 150, FG_H // 2
draw_mark(draw, mark_cx, mark_cy, 0.34, WHITE, PRIMARY)

try:
    title_font = ImageFont.truetype("C:\\Windows\\Fonts\\segoeuib.ttf", 72)
    subtitle_font = ImageFont.truetype("C:\\Windows\\Fonts\\segoeui.ttf", 30)
except OSError:
    title_font = ImageFont.load_default(72)
    subtitle_font = ImageFont.load_default(30)

text_x = 300
draw.text((text_x, 165), "Ask.me", font=title_font, fill=WHITE)
draw.text((text_x, 260), "Pergunte o que procura perto de você.", font=subtitle_font, fill=WHITE)
draw.text((text_x, 300), "A IA acha de verdade.", font=subtitle_font, fill=WHITE)

feature.save("assets/branding/feature_graphic.png")

print("Gerado: play_store_icon.png, feature_graphic.png")
