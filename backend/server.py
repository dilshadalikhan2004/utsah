from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Query, Response, Form
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import pandas as pd
import io
from io import BytesIO
import csv
import secrets
import resend
import re

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
import bcrypt
# Monkeypatch bcrypt for passlib compatibility
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type('About', (object,), {'__version__': bcrypt.__version__})

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.getenv("MONGO_URL")
db_name = os.getenv("DB_NAME")

if not mongo_url or not db_name:
    raise RuntimeError("❌ MONGO_URL or DB_NAME missing in environment")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Security
JWT_SECRET = os.environ.get('JWT_SECRET', 'utsah-secret-key-2026-fest-gita-college')
JWT_ALGORITHM = 'HS256'
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Resend Email Configuration (for password reset)
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

from fastapi.middleware.gzip import GZipMiddleware

# Create the main app without a prefix
app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",
        "https://utsahfest.in",
        "https://www.utsahfest.in",
        "https://utsah-production.up.railway.app"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(data: dict, expires_delta: timedelta = timedelta(days=7)) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"email": email}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Models
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    roll_number: str
    department: str
    year: int
    mobile_number: str

    @field_validator('year')
    def validate_year(cls, v):
        if v < 1 or v > 4:
            raise ValueError('Year must be between 1 and 4')
        return v
    
    @field_validator('mobile_number')
    def validate_mobile(cls, v):
        if not re.match(r'^\d{10}$', v):
            raise ValueError('Mobile number must be exactly 10 digits')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    full_name: str
    roll_number: str
    department: str
    year: int
    mobile_number: str
    role: str
    verified: bool
    created_at: datetime

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    mobile_number: Optional[str] = None
    roll_number: Optional[str] = None
    
    @field_validator('mobile_number')
    def validate_mobile(cls, v):
        if v and not re.match(r'^\d{10}$', v):
             raise ValueError('Mobile number must be exactly 10 digits')
        return v

class EventCreate(BaseModel):
    name: str
    description: str
    sub_fest: str  # CULTURAL-AKANKSHA, SPORTS-AHWAAN, TECHNOLOGY-ANWESH
    event_type: str  # individual or team
    coordinators: List[str]
    timing: str
    venue: str
    registration_deadline: datetime
    capacity: int
    min_team_size: Optional[int] = 1
    max_team_size: Optional[int] = 1
    max_events_per_student: int = 3
    is_registration_open: bool = True
    rulebooks: Optional[List[Dict[str, str]]] = [] # List of {title: "...", url: "..."}

class EventResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    sub_fest: str
    event_type: str
    coordinators: List[str] = []
    timing: str = "TBD"
    venue: str = "TBD"
    registration_deadline: datetime
    capacity: int = 100
    registered_count: int = 0
    is_active: bool = True
    is_registration_open: bool = True
    min_team_size: int = 1
    max_team_size: int = 1
    max_events_per_student: int = 3
    rulebooks: List[Dict[str, str]] = []
    created_at: Optional[datetime] = None

class TeamMember(BaseModel):
    full_name: str
    email: EmailStr
    roll_number: str
    department: str
    year: int
    mobile_number: str
    
    @field_validator('mobile_number')
    def validate_mobile(cls, v):
        if not re.match(r'^\d{10}$', v):
            raise ValueError('Mobile number must be exactly 10 digits')
        return v

class EventRegistration(BaseModel):
    event_id: str
    team_members: Optional[List[TeamMember]] = None
    selected_sub_events: Optional[List[str]] = None

class RegistrationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    event_id: str
    student_email: EmailStr
    team_members: Optional[List[Dict[str, Any]]] = None
    registered_at: datetime
    event_name: str
    sub_fest: str
    selected_sub_events: Optional[List[str]] = None

class NotificationCreate(BaseModel):
    title: str
    message: str
    image_url: Optional[str] = None

class NotificationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    message: str
    image_url: Optional[str] = None
    created_at: datetime

class GalleryImageCreate(BaseModel):
    sub_fest: str
    image_url: str
    caption: Optional[str] = None

class GalleryImageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    sub_fest: str
    image_url: str
    caption: Optional[str] = None
    uploaded_at: datetime

class ShortlistEntry(BaseModel):
    name: str
    roll_number: str
    department: str
    status: str

# Password Reset Models
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# Auth endpoints
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_roll = await db.users.find_one({"roll_number": user_data.roll_number}, {"_id": 0})
    if existing_roll:
        raise HTTPException(status_code=400, detail="Roll number already registered")
    
    # Create user
    try:
        user_dict = user_data.model_dump()
        user_dict['password'] = hash_password(user_data.password)
        user_dict['role'] = 'student'
        user_dict['verified'] = True  # Mock email verification
        user_dict['created_at'] = datetime.now(timezone.utc).isoformat()
        user_dict['id'] = user_data.email
        
        await db.users.insert_one(user_dict)
        
        # Create token
        token = create_token({"sub": user_data.email, "role": "student"})
        
        user_response = UserResponse(
            email=user_dict['email'],
            full_name=user_dict['full_name'],
            roll_number=user_dict['roll_number'],
            department=user_dict['department'],
            year=user_dict['year'],
            mobile_number=user_dict['mobile_number'],
            role=user_dict['role'],
            verified=user_dict['verified'],
            created_at=datetime.fromisoformat(user_dict['created_at'])
        )
        
        return TokenResponse(token=token, user=user_response)
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get('verified'):
        raise HTTPException(status_code=401, detail="Email not verified")
    
    token = create_token({"sub": user['email'], "role": user['role']})
    
    user_response = UserResponse(
        email=user['email'],
        full_name=user['full_name'],
        roll_number=user['roll_number'],
        department=user['department'],
        year=user['year'],
        mobile_number=user['mobile_number'],
        role=user['role'],
        verified=user['verified'],
        created_at=datetime.fromisoformat(user['created_at'])
    )
    
    return TokenResponse(token=token, user=user_response)

# Forgot Password - sends reset email
@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    # Check if user exists
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    # Always return success to prevent email enumeration attacks
    if not user:
        return {"message": "If an account exists with this email, you will receive a password reset link."}
    
    # Generate secure reset token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token in database
    await db.password_resets.delete_many({"email": request.email})  # Remove old tokens
    await db.password_resets.insert_one({
        "email": request.email,
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send email via Resend
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    if RESEND_API_KEY:
        try:
            resend.Emails.send({
                "from": "UTSAH Fest <noreply@utsahfest.in>",
                "to": [request.email],
                "subject": "Reset Your UTSAH Password",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #d946ef 0%, #ec4899 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; text-align: center;">UTSAH 2026</h1>
                    </div>
                    <div style="background: #1a1a2e; padding: 30px; border-radius: 0 0 10px 10px; color: #eee;">
                        <h2 style="color: #d946ef;">Password Reset Request</h2>
                        <p>Hi {user.get('full_name', 'there')},</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{reset_link}" style="background: linear-gradient(135deg, #d946ef 0%, #ec4899 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                        </div>
                        <p style="color: #888; font-size: 14px;">This link will expire in 1 hour.</p>
                        <p style="color: #888; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
                        <hr style="border: 1px solid #333; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px; text-align: center;">UTSAH - Annual College Fest | GITA Autonomous College</p>
                    </div>
                </div>
                """
            })
            logger.info(f"Password reset email sent to {request.email}")
        except Exception as e:
            logger.error(f"Failed to send reset email: {e}")
            # Don't expose email errors to user
    else:
        logger.warning(f"RESEND_API_KEY not configured. Reset token for {request.email}: {reset_token}")
    
    return {"message": "If an account exists with this email, you will receive a password reset link."}

# Reset Password - validates token and updates password
@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    # Find the reset token
    reset_record = await db.password_resets.find_one({"token": request.token})
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check expiration
    expires_at = datetime.fromisoformat(reset_record['expires_at'])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if datetime.now(timezone.utc) > expires_at:
        await db.password_resets.delete_one({"token": request.token})
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")
    
    # Validate password strength
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    # Update user's password
    hashed_password = hash_password(request.new_password)
    result = await db.users.update_one(
        {"email": reset_record['email']},
        {"$set": {"password": hashed_password}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete the used token
    await db.password_resets.delete_one({"token": request.token})
    
    logger.info(f"Password reset successful for {reset_record['email']}")
    
    return {"message": "Password reset successful. You can now login with your new password."}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        email=user['email'],
        full_name=user['full_name'],
        roll_number=user['roll_number'],
        department=user['department'],
        year=user['year'],
        mobile_number=user['mobile_number'],
        role=user['role'],
        verified=user['verified'],
        created_at=datetime.fromisoformat(user['created_at']) if isinstance(user['created_at'], str) else user['created_at']
    )

@api_router.put("/auth/me", response_model=UserResponse)
async def update_me(updates: UserUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    if not update_data:
         raise HTTPException(status_code=400, detail="No updates provided")
         
    await db.users.update_one({"email": user['email']}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"email": user['email']}, {"_id": 0})
    
    return UserResponse(
        email=updated_user['email'],
        full_name=updated_user['full_name'],
        roll_number=updated_user['roll_number'],
        department=updated_user['department'],
        year=updated_user['year'],
        mobile_number=updated_user['mobile_number'],
        role=updated_user['role'],
        verified=updated_user['verified'],
        created_at=datetime.fromisoformat(updated_user['created_at']) if isinstance(updated_user['created_at'], str) else updated_user['created_at']
    )

class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sub_fest: Optional[str] = None
    event_type: Optional[str] = None
    coordinators: Optional[List[str]] = None
    timing: Optional[str] = None
    venue: Optional[str] = None
    registration_deadline: Optional[datetime] = None
    capacity: Optional[int] = None
    min_team_size: Optional[int] = None
    max_team_size: Optional[int] = None
    max_events_per_student: Optional[int] = None
    is_active: Optional[bool] = None
    is_registration_open: Optional[bool] = None

# Event endpoints
@api_router.post("/events", response_model=EventResponse)
async def create_event(event: EventCreate, admin: dict = Depends(get_admin_user)):
    event_dict = event.model_dump()
    event_dict['id'] = f"{event.sub_fest}-{event.name}".replace(" ", "-").lower()
    event_dict['registered_count'] = 0
    event_dict['is_active'] = True
    event_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    event_dict['registration_deadline'] = event.registration_deadline.isoformat()
    event_dict['rulebooks'] = []
    
    # Check for duplicates
    existing = await db.events.find_one({"id": event_dict['id']})
    if existing:
        raise HTTPException(status_code=400, detail="Event with this name already exists in this sub-fest")
         
    await db.events.insert_one(event_dict)
    
    return EventResponse(**{**event_dict, 'registration_deadline': event.registration_deadline, 'created_at': datetime.fromisoformat(event_dict['created_at'])})

from fastapi.staticfiles import StaticFiles

# ... (imports)

# Make sure 'static' dir exists
STATIC_DIR = ROOT_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)
PDF_DIR = STATIC_DIR / "pdfs"
PDF_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

from bson.binary import Binary
import base64

# ... (imports)

# We are switching to Database storage for files to ensure persistence across deployments
# No more static file mounting needed

@api_router.get("/files/{file_id}")
async def get_file(file_id: str):
    file_doc = await db.files.find_one({"id": file_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
        
    return Response(
        content=file_doc['content'],
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={file_doc['filename']}"}
    )

@api_router.post("/events/{event_id}/rulebooks")
async def upload_rulebook(
    event_id: str, 
    file: UploadFile = File(...), 
    title: str = Form(...),
    admin: dict = Depends(get_admin_user)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    # Check event exists
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    try:
        content = await file.read()
        
        # Limit file size to 10MB to be safe for Mongo document limit (16MB)
        if len(content) > 10 * 1024 * 1024:
             raise HTTPException(status_code=400, detail="File too large (max 10MB)")

        file_id = f"file-{secrets.token_hex(8)}"
        
        # Store file content in valid BSON Binary format
        # MongoDB handles bytes objects as Binary automatically
        await db.files.insert_one({
            "id": file_id,
            "filename": f"{title.replace(' ', '_')}.pdf",
            "content": content,  # direct bytes
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        })
            
        # The URL now points to our API endpoint
        url = f"{os.getenv('BACKEND_URL', 'http://localhost:8000')}/api/files/{file_id}"
        
        rulebook = {
            "title": title,
            "url": url,
            "file_id": file_id, # Keep track for deletion
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.events.update_one(
            {"id": event_id},
            {"$push": {"rulebooks": rulebook}}
        )
        
        return rulebook
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to upload rulebook: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file to database: {str(e)}")

@api_router.delete("/events/{event_id}/rulebooks")
async def delete_rulebook(
    event_id: str,
    url: str = Query(...),
    admin: dict = Depends(get_admin_user)
):
    # Find the rulebook first to get the file_id
    event = await db.events.find_one({"id": event_id})
    if not event:
         raise HTTPException(status_code=404, detail="Event not found")
    
    rulebook = next((rb for rb in event.get('rulebooks', []) if rb['url'] == url), None)
    
    # Remove from event
    result = await db.events.update_one(
        {"id": event_id},
        {"$pull": {"rulebooks": {"url": url}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Rulebook not found")
        
    # Clean up file from DB if possible
    if rulebook and 'file_id' in rulebook:
        await db.files.delete_one({"id": rulebook['file_id']})
    
    return {"message": "Rulebook deleted"}
    
@api_router.get("/events", response_model=List[EventResponse])
async def get_events(sub_fest: Optional[str] = None):
    query = {"is_active": True}
    if sub_fest:
        query['sub_fest'] = sub_fest
    
    events = await db.events.find(query, {"_id": 0}).to_list(1000)
    
    processed_events = []
    for event in events:
        try:
            if isinstance(event.get('registration_deadline'), str):
                event['registration_deadline'] = datetime.fromisoformat(event['registration_deadline'])
            if isinstance(event.get('created_at'), str):
                event['created_at'] = datetime.fromisoformat(event['created_at'])
            if 'rulebooks' not in event:
                event['rulebooks'] = []
            processed_events.append(EventResponse(**event))
        except Exception as e:
            logger.error(f"Skipping corrupt event {event.get('id')}: {e}")
            continue
    
    return processed_events

@api_router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id, "is_active": True}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if isinstance(event['registration_deadline'], str):
        event['registration_deadline'] = datetime.fromisoformat(event['registration_deadline'])
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    if 'rulebooks' not in event:
        event['rulebooks'] = []
    
    return EventResponse(**event)


@api_router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, updates: EventUpdate, admin: dict = Depends(get_admin_user)):
    # Prepare update data
    logger.info(f"Updating {event_id} with: {updates.model_dump_json()}")

    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    if not update_data:
         raise HTTPException(status_code=400, detail="No updates provided")

    if 'registration_deadline' in update_data:
        update_data['registration_deadline'] = update_data['registration_deadline'].isoformat()
        
    result = await db.events.update_one({"id": event_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
        
    updated = await db.events.find_one({"id": event_id}, {"_id": 0})
    
    try:
        if isinstance(updated.get('registration_deadline'), str):
            updated['registration_deadline'] = datetime.fromisoformat(updated['registration_deadline'])
        if isinstance(updated.get('created_at'), str):
            updated['created_at'] = datetime.fromisoformat(updated['created_at'])
        if 'rulebooks' not in updated:
            updated['rulebooks'] = []
    except Exception as e:
         logger.error(f"Error parsing date for updated event {event_id}: {e}")
    
    return EventResponse(**updated)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, admin: dict = Depends(get_admin_user)):
    # Delete the event (use delete_many in case of duplicates)
    result = await db.events.delete_many({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Also delete associated registrations to maintain clean state
    await db.registrations.delete_many({"event_id": event_id})
    
    return {"message": "Event and associated registrations deleted successfully"}

# Registration endpoints
@api_router.post("/registrations", response_model=RegistrationResponse)
async def register_for_event(registration: EventRegistration, user: dict = Depends(get_current_user)):
    # Get event
    event = await db.events.find_one({"id": registration.event_id, "is_active": True}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check manual registration toggle
    if not event.get('is_registration_open', True):
         raise HTTPException(status_code=400, detail="Registration for this event is currently closed by admin")
    
    # Check if already registered
    existing = await db.registrations.find_one({"event_id": registration.event_id, "student_email": user['email']}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this event")
    
    # Check participation limit per sub-fest
    SUB_FEST_LIMITS = {
        "TECHNOLOGY-ANWESH": 2,
        "CULTURAL-AKANKSHA": 2,
        "SPORTS-AHWAAN": 4
    }
    
    sub_fest = event.get('sub_fest')
    max_allowed = SUB_FEST_LIMITS.get(sub_fest, 2) # Default to 2 if unknown
    
    # Count existing registrations for this sub_fest
    # We need to find all registrations for this user, then look up the events to check their sub_fest
    user_registrations = await db.registrations.find({"student_email": user['email']}).to_list(100)
    
    count_in_subfest = 0
    for reg in user_registrations:
        if reg['event_id'] == registration.event_id: continue # Should be caught by existing check, but just in case
        
        reg_event = await db.events.find_one({"id": reg['event_id']}, {"sub_fest": 1})
        if reg_event and reg_event.get('sub_fest') == sub_fest:
            count_in_subfest += 1
            
    if count_in_subfest >= max_allowed:
        raise HTTPException(status_code=400, detail=f"You can only register for {max_allowed} events in {sub_fest}")
    
    # Create registration
    try:
        reg_dict = {
            "id": f"reg-{secrets.token_hex(8)}",
            "event_id": registration.event_id,
            "student_email": user['email'],
            "registered_at": datetime.now(timezone.utc).isoformat(),
            "event_name": event['name'],
            "sub_fest": event['sub_fest'],
            "full_name": user['full_name'],
            "roll_number": user['roll_number'],
            "department": user['department'],
            "year": user['year'],
            "mobile_number": user['mobile_number']
        }
        
        if registration.selected_sub_events:
            reg_dict['selected_sub_events'] = registration.selected_sub_events
        
        # Handle team members if necessary
        if event['event_type'] == 'team':
             # Clean up team members to be plain dicts, not Pydantic models
             if registration.team_members:
                 # Verify each team member has valid details if needed (redundant check if generic validator works)
                 reg_dict['team_members'] = [m.model_dump() for m in registration.team_members]
             else:
                 reg_dict['team_members'] = []
    
        await db.registrations.insert_one(reg_dict)
        await db.events.update_one({"id": registration.event_id}, {"$inc": {"registered_count": 1}})
    
        return RegistrationResponse(**{**reg_dict, 'registered_at': datetime.fromisoformat(reg_dict['registered_at'])})
    except Exception as e:
        print(f"Error during registration: {str(e)}") # Log to Railway console
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@api_router.get("/registrations/my", response_model=List[RegistrationResponse])
async def get_my_registrations(user: dict = Depends(get_current_user)):
    registrations = await db.registrations.find({"student_email": user['email']}, {"_id": 0}).to_list(1000)
    
    for reg in registrations:
        if isinstance(reg['registered_at'], str):
            reg['registered_at'] = datetime.fromisoformat(reg['registered_at'])
    
    return [RegistrationResponse(**reg) for reg in registrations]

@api_router.get("/registrations", response_model=List[Dict[str, Any]])
async def get_all_registrations(admin: dict = Depends(get_admin_user)):
    registrations = await db.registrations.find({}, {"_id": 0}).to_list(10000)
    
    if not registrations:
        return []

    # Batch fetch users logic
    user_emails = [reg.get("student_email") for reg in registrations if reg.get("student_email")]
    users_cursor = db.users.find({"email": {"$in": user_emails}}, {"_id": 0})
    users_map = {user["email"]: user async for user in users_cursor}

    for reg in registrations:
        user = users_map.get(reg.get("student_email"))
        if user:
            reg.update({
                "full_name": user.get("full_name"),
                "roll_number": user.get("roll_number"),
                "department": user.get("department"),
                "year": user.get("year"),
                "mobile_number": user.get("mobile_number")
            })
    return registrations

@api_router.delete("/registrations/{registration_id}")
async def delete_registration(registration_id: str, admin: dict = Depends(get_admin_user)):
    reg = await db.registrations.find_one({"id": registration_id})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    await db.registrations.delete_one({"id": registration_id})
    # Decrement count safely
    await db.events.update_one(
        {"id": reg["event_id"], "registered_count": {"$gt": 0}}, 
        {"$inc": {"registered_count": -1}}
    )
    
    return {"message": "Registration deleted successfully"}

@api_router.get("/registrations/export")
async def export_registrations(event_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {}
    if event_id:
        query["event_id"] = event_id
        
    registrations = await db.registrations.find(query, {"_id": 0}).to_list(10000)
    
    if not registrations:
        return Response(content="No registrations found", media_type="text/csv")

    # Batch fetch users to optimize speed
    user_emails = [reg.get("student_email") for reg in registrations if reg.get("student_email")]
    users_cursor = db.users.find({"email": {"$in": user_emails}}, {"_id": 0})
    users_map = {user["email"]: user async for user in users_cursor}

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    headers = ["Full Name", "Event", "Sub-Fest", "Date", "Roll No", "Dept", "Year", "Mobile", "Email", "Team Members", "Robotics Sub-Events"]
    writer.writerow(headers)
    
    for reg in registrations:
        # Enrichment from map
        user = users_map.get(reg.get("student_email"))
        if user:
            reg.update({
                "full_name": user.get("full_name"),
                "roll_number": user.get("roll_number"),
                "department": user.get("department"),
                "year": user.get("year"),
                "mobile_number": user.get("mobile_number")
            })
                
        team_str = ""
        if reg.get('team_members'):
            team_str = "; ".join([f"{m['full_name']} ({m['roll_number']})" for m in reg['team_members']])
        
        # Format sub-events
        sub_events_str = ""
        if reg.get('selected_sub_events'):
            sub_events_str = ", ".join(reg['selected_sub_events']) if isinstance(reg['selected_sub_events'], list) else str(reg['selected_sub_events'])

        writer.writerow([
            reg.get('full_name', ''),
            reg.get('event_name', ''),
            reg.get('sub_fest', ''),
            reg.get('registered_at', ''),
            reg.get('roll_number', ''),
            reg.get('department', ''),
            reg.get('year', ''),
            reg.get('mobile_number', ''),
            reg.get('student_email', ''),
            team_str,
            sub_events_str
        ])

        
    output.seek(0)
    filename = f"registrations_{event_id}.csv" if event_id else "all_registrations.csv"
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={filename}"})

# Notification endpoints
@api_router.post("/notifications", response_model=NotificationResponse)
async def create_notification(notification: NotificationCreate, admin: dict = Depends(get_admin_user)):
    notif_dict = notification.model_dump()
    notif_dict['id'] = f"notif-{datetime.now(timezone.utc).timestamp()}"
    notif_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.notifications.insert_one(notif_dict)
    
    return NotificationResponse(**{**notif_dict, 'created_at': datetime.fromisoformat(notif_dict['created_at'])})

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications():
    notifications = await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for notif in notifications:
        if isinstance(notif['created_at'], str):
            notif['created_at'] = datetime.fromisoformat(notif['created_at'])
    
    return [NotificationResponse(**notif) for notif in notifications]

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.notifications.delete_one({"id": notification_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted successfully"}

# Gallery endpoints
@api_router.post("/gallery", response_model=GalleryImageResponse)
async def add_gallery_image(image: GalleryImageCreate, admin: dict = Depends(get_admin_user)):
    image_dict = image.model_dump()
    image_dict['id'] = f"img-{datetime.now(timezone.utc).timestamp()}"
    image_dict['uploaded_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.gallery.insert_one(image_dict)
    
    return GalleryImageResponse(**{**image_dict, 'uploaded_at': datetime.fromisoformat(image_dict['uploaded_at'])})

@api_router.get("/gallery", response_model=List[GalleryImageResponse])
async def get_gallery(sub_fest: Optional[str] = None):
    query = {}
    if sub_fest:
        query['sub_fest'] = sub_fest
    
    images = await db.gallery.find(query, {"_id": 0}).to_list(1000)
    
    for img in images:
        if isinstance(img['uploaded_at'], str):
            img['uploaded_at'] = datetime.fromisoformat(img['uploaded_at'])
    
    return [GalleryImageResponse(**img) for img in images]

# Shortlist endpoints
# Shortlist endpoints
@api_router.post("/shortlist/upload")
async def upload_shortlist(file: UploadFile = File(...), title: str = Form(...), admin: dict = Depends(get_admin_user)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files allowed")
    
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        # Clean dataframe - replace nan with None/empty string for JSON compatibility
        df = df.where(pd.notnull(df), None)
        
        # Insert new shortlist document
        records = df.to_dict('records')
        
        shortlist_id = f"list-{secrets.token_hex(4)}"
        shortlist_doc = {
            "id": shortlist_id,
            "title": title,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "entries": records
        }
        
        await db.shortlists.insert_one(shortlist_doc)
        
        return {"message": f"Uploaded '{title}' with {len(records)} entries", "count": len(records), "id": shortlist_id}
    except Exception as e:
        logger.error(f"Error processing upload: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@api_router.get("/shortlists")
async def get_shortlists():
    # Return list of shortlists without the full entries data to save bandwidth
    shortlists = await db.shortlists.find({}, {"entries": 0, "_id": 0}).sort("uploaded_at", -1).to_list(100)
    for s in shortlists:
        if isinstance(s.get('uploaded_at'), str):
            s['uploaded_at'] = datetime.fromisoformat(s['uploaded_at'])
    return shortlists

@api_router.get("/shortlists/{shortlist_id}")
async def get_shortlist_details(shortlist_id: str):
    shortlist = await db.shortlists.find_one({"id": shortlist_id}, {"_id": 0})
    if not shortlist:
        raise HTTPException(status_code=404, detail="Shortlist not found")
        
    if isinstance(shortlist.get('uploaded_at'), str):
        shortlist['uploaded_at'] = datetime.fromisoformat(shortlist['uploaded_at'])
        
    return shortlist

@api_router.delete("/shortlists/{shortlist_id}")
async def delete_shortlist(shortlist_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.shortlists.delete_one({"id": shortlist_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shortlist not found")
    return {"message": "Shortlist deleted successfully"}

# Data export endpoints
@api_router.get("/export/registrations")
async def export_registrations(format: str = Query("csv"), admin: dict = Depends(get_admin_user)):
    # Get all registrations with user details
    registrations = await db.registrations.find({}, {"_id": 0}).to_list(10000)
    
    if not registrations:
        raise HTTPException(status_code=404, detail="No registrations found")
    
    # Enhance with user details
    for reg in registrations:
        if reg.get("student_email"):
            user = await db.users.find_one({"email": reg["student_email"]}, {"_id": 0})
            if user:
                reg.update({
                    "full_name": user.get("full_name"),
                    "roll_number": user.get("roll_number"),
                    "department": user.get("department"),
                    "year": user.get("year"),
                    "mobile_number": user.get("mobile_number")
                })
    
    # Convert to dataframe
    df = pd.DataFrame(registrations)
    
    # Select columns
    columns = ["id", "event_id", "registered_at", "full_name", "email", "mobile_number", "roll_number", "selected_sub_events"]
    
    # Ensure all columns exist
    for col in columns:
        if col not in df.columns:
            df[col] = None
            
    # Format selected_sub_events list to readable string
    if "selected_sub_events" in df.columns:
        df['selected_sub_events'] = df['selected_sub_events'].apply(lambda x: ", ".join(x) if isinstance(x, list) else x)

    df = df[columns]
    
    output = io.StringIO()
    df.to_csv(output, index=False)
    
    return Response(
        content=output.getvalue(), 
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=registrations.csv"}
    )

class SystemData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    type: Optional[str] = "general_info"
    rules: Optional[List[Any]] = []
    additional_rules: Optional[List[Any]] = []
    schedule: Optional[List[Dict[str, Any]]] = []
    coordinators: Optional[List[Dict[str, Any]]] = []

@api_router.get("/system/coordinators", response_model=SystemData)
async def get_coordinator_data():
    data = await db.system.find_one({"type": "coordinator_data"}, {"_id": 0})
    if not data:
        # Default data structure if not found
        default_data = {
            "type": "coordinator_data",
            "rules": [
                "REGISTER ONLY THROUGH THE WEBSITE 'UTSAH2026' (utsahfest.in).",
                "Registration opens FROM 24 JAN 2026 from 7pm to 27 JAN 2026 till 10 am (*No on spot registration allowed).",
                "One student can REGISTER in maximum two events out of the followings.",
                "Anyone not participating in the audition won't be allowed to participate in the events.",
                "Mere participation in the audition does not confirm to be a part of the final event on-stage.",
                "College uniform is mandatory for all participants during audition.",
                "Decisions of jury members are final.",
                "All Faculty Members who are a part of the Cultural Society are requested to reach the venue by 10AM.",
                "All the student coordinators for audition need to contact the respective faculty in-charge."
            ],
            "additional_rules": [
                "Students for audition in Song and Dance are required to select their own song/track and bring them for the audition.",
                "Students for audition in Anchoring need to come prepared with a script of at least TWO mins.",
                "Singers will be allowed to sing duet or solo during the function days.",
                "Students interested in participating in Odissi dance can come prepared with an Odissi song for themselves."
            ],
            "schedule": [
                {"date": "28.01.2026", "time": "10AM", "venue": "W103", "event": "SONG"},
                {"date": "28.01.2026", "time": "10AM", "venue": "W202", "event": "ANCHORING"},
                {"date": "28.01.2026", "time": "10AM", "venue": "DANCE FLOOR", "event": "DANCE"},
                {"date": "28.01.2026", "time": "10AM", "venue": "MBA AUDITORIUM", "event": "FASHION SHOW"},
                {"date": "28.01.2026", "time": "2:30PM", "venue": "LIBRARY", "event": "DRAMA"}
            ],
            "coordinators": [
                {
                    "event": "ANCHORING",
                    "faculty": [
                        {"name": "DR. L.D. THOMAS", "dept": "BS&H", "phone": "9938513482"},
                        {"name": "PROF. PRITESH MOHAPATRA", "dept": "BS&H", "phone": "8249395020"},
                        {"name": "PROF. SOUMYA GOSWAMI", "dept": "CST", "phone": "9861623713"}
                    ],
                    "students": [
                        {"name": "Anshuman Patnaik", "year": "3rd", "phone": "9938074837"},
                        {"name": "Arpan Gadnayak", "year": "3rd", "phone": "9337281884"}
                    ]
                },
                {
                    "event": "SONG",
                    "faculty": [
                        {"name": "PROF. DIPAK KUMAR SAHU", "dept": "BS&H", "phone": "9437142602"},
                        {"name": "DR. SUDHIR PANDA", "dept": "CE", "phone": "7846936322"},
                        {"name": "PROF. BANDITA DASH", "dept": "BS&H", "phone": "9338217050"}
                    ],
                    "students": [
                        {"name": "Anshman Rout", "year": "3rd", "phone": "8658907290"},
                        {"name": "Smruti Nibedita Sahoo", "year": "3rd", "phone": "8328878351"}
                    ]
                },
                {
                    "event": "DANCE",
                    "faculty": [
                        {"name": "DR. SUSHMITA DASH", "dept": "ME", "phone": "8895435809"},
                        {"name": "DR. CHANDRIKA SAMAL", "dept": "ME", "phone": "9861950057"},
                        {"name": "MR. SUBHAM PADHY", "dept": "CE (Lab I/O)", "phone": "8280244918"},
                        {"name": "MR. TAPAS MOHARANA", "dept": "CSE (T.A.)", "phone": "8637279570"}
                    ],
                    "students": [
                        {"name": "Poonam Hati", "year": "3rd", "phone": "6371842562"},
                        {"name": "Kiranbala sahoo", "year": "3rd", "phone": "8249237202"},
                        {"name": "Akash Mohapatra", "year": "2nd", "phone": "8093720948"},
                        {"name": "Baishnabi Mishra", "year": "3rd", "phone": "6372298232"},
                        {"name": "Adwitiya Swayamsamparna", "year": "2nd", "phone": "9337027186"},
                        {"name": "Ankita Ghosh", "year": "3rd", "phone": "6370807987"}
                    ]
                },
                {
                    "event": "FASHION SHOW",
                    "faculty": [
                        {"name": "PROF. SUBHA R. DAS", "dept": "CSIT", "phone": "9337433945"},
                        {"name": "PROF. MANOJ K. SAHOO", "dept": "CSE", "phone": "9040146664"},
                        {"name": "PROF. LAXMI NARAYAN DASH", "dept": "CST", "phone": "7008862216"},
                        {"name": "PROF. RAMSHANKAR PRADHAN", "dept": "PHY", "phone": "9776932703"},
                        {"name": "PROF. PRIYATAMA MOHARANA", "dept": "CSE-AIML", "phone": "7978722903"},
                        {"name": "PROF. RAJALAXMI SAHOO", "dept": "MCA", "phone": "8984617506"},
                        {"name": "MR. ASHUTOSH PATNAIK", "dept": "ADM, SEC", "phone": "7381052524"}
                    ],
                    "students": [
                        {"name": "JayanarayanPanda", "year": "3rd", "phone": "7846803792"},
                        {"name": "SoumyaRanjanBehera", "year": "3rd", "phone": "9090407789"},
                        {"name": "Badal Nayak", "year": "3rd", "phone": "8260266125"}
                    ]
                },
                {
                    "event": "DRAMA",
                    "faculty": [
                        {"name": "DR. BRDARATA DASH", "dept": "LIBRARIAN", "phone": "9437228797"},
                        {"name": "DR. RASABIHARI MISHRA", "dept": "BSH", "phone": "9937993373"}
                    ],
                    "students": [
                        {"name": "Somnath Behera", "year": "3rd", "phone": "6371976033"}
                    ]
                },
                {
                    "event": "ALL EVENT COORDINATOR",
                    "faculty": [
                        {"name": "PROF. CHINMAYANANDA SAHOO", "dept": "CE", "phone": "8249556490"}
                    ],
                    "students": [
                        {"name": "Tripti Kumari", "year": "1st", "phone": "9430751385"},
                        {"name": "Prithviraj Das", "year": "3rd", "phone": "7008264556"}
                    ]
                },
                {
                    "event": "PRACTICE COORDINATION",
                    "faculty": [
                        {"name": "DR. RASHA BIHARI MISHRA", "dept": "BS&H", "phone": "8260045022"},
                        {"name": "PROF. AMIT KUMAR DEHURY", "dept": "ME", "phone": "9438138185"},
                        {"name": "PROF. SIBAKANTA SAHU", "dept": "ME", "phone": "8895988888"},
                        {"name": "PROF. SUJIT KHANDAI", "dept": "EE", "phone": "9777722770"},
                        {"name": "PROF. PRITISH BHANJA", "dept": "BS&H", "phone": "7377123101"},
                        {"name": "DR. SASWATI SAHOO", "dept": "CSE", "phone": "-"}
                    ],
                    "students": []
                }
            ]
        }
        await db.system.insert_one(default_data)
        return SystemData(**default_data)
    
    # Force update if URL is outdated
    if data and "utsah.in" in data["rules"][0]:
        data["rules"][0] = "REGISTER ONLY THROUGH THE WEBSITE 'UTSAH2026' (utsahfest.in)."
        await db.system.replace_one({"type": "coordinator_data"}, data)
        return SystemData(**data)

    return SystemData(**data)

@api_router.post("/system/coordinators", response_model=SystemData)
async def update_coordinator_data(data: SystemData, admin: dict = Depends(get_admin_user)):
    data_dict = data.model_dump()
    data_dict['type'] = "coordinator_data"
    
    await db.system.replace_one({"type": "coordinator_data"}, data_dict, upsert=True)
    return data

@api_router.post("/system/sync-counts")
async def sync_event_counts(admin: dict = Depends(get_admin_user)):
    events = await db.events.find({}).to_list(None)
    updated = 0
    for event in events:
        eid = event['id']
        actual = await db.registrations.count_documents({"event_id": eid})
        if event.get('registered_count', 0) != actual:
            await db.events.update_one({"id": eid}, {"$set": {"registered_count": actual}})
            updated += 1
    return {"message": f"Synchronization complete. Updated {updated} events.", "updated_count": updated}

# Include the router in the main app
app.include_router(api_router)



# Configure logging


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()