# Stand-in photographs for the local preview (the real ones live on cdn.shopify.com, unreachable here).
# Each is a tonal studio backdrop with a soft figure and the real filename in small type.
import json, sys, random, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
out = sys.argv[1]; names = json.load(open(sys.argv[2])) + [f"product-{i}{s}.jpg" for i in range(1, 7) for s in "ab"]
os.makedirs(out, exist_ok=True)
for idx, name in enumerate(names):
    rnd = random.Random(name)
    w, h = (1500, 2000)
    dark = rnd.random() < 0.45
    top = rnd.randint(25, 70) if dark else rnd.randint(205, 240)
    bot = top + (rnd.randint(-20, 25))
    im = Image.new("L", (w, h))
    px = im.load()
    for y in range(h):
        v = int(top + (bot - top) * y / h)
        for x in range(0, w):
            px[x, y] = v
    d = ImageDraw.Draw(im)
    fig = 20 if not dark else 200
    cx = w // 2 + rnd.randint(-250, 250)
    d.ellipse([cx - 95, 330, cx + 95, 560], fill=fig)                       # head
    d.polygon([(cx - 230, 640), (cx + 230, 640), (cx + 300, 1900), (cx - 300, 1900)], fill=fig)  # coat
    d.rectangle([cx - 70, 540, cx + 70, 660], fill=fig)                     # neck
    im = im.filter(ImageFilter.GaussianBlur(18))
    noise = Image.effect_noise((w, h), 14).convert("L")
    im = Image.blend(im, noise, 0.06)
    rgb = Image.merge("RGB", (im, im.point(lambda v: int(v * 0.985)), im.point(lambda v: int(v * 0.96))))
    ImageDraw.Draw(rgb).text((40, h - 70), name, fill=(128, 128, 128))
    rgb.save(os.path.join(out, name), quality=70)
print(len(names), "images")
