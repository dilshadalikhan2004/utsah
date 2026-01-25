import shutil
import os

source = r"C:\Users\LENOVO\Desktop\utsah2026\frontend\src\utsah_main_logo_forall (1).png"
destination = r"c:\Users\LENOVO\Desktop\utsah2026\frontend\public\logo.png"

if os.path.exists(source):
    try:
        shutil.copy2(source, destination)
        print("✅ Success: Copied to public/logo.png")
    except Exception as e:
        print(f"❌ Error copying: {e}")
else:
    print(f"❌ Source file not found: {source}")
