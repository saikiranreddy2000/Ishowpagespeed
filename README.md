# iShowPagespeed

A Vite + React app to generate Google PageSpeed reports for up to 30 URLs, export metrics to Excel, and deploy to GitHub Pages.

## Features
- Enter up to 30 URLs
- Generate PageSpeed Insights reports for each URL
- Export all metrics to an Excel file
- Download the Excel file from the webpage
- Ready for deployment to GitHub Pages

## Getting Started

1. Install dependencies:
   ```powershell
   npm install
   ```
2. Start the development server:
   ```powershell
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production
```powershell
npm run build
```

## Deploy to GitHub Pages
1. Install the gh-pages package:
   ```powershell
   npm install --save-dev gh-pages
   ```
2. Add the following to your `package.json`:
   ```json
   "homepage": "https://<your-username>.github.io/<repo-name>"
   ```
3. Add deploy scripts to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
4. Deploy:
   ```powershell
   npm run deploy
   ```

## Notes
- The app uses the public PageSpeed Insights API (no API key required for basic usage).
- For higher quota, you can add your API key in the code.

---
