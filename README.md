# UTSAH - College Fest Management System 🎉

<div align="center">
  <h3>A comprehensive web-based platform for managing college fest operations</h3>
  <p>Built for GITA Autonomous College, Bhubaneswar</p>
  
  ![UTSAH Banner](https://img.shields.io/badge/UTSAH-2026-purple?style=for-the-badge)
  ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
</div>

## 🌟 Features

### For Students
- 🎭 **Event Registration**: Register for individual and team-based events
- 👥 **Team Management**: Complete team member details (Name, Roll, Department, Year, Mobile)
- 📋 **My Registrations**: Track all registered events in one place
- 🔔 **Notifications**: Stay updated with fest announcements
- 🖼️ **Gallery**: Browse fest memories by sub-fest
- 🏆 **Shortlist View**: Check Aakanksha audition results

### For Admins
- ⚡ **Event Management**: Create, edit, and manage events with ease
- 📊 **Registration Analytics**: View detailed team/individual registrations
- 📢 **Notifications**: Publish announcements to all students
- 📤 **Data Export**: Download registrations in CSV/Excel/PDF
- 📋 **Shortlist Management**: Upload and manage Aakanksha shortlist
- 👀 **Team Viewer**: See complete details of all team members

## 🎨 Sub-Fests

1. **CULTURAL - AKANKSHA** (Purple/Pink) 🎭
2. **SPORTS - AHWAAN** (Orange/Yellow) 🏆
3. **TECHNOLOGY - ANWESH** (Cyan/Green) 💻

## 🚀 Tech Stack

### Backend
- **Framework**: FastAPI 0.110.1
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Processing**: pandas, openpyxl for Excel handling
- **PDF Generation**: ReportLab

### Frontend
- **Framework**: React 19 with React Router DOM
- **Styling**: Tailwind CSS with custom dark theme
- **UI Components**: Radix UI (Shadcn)
- **Animations**: Framer Motion
- **Smooth Scroll**: Lenis
- **Notifications**: Sonner (toast notifications)
- **Fonts**: Unbounded (headings), Space Grotesk (body)

## 📋 Prerequisites

- **Node.js**: v18+ and yarn
- **Python**: 3.11+
- **MongoDB**: 4.5+
- **Git**: For version control

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/utsah-fest-management.git
cd utsah-fest-management
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see .env.example)
cp .env.example .env
# Edit .env with your MongoDB connection string
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Create .env file (see .env.example)
cp .env.example .env
# Edit .env with your backend URL
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

Access the application at `http://localhost:3000`

## 🔐 Default Credentials

### Admin Account
- **Email**: admin@utsah.com
- **Password**: Admin@123

### Test Student
- Register a new student account through `/register`

## 📁 Project Structure

```
utsah-fest-management/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── frontend/
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/ui/    # Shadcn UI components
│   │   ├── context/          # React context (Auth)
│   │   ├── pages/            # Page components
│   │   ├── App.js            # Main app component
│   │   ├── App.css           # Global styles
│   │   └── index.css         # Tailwind config
│   ├── package.json          # Node dependencies
│   └── .env                  # Environment variables
├── docs/                     # Documentation
├── tests/                    # Test files
└── README.md                 # This file
```

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=utsah_database
CORS_ORIGINS=*
JWT_SECRET=your-secret-key-here
```

### Frontend Environment Variables (.env)

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Events
- `GET /api/events` - List all events
- `GET /api/events/{event_id}` - Get event details
- `POST /api/events` - Create event (Admin)
- `PUT /api/events/{event_id}` - Update event (Admin)
- `DELETE /api/events/{event_id}` - Disable event (Admin)

#### Registrations
- `POST /api/registrations` - Register for event
- `GET /api/registrations/my` - Get user's registrations
- `GET /api/registrations` - Get all registrations (Admin)

#### Notifications
- `GET /api/notifications` - List all notifications
- `POST /api/notifications` - Create notification (Admin)

#### Gallery
- `GET /api/gallery` - Get gallery images
- `POST /api/gallery` - Add image (Admin)

#### Shortlist
- `GET /api/shortlist` - View Aakanksha shortlist
- `POST /api/shortlist/upload` - Upload shortlist Excel (Admin)

## 🎨 Design System

### Theme: Electric Night
- **Background**: #030712 (Deep black)
- **Accent Colors**:
  - Cultural: #d946ef (Purple/Pink)
  - Sports: #f97316 (Orange)
  - Tech: #06b6d4 (Cyan)

### Typography
- **Headings**: Unbounded (Bold, Black)
- **Body**: Space Grotesk (Light, Regular, Medium)
- **Monospace**: JetBrains Mono

### Key Design Elements
- Glassmorphism effects
- Smooth scroll (Lenis)
- Framer Motion animations
- Neon glow effects
- Grain texture overlay

## 📦 Deployment

### Backend (FastAPI)

**Option 1: Docker**
```bash
cd backend
docker build -t utsah-backend .
docker run -p 8001:8001 utsah-backend
```

**Option 2: Cloud Platforms**
- Heroku
- Railway
- Render
- AWS EC2

### Frontend (React)

**Build for Production:**
```bash
cd frontend
yarn build
```

**Deploy to:**
- Vercel (Recommended)
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

### Database (MongoDB)

**Options:**
- MongoDB Atlas (Cloud)
- Self-hosted MongoDB
- Docker container

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based access control (Student/Admin)
- ✅ Input validation with Pydantic
- ✅ CORS configuration
- ✅ SQL injection prevention (NoSQL)
- ✅ XSS protection

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- GITA Autonomous College for the opportunity
- All contributors and testers
- Open source community

## 📞 Support

For issues and questions:
- 📧 Email: support@utsah.gita.edu.in
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/utsah-fest-management/issues)

## 🗺️ Roadmap

- [ ] WhatsApp notifications integration
- [ ] QR code for event check-ins
- [ ] Live event updates
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Certificate generation

---

<div align="center">
  <p>Made with ❤️ for UTSAH 2026</p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>