import os
import numpy as np
from PIL import Image

img_path = r"C:\Users\nehaj\.gemini\antigravity-ide\brain\80841bbd-4ee9-4335-a82a-889ea3d208b5\.user_uploaded\media_1789472931117.png"
output_dir = r"c:\Users\nehaj\Projects\revisit-backend\Hotel Management\hotel\hotel-front\public\images\icons"
os.makedirs(output_dir, exist_ok=True)

img = Image.open(img_path).convert("RGBA")
width, height = img.size  # 1024, 475

cell_w = width / 4   # 256
cell_h = height / 2  # 237.5
crop_dim = 210

icon_map = {
    (0, 0): "icon_payment_card.png",
    (0, 1): "icon_dining_bag.png",
    (0, 2): "feature_sync_flat.png",        # Rocket Sync
    (0, 3): "icon_delivery_truck.png",
    (1, 0): "icon_support_headset.png",
    (1, 1): "feature_rbac_flat.png",        # Hardhat / Governance
    (1, 2): "feature_multibranch_flat.png", # Storefront Branch Pin
    (1, 3): "icon_food_burger.png"
}

def recolor_to_project_indigo(pil_img):
    # Recolor cyan-blue (#0075ff, #00a3ff) to Project Indigo (#6366f1, #4f46e5)
    # Recolor light blue bubble (#dbeafe, #e0f2fe) to light indigo (#eef2ff)
    
    img_rgba = pil_img.convert("RGBA")
    data = np.array(img_rgba, dtype=np.float32)
    
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Identify blue pixels: high B, low/mid R, mid/high G
    # Pure black lines (r<50, g<50, b<50) should remain crisp dark slate/black #0f172a
    is_black_line = (r < 60) & (g < 60) & (b < 60)
    is_white_bg = (r > 250) & (g > 250) & (b > 250)
    
    # Cyan/Blue fills (Bright blue): R < 100, G > 100, B > 200 or R < 50, B > 200
    is_bright_blue = (~is_black_line) & (~is_white_bg) & (b > 180) & (r < 150)
    
    # Light blue background circle bubble: R > 180, G > 200, B > 240
    is_light_blue_bubble = (~is_white_bg) & (r > 160) & (g > 190) & (b > 230)
    
    # Apply Project Indigo transformations:
    # 1. Bright Blue -> Indigo #6366f1 (RGB: 99, 102, 241) or #4f46e5 (RGB: 79, 70, 229)
    data[is_bright_blue, 0] = 99.0   # R
    data[is_bright_blue, 1] = 102.0  # G
    data[is_bright_blue, 2] = 241.0  # B
    
    # 2. Light Blue Circle Bubble -> Light Indigo #eef2ff (RGB: 238, 242, 255)
    data[is_light_blue_bubble, 0] = 238.0  # R
    data[is_light_blue_bubble, 1] = 242.0  # G
    data[is_light_blue_bubble, 2] = 255.0  # B
    
    # 3. Black outlines -> Slate 900 #0f172a (RGB: 15, 23, 42)
    data[is_black_line, 0] = 15.0
    data[is_black_line, 1] = 23.0
    data[is_black_line, 2] = 42.0
    
    return Image.fromarray(data.astype(np.uint8), mode="RGBA")

for row in range(2):
    for col in range(4):
        cx = (col + 0.5) * cell_w
        cy = (row + 0.5) * cell_h
        
        left = int(cx - crop_dim / 2)
        top = int(cy - crop_dim / 2)
        right = int(cx + crop_dim / 2)
        bottom = int(cy + crop_dim / 2)
        
        cropped = img.crop((left, top, right, bottom))
        recolored = recolor_to_project_indigo(cropped)
        
        fname = icon_map.get((row, col), f"flat_icon_r{row+1}_c{col+1}.png")
        save_path = os.path.join(output_dir, fname)
        recolored.save(save_path)
        print(f"Saved {fname} (recolored to Indigo) at crop ({left},{top},{right},{bottom})")

print("All 8 vector line icons cropped & recolored to Project Indigo theme successfully!")
