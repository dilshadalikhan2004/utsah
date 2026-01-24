# Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- Domain name (optional but recommended)
- MongoDB Atlas account or self-hosted MongoDB
- Cloud platform account (Vercel/Netlify for frontend, Render/Railway for backend)

---

## Backend Deployment

### Option 1: Render (Recommended)

1. **Create account** at [render.com](https://render.com)

2. **Create Web Service**
   - Connect your GitHub repository
   - Select `backend` directory
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**
   ```
   MONGO_URL=your_mongodb_atlas_connection_string
   DB_NAME=utsah_database
   CORS_ORIGINS=https://your-frontend-domain.com
   JWT_SECRET=generate-strong-secret-key
   ```

4. **Deploy** and note the URL

### Option 2: Railway

1. **Create project** at [railway.app](https://railway.app)

2. **Deploy from GitHub**
   - Select repository and `backend` folder
   - Railway auto-detects FastAPI

3. **Add Environment Variables**
   - Same as above

### Option 3: Docker

**Create Dockerfile in `/backend`:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Build and run:**
```bash
docker build -t utsah-backend .
docker run -p 8001:8001 --env-file .env utsah-backend
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend**
   ```bash
   cd frontend
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables** in Vercel dashboard:
   ```
   REACT_APP_BACKEND_URL=https://your-backend-url.com
   ```

5. **Production deployment**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Build the project**
   ```bash
   cd frontend
   yarn build
   ```

2. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=build
   ```

4. **Set Environment Variables** in Netlify dashboard

### Option 3: AWS S3 + CloudFront

1. **Build**
   ```bash
   cd frontend
   yarn build
   ```

2. **Create S3 bucket**
   - Enable static website hosting
   - Upload `build` folder

3. **Create CloudFront distribution**
   - Point to S3 bucket
   - Configure SSL certificate

---

## Database Deployment

### MongoDB Atlas (Recommended)

1. **Create account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create cluster**
   - Free tier (M0) available
   - Choose region close to your backend

3. **Create database user**
   - Username and password
   - Note credentials

4. **Whitelist IP addresses**
   - Add `0.0.0.0/0` for development
   - Restrict in production

5. **Get connection string**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/utsah_database
   ```

6. **Add to backend environment variables**

---

## Environment Variables Summary

### Backend (.env)
```env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname
DB_NAME=utsah_database
CORS_ORIGINS=https://utsah-frontend.vercel.app
JWT_SECRET=super-secret-key-min-32-characters
```

### Frontend (.env.production)
```env
REACT_APP_BACKEND_URL=https://utsah-backend.render.com
```

---

## Post-Deployment Checklist

### Security
- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication

### Performance
- [ ] Enable CDN for frontend
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Enable gzip compression
- [ ] Set up monitoring

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Database backup schedule

---

## Custom Domain Setup

### Frontend (Vercel)
1. Go to project settings
2. Add custom domain
3. Update DNS records as shown
4. Wait for SSL certificate

### Backend (Render)
1. Go to web service settings
2. Add custom domain
3. Update CNAME record
4. Enable automatic SSL

---

## CI/CD Setup

### GitHub Actions

**Create `.github/workflows/deploy.yml`:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
render logs

# Verify environment variables
printenv | grep MONGO

# Test locally with production env
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend can't connect to backend
- Verify `REACT_APP_BACKEND_URL` is correct
- Check CORS settings in backend
- Ensure backend is running
- Test API directly with curl

### Database connection errors
- Verify connection string
- Check IP whitelist
- Ensure database user has permissions
- Test connection with MongoDB Compass

---

## Scaling

### Backend
- Use managed services (Render, Railway) for auto-scaling
- Add Redis for caching
- Implement connection pooling
- Use load balancer for multiple instances

### Frontend
- CDN automatically scales
- Optimize bundle size
- Implement lazy loading
- Use service workers for offline support

### Database
- Upgrade MongoDB Atlas tier
- Enable sharding for large datasets
- Implement read replicas
- Regular backups

---

## Maintenance

### Regular Tasks
- Monitor error logs weekly
- Update dependencies monthly
- Review database performance
- Check disk space
- Rotate JWT secrets quarterly

### Backups
- Automated database backups daily
- Export data weekly
- Test restore procedures monthly

---

## Support

For deployment issues:
- Check deployment platform docs
- Review error logs
- Contact support@utsah.gita.edu.in