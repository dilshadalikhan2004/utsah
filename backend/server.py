from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Query
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
from io import BytesIO
import csv
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import openpyxl

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
JWT_SECRET = os.environ.get('JWT_SECRET', 'utsah-secret-key-2026-fest-gita-college')
JWT_ALGORITHM = 'HS256'
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

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

class EventResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    sub_fest: str
    event_type: str
    coordinators: List[str]
    timing: str
    venue: str
    registration_deadline: datetime
    capacity: int
    registered_count: int = 0
    is_active: bool = True
    min_team_size: int
    max_team_size: int
    max_events_per_student: int
    created_at: datetime

class EventRegistration(BaseModel):
    event_id: str
    team_members: Optional[List[EmailStr]] = None  # For team events, includes leader

class RegistrationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    event_id: str
    student_email: EmailStr
    team_members: Optional[List[str]] = None
    registered_at: datetime
    event_name: str
    sub_fest: str

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
        created_at=datetime.fromisoformat(user['created_at'])
    )

# Event endpoints
@api_router.post("/events", response_model=EventResponse)
async def create_event(event: EventCreate, admin: dict = Depends(get_admin_user)):
    event_dict = event.model_dump()
    event_dict['id'] = f"{event.sub_fest}-{event.name}".replace(" ", "-").lower()
    event_dict['registered_count'] = 0
    event_dict['is_active'] = True
    event_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    event_dict['registration_deadline'] = event.registration_deadline.isoformat()
    
    await db.events.insert_one(event_dict)
    
    return EventResponse(**{**event_dict, 'registration_deadline': event.registration_deadline, 'created_at': datetime.fromisoformat(event_dict['created_at'])})

@api_router.get("/events", response_model=List[EventResponse])
async def get_events(sub_fest: Optional[str] = None):
    query = {"is_active": True}
    if sub_fest:
        query['sub_fest'] = sub_fest
    
    events = await db.events.find(query, {"_id": 0}).to_list(1000)
    
    for event in events:
        if isinstance(event['registration_deadline'], str):
            event['registration_deadline'] = datetime.fromisoformat(event['registration_deadline'])
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    return [EventResponse(**event) for event in events]

@api_router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id, "is_active": True}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if isinstance(event['registration_deadline'], str):
        event['registration_deadline'] = datetime.fromisoformat(event['registration_deadline'])
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    return EventResponse(**event)

@api_router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, event: EventCreate, admin: dict = Depends(get_admin_user)):
    existing = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event_dict = event.model_dump()
    event_dict['registration_deadline'] = event.registration_deadline.isoformat()
    
    await db.events.update_one({"id": event_id}, {"$set": event_dict})
    
    updated = await db.events.find_one({"id": event_id}, {"_id": 0})
    if isinstance(updated['registration_deadline'], str):
        updated['registration_deadline'] = datetime.fromisoformat(updated['registration_deadline'])
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return EventResponse(**updated)

@api_router.delete("/events/{event_id}")
async def disable_event(event_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.events.update_one({"id": event_id}, {"$set": {"is_active": False}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event disabled successfully"}

# Registration endpoints
@api_router.post("/registrations", response_model=RegistrationResponse)
async def register_for_event(registration: EventRegistration, user: dict = Depends(get_current_user)):
    # Get event
    event = await db.events.find_one({"id": registration.event_id, "is_active": True}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check deadline
    deadline = datetime.fromisoformat(event['registration_deadline']) if isinstance(event['registration_deadline'], str) else event['registration_deadline']
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > deadline:
        raise HTTPException(status_code=400, detail="Registration deadline passed")
    
    # Check capacity
    if event['registered_count'] >= event['capacity']:
        raise HTTPException(status_code=400, detail="Event is full")
    
    # Check if already registered
    existing = await db.registrations.find_one({"event_id": registration.event_id, "student_email": user['email']}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this event")
    
    # Check participation limit per sub-fest
    sub_fest_registrations = await db.registrations.count_documents({
        "student_email": user['email'],
        "sub_fest": event['sub_fest']
    })
    
    if sub_fest_registrations >= event['max_events_per_student']:
        raise HTTPException(status_code=400, detail=f"Maximum {event['max_events_per_student']} events allowed per sub-fest")
    
    # Handle team events
    team_members = None
    if event['event_type'] == 'team':
        if not registration.team_members:
            raise HTTPException(status_code=400, detail="Team members required for team events")
        
        # Validate team size
        if len(registration.team_members) < event['min_team_size'] or len(registration.team_members) > event['max_team_size']:
            raise HTTPException(status_code=400, detail=f"Team size must be between {event['min_team_size']} and {event['max_team_size']}")
        
        # Check for duplicates
        if len(registration.team_members) != len(set(registration.team_members)):
            raise HTTPException(status_code=400, detail="Duplicate team members not allowed")
        
        team_members = registration.team_members
    
    # Create registration
    reg_dict = {
        "id": f"{user['email']}-{registration.event_id}",
        "event_id": registration.event_id,
        "student_email": user['email'],
        "team_members": team_members,
        "registered_at": datetime.now(timezone.utc).isoformat(),
        "event_name": event['name'],
        "sub_fest": event['sub_fest']
    }
    
    await db.registrations.insert_one(reg_dict)
    await db.events.update_one({"id": registration.event_id}, {"$inc": {"registered_count": 1}})
    
    return RegistrationResponse(**{**reg_dict, 'registered_at': datetime.fromisoformat(reg_dict['registered_at'])})

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
    return registrations

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
@api_router.post("/shortlist/upload")
async def upload_shortlist(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files allowed")
    
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        # Clear existing shortlist
        await db.shortlist.delete_many({})
        
        # Insert new shortlist
        records = df.to_dict('records')
        for record in records:
            record['id'] = f"short-{record.get('roll_number', '')}"
        
        if records:
            await db.shortlist.insert_many(records)
        
        return {"message": f"Uploaded {len(records)} entries", "count": len(records)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@api_router.get("/shortlist")
async def get_shortlist():
    shortlist = await db.shortlist.find({}, {"_id": 0}).to_list(10000)
    return shortlist

# Data export endpoints
@api_router.get("/export/registrations")
async def export_registrations(format: str = Query("csv"), admin: dict = Depends(get_admin_user)):
    # Get all registrations with user details
    registrations = await db.registrations.find({}, {"_id": 0}).to_list(10000)
    
    if not registrations:
        raise HTTPException(status_code=404, detail="No registrations found")
    
    # Enhance with user details
    for reg in registrations:
        user = await db.users.find_one({"email": reg['student_email']}, {"_id": 0})
        if user:
            reg['full_name'] = user.get('full_name')
            reg['roll_number'] = user.get('roll_number')
            reg['department'] = user.get('department')
            reg['year'] = user.get('year')
            reg['mobile_number'] = user.get('mobile_number')
    
    return {"data": registrations, "format": format, "message": "Export data ready"}

# Initialize default admin
@app.on_event("startup")
async def startup_event():
    # Create default admin if not exists
    admin = await db.users.find_one({"email": "admin@utsah.com"}, {"_id": 0})
    if not admin:
        admin_data = {
            "id": "admin@utsah.com",
            "email": "admin@utsah.com",
            "password": hash_password("Admin@123"),
            "full_name": "UTSAH Admin",
            "roll_number": "ADMIN001",
            "department": "Administration",
            "year": 1,
            "mobile_number": "9999999999",
            "role": "admin",
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_data)
        logging.info("Default admin created: admin@utsah.com / Admin@123")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()