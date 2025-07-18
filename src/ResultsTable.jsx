
import React, { useState } from 'react';

const columns = [
  { key: 'sno', label: 'S.no', sortable: false },
  { key: 'url', label: 'URL', sortable: true },
  { key: 'mobile_lighthouse', label: 'Mobile Lighthouse Performance', sortable: true },
  { key: 'mobile_fcp', label: 'Mobile FCP (s)', sortable: true },
  { key: 'mobile_lcp', label: 'Mobile LCP (s)', sortable: true },
  { key: 'mobile_cls', label: 'Mobile CLS', sortable: true },
  { key: 'mobile_inp', label: 'Mobile INP (ms)', sortable: true },
  { key: 'mobile_source', label: 'Mobile Data Source', sortable: false },
  { key: 'desktop_lighthouse', label: 'Desktop Lighthouse Performance', sortable: true },
  { key: 'desktop_fcp', label: 'Desktop FCP (s)', sortable: true },
  { key: 'desktop_lcp', label: 'Desktop LCP (s)', sortable: true },
  { key: 'desktop_cls', label: 'Desktop CLS', sortable: true },
  { key: 'desktop_inp', label: 'Desktop INP (ms)', sortable: true },
  { key: 'desktop_source', label: 'Desktop Data Source', sortable: false },
];

export default function ResultsTable({ results }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  if (!results.length) return null;

  // Sorting logic
  const sortedResults = React.useMemo(() => {
    if (!sortConfig.key) return results;
    const col = columns.find(c => c.key === sortConfig.key);
    if (!col || col.sortable === false) return results;
    const sorted = [...results];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      // Numeric sort if both are numbers
      if (!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal))) {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
      // String sort
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [results, sortConfig]);

  const handleSort = (key) => {
    const col = columns.find(c => c.key === key);
    if (!col || col.sortable === false) return;
    if (sortConfig.key === key) {
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  return (
    <div className="results">
      <h2>Results</h2>
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  cursor: col.sortable === false ? 'default' : 'pointer',
                  userSelect: 'none',
                  position: 'relative',
                  color: '#222',
                  fontWeight: 700
                }}
                onClick={col.sortable === false ? undefined : () => handleSort(col.key)}
              >
                {col.label}
                {col.sortable !== false && (
                  <span style={{ display: 'block', fontSize: '0.9em', lineHeight: '1', height: '16px' }}>
                    {sortConfig.key === col.key ? (
                      sortConfig.direction === 'asc' ? '▲' : '▼'
                    ) : (
                      <span style={{ color: '#bbb' }}>▲▼</span>
                    )}
                  </span>
                )}
              </th>
            ))}
            <th>Visualization</th>
          </tr>
        </thead>
        <tbody>
          {sortedResults.map((r, i) => (
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
              <td style={{ textAlign: 'center', fontSize: '1.3em', cursor: 'pointer' }}
                  onClick={() => window.dispatchEvent(new CustomEvent('showCruxGraph', { detail: { url: r.url, index: i } }))}
              >📈</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="metric-definitions">
        <b>Metric definitions (percentile values, real user data):</b><br />
        <ul>
          <li><b>FCP</b>: First Contentful Paint (s)</li>
          <li><b>LCP</b>: Largest Contentful Paint (s)</li>
          <li><b>CLS</b>: Cumulative Layout Shift</li>
          <li><b>INP</b>: Interaction to Next Paint (ms)</li>
        </ul>
      </div>
    </div>
  );
}
