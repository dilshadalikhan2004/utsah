from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Query, Response
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
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import openpyxl

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

# Create the main app without a prefix
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    # allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_origin_regex="https?://.*", # Allow all http/https origins safely
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
    coordinators: List[str] = []
    timing: str = "TBD"
    venue: str = "TBD"
    registration_deadline: datetime
    capacity: int = 100
    registered_count: int = 0
    is_active: bool = True
    min_team_size: int = 1
    max_team_size: int = 1
    max_events_per_student: int = 3
    created_at: Optional[datetime] = None


class TeamMember(BaseModel):
    full_name: str
    email: EmailStr
    roll_number: str
    department: str
    year: int
    mobile_number: str

class EventRegistration(BaseModel):
    event_id: str
    team_members: Optional[List[TeamMember]] = None  # For team events, includes leader

class RegistrationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    event_id: str
    student_email: EmailStr
    team_members: Optional[List[Dict[str, Any]]] = None
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

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    mobile_number: Optional[str] = None
    roll_number: Optional[str] = None

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

@api_router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, updates: EventUpdate, admin: dict = Depends(get_admin_user)):
    # Prepare update data
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    if not update_data:
         raise HTTPException(status_code=400, detail="No updates provided")

    if 'registration_deadline' in update_data:
        update_data['registration_deadline'] = update_data['registration_deadline'].isoformat()
        
    result = await db.events.update_one({"id": event_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
        
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
    SUB_FEST_LIMITS = {
        "TECHNOLOGY-ANWESH": 3,
        "CULTURAL-AKANKSHA": 2,
        "SPORTS-AHWAAN": 4
    }
    
    limit = SUB_FEST_LIMITS.get(event['sub_fest'], 3) # Default to 3 if unknown
    
    sub_fest_registrations = await db.registrations.count_documents({
        "student_email": user['email'],
        "sub_fest": event['sub_fest']
    })
    
    if sub_fest_registrations >= limit:
        raise HTTPException(status_code=400, detail=f"Maximum {limit} events allowed for {event['sub_fest'].split('-')[1]}")
    
    # Handle team events
    team_members = None
    if event['event_type'] == 'team':
        if not registration.team_members:
            raise HTTPException(status_code=400, detail="Team members required for team events")
        
        # Validate team size
        if len(registration.team_members) < event['min_team_size'] or len(registration.team_members) > event['max_team_size']:
            raise HTTPException(status_code=400, detail=f"Team size must be between {event['min_team_size']} and {event['max_team_size']}")
        
        # Check for duplicate emails
        emails = [member.email for member in registration.team_members]
        if len(emails) != len(set(emails)):
            raise HTTPException(status_code=400, detail="Duplicate team member emails not allowed")
        
        # Convert team members to dict for storage
        team_members = [member.model_dump() for member in registration.team_members]
        
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
    return registrations

@api_router.get("/registrations/export")
async def export_registrations(event_id: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {}
    if event_id:
        query["event_id"] = event_id
        
    registrations = await db.registrations.find(query, {"_id": 0}).to_list(10000)
    
    if not registrations:
        return Response(content="No registrations found", media_type="text/csv")

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    headers = ["Registration ID", "Event", "Sub-Fest", "Date", "Full Name", "Roll No", "Dept", "Year", "Mobile", "Email", "Team Members"]
    writer.writerow(headers)
    
    for reg in registrations:
        # Enrichment
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
                
        team_str = ""
        if reg.get('team_members'):
            team_str = "; ".join([f"{m['full_name']} ({m['roll_number']})" for m in reg['team_members']])
            
        writer.writerow([
            reg.get('id', ''),
            reg.get('event_name', ''),
            reg.get('sub_fest', ''),
            reg.get('registered_at', ''),
            reg.get('full_name', ''),
            reg.get('roll_number', ''),
            reg.get('department', ''),
            reg.get('year', ''),
            reg.get('mobile_number', ''),
            reg.get('student_email', ''),
            team_str
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
    
    # Auto-seed Anwesh Events
    try:
        from anwesh_data import EVENTS
        for event_data in EVENTS:
            event_id = f"{event_data['sub_fest']}-{event_data['name']}".replace(" ", "-").lower()
            existing_event = await db.events.find_one({"id": event_id})
            if not existing_event:
                event_dict = event_data.copy()
                event_dict['id'] = event_id
                event_dict['registered_count'] = 0
                event_dict['is_active'] = True
                event_dict['created_at'] = datetime.now(timezone.utc).isoformat()
                event_dict['max_events_per_student'] = 3
                await db.events.insert_one(event_dict)
                logging.info(f"Seeded event: {event_data['name']}")
    except Exception as e:
        logging.error(f"Error seeding events: {e}")

    # Auto-seed Akanksha Events
    try:
        from akanksha_data import EVENTS as AKANKSHA_EVENTS
        for event_data in AKANKSHA_EVENTS:
            event_id = f"{event_data['sub_fest']}-{event_data['name']}".replace(" ", "-").lower()
            existing_event = await db.events.find_one({"id": event_id})
            if not existing_event:
                event_dict = event_data.copy()
                event_dict['id'] = event_id
                event_dict['registered_count'] = 0
                event_dict['is_active'] = True
                event_dict['created_at'] = datetime.now(timezone.utc).isoformat()
                event_dict['max_events_per_student'] = 2
                # Ensure date fields are isoformatted
                if isinstance(event_dict['registration_deadline'], str) and 'T' not in event_dict['registration_deadline']:
                     # Parse simple date strings if needed or just trust the seed file is ISO
                     pass

                await db.events.insert_one(event_dict)
                logging.info(f"Seeded event: {event_data['name']}")
    except Exception as e:
        logging.error(f"Error seeding Akanksha events: {e}")

# System Data Endpoints
class CoordinatorInfo(BaseModel):
    event: str
    faculty: List[Dict[str, str]]
    students: List[Dict[str, str]]

class ScheduleItem(BaseModel):
    date: str
    time: str
    venue: str
    event: str
    faculty_in_charge: Optional[str] = None

class SystemData(BaseModel):
    rules: List[str]
    additional_rules: List[str]
    schedule: List[ScheduleItem]
    coordinators: List[CoordinatorInfo]

@api_router.get("/system/coordinators", response_model=SystemData)
async def get_coordinator_data():
    data = await db.system.find_one({"type": "coordinator_data"}, {"_id": 0})
    if not data:
        # Default/Seed Data
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

# Include the router in the main app
app.include_router(api_router)



# Configure logging


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()