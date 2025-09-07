import React, { useState } from 'react';
import './fcp.css';

export default function FCP() {
  const [url, setUrl] = useState('');
  const [device, setDevice] = useState('mobile');
  const [results, setResults] = useState({
    mobile: {
      fcpScore: null,
      fcpElements: null,
      timingData: null,
      serverResponse: null,
      renderBlocking: null,
      mainThreadWork: null,
      networkRtt: null,
      resourceSize: null
    },
    desktop: {
      fcpScore: null,
      fcpElements: null,
      timingData: null,
      serverResponse: null,
      renderBlocking: null,
      mainThreadWork: null,
      networkRtt: null,
      resourceSize: null
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current device's results
  const currentResults = results[device];

  const analyzeFCP = async (e, deviceType = device) => {
    e?.preventDefault();
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
      
      // Extract FCP score and elements
      const fcpAudit = data.lighthouseResult.audits['first-contentful-paint'];
      const coreWebVitalsData = data.loadingExperience?.metrics?.['FIRST_CONTENTFUL_PAINT_MS'];
      
      // Extract related performance audits
      const serverResponseAudit = data.lighthouseResult.audits['server-response-time'];
      const renderBlockingAudit = data.lighthouseResult.audits['render-blocking-resources'];
      const mainThreadWorkAudit = data.lighthouseResult.audits['mainthread-work-breakdown'];
      const networkRttAudit = data.lighthouseResult.audits['network-rtt'];
      const resourceSizeAudit = data.lighthouseResult.audits['total-byte-weight'];
      
      // Update results for the specific device
      setResults(prev => ({
        ...prev,
        [deviceType]: {
          fcpScore: {
            lighthouse: fcpAudit.numericValue / 1000, // Convert to seconds
            coreWebVitals: coreWebVitalsData ? coreWebVitalsData.percentile / 1000 : null // Convert to seconds
          },
          fcpElements: fcpAudit.details?.items || [],
          timingData: fcpAudit.details || null,
          serverResponse: {
            score: serverResponseAudit.score,
            value: serverResponseAudit.numericValue, // in milliseconds
            details: serverResponseAudit.details || null
          },
          renderBlocking: {
            score: renderBlockingAudit.score,
            items: renderBlockingAudit.details?.items || [],
            description: renderBlockingAudit.description
          },
          mainThreadWork: {
            score: mainThreadWorkAudit.score,
            items: mainThreadWorkAudit.details?.items || [],
            description: mainThreadWorkAudit.description
          },
          networkRtt: {
            value: networkRttAudit.numericValue, // in milliseconds
            description: networkRttAudit.description
          },
          resourceSize: {
            score: resourceSizeAudit.score,
            value: resourceSizeAudit.numericValue, // in bytes
            details: resourceSizeAudit.details || null
          }
        }
      }));
    } catch (error) {
      setError('Error analyzing FCP. Please check the URL and try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFCPRating = (score) => {
    if (score <= 1.8) return { text: 'Good', class: 'good' };
    if (score <= 3.0) return { text: 'Needs Improvement', class: 'needs-improvement' };
    return { text: 'Poor', class: 'poor' };
  };

  return (
    <div className="fcp-container">
      <h1>FCP Calculator</h1>
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

        <form onSubmit={analyzeFCP} className="analysis-form">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter webpage URL (e.g., https://example.com)"
            required
            className="url-input"
          />
          <button type="submit" disabled={loading} className="analyze-btn">
            {loading ? 'Analyzing...' : 'Analyze FCP'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {currentResults.fcpScore !== null && (
          <div className="results">
            <h2>FCP Analysis Results</h2>
            <div className="scores-container">
              <div className="score-card">
                <p className="score-label">Lighthouse FCP Score</p>
                <p className="score-value">{currentResults.fcpScore.lighthouse.toFixed(2)} seconds</p>
                <p className={`score-rating ${getFCPRating(currentResults.fcpScore.lighthouse).class}`}>
                  {getFCPRating(currentResults.fcpScore.lighthouse).text}
                </p>
              </div>
              
              <div className="score-card">
                <p className="score-label">Core Web Vitals FCP</p>
                <p className="score-value">
                  {currentResults.fcpScore.coreWebVitals 
                    ? `${currentResults.fcpScore.coreWebVitals.toFixed(2)} seconds`
                    : 'No field data available'}
                </p>
                {currentResults.fcpScore.coreWebVitals && (
                  <p className={`score-rating ${getFCPRating(currentResults.fcpScore.coreWebVitals).class}`}>
                    {getFCPRating(currentResults.fcpScore.coreWebVitals).text}
                  </p>
                )}
              </div>
            </div>

            <div className="performance-audits">
              <h3>Performance Factors Affecting FCP</h3>
              
              {/* Server Response Time */}
              <div className="audit-card">
                <h4>Server Response Time</h4>
                <p className="audit-value">
                  Time to First Byte: {(currentResults.serverResponse?.value || 0).toFixed(2)}ms
                </p>
                <div className={`audit-score ${currentResults.serverResponse?.score >= 0.9 ? 'good' : currentResults.serverResponse?.score >= 0.5 ? 'needs-improvement' : 'poor'}`}>
                  Score: {Math.round(currentResults.serverResponse?.score * 100) || 0}/100
                </div>
              </div>

              {/* Render Blocking Resources */}
              <div className="audit-card">
                <h4>Render Blocking Resources</h4>
                <p>Found {currentResults.renderBlocking?.items?.length || 0} blocking resources</p>
                {currentResults.renderBlocking?.items?.length > 0 && (
                  <div className="resources-list">
                    {currentResults.renderBlocking.items.slice(0, 5).map((item, index) => (
                      <div key={index} className="resource-item">
                        <code>{item.url}</code>
                        <span>Blocking time: {(item.wastedMs || 0).toFixed(0)}ms</span>
                      </div>
                    ))}
                    {currentResults.renderBlocking.items.length > 5 && (
                      <p className="more-items">And {currentResults.renderBlocking.items.length - 5} more...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Main Thread Work */}
              <div className="audit-card">
                <h4>JavaScript Execution</h4>
                <p>Main Thread Work Breakdown:</p>
                {currentResults.mainThreadWork?.items?.slice(0, 3).map((item, index) => (
                  <div key={index} className="work-item">
                    <span>{item.groupLabel}</span>
                    <span>{(item.duration || 0).toFixed(1)}ms</span>
                  </div>
                ))}
              </div>

              {/* Network Conditions */}
              <div className="audit-card">
                <h4>Network Conditions</h4>
                <p>Round Trip Time (RTT): {(currentResults.networkRtt?.value || 0).toFixed(0)}ms</p>
              </div>

              {/* Resource Size */}
              <div className="audit-card">
                <h4>Total Resource Size</h4>
                <p>{((currentResults.resourceSize?.value || 0) / (1024 * 1024)).toFixed(2)}MB transferred</p>
                <div className={`audit-score ${currentResults.resourceSize?.score >= 0.9 ? 'good' : currentResults.resourceSize?.score >= 0.5 ? 'needs-improvement' : 'poor'}`}>
                  Score: {Math.round(currentResults.resourceSize?.score * 100) || 0}/100
                </div>
              </div>
            </div>

            <div className="explanation">
              <h3>About FCP (First Contentful Paint)</h3>
              <p>FCP measures the time from when the page starts loading to when any part of the page's content is rendered on the screen.</p>
              <h4>What Affects FCP:</h4>
              <ul>
                <li>Server response time</li>
                <li>Render-blocking resources (CSS, JavaScript)</li>
                <li>Client-side rendering</li>
                <li>Network conditions</li>
                <li>Resource size and optimization</li>
              </ul>
              <h4>Target Scores:</h4>
              <ul>
                <li><span className="score-pill good">Good</span> 0 to 1.8 seconds</li>
                <li><span className="score-pill needs-improvement">Needs Improvement</span> 1.8 to 3.0 seconds</li>
                <li><span className="score-pill poor">Poor</span> Over 3.0 seconds</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
