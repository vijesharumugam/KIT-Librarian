# Kit Librarian - Deployment Guide

This guide will walk you through deploying the Kit Librarian application to Render.

## Prerequisites

- [GitHub](https://github.com/) account
- [Render](https://render.com/) account
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account

## Backend Deployment

1. **Fork and clone** this repository
2. **Push to your GitHub** repository
3. Go to [Render Dashboard](https://dashboard.render.com/)
4. Click **New +** and select **Web Service**
5. Connect your GitHub repository
6. Configure the service:
   - **Name**: kit-librarian-backend
   - **Region**: Choose the closest to your users
   - **Branch**: main
   - **Build Command**: npm install
   - **Start Command**: cd backend && npm start
7. Add these environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (Render does not host MongoDB)
   - `JWT_ACCESS_SECRET`: Generate a secure secret
   - `JWT_REFRESH_SECRET`: Generate a different secure secret
   - `CLIENT_ORIGIN`: https://kit-librarian.onrender.com (update after frontend deployment)
   - `PORT`: 10000
   - `NODE_ENV`: production
8. Click **Create Web Service**

## Frontend Deployment

1. In Render Dashboard, click **New +** and select **Static Site**
2. Connect your GitHub repository
3. Configure the build:
   - **Name**: kit-librarian
   - **Build Command**: cd frontend && npm install && npm run build
   - **Publish Directory**: frontend/build
4. Add environment variables:
   - `REACT_APP_API_URL`: Your backend URL (e.g., https://kit-librarian-backend.onrender.com)
   - `NODE_ENV`: production
   - `GENERATE_SOURCEMAP`: false
5. Click **Create Static Site**

## Blueprint (render.yaml) Option

This repo includes a `render.yaml` that defines both services:
- A Node web service for the backend in `backend/`
- A static site for the frontend in `frontend/`

Steps:
1. Commit/push the updated `render.yaml`.
2. In Render, click **New +** → **Blueprint** → select your repo.
3. After creation, set these env vars in the dashboard (marked `sync: false` in YAML):
   - Backend: `MONGODB_URI`, `CLIENT_ORIGIN` (update to your frontend URL after it deploys)
   - Frontend: `REACT_APP_API_URL` (the backend URL)
4. Redeploy as needed.

## Environment Variables Reference

### Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_ORIGIN=https://your-frontend.onrender.com
PORT=10000
NODE_ENV=production
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend.onrender.com
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

## Post-Deployment

1. Update the `CLIENT_ORIGIN` in your backend environment variables with your actual frontend URL
2. Confirm CORS: backend `allowedOrigins` in `backend/server.js` uses `CLIENT_ORIGIN`. It must match exactly.
3. Test all API endpoints and UI flows
4. Set up a custom domain (optional) in the Render dashboard

## Troubleshooting

- If you get CORS errors, double-check your `CLIENT_ORIGIN` and frontend `REACT_APP_API_URL`
- Check the logs in the Render dashboard for any deployment errors
- Ensure your MongoDB Atlas network access allows connections from Render (for quick testing, 0.0.0.0/0)
- For Atlas SRV connection issues, the backend converts `mongodb+srv://` to a seedlist via DoH; ensure `MONGODB_URI` is correct
