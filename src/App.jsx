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
      .filter(Boolean)
      .slice(0, 30);
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
    // Run all URL fetches in parallel for speed
    const urlList = urls.filter(Boolean);
    const fetchAll = urlList.map(async (url) => {
      try {
        const [mobileRes, desktopRes] = await Promise.all([
          fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${apiKey}`),
          fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&key=${apiKey}`)
        ]);
        const mobileData = await mobileRes.json();
        const desktopData = await desktopRes.json();
        const getCrux = (data) => {
          const exp = data.loadingExperience || data.originLoadingExperience || {};
          return {
            fcp: exp.metrics?.FIRST_CONTENTFUL_PAINT_MS?.percentile ?? 'N/A',
            lcp: exp.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? 'N/A',
            cls: exp.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ?? 'N/A',
            inp: exp.metrics?.INTERACTION_TO_NEXT_PAINT_MS?.percentile ?? 'N/A',
          };
        };
        const mobileCrux = getCrux(mobileData);
        const desktopCrux = getCrux(desktopData);
        return {
          url,
          'mobile_fcp': mobileCrux.fcp,
          'mobile_lcp': mobileCrux.lcp,
          'mobile_cls': mobileCrux.cls,
          'mobile_inp': mobileCrux.inp,
          'desktop_fcp': desktopCrux.fcp,
          'desktop_lcp': desktopCrux.lcp,
          'desktop_cls': desktopCrux.cls,
          'desktop_inp': desktopCrux.inp,
        };
      } catch (e) {
        return { url, error: 'Failed to fetch' };
      }
    });
    const metrics = await Promise.all(fetchAll);
    setResults(metrics);
    await exportToExcel(metrics);
    setLoading(false);
  };

  // Export metrics to Excel
  const exportToExcel = async (metrics) => {
    const XLSX = await import('xlsx');
    // Add header row for real user metrics (CrUX)
    const header = [
      'URL',
      'Mobile FCP (ms)', 'Mobile LCP (ms)', 'Mobile CLS', 'Mobile INP (ms)',
      'Desktop FCP (ms)', 'Desktop LCP (ms)', 'Desktop CLS', 'Desktop INP (ms)',
      'Error'
    ];
    const data = metrics.map(row => ([
      row.url,
      row.mobile_fcp, row.mobile_lcp, row.mobile_cls, row.mobile_inp,
      row.desktop_fcp, row.desktop_lcp, row.desktop_cls, row.desktop_inp,
      row.error || ''
    ]));
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    // Set column widths for better appearance (fit to screen width)
    ws['!cols'] = [
      { wch: 40 }, // URL
      { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, // Mobile
      { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, // Desktop
      { wch: 16 } // Error
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PageSpeed');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    setExcelUrl(url);
  };

  return (
    <div className="container">
      <h1>PageSpeed Report Generator</h1>
      <p>Enter up to 30 URLs below. Click 'Generate' to get PageSpeed metrics and download as Excel.</p>
      <div style={{ marginBottom: 16 }}>
        {/* Device checkboxes removed, always fetch both */}
        <b>Both Mobile & Desktop metrics will be included for each URL.</b>
      </div>
      <form onSubmit={e => { e.preventDefault(); generateReports(); }}>
        <div className="url-input-row">
          <textarea
            value={urls.join('\n')}
            onChange={e => handleBulkInput(e.target.value)}
            placeholder={"Paste up to 30 URLs, one per line, comma, or space separated"}
            rows={8}
            style={{ width: '100%', fontSize: '1.1em', padding: 10, resize: 'vertical', marginBottom: 12 }}
            required
          />
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
                <th>Mobile FCP (ms)</th>
                <th>Mobile LCP (ms)</th>
                <th>Mobile CLS</th>
                <th>Mobile INP (ms)</th>
                <th>Desktop FCP (ms)</th>
                <th>Desktop LCP (ms)</th>
                <th>Desktop CLS</th>
                <th>Desktop INP (ms)</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.url}</td>
                  <td>{r.mobile_fcp ?? ''}</td>
                  <td>{r.mobile_lcp ?? ''}</td>
                  <td>{r.mobile_cls ?? ''}</td>
                  <td>{r.mobile_inp ?? ''}</td>
                  <td>{r.desktop_fcp ?? ''}</td>
                  <td>{r.desktop_lcp ?? ''}</td>
                  <td>{r.desktop_cls ?? ''}</td>
                  <td>{r.desktop_inp ?? ''}</td>
                  <td>{r.error ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop: '1em', fontSize: '0.95em'}}>
            <b>Metric definitions (percentile values, real user data):</b><br/>
            <ul>
              <li><b>FCP</b>: First Contentful Paint (ms)</li>
              <li><b>LCP</b>: Largest Contentful Paint (ms)</li>
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
