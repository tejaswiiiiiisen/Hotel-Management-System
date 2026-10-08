import os
import numpy as np
from PIL import Image

img_path = r"C:\Users\nehaj\.gemini\antigravity-ide\brain\80841bbd-4ee9-4335-a82a-889ea3d208b5\.user_uploaded\media_1789472931117.png"
output_dir = r"c:\Users\nehaj\Projects\revisit-backend\Hotel Management\hotel\hotel-front\public\images\icons"

img = Image.open(img_path).convert("RGBA")
width, height = img.size # 1024, 475

data = np.array(img)
r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

# Non-white pixels (where R < 245 or G < 245 or B < 245)
non_white = (r < 245) | (g < 245) | (b < 245)

# Find bounding boxes of non-white pixels for each icon region:
# Row 1, Col 3: Rocket Sync (x around 512-768, y around 0-237)
# Row 2, Col 2: Hardhat RBAC (x around 256-512, y around 237-475)
# Row 2, Col 3: Storefront Branch (x around 512-768, y around 237-475)

regions = {
    "feature_sync_flat.png": (512, 0, 768, 237),
    "feature_rbac_flat.png": (256, 237, 512, 475),
    "feature_multibranch_flat.png": (512, 237, 768, 475)
}

for name, (x1, y1, x2, y2) in regions.items():
    sub_mask = non_white[y1:y2, x1:x2]
    sub_y, sub_x = np.where(sub_mask)
    
    # Calculate exact bounding box of the non-white icon graphic
    min_x, max_x = np.min(sub_x) + x1, np.max(sub_x) + x1
    min_y, max_y = np.min(sub_y) + y1, np.max(sub_y) + y1
    
    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0
    
    width_icon = max_x - min_x
    height_icon = max_y - min_y
    max_dim = max(width_icon, height_icon)
    
    print(f"{name}: Bounding Box ({min_x}, {min_y}) to ({max_x}, {max_y}), Center ({center_x:.1f}, {center_y:.1f}), Dim: {width_icon}x{height_icon}")
