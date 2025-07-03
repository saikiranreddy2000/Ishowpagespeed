import { useState } from 'react'
import './App.css'

function App() {
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [excelUrl, setExcelUrl] = useState(null);

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
          const mobileCrux = getCrux(mobileData, 'mobile');
          const desktopCrux = getCrux(desktopData, 'desktop');
          const mobileLighthouse = getLighthousePerf(mobileData);
          const desktopLighthouse = getLighthousePerf(desktopData);
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
          };
        } catch (e) {
          return { url, error: 'Failed to fetch' };
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
  };

  // Export metrics to Excel
  const exportToExcel = async (metrics) => {
    const XLSX = await import('xlsx');
    // Add header row for real user metrics (CrUX) and Lighthouse
    const header = [
      'URL',
      'Mobile Lighthouse Performance',
      'Mobile FCP (s)', 'Mobile LCP (s)', 'Mobile CLS', 'Mobile INP (ms)', 'Mobile Data Source',
      'Desktop Lighthouse Performance', // moved here
      'Desktop FCP (s)', 'Desktop LCP (s)', 'Desktop CLS', 'Desktop INP (ms)', 'Desktop Data Source',
      'Error'
    ];
    const data = metrics.map(row => ({
      url: row.url,
      mobile_lighthouse: row.mobile_lighthouse,
      mobile_fcp: row.mobile_fcp,
      mobile_lcp: row.mobile_lcp,
      mobile_cls: row.mobile_cls,
      mobile_inp: row.mobile_inp,
      mobile_source: row.mobile_source,
      desktop_lighthouse: row.desktop_lighthouse, // moved here
      desktop_fcp: row.desktop_fcp,
      desktop_lcp: row.desktop_lcp,
      desktop_cls: row.desktop_cls,
      desktop_inp: row.desktop_inp,
      desktop_source: row.desktop_source,
      error: row.error || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data, { header });
    // Set column widths for better appearance (fit to screen width)
    ws['!cols'] = [
      { wch: 40 }, // URL
      { wch: 14 }, // Mobile Lighthouse
      { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, // Mobile
      { wch: 14 }, // Desktop Lighthouse (moved here)
      { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, // Desktop
      { wch: 16 } // Error
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PageSpeed');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    setExcelUrl(url);
  };

  // Fetch all URLs from a sitemap.xml
  const fetchUrlsFromSitemap = async (sitemapUrl) => {
    try {
      const res = await fetch(sitemapUrl, { mode: 'cors' });
      if (!res.ok) throw new Error('Network response was not ok');
      const text = await res.text();
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
      alert('Failed to fetch or parse URLs from the sitemap. This may be due to CORS restrictions or an invalid sitemap.');
    }
  };

  // Fetch all URLs from a webpage that lists them (comma separated)
  const fetchUrlsFromWebpage = async (webpageUrl) => {
    try {
      const res = await fetch(webpageUrl);
      const text = await res.text();
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
      console.log(urlArr,'+++')
      setUrls(urlArr.length ? urlArr : ['']);
      // Also update the textarea directly for user feedback
      const textarea = document.querySelector('textarea');
      if (textarea && urlArr.length) textarea.value = urlArr.join('\n');
    } catch (e) {
      alert('Failed to fetch or parse URLs from the webpage.');
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
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.url}</td>
                  <td>{r.mobile_lighthouse ?? ''}</td>
                  <td>{r.mobile_fcp ?? ''}</td>
                  <td>{r.mobile_lcp ?? ''}</td>
                  <td>{r.mobile_cls ?? ''}</td>
                  <td>{r.mobile_inp ?? ''}</td>
                  <td>{r.mobile_source ?? ''}</td>
                  <td>{r.desktop_lighthouse ?? ''}</td> {/* moved here */}
                  <td>{r.desktop_fcp ?? ''}</td>
                  <td>{r.desktop_lcp ?? ''}</td>
                  <td>{r.desktop_cls ?? ''}</td>
                  <td>{r.desktop_inp ?? ''}</td>
                  <td>{r.desktop_source ?? ''}</td>
                  <td>{r.error ?? ''}</td>
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
