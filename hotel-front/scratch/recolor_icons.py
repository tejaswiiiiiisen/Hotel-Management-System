import os
import numpy as np
from PIL import Image

output_dir = r"c:\Users\nehaj\Projects\revisit-backend\Hotel Management\hotel\hotel-front\public\images\icons"

def recolor_green_to_indigo(input_filename, output_filename):
    filepath = os.path.join(output_dir, input_filename)
    img = Image.open(filepath).convert("RGBA")
    
    # Convert image to numpy array
    data = np.array(img, dtype=np.float32)
    
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Calculate luminance / grayscale
    gray = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Indigo color palette:
    # Deep Indigo foreground: #4f46e5 (RGB: 79, 70, 229)
    # Bright Indigo accent: #818cf8 (RGB: 129, 140, 248)
    # Light Indigo background: #eef2ff (RGB: 238, 242, 255)
    # White highlights: #ffffff (RGB: 255, 255, 255)
    
    # Shift hue: Greens have high G relative to R and B
    # Let's map green channels: G > R & G > B is green region
    is_green = (g > r * 0.9) & (g > b * 0.9)
    
    # Create new RGB channels
    new_r = r.copy()
    new_g = g.copy()
    new_b = b.copy()
    
    # Swap G and B channels or remap green tones to Indigo
    # Green (0, 200, 100) -> Indigo (99, 102, 241) or Purple (124, 58, 237)
    # R_new = G * 0.4 + R * 0.6
    # G_new = G * 0.35 + R * 0.2
    # B_new = G * 1.1 + B * 0.2
    
    # Precise palette map based on normalized intensity (0 to 1):
    norm_gray = gray / 255.0
    
    # For dark green parts (icons/lines), map to #4f46e5 (79, 70, 229) to #6366f1 (99, 102, 241)
    # For light green background, map to #eef2ff (238, 242, 255) to white
    
    # Hue shift logic in HSV space:
    img_hsv = img.convert("HSV")
    hsv_data = np.array(img_hsv, dtype=np.float32)
    
    # Green hue in Pillow HSV (0-255) is around 60 - 100 (which is 85-140 degrees)
    # Indigo hue in Pillow HSV (0-255) is around 160 - 180 (around 220-250 degrees)
    h, s, v = hsv_data[:,:,0], hsv_data[:,:,1], hsv_data[:,:,2]
    
    # Shift green hues to indigo hue (~165)
    green_mask = (h >= 40) & (h <= 110)
    h[green_mask] = (h[green_mask] + 105) % 255
    
    hsv_data[:,:,0] = h
    
    recolored_hsv = Image.fromarray(hsv_data.astype(np.uint8), mode="HSV")
    recolored_rgb = recolored_hsv.convert("RGBA")
    
    save_path = os.path.join(output_dir, output_filename)
    recolored_rgb.save(save_path)
    print(f"Recolored {input_filename} to Indigo theme -> saved to {output_filename}")

recolor_green_to_indigo("feature_multibranch.png", "feature_multibranch.png")
recolor_green_to_indigo("feature_rbac.png", "feature_rbac.png")
recolor_green_to_indigo("feature_sync.png", "feature_sync.png")
