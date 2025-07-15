import { useState, useEffect } from 'react';
import './App.css';
import ProgressBar from './ProgressBar';
import ResultsTable from './ResultsTable';
import { proxyList, fetchWithProxies, getCrux, getLighthousePerf, exportToExcel } from './pagespeedUtils';
import CruxGraphChart from './CruxGraphChart';
import CruxMetricTabs from './CruxMetricTabs';

function App() {
  // CrUX graph state
  const [cruxGraph, setCruxGraph] = useState({ visible: false, loading: false, data: null, url: '', error: null, formFactor: 'PHONE' });

  // Listen for graph icon click
  useEffect(() => {
    const handler = async (e) => {
      const { url } = e.detail;
      setCruxGraph({ visible: true, loading: true, data: null, url, error: null, formFactor: 'PHONE' });
      // Extract origin from URL
      let origin;
      try {
        origin = new URL(url).origin;
      } catch {
        setCruxGraph(g => ({ ...g, loading: false, error: 'Invalid URL' }));
        return;
      }
      // Fetch CrUX API data (prefer url-level, fallback to origin-level)
      const fetchCrux = async (formFactor) => {
        setCruxGraph(g => ({ ...g, loading: true, error: null, formFactor }));
        try {
          const apiKey = 'AIzaSyApNpUJyvuNDt3RZZIa2rCASP_s98CClxc';
          // Try url-level first
          let body = {
            url,
            formFactor,
            metrics: [
              'largest_contentful_paint',
              'cumulative_layout_shift',
              'interaction_to_next_paint'
            ]
          };
          let res = await fetch(`https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          let data = await res.json();
          // If url-level data is not present, fallback to origin
          if (!data.record || (!data.record.metrics && !data.record.urlMetrics)) {
            body = {
              origin,
              formFactor,
              metrics: [
                'largest_contentful_paint',
                'cumulative_layout_shift',
                'interaction_to_next_paint'
              ]
            };
            res = await fetch(`https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            data = await res.json();
          }
          if (data.record) {
            setCruxGraph(g => ({ ...g, loading: false, data: data.record, error: null, formFactor }));
          } else {
            setCruxGraph(g => ({ ...g, loading: false, error: data.error?.message || 'No data found', formFactor }));
          }
        } catch (err) {
          setCruxGraph(g => ({ ...g, loading: false, error: err.message, formFactor }));
        }
      };
      await fetchCrux('PHONE');
      // Attach to window for modal toggle
      window._fetchCrux = async (formFactor) => {
        // Only fetch if not already showing this formFactor
        setCruxGraph(g => {
          if (g.formFactor === formFactor && g.data) return g;
          return { ...g, loading: true, error: null, formFactor };
        });
        await fetchCrux(formFactor);
      };
    };
    window.addEventListener('showCruxGraph', handler);
    return () => window.removeEventListener('showCruxGraph', handler);
  }, []);
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [excelUrl, setExcelUrl] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  // Loader for sitemap/webpage extraction
  const [extracting, setExtracting] = useState(false);

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
    // Do NOT reset progress here, so the progress bar stays visible after completion
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
    // Only export the raw data keys, not the display headers, and do NOT include serial number column
    const data = metrics.map((row) => ({
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
    }));
    if (data.length > 0) {
      // Add a row at the top with the generation date/time
      const metaRow = {
        url: `Report generated: ${dateTimeStr}`
      };
      const dataWithMeta = [metaRow, ...data];
      const ws = XLSX.utils.json_to_sheet(dataWithMeta, { skipHeader: false });
      ws['!cols'] = [
        { wch: 40 }, // url
        { wch: 14 }, // mobile_lighthouse
        { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 14 },
        { wch: 14 }, // desktop_lighthouse
        { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 14 }
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
    // Your custom Render.com proxy (highest priority)
    url => `https://ishowpagespeed-cors.onrender.com/${url}`,
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
    setExtracting(true);
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
    } finally {
      setExtracting(false);
    }
  };

  // Fetch all URLs from a webpage that lists them (comma separated)
  const fetchUrlsFromWebpage = async (webpageUrl) => {
    setExtracting(true);
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
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="container">
      <h1>PageSpeed Report Generator</h1>
      <p>Enter URLs below. Click 'Generate' to get PageSpeed metrics and download as Excel.</p>
      <div style={{ marginBottom: 16 }}>
        <b>Both Mobile & Desktop metrics will be included for each URL.</b>
      </div>
      <form onSubmit={e => { e.preventDefault(); generateReports(); }}>
        <ProgressBar loading={loading} progress={progress} />
        <div className="url-input-row" style={{ position: 'relative' }}>
          <textarea
            value={urls.join('\n')}
            onChange={e => handleBulkInput(e.target.value)}
            placeholder={extracting ? '' : "Paste URLs here, one per line, comma, or space separated"}
            rows={8}
            style={{ width: '100%', fontSize: '1.1em', padding: 10, resize: 'vertical', marginBottom: 12, background: extracting ? '#f8fafd' : undefined, color: extracting ? '#aaa' : undefined }}
            required
            disabled={extracting}
          />
          {extracting && (
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.7)',
              zIndex: 2
            }}>
              <span className="loader" style={{ width: 32, height: 32, display: 'inline-block' }}>
                <svg width="32" height="32" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" stroke="#0078d4">
                  <g fill="none" fillRule="evenodd" strokeWidth="4">
                    <circle cx="22" cy="22" r="18" strokeOpacity=".2" />
                    <path d="M40 22c0-9.94-8.06-18-18-18">
                      <animateTransform attributeName="transform" type="rotate" from="0 22 22" to="360 22 22" dur="0.9s" repeatCount="indefinite" />
                    </path>
                  </g>
                </svg>
              </span>
              <span style={{ marginLeft: 12, fontWeight: 500, color: '#0078d4', fontSize: 16 }}>Extracting URLs...</span>
            </div>
          )}
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
      <ResultsTable results={results} />
      {excelUrl && (
        <a href={excelUrl} download="pagespeed-metrics.xlsx" className="download-btn">Download Excel</a>
      )}

      {/* CrUX Graph Modal */}
      {cruxGraph.visible && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.25)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setCruxGraph(g => ({ ...g, visible: false }))}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px #0002', padding: 32, minWidth: 480, maxWidth: 900, width: '90vw' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>CrUX Historical Metrics</h2>
            <div style={{ marginBottom: 12, fontSize: 15, color: '#0078d4' }}>{cruxGraph.url}</div>
            <div style={{ marginBottom: 16 }}>
              <button
                style={{
                  background: cruxGraph.formFactor === 'PHONE' ? '#0078d4' : '#eee', color: cruxGraph.formFactor === 'PHONE' ? '#fff' : '#333',
                  border: 'none', borderRadius: 6, padding: '6px 16px', marginRight: 8, cursor: 'pointer', fontWeight: 500
                }}
                onClick={() => window._fetchCrux('PHONE')}
                disabled={cruxGraph.loading}
              >Mobile</button>
              <button
                style={{
                  background: cruxGraph.formFactor === 'DESKTOP' ? '#0078d4' : '#eee', color: cruxGraph.formFactor === 'DESKTOP' ? '#fff' : '#333',
                  border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontWeight: 500
                }}
                onClick={() => window._fetchCrux('DESKTOP')}
                disabled={cruxGraph.loading}
              >Desktop</button>
            </div>
            {cruxGraph.loading && <div>Loading historical data...</div>}
            {cruxGraph.error && <div style={{ color: 'red' }}>{cruxGraph.error}</div>}
            {cruxGraph.data && (
              <CruxMetricTabs cruxData={cruxGraph.data} formFactor={cruxGraph.formFactor} />
            )}
            <button style={{ marginTop: 18 }} onClick={() => setCruxGraph(g => ({ ...g, visible: false }))}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
