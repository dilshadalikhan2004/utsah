---
description: Guide to deploy the Utsah application to the web
---

# Deployment Guide for UTSAH (MERN-like Stack)

This guide will help you deploy your application for free using **MongoDB Atlas** (Database), **Render** (Backend), and **Vercel** (Frontend).

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

## 2. Backend Deployment (Render)

1.  Go to [Render.com](https://render.com) and sign up/login.
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository (`dilshadalikhan2004/utsah`).
4.  **Settings**:
    *   **Name**: `utsah-backend`
    *   **Region**: Singapore or Frankfurt (closest to India).
    *   **Root Directory**: `backend`
    *   **Runtime**: Python 3
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5.  **Environment Variables** (Advanced):
    *   Add the following variables:
        *   `MONGO_URL`: (Paste your MongoDB connection string from Step 1).
        *   `DB_NAME`: `utsah2026`
        *   `JWT_SECRET`: (Enter a long random string for security).
        *   `CORS_ORIGINS`: `*` (Temporarily allow all, update to your Vercel URL later).
6.  Click **Create Web Service**.
7.  Wait for deployment to finish. Copy your backend URL (e.g., `https://utsah-backend.onrender.com`).

---

## 3. Frontend Deployment (Vercel)

1.  Go to [Vercel](https://vercel.com) and sign up/login.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository (`dilshadalikhan2004/utsah`).
4.  **Configure Project**:
    *   **Framework Preset**: Create React App
    *   **Root Directory**: Click "Edit" and select `frontend`.
5.  **Environment Variables**:
    *   Add variable: `REACT_APP_BACKEND_URL`
    *   Value: Your Render Backend URL **without the trailing slash** (e.g., `https://utsah-backend.onrender.com`).
6.  Click **Deploy**.
7.  Wait for the build to complete. You now have your live frontend URL (e.g., `https://utsah-frontend.vercel.app`).

---

## 4. Final Security Step

1.  Go back to **Render** Dashboard -> **Environment**.
2.  Edit `CORS_ORIGINS`.
3.  Change it from `*` to your actual Vercel URL (e.g., `https://utsah-frontend.vercel.app`).
4.  **Save Changes** (this will trigger a redeploy).

**🎉 Done! Your app is now live.**
