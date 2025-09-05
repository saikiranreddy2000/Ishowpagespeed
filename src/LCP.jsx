import React, { useState } from 'react';
import './App.css';
import './lcp.css';

export default function LCP() {
  const [url, setUrl] = useState('');
  const [lcpElements, setLcpElements] = useState(null);
  const [lcpScore, setLcpScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeLCP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLcpElements(null);
    setLcpScore(null);

    try {
      const response = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
          url
        )}&strategy=mobile&category=performance&key=${import.meta.env.VITE_PAGESPEED_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch PageSpeed data');
      }

      const data = await response.json();
      console.log(data,'data')
      // Extract LCP score and elements
      const lcpAudit = data.lighthouseResult.audits['largest-contentful-paint'];
      const lcpElementsAudit = data.lighthouseResult.audits['largest-contentful-paint-element'];
      
      setLcpScore(lcpAudit.numericValue / 1000); // Convert to seconds
      setLcpElements(lcpElementsAudit.details?.items || []);
    } catch (error) {
      setError('Error analyzing LCP. Please check the URL and try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLCPRating = (score) => {
    if (score <= 2.5) return { text: 'Good', class: 'good' };
    if (score <= 4.0) return { text: 'Needs Improvement', class: 'needs-improvement' };
    return { text: 'Poor', class: 'poor' };
  };

  return (
    <div className="container">
      <h1>LCP Calculator</h1>
      <div className="calculator-section">
        <form onSubmit={analyzeLCP} className="analysis-form">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter webpage URL (e.g., https://example.com)"
            required
            className="url-input"
          />
          <button type="submit" disabled={loading} className="analyze-btn">
            {loading ? 'Analyzing...' : 'Analyze LCP'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {lcpScore !== null && (
          <div className="results">
            <h2>LCP Analysis Results</h2>
            <div className="score-card">
              <p className="score-label">LCP Score</p>
              <p className="score-value">{lcpScore.toFixed(2)} seconds</p>
              <p className={`score-rating ${getLCPRating(lcpScore).class}`}>
                {getLCPRating(lcpScore).text}
              </p>
            </div>

            {lcpElements && lcpElements.length > 0 && (
              <div className="lcp-elements">
                <h3>LCP Elements Found</h3>
                {lcpElements.map((element, index) => (
                  <div key={index} className="lcp-element-card">
                    <h4>Element {index + 1}</h4>
                    <div className="element-details">
                      <p><strong>Type:</strong> {element.node?.nodeLabel || 'Unknown'}</p>
                      <p><strong>Size:</strong> {element.size || 'N/A'}px</p>
                      {element.node?.snippet && (
                        <div className="element-snippet">
                          <p><strong>HTML:</strong></p>
                          <pre>{element.node.snippet}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="explanation">
              <h3>About LCP (Largest Contentful Paint)</h3>
              <p>LCP measures the time when the largest content element becomes visible in the viewport.</p>
              <h4>Common LCP Elements:</h4>
              <ul>
                <li>Large images or video thumbnails</li>
                <li>Large blocks of text</li>
                <li>Banner images</li>
                <li>Hero sections with background images</li>
              </ul>
              <h4>Target Scores:</h4>
              <ul>
                <li><span className="score-pill good">Good</span> 0-2.5 seconds</li>
                <li><span className="score-pill needs-improvement">Needs Improvement</span> 2.5-4.0 seconds</li>
                <li><span className="score-pill poor">Poor</span> Over 4.0 seconds</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
