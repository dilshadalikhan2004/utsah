import shutil
import os

source = r"C:/Users/LENOVO/.gemini/antigravity/brain/8a155cd0-c51a-4a54-977b-ac40e2d30c88/uploaded_media_1769299232872.jpg"
destination = r"c:/Users/LENOVO/Desktop/utsah2026/frontend/public/utsah_logo.jpg"

try:
    shutil.copy2(source, destination)
    print("✅ Copy successful!")
except Exception as e:
    print(f"❌ Copy failed: {e}")
