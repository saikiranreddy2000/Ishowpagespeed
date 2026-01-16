import React, { useState } from 'react';
import './cls.css';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';


export default function CLS() {
  const [url, setUrl] = useState('');
  const [device, setDevice] = useState('mobile');
  const [results, setResults] = useState({
    mobile: {
      clsScore: null,
      clsElements: null,
      shiftData: null,
      unsizedImages: null,
    },
    desktop: {
      clsScore: null,
      clsElements: null,
      shiftData: null,
      unsizedImages: null,
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current device's results
  const currentResults = results[device];

  const analyzeCLS = async (e, deviceType = device) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
       const [response] = await Promise.all([
            fetch(`${BACKEND_URL}/api/pagespeed`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, strategy: device })
            }),
      ]);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PageSpeed data');
      }

      const data = await response.json();
      
      // Extract CLS score and elements
      const clsAudit = data.lighthouseResult.audits['cumulative-layout-shift'];
      const coreWebVitalsData = data.loadingExperience?.metrics?.['CUMULATIVE_LAYOUT_SHIFT_SCORE'];
      const layoutShiftElements = data.lighthouseResult.audits['cls-culprits-insight'];
      const unsizedImagesAudit = data.lighthouseResult.audits['unsized-images'];
console.log(unsizedImagesAudit,'unsizedImagesAudit')
      // Update results for the specific device
      setResults(prev => ({
        ...prev,
        [deviceType]: {
          clsScore: {
            lighthouse: clsAudit.numericValue,
            coreWebVitals: coreWebVitalsData ? coreWebVitalsData.percentile / 10 : null
          },
          clsElements: layoutShiftElements?.details?.items || [],
          shiftData: layoutShiftElements?.details || null,
          unsizedImages: unsizedImagesAudit ? {
            score: unsizedImagesAudit.score,
            details: unsizedImagesAudit.details?.items || [],
            displayValue: unsizedImagesAudit.displayValue,
            description: unsizedImagesAudit.description
          } : null
        }
      }));
    } catch (error) {
      setError('Error analyzing CLS. Please check the URL and try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCLSRating = (score) => {
    if (score <= 0.1) return { text: 'Good', class: 'good' };
    if (score <= 0.25) return { text: 'Needs Improvement', class: 'needs-improvement' };
    return { text: 'Poor', class: 'poor' };
  };
  return (
    <div className="cls-container">
      <h1>CLS Calculator</h1>
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

        <form onSubmit={analyzeCLS} className="analysis-form">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter webpage URL (e.g., https://example.com)"
            required
            className="url-input"
          />
          <button type="submit" disabled={loading} className="analyze-btn">
            {loading ? 'Analyzing...' : 'Analyze CLS'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {currentResults.clsScore !== null && (
          <div className="results">
            <h2>CLS Analysis Results</h2>
            <div className="scores-container">
              <div className="score-card">
                <p className="score-label">Lighthouse CLS Score</p>
                <p className="score-value">{(currentResults.clsScore.lighthouse/10).toFixed(3)}</p>
                <p className={`score-rating ${getCLSRating(currentResults.clsScore.lighthouse).class}`}>
                  {getCLSRating(currentResults.clsScore.lighthouse).text}
                </p>
              </div>
              
              <div className="score-card">
                <p className="score-label">Core Web Vitals CLS</p>
                <p className="score-value">
                  {currentResults.clsScore.coreWebVitals 
                    ? (currentResults.clsScore.coreWebVitals / 10).toFixed(3)
                    : 'No field data available'}
                </p>
                {currentResults.clsScore.coreWebVitals && (
                  <p className={`score-rating ${getCLSRating(currentResults.clsScore.coreWebVitals).class}`}>
                    {getCLSRating(currentResults.clsScore.coreWebVitals).text}
                  </p>
                )}
              </div>
            </div>

            {currentResults.clsElements && currentResults.clsElements.length > 0 && (
              <div className="cls-elements">
                <h3>Layout Shift Analysis</h3>
                {currentResults.clsElements[0].items?.map((item, index) => (
                  <div key={index} className="cls-element-card">
                    <h4>Layout Shift {index + 1}</h4>
                    <div className="element-details">
                      <p><strong>Shift Score:</strong> {item.score?.toFixed(3) || 'N/A'}</p>
                      {item.node && (
                        <div className="sub-items">
                          <p><strong>Element Information:</strong></p>
                          <div className="sub-item">
                            {item.node.lhId &&<p><strong>ID:</strong> {item.node.lhId || 'N/A'}</p>}
                            {item.node.nodeLabel &&<p><strong>Type:</strong> {item.node.nodeLabel || 'Unknown'}</p>}
                            {item.node.path&&<p><strong>Path:</strong> {item.node.path || 'N/A'}</p>}
                            {item.node.selector&&<p><strong>CSS Selector:</strong> <code>{item.node.selector || 'N/A'}</code></p>}
                            {item.node.type&&<p><strong>type:</strong> <code>{item.node.type || 'N/A'}</code></p>}
                            {item.node.value&&<p><strong>value:</strong> <code>{item.node.value || 'N/A'}</code></p>}

                            {item.node.boundingRect && (
                              <div className="bounding-rect">
                                <p><strong>Element Size & Position:</strong></p>
                                <ul>
                                  <li>Width: {item.node.boundingRect.width}px</li>
                                  <li>Height: {item.node.boundingRect.height}px</li>
                                  <li>Top: {item.node.boundingRect.top}px</li>
                                  <li>Bottom: {item.node.boundingRect.bottom}px</li>
                                </ul>
                              </div>
                            )}
                            {item.node.snippet && (
                              <div className="element-snippet">
                                <p><strong>HTML:</strong></p>
                                <pre>{item.node.snippet}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Unsized Images Section */}
            {currentResults.unsizedImages && currentResults.unsizedImages.details.length > 0 && (
              <div className="unsized-images-section">
                <h3>Unsized Images Found</h3>
                <p className="section-description">{currentResults.unsizedImages.description}</p>
                <div className="score-indicator">
                  <span className={`score-badge ${currentResults.unsizedImages.score === 1 ? 'good' : 'poor'}`}>
                    {currentResults.unsizedImages.displayValue}
                  </span>
                </div>
                <div className="image-list">
                  {currentResults.unsizedImages.details.map((image, index) => (
                    <div key={index} className="image-item">
                      <h4>Image {index + 1}</h4>
                      <div className="image-details">
                        <p><strong>URL:</strong> <span className="url-text">{image.url}</span></p>
                        {image.node && (
                          <>
                            <p><strong>Element:</strong> <code>{image.node.snippet || 'N/A'}</code></p>
                            {image.node.selector && (
                              <p><strong>Selector:</strong> <code>{image.node.selector}</code></p>
                            )}
                          </>
                        )}
                        <div className="recommendation">
                          <strong>Fix:</strong> Add width and height attributes to prevent layout shifts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="explanation">
              <h3>About CLS (Cumulative Layout Shift)</h3>
              <p>CLS measures the sum of all individual layout shift scores for every unexpected layout shift that occurs during the entire lifespan of the page.</p>
              <h4>What Causes Layout Shifts:</h4>
              <ul>
                <li>Images without dimensions</li>
                <li>Ads, embeds, and iframes without dimensions</li>
                <li>Dynamically injected content</li>
                <li>Web Fonts causing FOIT/FOUT</li>
                <li>Actions waiting for a network response before updating the DOM</li>
              </ul>
              <h4>Target Scores:</h4>
              <ul>
                <li><span className="score-pill good">Good</span> 0 to 0.1</li>
                <li><span className="score-pill needs-improvement">Needs Improvement</span> 0.1 to 0.25</li>
                <li><span className="score-pill poor">Poor</span> Above 0.25</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
