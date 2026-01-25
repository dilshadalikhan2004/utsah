import os

source = r"C:/Users/LENOVO/.gemini/antigravity/brain/8a155cd0-c51a-4a54-977b-ac40e2d30c88/uploaded_media_1769299232872.jpg"

if os.path.exists(source):
    print(f"File exists: {source}")
else:
    print(f"File NOT found: {source}")
