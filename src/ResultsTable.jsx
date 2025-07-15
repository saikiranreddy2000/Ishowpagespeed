import React from 'react';

export default function ResultsTable({ results }) {
  if (!results.length) return null;
  return (
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
            <th>Desktop Lighthouse Performance</th>
            <th>Desktop FCP (s)</th>
            <th>Desktop LCP (s)</th>
            <th>Desktop CLS</th>
            <th>Desktop INP (ms)</th>
            <th>Desktop Data Source</th>
            <th>Visualization</th>
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
