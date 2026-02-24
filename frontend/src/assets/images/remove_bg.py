import os
from rembg import remove
from PIL import Image

images = [
    'icon_save_disk.png',
    'onboarding_camera.png',
    'onboarding_ledger.png',
    'onboarding_tape.png'
]

for img_path in images:
    print(f"Processing {img_path}...")
    try:
        input_image = Image.open(img_path)
        output_image = remove(input_image)
        output_image.save(img_path)
        print(f"Successfully processed {img_path}")
    except Exception as e:
        print(f"Failed to process {img_path}: {e}")
