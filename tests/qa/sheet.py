import sys, glob, os
from PIL import Image, ImageDraw
d = sys.argv[1]; cols = int(sys.argv[2]); scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1
files = sorted(glob.glob(os.path.join(d, '[0-9]*.png')))
ims = [Image.open(f) for f in files]
w = int(ims[0].width * scale); h = int(ims[0].height * scale); pad = 8; lab = 14
per = cols * 2
for page in range(0, len(ims), per):
    part = ims[page:page + per]; rows = (len(part) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (w + pad) + pad, rows * (h + pad + lab) + pad), (90, 90, 90))
    dr = ImageDraw.Draw(sheet)
    for i, im in enumerate(part):
        x = pad + (i % cols) * (w + pad); y = pad + (i // cols) * (h + pad + lab)
        sheet.paste(im.resize((w, h)), (x, y + lab)); dr.text((x, y), os.path.basename(files[page + i])[:-4], fill=(255, 255, 255))
    sheet.save(os.path.join(d, f'sheet-{page // per + 1}.png'))
print(len(ims), 'shots')
