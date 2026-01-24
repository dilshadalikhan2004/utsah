# Project Structure

## Directory Overview

```
utsah-fest-management/
├── backend/                   # FastAPI Backend
│   ├── server.py             # Main application
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment template
│   └── .env                  # Your environment (not in git)
│
├── frontend/                  # React Frontend
│   ├── public/               # Static files
│   ├── src/
│   │   ├── components/ui/    # UI components
│   │   ├── context/          # React context
│   │   ├── pages/            # Page components
│   │   ├── App.js            # Main app
│   │   ├── App.css           # Global styles
│   │   └── index.css         # Tailwind config
│   ├── package.json          # Dependencies
│   ├── .env.example          # Environment template
│   └── .env                  # Your environment (not in git)
│
├── docs/                      # Documentation
│   ├── API.md                # API documentation
│   └── DEPLOYMENT.md         # Deployment guide
│
├── README.md                  # Main documentation
├── LICENSE                    # MIT License
├── .gitignore                # Git ignore rules
└── CONTRIBUTING.md            # Contribution guidelines
```

## Key Files

### Backend
- `server.py` - FastAPI app with all endpoints
- `requirements.txt` - Python dependencies

### Frontend
- `src/App.js` - Main React component with routing
- `src/context/AuthContext.js` - Authentication context
- `src/pages/` - All page components
- `src/components/ui/` - Shadcn UI components

## Getting Started

1. See [README.md](README.md) for installation
2. See [docs/API.md](docs/API.md) for API reference
3. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment

