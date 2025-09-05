import { useEffect } from 'react';
import { Routes } from 'react-router-dom';
import { routes, generateRoutes } from './routes/Routes';
import Header from './Header';
import './document.css';

export default function Document() {
  useEffect(() => {
    // Set theme based on user preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  return (
    <div className="document">
      <Header />
      <main className="main-content">
        <Routes>
          {generateRoutes(routes)}
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} iShowPagespeed. All rights reserved.</p>
            <div className="footer-links">
              <a href="https://github.com/saikiranreddy2000/Ishowpagespeed" target="_blank" rel="noopener noreferrer">GitHub</a>
              <span className="separator">|</span>
              <a href="https://pagespeed.web.dev/" target="_blank" rel="noopener noreferrer">PageSpeed Insights</a>
            </div>
          </div>
          <div className="developer-credit">
            Developed with ❤️ by <a href="https://www.linkedin.com/in/devanasaikiranreddy" target="_blank" rel="noopener noreferrer">Saikiranreddy A D</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
