"""OfferTrack icon generator — requires Pillow: pip install pillow"""
from PIL import Image, ImageDraw

INK = (22, 24, 29, 255)        # #16181d
GREEN = (22, 163, 74, 255)     # #16a34a
BG = (255, 255, 255, 255)
LINE = (233, 235, 239, 255)    # #e9ebef

def make(size, path):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # rounded white tile
    radius = int(size * 0.18)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG, outline=LINE, width=max(2, size // 128))
    # ascending pipeline bars: 4 bars, last one green (offer)
    margin = size * 0.22
    gap = size * 0.075
    bw = (size - 2 * margin - 3 * gap) / 4
    heights = [0.26, 0.40, 0.54, 0.68]
    base = size - margin
    for i, h in enumerate(heights):
        x0 = margin + i * (bw + gap)
        y0 = base - size * h
        color = GREEN if i == 3 else INK
        d.rounded_rectangle([x0, y0, x0 + bw, base], radius=bw * 0.32, fill=color)
    img.save(path)
    print("wrote", path, size)

if __name__ == "__main__":
    make(512, "icon-512.png")
    make(192, "icon-192.png")
    make(180, "apple-touch-icon.png")
