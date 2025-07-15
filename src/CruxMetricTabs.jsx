import React, { useState } from 'react';
import CruxGraphChart from './CruxGraphChart';

const METRICS = [
  { key: 'largest_contentful_paint', label: 'LCP' },
  { key: 'cumulative_layout_shift', label: 'CLS' },
  { key: 'interaction_to_next_paint', label: 'INP' },
];

export default function CruxMetricTabs({ cruxData, formFactor }) {
    console.log(cruxData,'Chartfile')
  const [selected, setSelected] = useState('largest_contentful_paint');
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
        {METRICS.map(m => (
          <button
            key={m.key}
            style={{
              background: selected === m.key ? '#0078d4' : '#eee',
              color: selected === m.key ? '#fff' : '#333',
              border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontWeight: 500
            }}
            onClick={() => setSelected(m.key)}
          >{m.label}</button>
        ))}
      </div>
      <b>Historical data (formFactor: {formFactor})</b>
      <CruxGraphChart cruxData={cruxData} metric={selected} />
      {/* Debug: show available metrics and timeseries for troubleshooting */}
      {/* <pre style={{fontSize:12,background:'#f8f8f8',padding:8}}>{JSON.stringify(cruxData, null, 2)}</pre> */}
    </div>
  );
}
