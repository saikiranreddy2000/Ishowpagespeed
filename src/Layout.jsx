import Header from './Header';
import './layout.css';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
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
