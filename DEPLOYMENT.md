# Deployment Guide

## Architecture Overview

**iShowPagespeed** consists of **two separate repositories**:

1. **Frontend** (this repo) → Deployed to **GitHub Pages**
2. **Backend** (separate repo) → Deployed to **Render**

```
GitHub Pages (Frontend)
      ↓
      → Render Backend
          ↓
          → Google APIs (PageSpeed, CrUX)
```

This separation ensures:
- ✅ API keys are **never exposed** in the frontend
- ✅ Independent scaling and deployment
- ✅ Clean separation of concerns

---

## Backend Setup (First Time Only)

**⚠️ IMPORTANT**: Set up the backend first before deploying the frontend!

The backend repository is separate: `iShowPagespeed-backend`

### Option A: Clone Existing Backend Repo
```bash
git clone https://github.com/YOUR_USERNAME/iShowPagespeed-backend.git
cd iShowPagespeed-backend
npm install
```

### Option B: Create New Backend Repo
Follow the detailed guide in the `iShowPagespeed-backend` repository's README.md

---

## Frontend Deployment to GitHub Pages

### Prerequisites
- Backend deployed to Render (see Backend README)
- Backend URL: `https://ishowpagespeed-backend.onrender.com`

### Step 1: Update Frontend Configuration

Update `.env`:
```
VITE_BACKEND_URL=https://ishowpagespeed-backend.onrender.com
```

### Step 2: Build and Deploy

```bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

Your app will be live at: `https://saikiranreddy2000.github.io/Ishowpagespeed`

---

## Local Development

### Terminal 1: Start Backend Server
```bash
cd ../iShowPagespeed-backend
npm install
npm start
```
Backend runs on: `http://localhost:3001`

### Terminal 2: Start Frontend
```bash
cd iShowPagespeed
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

Visit `http://localhost:5173` to test locally.

---

## Troubleshooting

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:3001/health`
- Check `VITE_BACKEND_URL` in `.env` matches backend address
- Check browser console for CORS errors

### Deployed backend showing 500 errors
- Check Render logs: Render dashboard → Backend service → Logs
- Verify environment variables in Render: `PAGESPEED_API_KEY`, `CRUX_API_KEY`
- Verify API keys are valid

### GitHub Pages shows old version
- Clear browser cache (Ctrl+Shift+Delete)
- Wait 5 minutes for GitHub Pages to refresh
- Try `npm run deploy` again

### Cold start delays
- Expected on Render free tier after 15 minutes inactivity
- First request after inactivity: 10-15 seconds
- Upgrade to paid tier if unacceptable

---

## Backend Deployment

For detailed backend deployment instructions, see:
📖 [`iShowPagespeed-backend/README.md`](../iShowPagespeed-backend/README.md)

Quick summary:
1. Push backend repo to GitHub
2. Create Render Web Service
3. Add environment variables (`PAGESPEED_API_KEY`, `CRUX_API_KEY`)
4. Deploy

---

## Security Checklist

- ✅ API keys NOT in frontend code
- ✅ API keys stored in `.env` (gitignored)
- ✅ Backend handles all API calls
- ✅ `VITE_BACKEND_URL` points to deployed backend
- ✅ No API keys in GitHub repo

---

## File Structure

```
iShowPagespeed/                     (Frontend repo)
├── src/
│   ├── ReportGenerator.jsx         (Uses BACKEND_URL)
│   └── ...
├── .env                            (VITE_BACKEND_URL only)
├── .env.example                    (Template)
├── package.json                    (Frontend deps only)
└── DEPLOYMENT.md                   (This file)

iShowPagespeed-backend/             (Backend repo - separate)
├── server.js                       (Express API)
├── package.json                    (Backend deps only)
├── .env                            (API keys - gitignored)
├── .env.example                    (Template)
└── README.md                       (Backend deployment guide)
```

---

## Next Steps

1. ✅ Ensure backend is deployed to Render
2. ✅ Update `VITE_BACKEND_URL` in frontend `.env`
3. ✅ Run `npm run build && npm run deploy`
4. ✅ Test at `https://saikiranreddy2000.github.io/Ishowpagespeed`

Done! Your application is secure and deployed! 🚀
