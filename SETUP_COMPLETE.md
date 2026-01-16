# Setup Complete - Separate Backend Repository

## What Was Done

Your project is now split into **two separate repositories**:

### 1. Frontend Repository: `iShowPagespeed` (current)
- ✅ Updated `ReportGenerator.jsx` to use backend API endpoints
- ✅ Removed hardcoded Google API keys
- ✅ Configured to call backend at `BACKEND_URL`
- ✅ Ready for GitHub Pages deployment
- ✅ Updated `.env` and `.env.example` for frontend only

**Files to keep:**
- `src/ReportGenerator.jsx` (updated)
- `package.json` (frontend deps only)
- `.env` (with `VITE_BACKEND_URL` only)
- Other frontend files

**⚠️ Manual cleanup needed:**
- Delete `server.js` from the frontend repo

### 2. Backend Repository: `iShowPagespeed-backend` (NEW - separate folder)
Located at: `c:\iShowPagespeed-backend`

**Files created:**
- ✅ `server.js` - Express API server
- ✅ `package.json` - Backend dependencies only
- ✅ `.env` - API keys for backend
- ✅ `.env.example` - Template
- ✅ `.gitignore` - Protects `.env`
- ✅ `README.md` - Comprehensive backend guide

---

## Next Steps

### Step 1: Clean Up Frontend Repository

```bash
cd c:\iShowPagespeed

# Remove server.js (it's now in backend repo)
rm server.js
# or on Windows PowerShell:
Remove-Item server.js -Force

# Verify package.json only has frontend deps
# (should NOT have: express, cors, dotenv)

git add .
git commit -m "Move backend to separate repository"
git push
```

### Step 2: Initialize Backend Repository

```bash
cd c:\iShowPagespeed-backend

# Install dependencies
npm install

# Test locally
npm start
```

Backend should run on `http://localhost:3001`

### Step 3: Deploy Backend to Render

1. Create a new GitHub repository: `iShowPagespeed-backend`
2. Push the backend code:
   ```bash
   cd c:\iShowPagespeed-backend
   git init
   git add .
   git commit -m "Initial backend setup"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/iShowPagespeed-backend.git
   git push -u origin main
   ```

3. Follow the deployment guide in `iShowPagespeed-backend/README.md`:
   - Create Render Web Service
   - Add environment variables
   - Deploy

### Step 4: Update Frontend with Backend URL

Once backend is deployed to Render:

```bash
cd c:\iShowPagespeed

# Update .env with deployed backend URL
# VITE_BACKEND_URL=https://ishowpagespeed-backend.onrender.com

npm run build
npm run deploy
```

---

## Repository Structure

```
c:\
├── iShowPagespeed/                  (Frontend - GitHub Pages)
│   ├── src/
│   │   ├── ReportGenerator.jsx      (Uses BACKEND_URL)
│   │   └── ...
│   ├── package.json                 (Frontend deps)
│   ├── .env                         (VITE_BACKEND_URL)
│   ├── .gitignore
│   ├── DEPLOYMENT.md
│   └── ...
│
└── iShowPagespeed-backend/          (Backend - Render)
    ├── server.js                    (Express API)
    ├── package.json                 (Backend deps)
    ├── .env                         (API keys)
    ├── .env.example
    ├── .gitignore
    ├── README.md
    └── ...
```

---

## Deployment Architecture

```
User Browser
    ↓
GitHub Pages
(iShowPagespeed frontend)
    ↓
Render Backend
(iShowPagespeed-backend)
    ↓
Google APIs
(PageSpeed, CrUX)
```

---

## Security Summary

✅ API keys are **stored ONLY in backend** environment variables  
✅ API keys are **NOT in frontend code or GitHub**  
✅ Frontend safely calls backend without exposing keys  
✅ `.env` files are gitignored in both repos  
✅ Each repo is independently deployable  

---

## Local Development

**Terminal 1 - Backend:**
```bash
cd c:\iShowPagespeed-backend
npm install
npm start
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd c:\iShowPagespeed
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Important Files

### Frontend Only
- `c:\iShowPagespeed\src\ReportGenerator.jsx` - Uses `BACKEND_URL`
- `c:\iShowPagespeed\package.json` - Frontend deps
- `c:\iShowPagespeed\.env` - `VITE_BACKEND_URL` only
- `c:\iShowPagespeed\DEPLOYMENT.md` - Frontend deployment guide

### Backend Only
- `c:\iShowPagespeed-backend\server.js` - Express server
- `c:\iShowPagespeed-backend\package.json` - Backend deps
- `c:\iShowPagespeed-backend\.env` - API keys
- `c:\iShowPagespeed-backend\README.md` - Backend deployment guide

---

## Troubleshooting

### "Cannot find module 'express'" in frontend
- ✅ This is expected! Express should NOT be in frontend
- `npm install` in frontend should only install React dependencies
- Check `package.json` doesn't list express, cors, dotenv

### Backend won't start
- Make sure you're in `c:\iShowPagespeed-backend` directory
- Run `npm install` first
- Check `.env` has API keys
- Verify Node.js is installed: `node --version`

### Frontend can't connect to backend
- Verify backend is running on port 3001
- Check `VITE_BACKEND_URL` in frontend `.env`
- Verify frontend is calling correct backend URL
- Check browser console for CORS/network errors

### Deployed backend shows 500 errors
- Check Render logs for the backend service
- Verify environment variables in Render dashboard
- Confirm API keys are valid

---

## Checklist

- [ ] Frontend: `server.js` deleted
- [ ] Frontend: `package.json` has no express/cors/dotenv
- [ ] Frontend: `npm install` runs successfully
- [ ] Backend: `npm install` runs successfully in backend folder
- [ ] Backend: `npm start` runs on port 3001
- [ ] Backend: Test `/health` endpoint works
- [ ] Frontend: `VITE_BACKEND_URL` points to backend
- [ ] Backend: Deployed to Render
- [ ] Backend: Environment variables set in Render
- [ ] Frontend: `npm run deploy` successful
- [ ] Both: Verify app works end-to-end

---

## Questions?

Refer to:
- Frontend: `c:\iShowPagespeed\DEPLOYMENT.md`
- Backend: `c:\iShowPagespeed-backend\README.md`
