import { useState } from 'react'
import './App.css'

function App() {
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [excelUrl, setExcelUrl] = useState(null);
  const [showHeaderTooltip, setShowHeaderTooltip] = useState(false);
  const [showTooltipIdx, setShowTooltipIdx] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  // Handle input change for all URLs at once
  const handleBulkInput = (value) => {
    // Split by newlines, commas, or spaces, filter out empty
    const urlArr = value
      .split(/\s|,|\n/)
      .map(u => u.trim())
      .filter(Boolean);
    setUrls(urlArr.length ? urlArr : ['']);
  };

  // Add a new URL input (up to 30)
  const addUrlInput = () => {
    if (urls.length < 30) setUrls([...urls, '']);
  };

  // Remove a URL input
  const removeUrlInput = (idx) => {
    if (urls.length > 1) setUrls(urls.filter((_, i) => i !== idx));
  };

  // Fetch PageSpeed Insights for all URLs
  const generateReports = async () => {
    setLoading(true);
    setResults([]);
    setExcelUrl(null);
    const apiKey = 'AIzaSyAF6N58p5HULIGapVSNFWmBT-8BYadvU9A';
    const urlList = urls.filter(Boolean);
    const BATCH_SIZE = 5; // Number of URLs to process in parallel
    const DELAY_MS = 1500; // Delay between batches (1.5 seconds)
    let allResults = [];
    setProgress({ done: 0, total: urlList.length });

    for (let i = 0; i < urlList.length; i += BATCH_SIZE) {
      const batch = urlList.slice(i, i + BATCH_SIZE);
      const fetchAll = batch.map(async (url) => {
        try {
          const [mobileRes, desktopRes] = await Promise.all([
            fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${apiKey}`),
            fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&key=${apiKey}`)
          ]);
          const mobileData = await mobileRes.json();
          const desktopData = await desktopRes.json();
          const getCrux = (data, strategy) => {
            // Try strategy-specific experience first
            let exp = data[`${strategy}Experience`];
            let source = '';
            if (exp && exp.metrics && Object.keys(exp.metrics).length > 0) {
              source = 'url';
            } else if (data.loadingExperience && data.loadingExperience.metrics && Object.keys(data.loadingExperience.metrics).length > 0) {
              exp = data.loadingExperience;
              // Check if loadingExperience is for origin or url
              if (data.id && data.originLoadingExperience && data.originLoadingExperience.id === data.loadingExperience.id) {
                source = 'origin';
              } else {
                source = 'url';
              }
            } else if (data.originLoadingExperience && data.originLoadingExperience.metrics && Object.keys(data.originLoadingExperience.metrics).length > 0) {
              exp = data.originLoadingExperience;
              source = 'origin';
            } else {
              exp = {};
              source = 'none';
            }
            const roundToHundred = (val) => {
              if (typeof val !== 'number') return val ?? 'N/A';
              return Math.round(val / 100) * 100;
            };
            // Convert ms to seconds for FCP and LCP, keep INP in ms
            const msToSec = (val) => (typeof val === 'number' ? (val / 1000).toFixed(2) : val);
            return {
              fcp: msToSec(roundToHundred(exp?.metrics?.FIRST_CONTENTFUL_PAINT_MS?.percentile)),
              lcp: msToSec(roundToHundred(exp?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile)),
              cls: typeof exp?.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile === 'number'
                ? exp.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
                : 'N/A',
              inp: exp?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile ?? 'N/A',
              source,
            };
          };
          // Get Lighthouse performance score
          const getLighthousePerf = (data) => {
            return typeof data.lighthouseResult?.categories?.performance?.score === 'number'
              ? Math.round(data.lighthouseResult.categories.performance.score * 100)
              : 'N/A';
          };
          // Get recommendations for Core Web Vitals from Lighthouse audits
          const getRecommendations = (data) => {
            if (!data.lighthouseResult || !data.lighthouseResult.audits) return '';
            const audits = data.lighthouseResult.audits;
            // Pick relevant audits for Core Web Vitals
            const keys = [
              'first-contentful-paint',
              'largest-contentful-paint',
              'cumulative-layout-shift',
              'interactive',
              'total-blocking-time',
              'speed-index',
              'uses-rel-preload',
              'uses-responsive-images',
              'offscreen-images',
              'render-blocking-resources',
              'unused-css-rules',
              'unused-javascript',
              'efficient-animated-content',
              'modern-image-formats',
              'uses-text-compression',
              'uses-long-cache-ttl',
              'uses-optimized-images',
              'uses-webp-images',
              'uses-http2',
              'server-response-time',
              'redirects',
              'mainthread-work-breakdown',
              'dom-size',
              'unminified-javascript',
              'unminified-css',
              'uses-passive-event-listeners',
              'uses-rel-preconnect',
              'font-display',
              'uses-webp-images',
              'uses-optimized-images',
              'uses-text-compression',
              'uses-long-cache-ttl',
              'uses-rel-preload',
              'uses-responsive-images',
              'offscreen-images',
              'modern-image-formats',
              'efficient-animated-content',
              'total-blocking-time',
              'interactive',
              'mainthread-work-breakdown',
              'dom-size',
            ];
            // Collect failed or not passed audits with details
            const recs = keys
              .map(key => audits[key])
              .filter(a => a && a.score !== 1 && a.title && a.description)
              .map(a => `• ${a.title}: ${a.description.replace(/\s+/g, ' ').trim()}`);
            return recs.length ? recs.join('\n') : 'No major recommendations.';
          };
          const mobileCrux = getCrux(mobileData, 'mobile');
          const desktopCrux = getCrux(desktopData, 'desktop');
          const mobileLighthouse = getLighthousePerf(mobileData);
          const desktopLighthouse = getLighthousePerf(desktopData);
          // Combine recommendations from both mobile and desktop
          const recommendations = [
            mobileData ? `Mobile:\n${getRecommendations(mobileData)}` : '',
            desktopData ? `Desktop:\n${getRecommendations(desktopData)}` : ''
          ].filter(Boolean).join('\n\n');
          return {
            url,
            'mobile_fcp': mobileCrux.fcp,
            'mobile_lcp': mobileCrux.lcp,
            'mobile_cls': mobileCrux.cls,
            'mobile_inp': mobileCrux.inp,
            'mobile_source': mobileCrux.source,
            'mobile_lighthouse': mobileLighthouse,
            'desktop_fcp': desktopCrux.fcp,
            'desktop_lcp': desktopCrux.lcp,
            'desktop_cls': desktopCrux.cls,
            'desktop_inp': desktopCrux.inp,
            'desktop_source': desktopCrux.source,
            'desktop_lighthouse': desktopLighthouse,
            'recommendations': recommendations,
          };
        } catch (e) {
          return { url, error: 'Failed to fetch' };
        } finally {
          setProgress(prev => ({ ...prev, done: prev.done + 1 }));
        }
      });
      const batchResults = await Promise.all(fetchAll);
      allResults = allResults.concat(batchResults);
      setResults([...allResults]); // update UI incrementally
      if (i + BATCH_SIZE < urlList.length) {
        await new Promise(res => setTimeout(res, DELAY_MS));
      }
    }
    await exportToExcel(allResults);
    setLoading(false);
    setProgress({ done: 0, total: 0 });
  };

  // Export metrics to Excel
  const exportToExcel = async (metrics) => {
    const XLSX = await import('xlsx');
    // Get current date and time for filename and sheet
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const dateTimeStr = `${dateStr} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    // Only export the raw data keys, not the display headers
    const data = metrics.map((row, idx) => ({
      '#': idx + 1,
      url: row.url,
      mobile_lighthouse: row.mobile_lighthouse,
      mobile_fcp: row.mobile_fcp,
      mobile_lcp: row.mobile_lcp,
      mobile_cls: row.mobile_cls,
      mobile_inp: row.mobile_inp,
      mobile_source: row.mobile_source,
      desktop_lighthouse: row.desktop_lighthouse,
      desktop_fcp: row.desktop_fcp,
      desktop_lcp: row.desktop_lcp,
      desktop_cls: row.desktop_cls,
      desktop_inp: row.desktop_inp,
      desktop_source: row.desktop_source,
      recommendations: row.recommendations || '',
    }));
    if (data.length > 0) {
      // Add a row at the top with the generation date/time
      const metaRow = {
        url: `Report generated: ${dateTimeStr}`
      };
      const dataWithMeta = [metaRow, ...data];
      const ws = XLSX.utils.json_to_sheet(dataWithMeta, { skipHeader: false });
      ws['!cols'] = [
        { wch: 6 }, // serial number
        { wch: 40 }, // url
        { wch: 14 }, // mobile_lighthouse
        { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 14 },
        { wch: 14 }, // desktop_lighthouse
        { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 14 },
        { wch: 60 } // recommendations
      ];
      const wb = XLSX.utils.book_new();
      // Sheet name with date and time (max 31 chars for Excel)
      let sheetName = `PageSpeed_${dateStr}_${timeStr}`;
      if (sheetName.length > 31) sheetName = sheetName.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const filename = `${sheetName}.xlsx`;
      const url = URL.createObjectURL(blob);
      setExcelUrl(url);
      // Set download attribute dynamically
      const link = document.querySelector('.download-btn');
      if (link) link.setAttribute('download', filename);
    } else {
      setExcelUrl(null);
    }
  };

  // --- Proxy fallback utility ---
  // Proxy list for CORS workarounds. Thingproxy is unreliable and should be last (or removed if it fails consistently).
  const proxyList = [
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.org/?${encodeURIComponent(url)}`,
    url => `https://yacdn.org/proxy/${url}`,
    // Thingproxy is last due to CORS issues; remove if it fails for your deployment
    url => `https://thingproxy.freeboard.io/fetch/${url}`
  ];

  async function fetchWithProxies(url) {
    let lastError;
    for (const makeProxy of proxyList) {
      try {
        const proxyUrl = makeProxy(url);
        const res = await fetch(proxyUrl);
        if (res.ok) return await res.text();
        lastError = `Proxy ${proxyUrl} failed: ${res.status}`;
      } catch (e) {
        lastError = e.message;
      }
    }
    // Show a more helpful error message for CORS/proxy failures
    throw new Error(
      (lastError ? lastError + '\n' : '') +
      'All proxy attempts failed. This is likely due to CORS restrictions or proxy limits. If you are using the GitHub Pages version, public proxies may not work reliably.\n' +
      'As a workaround, you can download the sitemap.xml or webpage manually and paste the URLs here.'
    );
  }

  // Fetch all URLs from a sitemap.xml
  const fetchUrlsFromSitemap = async (sitemapUrl) => {
    try {
      let urlToFetch = sitemapUrl;
      if (!/^https?:\/\//i.test(urlToFetch)) urlToFetch = 'https://' + urlToFetch;
      const text = await fetchWithProxies(urlToFetch);
      // Parse XML and extract <loc> tags
      let parser;
      let xmlDoc;
      if (window.DOMParser) {
        parser = new window.DOMParser();
        xmlDoc = parser.parseFromString(text, 'application/xml');
      } else {
        // IE fallback
        xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
        xmlDoc.async = false;
        xmlDoc.loadXML(text);
      }
      const locElements = xmlDoc.getElementsByTagName('loc');
      const urlArr = Array.from(locElements).map(el => el.textContent.trim()).filter(Boolean);
      setUrls(urlArr.length ? urlArr : ['']);
      const textarea = document.querySelector('textarea');
      if (textarea && urlArr.length) textarea.value = urlArr.join('\n');
    } catch (e) {
      alert('Failed to fetch or parse URLs from the sitemap.\n' + e.message);
    }
  };

  // Fetch all URLs from a webpage that lists them (comma separated)
  const fetchUrlsFromWebpage = async (webpageUrl) => {
    try {
      let urlToFetch = webpageUrl;
      if (!/^https?:\/\//i.test(urlToFetch)) urlToFetch = 'https://' + urlToFetch;
      const text = await fetchWithProxies(urlToFetch);
      // Extract all URLs from the page content (comma separated)
      // Try to find a long comma-separated string of URLs
      const urlMatch = text.match(/https?:\/\/[^\s,'"<>]+(,\s*https?:\/\/[^\s,'"<>]+)+/);
      let urlArr = [];
      if (urlMatch) {
        // Split by comma, trim, filter
        urlArr = urlMatch[0].split(',').map(u => u.trim()).filter(Boolean);
      } else {
        // Fallback: try to extract all URLs in the page
        const allUrls = Array.from(text.matchAll(/https?:\/\/[^\s,'"<>]+/g)).map(m => m[0]);
        urlArr = Array.from(new Set(allUrls));
      }
      setUrls(urlArr.length ? urlArr : ['']);
      // Also update the textarea directly for user feedback
      const textarea = document.querySelector('textarea');
      if (textarea && urlArr.length) textarea.value = urlArr.join('\n');
    } catch (e) {
      alert('Failed to fetch or parse URLs from the webpage.\n' + e.message);
    }
  };

  return (
    <div className="container">
      <h1>PageSpeed Report Generator</h1>
      <p>Enter URLs below. Click 'Generate' to get PageSpeed metrics and download as Excel.</p>
      <div style={{ marginBottom: 16 }}>
        {/* Device checkboxes removed, always fetch both */}
        <b>Both Mobile & Desktop metrics will be included for each URL.</b>
      </div>
      <form onSubmit={e => { e.preventDefault(); generateReports(); }}>
        {loading && progress.total > 0 && (
          <div style={{ margin: '16px 0', width: '100%' }}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>
              Generating reports: {progress.done} of {progress.total} completed
            </div>
            <div style={{
              width: '100%',
              height: 16,
              background: '#eee',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 2px #ccc'
            }}>
              <div style={{
                width: `${(progress.done / progress.total) * 100}%`,
                height: '100%',
                background: '#0078d4',
                transition: 'width 0.3s',
                borderRadius: 8
              }} />
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#666' }}>
              Pending: {progress.total - progress.done} URLs
            </div>
          </div>
        )}
        <div className="url-input-row">
          <textarea
            value={urls.join('\n')}
            onChange={e => handleBulkInput(e.target.value)}
            placeholder={"Paste URLs here, one per line, comma, or space separated"}
            rows={8}
            style={{ width: '100%', fontSize: '1.1em', padding: 10, resize: 'vertical', marginBottom: 12 }}
            required
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="url"
            placeholder="Or enter a webpage or sitemap.xml URL to extract URLs from"
            style={{ flex: 1, padding: 8 }}
            id="webpage-url-input"
          />
          <button
            type="button"
            onClick={() => {
              const val = document.getElementById('webpage-url-input').value;
              if (val.endsWith('.xml')) fetchUrlsFromSitemap(val);
              else fetchUrlsFromWebpage(val);
            }}
            style={{ padding: '8px 16px' }}
          >
            Extract URLs
          </button>
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>
      {results.length > 0 && (
        <div className="results">
          <h2>Results</h2>
          <table>
            <thead>
              <tr>
                <th>S.no</th>
                <th>URL</th>
                <th>Mobile Lighthouse Performance</th>
                <th>Mobile FCP (s)</th>
                <th>Mobile LCP (s)</th>
                <th>Mobile CLS</th>
                <th>Mobile INP (ms)</th>
                <th>Mobile Data Source</th>
                <th>Desktop Lighthouse Performance</th> {/* moved here */}
                <th>Desktop FCP (s)</th>
                <th>Desktop LCP (s)</th>
                <th>Desktop CLS</th>
                <th>Desktop INP (ms)</th>
                <th>Desktop Data Source</th>
                <th style={{ textAlign: 'center', position: 'relative' }}>
                  Recommendation
                  <span
                    style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4', verticalAlign: 'middle', position: 'relative' }}
                    onClick={e => {
                      e.stopPropagation();
                      setShowHeaderTooltip(v => !v);
                    }}
                    role="img"
                    aria-label="recommendation info"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0078d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="10" r="1"/>
                      <path d="M12 12v4"/>
                    </svg>
                    {showHeaderTooltip && (
                      <span
                        style={{
                          position: 'absolute',
                          right: '28px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: '#fff',
                          color: '#222',
                          border: '1px solid #ccc',
                          borderRadius: 6,
                          padding: '8px 12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          zIndex: 10,
                          minWidth: 220,
                          fontSize: '0.98em',
                          whiteSpace: 'normal',
                        }}
                      >
                        You can find the recommendation in Excel sheet
                        <span
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 8,
                            cursor: 'pointer',
                            color: '#888',
                            fontWeight: 'bold',
                            fontSize: 16
                          }}
                          onClick={e => { e.stopPropagation(); setShowHeaderTooltip(false); }}
                        >×</span>
                      </span>
                    )}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r.url}</td>
                  <td>{r.mobile_lighthouse ?? ''}</td>
                  <td>{r.mobile_fcp ?? ''}</td>
                  <td>{r.mobile_lcp ?? ''}</td>
                  <td>{r.mobile_cls ?? ''}</td>
                  <td>{r.mobile_inp ?? ''}</td>
                  <td>{r.mobile_source ?? ''}</td>
                  <td>{r.desktop_lighthouse ?? ''}</td>
                  <td>{r.desktop_fcp ?? ''}</td>
                  <td>{r.desktop_lcp ?? ''}</td>
                  <td>{r.desktop_cls ?? ''}</td>
                  <td>{r.desktop_inp ?? ''}</td>
                  <td>{r.desktop_source ?? ''}</td>
                  <td style={{ textAlign: 'center', position: 'relative' }}>
                    <span
                      style={{ cursor: 'pointer', color: '#0078d4', position: 'relative' }}
                      onClick={e => {
                        e.stopPropagation();
                        setShowTooltipIdx(showTooltipIdx === i ? null : i);
                      }}
                      role="img"
                      aria-label="recommendation info"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0078d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="10" r="1"/>
                        <path d="M12 12v4"/>
                      </svg>
                      {showTooltipIdx === i && (
                        <span
                          style={{
                            position: 'absolute',
                            right: '28px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#fff',
                            color: '#222',
                            border: '1px solid #ccc',
                            borderRadius: 6,
                            padding: '8px 12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            zIndex: 10,
                            minWidth: 220,
                            fontSize: '0.98em',
                            whiteSpace: 'normal',
                          }}
                        >
                          You can find the recommendation in Excel sheet
                          <span
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 8,
                              cursor: 'pointer',
                              color: '#888',
                              fontWeight: 'bold',
                              fontSize: 16
                            }}
                            onClick={e => { e.stopPropagation(); setShowTooltipIdx(null); }}
                          >×</span>
                        </span>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="metric-definitions">
            <b>Metric definitions (percentile values, real user data):</b><br/>
            <ul>
              <li><b>FCP</b>: First Contentful Paint (s)</li>
              <li><b>LCP</b>: Largest Contentful Paint (s)</li>
              <li><b>CLS</b>: Cumulative Layout Shift</li>
              <li><b>INP</b>: Interaction to Next Paint (ms)</li>
            </ul>
          </div>
        </div>
      )}
      {excelUrl && (
        <a href={excelUrl} download="pagespeed-metrics.xlsx" className="download-btn">Download Excel</a>
      )}
    </div>
  );
}

export default App
