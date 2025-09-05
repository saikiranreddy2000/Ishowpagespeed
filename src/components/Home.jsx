import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <h1>Welcome to Ishowpagespeed</h1>
      <p>Your all-in-one tool for PageSpeed analysis and Core Web Vitals optimization.</p>
      <div className="features">
        <Link to="/report-generator" className="feature-card">
          <h2>Report Generator</h2>
          <p>Generate PageSpeed reports for multiple URLs at once</p>
        </Link>
        {/* Add more feature cards as you implement them */}
      </div>
    </div>
  );
}

export default Home;
