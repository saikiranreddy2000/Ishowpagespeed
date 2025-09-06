import React from 'react';
import './document.css';

export default function LearnMore() {
  return (
    <div className="coming-soon-container">
      <h1>Learn More</h1>
      <div className="coming-soon-message">
        <p>We are working on it</p>
        <div className="progress-indicator">🚧</div>
      </div>
    </div>
  );
}
