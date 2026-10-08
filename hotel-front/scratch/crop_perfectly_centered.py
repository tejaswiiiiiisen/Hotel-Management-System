import os
import numpy as np
from PIL import Image

img_path = r"C:\Users\nehaj\.gemini\antigravity-ide\brain\80841bbd-4ee9-4335-a82a-889ea3d208b5\.user_uploaded\media_1789472931117.png"
output_dir = r"c:\Users\nehaj\Projects\revisit-backend\Hotel Management\hotel\hotel-front\public\images\icons"

img = Image.open(img_path).convert("RGBA")

# Exact center points of the 3 icons
targets = {
    "feature_sync_flat.png": (646.5, 112.0),
    "feature_rbac_flat.png": (366.5, 363.5),
    "feature_multibranch_flat.png": (646.5, 364.0)
}

crop_size = 220 # Size around exact center

for fname, (cx, cy) in targets.items():
    left = int(cx - crop_size / 2.0)
    top = int(cy - crop_size / 2.0)
    right = left + crop_size
    bottom = top + crop_size
    
    cropped = img.crop((left, top, right, bottom))
    
    # Recolor cyan-blue to Project Indigo & make background transparent
    data = np.array(cropped, dtype=np.float32)
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    is_white_bg = (r > 248) & (g > 248) & (b > 248)
    is_black_line = (r < 60) & (g < 60) & (b < 60)
    is_bright_blue = (~is_black_line) & (~is_white_bg) & (b > 180) & (r < 150)
    is_light_blue_bubble = (~is_white_bg) & (r > 160) & (g > 190) & (b > 230)
    
    # Make outer white background transparent (alpha = 0)
    a[is_white_bg] = 0.0
    
    # Project Indigo palette:
    # Primary Indigo fill #6366f1 (99, 102, 241)
    data[is_bright_blue, 0] = 99.0
    data[is_bright_blue, 1] = 102.0
    data[is_bright_blue, 2] = 241.0
    
    # Light Indigo Bubble #eef2ff (238, 242, 255)
    data[is_light_blue_bubble, 0] = 238.0
    data[is_light_blue_bubble, 1] = 242.0
    data[is_light_blue_bubble, 2] = 255.0
    
    # Crisp Dark Slate Outlines #0f172a (15, 23, 42)
    data[is_black_line, 0] = 15.0
    data[is_black_line, 1] = 23.0
    data[is_black_line, 2] = 42.0
    
    data[:,:,3] = a
    
    final_img = Image.fromarray(data.astype(np.uint8), mode="RGBA")
    save_path = os.path.join(output_dir, fname)
    final_img.save(save_path)
    print(f"Saved {fname} perfectly centered at ({cx}, {cy}) with transparent background.")

print("All 3 icons cropped perfectly centered and recolored.")
