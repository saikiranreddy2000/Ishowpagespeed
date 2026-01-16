# Local Development Setup

## Starting the Application Locally

The application consists of two parts:
1. **Backend (Express server)** - Handles API calls to Google services
2. **Frontend (Vite + React)** - User interface

### Prerequisites
- Node.js v20.12.2 or higher
- npm v10.8.0 or higher

### Running Locally

**Terminal 1 - Start Backend Server:**
```bash
npm run server:dev
```
This starts the Express server on `http://localhost:3001`

**Terminal 2 - Start Frontend Development Server:**
```bash
npm run dev
```
This starts the Vite dev server on `http://localhost:5173`

### Accessing the Application
- Frontend: `http://localhost:5173`
- Backend Health Check: `http://localhost:3001/health`

### Environment Variables

The `.env` file contains:
- `PAGESPEED_API_KEY` - Google PageSpeed Insights API key (backend use)
- `CRUX_API_KEY` - Google CrUX Report API key (backend use)
- `VITE_BACKEND_URL` - Backend URL (default: `http://localhost:3001`)

**Important:** Never commit `.env` to GitHub. It's in `.gitignore` for security.

## Testing the Backend APIs

### Test PageSpeed API
```bash
curl -X POST http://localhost:3001/api/pagespeed \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","strategy":"mobile"}'
```

### Test CrUX API
```bash
curl -X POST http://localhost:3001/api/crux \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","formFactor":"PHONE","metrics":["largest_contentful_paint"]}'
```

## Deployment to Render

1. Push code to GitHub (`.env` is excluded by `.gitignore`)
2. Create new Web Service on [render.com](https://render.com)
3. Connect your GitHub repository
4. Set Build Command: `npm install`
5. Set Start Command: `npm run server`
6. Add Environment Variables in Render dashboard:
   - `PAGESPEED_API_KEY`: (your API key)
   - `CRUX_API_KEY`: (your API key)
   - `NODE_ENV`: `production`
7. Deploy and update `VITE_BACKEND_URL` in frontend `.env` to your Render URL

Example Render backend URL: `https://ishowpagespeed-backend.onrender.com`
