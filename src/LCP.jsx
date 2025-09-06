import React, { useState, useEffect } from 'react';
import './lcp.css';
import TimingPieChart from './TimingPieChart';

export default function LCP() {
  const [url, setUrl] = useState('');
  const [device, setDevice] = useState('mobile');
  const [results, setResults] = useState({
    mobile: {
      lcpElements: null,
      lcpScore: null,
      timingData: null,
    },
    desktop: {
      lcpElements: null,
      lcpScore: null,
      timingData: null,
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current device's results
  const currentResults = results[device];

  const analyzeLCP = async (e, deviceType = device) => {
    e?.preventDefault(); // Make preventDefault optional for programmatic calls
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
          url
        )}&strategy=${deviceType}&category=performance&key=${import.meta.env.VITE_PAGESPEED_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch PageSpeed data');
      }

      const data = await response.json();
      
      // Extract LCP score and elements
      const lcpAudit = data.lighthouseResult.audits['largest-contentful-paint'];
      const lcpElementsAudit = data.lighthouseResult.audits['largest-contentful-paint-element'];
      const coreWebVitalsData = data.loadingExperience?.metrics?.['LARGEST_CONTENTFUL_PAINT_MS'];

      // Extract timing data from lcpElementsAudit
      const timingItems = lcpElementsAudit?.details?.items?.[1]?.items || [];
      console.log('Timing Items:', timingItems);
      
      // Process timing data with actual timing values
      const processedTimingData = {
        ttfb: timingItems.find(item => item.phase === 'TTFB')?.timing || 0,
        loadDelay: timingItems.find(item => item.phase === 'Load Delay')?.timing || 0,
        loadTime: timingItems.find(item => item.phase === 'Load Time')?.timing || 0,
        renderDelay: timingItems.find(item => item.phase === 'Render Delay')?.timing || 0
      };
      
      console.log('Processed Timing Data:', processedTimingData);
      console.log('LCP Elements Audit:', lcpElementsAudit);

      // Update results for the specific device
      setResults(prev => ({
        ...prev,
        [deviceType]: {
          lcpScore: {
            lighthouse: lcpAudit.numericValue / 1000,
            coreWebVitals: coreWebVitalsData ? coreWebVitalsData.percentile / 1000 : null
          },
          lcpElements: lcpElementsAudit?.details?.items || [],
          timingData: processedTimingData
        }
      }));
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
console.log(currentResults.lcpElements,'lcpElements')
  return (
    <div className="container">
      <h1>LCP Calculator</h1>
      <div className="calculator-section">
        <div className="device-toggle">
          <button
            className={device === 'mobile' ? 'active' : ''}
            onClick={() => setDevice('mobile')}
          >
            MOBILE
          </button>
          <button
            className={device === 'desktop' ? 'active' : ''}
            onClick={() => setDevice('desktop')}
          >
            DESKTOP
          </button>
        </div>
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

        {currentResults.lcpScore !== null && (
          <div className="results">
            <h2>LCP Analysis Results</h2>
            <div className="scores-container">
              <div className="score-card">
                <p className="score-label">Lighthouse LCP Score</p>
                <p className="score-value">{currentResults.lcpScore.lighthouse.toFixed(2)} seconds</p>
                <p className={`score-rating ${getLCPRating(currentResults.lcpScore.lighthouse).class}`}>
                  {getLCPRating(currentResults.lcpScore.lighthouse).text}
                </p>
              </div>
              
              <div className="score-card">
                <p className="score-label">Core Web Vitals LCP</p>
                <p className="score-value">
                  {currentResults.lcpScore.coreWebVitals 
                    ? `${currentResults.lcpScore.coreWebVitals.toFixed(2)} seconds`
                    : 'No field data available'}
                </p>
                {currentResults.lcpScore.coreWebVitals && (
                  <p className={`score-rating ${getLCPRating(currentResults.lcpScore.coreWebVitals).class}`}>
                    {getLCPRating(currentResults.lcpScore.coreWebVitals).text}
                  </p>
                )}
              </div>
            </div>

            {currentResults.timingData && Object.values(currentResults.timingData).some(v => v > 0) && (
              <div className="timing-chart-container">
                <TimingPieChart timingData={currentResults.timingData} />
                <div className="timing-summary">
                  <h4>Timing Breakdown (in seconds):</h4>
                  <ul>
                    <li>TTFB: {(currentResults.timingData.ttfb / 1000).toFixed(2)}s</li>
                    <li>Load Delay: {(currentResults.timingData.loadDelay / 1000).toFixed(2)}s</li>
                    <li>Load Time: {(currentResults.timingData.loadTime / 1000).toFixed(2)}s</li>
                    <li>Render Delay: {(currentResults.timingData.renderDelay / 1000).toFixed(2)}s</li>
                  </ul>
                </div>
              </div>
            )}

            {currentResults.lcpElements && currentResults.lcpElements.length > 0 && (
              <div className="lcp-elements">
                <h3>LCP Elements Found</h3>
                {currentResults.lcpElements
                  .filter(element => element?.items?.[0]?.node) // Only show elements with valid data
                  .map((element, index) => (
                  <div key={index} className="lcp-element-card">
                    <h4>Element {index + 1}</h4>
                    <div className="element-details">
                      <p><strong>Element ID:</strong> {element.items[0].node.lhId || 'N/A'}</p>
                      <p><strong>Element Type:</strong> {element.items[0].node.nodeLabel || 'Unknown'}</p>
                      {element.items[0].node.snippet && (
                        <div className="element-snippet">
                          <p><strong>HTML:</strong></p>
                          <pre>{element.items[0].node.snippet}</pre>
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
