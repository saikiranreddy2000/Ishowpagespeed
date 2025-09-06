import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import { BASE_PATH } from './routes/Routes.jsx';

const MENU_ITEMS = [
  { label: 'Home', to: `${BASE_PATH}` },
  { label: 'Report generator', to: `${BASE_PATH}/report-generator` },
  { label: 'LCP calculator', to: `${BASE_PATH}/lcp-calculator` },
  { label: 'CLS Calculator', to: `${BASE_PATH}/cls-calculator` },
  { label: 'FCP calculator', to: `${BASE_PATH}/fcp-calculator` },
  { label: 'TTFB calculator', to: `${BASE_PATH}/ttfb-calculator` },
  { label: 'Learn here', to: `${BASE_PATH}/learn` },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="main-header">
      <div className="header-title">Ishowpagespeed</div>
      <nav className={`header-nav ${open ? 'open' : ''}`}>
        <ul>
          {MENU_ITEMS.map(item => (
            <li key={item.label}><Link to={item.to}>{item.label}</Link></li>
          ))}
        </ul>
      </nav>
      <button className="hamburger" aria-label="Menu" onClick={() => setOpen(o => !o)}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
      {open && (
        <div className="mobile-menu" onClick={() => setOpen(false)}>
          <nav onClick={e => e.stopPropagation()}>
            <ul>
              {MENU_ITEMS.map(item => (
                <li key={item.label}><Link to={item.to}>{item.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
