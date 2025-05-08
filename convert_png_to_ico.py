from PIL import Image
import os

src = os.path.join("assets", "PhotoPackager_Patch_Design.png")
dst = os.path.join("assets", "PhotoPackager_Patch_Design.ico")

img = Image.open(src)
img.save(
    dst,
    format="ICO",
    sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
)
print(f"Converted {src} to {dst}")
