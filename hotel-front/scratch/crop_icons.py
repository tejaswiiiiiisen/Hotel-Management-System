import os
from PIL import Image

img_path = r"C:\Users\nehaj\.gemini\antigravity-ide\brain\80841bbd-4ee9-4335-a82a-889ea3d208b5\.user_uploaded\media_1789472259045.png"
output_dir = r"c:\Users\nehaj\Projects\revisit-backend\Hotel Management\hotel\hotel-front\public\images\icons"

os.makedirs(output_dir, exist_ok=True)
img = Image.open(img_path)

# Image size (1024, 760)
# Grid: 4 columns, 4 rows
# Let's calculate cell bounding boxes
cell_w = 1024 / 4 # 256
cell_h = 760 / 4  # 190

# We want square crops centered in each cell
crop_size = 150

for row in range(4):
    for col in range(4):
        cx = (col + 0.5) * cell_w
        cy = (row + 0.5) * cell_h
        
        left = int(cx - crop_size / 2)
        top = int(cy - crop_size / 2)
        right = int(cx + crop_size / 2)
        bottom = int(cy + crop_size / 2)
        
        cropped = img.crop((left, top, right, bottom))
        filename = f"icon_r{row+1}_c{col+1}.png"
        cropped.save(os.path.join(output_dir, filename))
        print(f"Saved {filename} at ({left}, {top}, {right}, {bottom})")
