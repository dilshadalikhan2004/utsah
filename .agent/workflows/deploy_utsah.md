---
description: Guide to deploy the Utsah application to the web
---

# Deployment Guide for UTSAH

This guide will help you deploy your application using **MongoDB Atlas** (Database), **Railway** (Backend), and **Vercel** (Frontend).

---

## 1. Database Setup (MongoDB Atlas)

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up/login.
2.  Create a **New Project**.
3.  Click **Create a Cluster** and select the **Shared (Free)** tier. Select a region near you (e.g., Mumbai for India).
4.  **Database Access**:
    *   Create a database user (e.g., `utsah_admin`) and a secure password. **Save this password**.
5.  **Network Access**:
    *   Click "Add IP Address" -> Select "Allow Access from Anywhere" (`0.0.0.0/0`). This is required for cloud hosting to connect.
6.  **Get Connection String**:
    *   Click **Connect** -> **Drivers**.
    *   Copy the string (e.g., `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`).
    *   Replace `<password>` with your actual password.

---

## 2. Backend Deployment (Railway)

1.  Go to [Railway.app](https://railway.app) and sign up/login.
2.  Click **New Project** -> **Deploy from GitHub repo**.
3.  Connect your GitHub repository (`dilshadalikhan2004/utsah`).
4.  **Settings**:
    *   **Root Directory**: `backend`
    *   **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5.  **Environment Variables**:
    *   `MONGO_URL`: (Paste your MongoDB connection string)
    *   `DB_NAME`: `utsah_database`
    *   `JWT_SECRET`: (Long random string)
    *   `CORS_ORIGINS`: `*` (Update later)
    *   `RESEND_API_KEY`: (Get from resend.com for password reset emails)
    *   `FRONTEND_URL`: `https://utsahfest.in`
6.  **Add Custom Domain** (IMPORTANT for mobile network compatibility):
    *   Go to Settings -> Domains
    *   Add: `api.utsahfest.in`
    *   Add the CNAME record to your domain's DNS
7.  Your backend URL: `https://utsah-production.up.railway.app` or `https://api.utsahfest.in`

---

## 3. Frontend Deployment (Vercel)

1.  Go to [Vercel](https://vercel.com) and sign up/login.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository (`dilshadalikhan2004/utsah`).
4.  **Configure Project**:
    *   **Framework Preset**: Create React App
    *   **Root Directory**: Click "Edit" and select `frontend`.
5.  **Environment Variables**:
    *   `REACT_APP_BACKEND_URL`: `https://api.utsahfest.in` (or Railway URL)
6.  Click **Deploy**.

---

## 4. Custom Domain Setup (REQUIRED for Mobile Networks)

Mobile networks (Jio, Airtel, Vi) have DNS issues with `*.up.railway.app` subdomains. Using a custom domain fixes this.

### For API (`api.utsahfest.in`):
1.  In Railway: Settings -> Domains -> Add `api.utsahfest.in`
2.  In your domain registrar, add:
    *   Type: `CNAME`
    *   Name: `api`
    *   Value: `utsah-production.up.railway.app`

### Update Frontend:
1.  In Vercel, update `REACT_APP_BACKEND_URL` to `https://api.utsahfest.in`
2.  Redeploy

---

## 5. Password Reset Email Setup (Resend)

1.  Go to [resend.com](https://resend.com) and create account
2.  Add your domain `utsahfest.in` and verify DNS
3.  Get API key
4.  Add to Railway environment: `RESEND_API_KEY=re_xxxxxxx`

---

**🎉 Done! Your app is now live and works on all networks.**

