import os
import numpy as np
from PIL import Image

user_dir = r"C:\Users\nehaj\.gemini\antigravity-ide\brain\80841bbd-4ee9-4335-a82a-889ea3d208b5\.user_uploaded"
output_dir = r"c:\Users\nehaj\Projects\revisit-backend\Hotel Management\hotel\hotel-front\public\images\icons"
os.makedirs(output_dir, exist_ok=True)

icon_files = {
    "feature_multibranch_flat.png": "media_1789474312286.png", # Storefront Pin
    "feature_rbac_flat.png": "media_1789474334257.png",       # Hardhat Wrench Check
    "feature_sync_flat.png": "media_1789474360136.png"         # Rocket Sync Pin
}

def recolor_and_make_transparent(src_path, dest_path):
    img = Image.open(src_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)
    
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Background white pixels -> transparent alpha = 0
    is_white_bg = (r > 240) & (g > 240) & (b > 240)
    is_black_line = (r < 65) & (g < 65) & (b < 65)
    
    # Bright blue fills (Pin, awning, wrench fill, rocket body)
    is_bright_blue = (~is_black_line) & (~is_white_bg) & (b > 170) & (r < 150)
    
    # Soft light blue circle bubble background
    is_light_blue_bubble = (~is_white_bg) & (r > 150) & (g > 180) & (b > 210)
    
    # Outer white area -> Transparent Alpha = 0
    a[is_white_bg] = 0.0
    
    # Project Indigo Theme recoloring:
    # 1. Bright Blue -> Indigo #5e68f1 / #6366f1 (RGB: 94, 104, 241)
    data[is_bright_blue, 0] = 94.0
    data[is_bright_blue, 1] = 104.0
    data[is_bright_blue, 2] = 241.0
    
    # 2. Light Blue Bubble -> Light Indigo #eef2ff (RGB: 238, 242, 255)
    data[is_light_blue_bubble, 0] = 238.0
    data[is_light_blue_bubble, 1] = 242.0
    data[is_light_blue_bubble, 2] = 255.0
    
    # 3. Outlines -> Crisp Slate #0f172a (RGB: 15, 23, 42)
    data[is_black_line, 0] = 15.0
    data[is_black_line, 1] = 23.0
    data[is_black_line, 2] = 42.0
    
    data[:,:,3] = a
    
    final_img = Image.fromarray(data.astype(np.uint8), mode="RGBA")
    final_img.save(dest_path)
    print(f"Processed {os.path.basename(src_path)} -> saved transparent indigo icon to {dest_path}")

for dest_name, src_name in icon_files.items():
    src_p = os.path.join(user_dir, src_name)
    dest_p = os.path.join(output_dir, dest_name)
    recolor_and_make_transparent(src_p, dest_p)

print("All 3 exact high-res user icons processed successfully!")
