import shutil
import os

source = r"c:\Users\LENOVO\Desktop\utsah2026\frontend\src\utsah_main_logo_forall (1).png"
destination = r"c:\Users\LENOVO\Desktop\utsah2026\frontend\public\logo.png"

print(f"Attempting to copy from '{source}' to '{destination}'...")

if os.path.exists(source):
    try:
        shutil.copy2(source, destination)
        print("✅ Success: File copied successfully.")
    except Exception as e:
        print(f"❌ Error copying file: {e}")
else:
    print(f"❌ Error: Source file not found at {source}")
