# API Documentation

## Base URL
```
Development: http://localhost:8001/api
Production: https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new student account.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "roll_number": "2026CS001",
  "department": "Computer Science",
  "year": 2,
  "mobile_number": "9876543210"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "email": "john@example.com",
    "full_name": "John Doe",
    "roll_number": "2026CS001",
    "department": "Computer Science",
    "year": 2,
    "mobile_number": "9876543210",
    "role": "student",
    "verified": true,
    "created_at": "2026-01-24T12:00:00Z"
  }
}
```

### POST /api/auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** Same as register

### GET /api/auth/me
Get current user information.

**Headers:** Requires Authentication

**Response:**
```json
{
  "email": "john@example.com",
  "full_name": "John Doe",
  "roll_number": "2026CS001",
  "department": "Computer Science",
  "year": 2,
  "mobile_number": "9876543210",
  "role": "student",
  "verified": true,
  "created_at": "2026-01-24T12:00:00Z"
}
```

---

## Event Endpoints

### GET /api/events
Get all active events.

**Query Parameters:**
- `sub_fest` (optional): Filter by sub-fest (CULTURAL-AKANKSHA, SPORTS-AHWAAN, TECHNOLOGY-ANWESH)

**Response:**
```json
[
  {
    "id": "cultural-akanksha-classical-dance",
    "name": "Classical Dance Competition",
    "description": "Showcase your classical dance skills",
    "sub_fest": "CULTURAL-AKANKSHA",
    "event_type": "individual",
    "coordinators": ["Dr. Smith", "Prof. Jane"],
    "timing": "10:00 AM - 12:00 PM",
    "venue": "Main Auditorium",
    "registration_deadline": "2026-02-15T23:59:59Z",
    "capacity": 50,
    "registered_count": 25,
    "is_active": true,
    "min_team_size": 1,
    "max_team_size": 1,
    "max_events_per_student": 3,
    "created_at": "2026-01-20T10:00:00Z"
  }
]
```

### GET /api/events/{event_id}
Get specific event details.

**Response:** Single event object (same structure as above)

### POST /api/events
Create a new event (Admin only).

**Headers:** Requires Admin Authentication

**Request Body:**
```json
{
  "name": "Basketball Tournament",
  "description": "5v5 basketball championship",
  "sub_fest": "SPORTS-AHWAAN",
  "event_type": "team",
  "coordinators": ["Coach Mike", "Prof. Johnson"],
  "timing": "2:00 PM - 5:00 PM",
  "venue": "Sports Complex",
  "registration_deadline": "2026-02-20T23:59:59Z",
  "capacity": 100,
  "min_team_size": 5,
  "max_team_size": 7,
  "max_events_per_student": 3
}
```

**Response:** Created event object

### PUT /api/events/{event_id}
Update an event (Admin only).

**Headers:** Requires Admin Authentication

**Request Body:** Same as POST

**Response:** Updated event object

### DELETE /api/events/{event_id}
Disable an event (Admin only).

**Headers:** Requires Admin Authentication

**Response:**
```json
{
  "message": "Event disabled successfully"
}
```

---

## Registration Endpoints

### POST /api/registrations
Register for an event.

**Headers:** Requires Authentication

**For Individual Events:**
```json
{
  "event_id": "cultural-akanksha-classical-dance",
  "team_members": null
}
```

**For Team Events:**
```json
{
  "event_id": "sports-ahwaan-basketball",
  "team_members": [
    {
      "full_name": "John Doe",
      "email": "john@example.com",
      "roll_number": "2026CS001",
      "department": "Computer Science",
      "year": 2,
      "mobile_number": "9876543210"
    },
    {
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "roll_number": "2026CS002",
      "department": "Computer Science",
      "year": 3,
      "mobile_number": "9876543211"
    }
  ]
}
```

**Response:**
```json
{
  "id": "john@example.com-sports-ahwaan-basketball",
  "event_id": "sports-ahwaan-basketball",
  "student_email": "john@example.com",
  "team_members": [...],
  "registered_at": "2026-01-24T14:30:00Z",
  "event_name": "Basketball Tournament",
  "sub_fest": "SPORTS-AHWAAN"
}
```

### GET /api/registrations/my
Get current user's registrations.

**Headers:** Requires Authentication

**Response:** Array of registration objects

### GET /api/registrations
Get all registrations (Admin only).

**Headers:** Requires Admin Authentication

**Response:** Array of all registrations with user details

---

## Notification Endpoints

### GET /api/notifications
Get all notifications.

**Response:**
```json
[
  {
    "id": "notif-1706101234",
    "title": "Registration Opens Tomorrow",
    "message": "Event registrations open at 9 AM",
    "image_url": "https://example.com/image.jpg",
    "created_at": "2026-01-24T10:00:00Z"
  }
]
```

### POST /api/notifications
Create a notification (Admin only).

**Headers:** Requires Admin Authentication

**Request Body:**
```json
{
  "title": "Important Announcement",
  "message": "All participants must report by 9 AM",
  "image_url": "https://example.com/image.jpg"
}
```

**Response:** Created notification object

---

## Gallery Endpoints

### GET /api/gallery
Get gallery images.

**Query Parameters:**
- `sub_fest` (optional): Filter by sub-fest

**Response:**
```json
[
  {
    "id": "img-1706101234",
    "sub_fest": "CULTURAL-AKANKSHA",
    "image_url": "https://example.com/image1.jpg",
    "caption": "Classical Dance Performance",
    "uploaded_at": "2026-01-24T15:00:00Z"
  }
]
```

### POST /api/gallery
Add gallery image (Admin only).

**Headers:** Requires Admin Authentication

**Request Body:**
```json
{
  "sub_fest": "CULTURAL-AKANKSHA",
  "image_url": "https://example.com/image.jpg",
  "caption": "Amazing performance"
}
```

**Response:** Created gallery image object

---

## Shortlist Endpoints

### GET /api/shortlist
Get Aakanksha shortlist.

**Response:**
```json
[
  {
    "id": "short-2026CS001",
    "name": "John Doe",
    "roll_number": "2026CS001",
    "department": "Computer Science",
    "status": "Shortlisted"
  }
]
```

### POST /api/shortlist/upload
Upload shortlist Excel file (Admin only).

**Headers:** 
- Requires Admin Authentication
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: Excel file (.xlsx or .xls)

**Excel Format:**
| name | roll_number | department | status |
|------|-------------|------------|--------|
| John Doe | 2026CS001 | Computer Science | Shortlisted |

**Response:**
```json
{
  "message": "Uploaded 25 entries",
  "count": 25
}
```

---

## Data Export Endpoints

### GET /api/export/registrations
Export registration data (Admin only).

**Headers:** Requires Admin Authentication

**Query Parameters:**
- `format`: csv, excel, or pdf (default: csv)

**Response:**
```json
{
  "data": [...],
  "format": "csv",
  "message": "Export data ready"
}
```

---

## Error Responses

All endpoints may return these error codes:

### 400 Bad Request
```json
{
  "detail": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "detail": "Admin access required"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```