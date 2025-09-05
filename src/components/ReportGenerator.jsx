import { useState, useEffect } from 'react';
import '../App.css';
import ProgressBar from '../ProgressBar';
import ResultsTable from '../ResultsTable';
import { proxyList, fetchWithProxies, getCrux, getLighthousePerf, exportToExcel } from '../pagespeedUtils';
import CruxGraphChart from '../CruxGraphChart';
import CruxMetricTabs from '../CruxMetricTabs';

function ReportGenerator() {
  // CrUX graph state
  const [cruxGraph, setCruxGraph] = useState({ visible: false, loading: false, data: null, url: '', error: null, formFactor: 'PHONE' });
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [excelUrl, setExcelUrl] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [extracting, setExtracting] = useState(false);

  // Listen for graph icon click
  useEffect(() => {
    const handler = async (e) => {
      const { url } = e.detail;
      setCruxGraph({ visible: true, loading: true, data: null, url, error: null, formFactor: 'PHONE' });
      let origin;
      try {
        origin = new URL(url).origin;
      } catch {
        setCruxGraph(g => ({ ...g, loading: false, error: 'Invalid URL' }));
        return;
      }
      const fetchCrux = async (formFactor) => {
        // ... existing fetchCrux logic
      };
      await fetchCrux('PHONE');
      window._fetchCrux = async (formFactor) => {
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

  // Handle input change for all URLs at once
  const handleBulkInput = (value) => {
    const urlArr = value
      .split(/\s|,|\n/)
      .map(u => u.trim())
      .filter(Boolean);
    setUrls(urlArr.length ? urlArr : ['']);
  };

  const generateReports = async () => {
    setLoading(true);
    setResults([]);
    setExcelUrl(null);
    const apiKey = 'AIzaSyAF6N58p5HULIGapVSNFWmBT-8BYadvU9A';
    const urlList = urls.filter(Boolean);
    const BATCH_SIZE = 5;
    const DELAY_MS = 1500;
    let allResults = [];
    setProgress({ done: 0, total: urlList.length });

    // ... rest of the generateReports logic
  };

  // Fetch URLs from sitemap.xml
  const fetchUrlsFromSitemap = async (sitemapUrl) => {
    setExtracting(true);
    try {
      let urlToFetch = sitemapUrl;
      if (!/^https?:\/\//i.test(urlToFetch)) urlToFetch = 'https://' + urlToFetch;
      const text = await fetchWithProxies(urlToFetch);
      let parser;
      let xmlDoc;
      if (window.DOMParser) {
        parser = new window.DOMParser();
        xmlDoc = parser.parseFromString(text, 'application/xml');
      } else {
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

  // Fetch URLs from webpage
  const fetchUrlsFromWebpage = async (webpageUrl) => {
    setExtracting(true);
    try {
      let urlToFetch = webpageUrl;
      if (!/^https?:\/\//i.test(urlToFetch)) urlToFetch = 'https://' + urlToFetch;
      const text = await fetchWithProxies(urlToFetch);
      const urlMatch = text.match(/https?:\/\/[^\s,'"<>]+(,\s*https?:\/\/[^\s,'"<>]+)+/);
      let urlArr = [];
      if (urlMatch) {
        urlArr = urlMatch[0].split(',').map(u => u.trim()).filter(Boolean);
      } else {
        const allUrls = Array.from(text.matchAll(/https?:\/\/[^\s,'"<>]+/g)).map(m => m[0]);
        urlArr = Array.from(new Set(allUrls));
      }
      setUrls(urlArr.length ? urlArr : ['']);
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
            <div className="extracting-overlay">
              <span className="loader"></span>
              <span className="extracting-text">Extracting URLs...</span>
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
        <a
          href={excelUrl}
          download="pagespeed-metrics.xlsx"
          className="download-btn"
        >
          Download Excel
        </a>
      )}

      {/* CrUX Graph Modal */}
      {cruxGraph.visible && (
        <div className="modal-overlay" onClick={() => setCruxGraph(g => ({ ...g, visible: false }))}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>CrUX Historical Metrics</h2>
            <div className="crux-url">{cruxGraph.url}</div>
            <div className="form-factor-buttons">
              <button
                className={cruxGraph.formFactor === 'PHONE' ? 'active' : ''}
                onClick={() => window._fetchCrux('PHONE')}
                disabled={cruxGraph.loading}
              >Mobile</button>
              <button
                className={cruxGraph.formFactor === 'DESKTOP' ? 'active' : ''}
                onClick={() => window._fetchCrux('DESKTOP')}
                disabled={cruxGraph.loading}
              >Desktop</button>
            </div>
            {cruxGraph.loading && <div>Loading historical data...</div>}
            {cruxGraph.error && <div className="error">{cruxGraph.error}</div>}
            {cruxGraph.data && (
              <CruxMetricTabs cruxData={cruxGraph.data} formFactor={cruxGraph.formFactor} />
            )}
            <button className="close-button" onClick={() => setCruxGraph(g => ({ ...g, visible: false }))}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportGenerator;
