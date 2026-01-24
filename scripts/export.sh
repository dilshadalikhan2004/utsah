#!/bin/bash

# UTSAH Project Export Script
# This script packages the entire project for GitHub/download

echo "🎉 UTSAH Project Export Script"
echo "================================"

# Set project name and version
PROJECT_NAME="utsah-fest-management"
VERSION=$(date +%Y%m%d-%H%M%S)
EXPORT_DIR="/tmp/${PROJECT_NAME}-${VERSION}"
ARCHIVE_NAME="${PROJECT_NAME}-${VERSION}.tar.gz"

echo "📦 Creating export directory..."
mkdir -p "$EXPORT_DIR"

echo "📂 Copying project files..."

# Copy backend
echo "  - Copying backend..."
cp -r /app/backend "$EXPORT_DIR/"
rm -f "$EXPORT_DIR/backend/.env"  # Don't include actual .env

# Copy frontend
echo "  - Copying frontend..."
cp -r /app/frontend "$EXPORT_DIR/"
rm -rf "$EXPORT_DIR/frontend/node_modules"  # Don't include node_modules
rm -rf "$EXPORT_DIR/frontend/build"  # Don't include build
rm -f "$EXPORT_DIR/frontend/.env"  # Don't include actual .env

# Copy documentation
echo "  - Copying documentation..."
cp -r /app/docs "$EXPORT_DIR/" 2>/dev/null || mkdir -p "$EXPORT_DIR/docs"

# Copy root files
echo "  - Copying root files..."
cp /app/README.md "$EXPORT_DIR/" 2>/dev/null || echo "README.md not found"
cp /app/LICENSE "$EXPORT_DIR/" 2>/dev/null || echo "LICENSE not found"
cp /app/.gitignore "$EXPORT_DIR/" 2>/dev/null || echo ".gitignore not found"
cp /app/CONTRIBUTING.md "$EXPORT_DIR/" 2>/dev/null || echo "CONTRIBUTING.md not found"

# Create .env.example files if they don't exist
if [ ! -f "$EXPORT_DIR/backend/.env.example" ]; then
  cat > "$EXPORT_DIR/backend/.env.example" << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=utsah_database
CORS_ORIGINS=*
JWT_SECRET=your-secret-key-change-this
EOF
fi

if [ ! -f "$EXPORT_DIR/frontend/.env.example" ]; then
  cat > "$EXPORT_DIR/frontend/.env.example" << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
fi

echo "📝 Creating project structure documentation..."
cat > "$EXPORT_DIR/PROJECT_STRUCTURE.md" << 'EOF'
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

EOF

echo "📦 Creating archive..."
cd /tmp
tar -czf "$ARCHIVE_NAME" "${PROJECT_NAME}-${VERSION}"

echo ""
echo "✅ Export complete!"
echo ""
echo "📍 Location: /tmp/$ARCHIVE_NAME"
echo "📏 Size: $(du -h /tmp/$ARCHIVE_NAME | cut -f1)"
echo ""
echo "To download:"
echo "  1. Use file explorer to navigate to /tmp/"
echo "  2. Download: $ARCHIVE_NAME"
echo ""
echo "To extract:"
echo "  tar -xzf $ARCHIVE_NAME"
echo ""
echo "🚀 Ready for GitHub!"

# List contents
echo ""
echo "📋 Package contents:"
tar -tzf "/tmp/$ARCHIVE_NAME" | head -20
echo "   ... (showing first 20 files)"

echo ""
echo "================================"
echo "✨ Happy Coding!"