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
   - **Start Command**: npm start
7. Add these environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_ACCESS_SECRET`: Generate a secure secret
   - `JWT_REFRESH_SECRET`: Generate a different secure secret
   - `CLIENT_ORIGIN`: https://kit-librarian.onrender.com (update after frontend deployment)
   - `PORT`: 10000
8. Click **Create Web Service**

## Frontend Deployment

1. In Render Dashboard, click **New +** and select **Static Site**
2. Connect your GitHub repository
3. Configure the build:
   - **Name**: kit-librarian
   - **Build Command**: cd frontend && npm install && npm run build
   - **Publish Directory**: frontend/build
4. Add environment variable:
   - `REACT_APP_API_URL`: Your backend URL (e.g., https://kit-librarian-backend.onrender.com)
5. Click **Create Static Site**

## Environment Variables Reference

### Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_ORIGIN=https://kit-librarian.onrender.com
PORT=10000
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://kit-librarian-backend.onrender.com
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

## Post-Deployment

1. Update the `CLIENT_ORIGIN` in your backend environment variables with your actual frontend URL
2. Test all API endpoints to ensure they're working correctly
3. Set up a custom domain (optional) in the Render dashboard

## Troubleshooting

- If you get CORS errors, double-check your `CLIENT_ORIGIN` and CORS settings
- Check the logs in the Render dashboard for any deployment errors
- Ensure your MongoDB Atlas IP whitelist includes Render's IP addresses
- For database connection issues, verify your MongoDB connection string and network access settings
