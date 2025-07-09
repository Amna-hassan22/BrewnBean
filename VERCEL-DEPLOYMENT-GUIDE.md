# Vercel Deployment Guide for Brew&Bean

## 🚨 Current Issue & Solution

Your frontend is stuck on loading because it's trying to connect to `localhost:5000` (your local backend) which isn't available in production. Here's how to fix it:

## 📋 Steps to Fix the Loading Issue

### Option 1: Quick Fix (Frontend Only - Demo Mode)

Your frontend will work in "demo mode" without a backend:

1. **Already Fixed**: I've updated your JavaScript files to detect the environment
2. **Deploy Frontend**: Your current frontend should work on Vercel now
3. **Backend**: The frontend will fallback to demo mode if backend is unavailable

### Option 2: Full Production Setup (Recommended)

#### Step 1: Deploy Backend to Vercel

1. **Create a new Vercel project for your backend**:

   ```bash
   cd bnbweb-backend
   npm install
   ```

2. **Create `vercel.json` in your backend folder**:

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/server.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy backend**:

   ```bash
   vercel --prod
   ```

4. **Note your backend URL** (e.g., `https://your-backend-app.vercel.app`)

#### Step 2: Update Frontend Configuration

1. **Update the API URL in your frontend files**:

   - Replace `https://your-backend-app.vercel.app/api` with your actual backend URL
   - Files to update:
     - `js/api-integration.js` (line 18)
     - `js/homepage-auth.js` (line 12)
     - `js/auth-register.js` (line 10)
     - `js/auth-login.js` (line 10)
     - `index.html` (line 846)

2. **Example**: If your backend URL is `https://brewbean-backend.vercel.app`, update:
   ```javascript
   return "https://brewbean-backend.vercel.app/api";
   ```

#### Step 3: Setup MongoDB (Optional)

If you want persistent data:

1. **Create MongoDB Atlas account** (free tier available)
2. **Create a database cluster**
3. **Get connection string**
4. **Add environment variables to Vercel**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/brewbean
   JWT_SECRET=your-jwt-secret
   NODE_ENV=production
   ```

## 🔧 Current File Updates Made

### ✅ Fixed Files:

- `js/api-integration.js` - Dynamic API URL detection
- `js/homepage-auth.js` - Environment-aware API URL
- `js/auth-register.js` - Dynamic API configuration
- `js/auth-login.js` - Environment detection
- `index.html` - Added environment detection script

### 🎯 How It Works Now:

1. **Local Development**: Uses `http://localhost:5000/api`
2. **Production**: Uses `https://your-backend-app.vercel.app/api`
3. **Fallback**: Works in demo mode if backend is unavailable

## 🚀 Quick Test

1. **Test locally**:

   ```bash
   # Start backend
   cd bnbweb-backend
   npm run dev

   # Open frontend with Live Server
   # Should connect to localhost:5000
   ```

2. **Test production**:
   - Deploy to Vercel
   - Check browser console for API URL
   - Should show environment detection

## 📝 Vercel Deployment Commands

### For Frontend (Root folder):

```bash
vercel --prod
```

### For Backend (bnbweb-backend folder):

```bash
cd bnbweb-backend
vercel --prod
```

## 🔍 Debugging Steps

If still having issues:

1. **Check browser console** for API URL
2. **Verify backend is running** (visit backend URL directly)
3. **Check CORS settings** in backend
4. **Verify environment variables** in Vercel dashboard

## 🎯 Next Steps

1. **Deploy backend to Vercel** (recommended)
2. **Update frontend with actual backend URL**
3. **Test all functionality**
4. **Setup MongoDB for persistence** (optional)

## 🆘 Alternative: Demo Mode

If you just want the frontend to work without backend:

- Current setup will work in demo mode
- All JavaScript files have been updated
- Frontend will show loading briefly then work normally

Your frontend should now work on Vercel! The loading issue was caused by trying to connect to localhost in production.
