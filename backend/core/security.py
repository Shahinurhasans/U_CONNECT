from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv
import pyotp
from datetime import datetime, timedelta

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__ident="2b")

# Hash Password
def hash_password(password: str):
    return pwd_context.hash(password)

# Verify Password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Create JWT Token
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=12)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)



def generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return pyotp.random_base32()[:6]  # Simple 6-digit OTP

def store_otp(db, user, otp: str):
    """Store OTP with 10-minute expiry."""
    user.otp = otp
    user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    db.refresh(user)