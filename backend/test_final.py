import sys
import os
from pathlib import Path

# Add the current directory to sys.path
sys.path.append(os.getcwd())

try:
    import bcrypt
    # Monkeypatch bcrypt for passlib compatibility
    if not hasattr(bcrypt, "__about__"):
        bcrypt.__about__ = type('About', (object,), {'__version__': bcrypt.__version__})
    
    from server import hash_password
    print("Import successful")
    
    h = hash_password("test")
    print(f"Hash successful: {h}")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
