import os
from PIL import Image

img_path = r"C:\Users\nehaj\.gemini\antigravity-ide\brain\80841bbd-4ee9-4335-a82a-889ea3d208b5\.user_uploaded\media_1789472259045.png"
output_dir = r"c:\Users\nehaj\Projects\revisit-backend\Hotel Management\hotel\hotel-front\public\images\icons"

os.makedirs(output_dir, exist_ok=True)
img = Image.open(img_path)

# Precise crops for the 3 feature cards:
# Card 1: Multi-Branch & Property Control -> Settings Gear (Row 1, Col 1)
# Center x=128, y=95, size=150
crop_multibranch = img.crop((50, 15, 206, 171))
crop_multibranch.save(os.path.join(output_dir, "feature_multibranch.png"))

# Card 2: RBAC Employee Sign In -> Microchip with Eye Security (Row 1, Col 3)
# Center x=640, y=95, size=150
crop_rbac = img.crop((562, 15, 718, 171))
crop_rbac.save(os.path.join(output_dir, "feature_rbac.png"))

# Card 3: Real-Time Room & Booking Sync -> Rocket Launch (Row 4, Col 2)
# Center x=384, y=665, size=150
crop_sync = img.crop((306, 585, 462, 741))
crop_sync.save(os.path.join(output_dir, "feature_sync.png"))

print("Cropped 3 feature icons successfully.")
