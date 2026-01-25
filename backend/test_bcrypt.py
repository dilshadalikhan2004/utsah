from passlib.context import CryptContext
import sys

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = pwd_context.hash("test_password")
    print(f"SUCCESS: {hashed}")
except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)
