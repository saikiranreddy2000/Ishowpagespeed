import React from 'react';

export default function ProgressBar({ loading, progress }) {
  if (!(loading || (progress.done === progress.total && progress.total > 0))) return null;
  return (
    <div style={{ margin: '16px 0', width: '100%' }}>
      <div style={{ marginBottom: 6, fontWeight: 500 }}>
        {progress.done === progress.total && progress.total > 0 && !loading
          ? (<span style={{ color: '#007a1a' }}>All reports generated!</span>)
          : (<>Generating reports: {progress.done} of {progress.total} completed</>)}
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
          background: progress.done === progress.total && progress.total > 0 ? '#007a1a' : '#0078d4',
          transition: 'width 0.3s',
          borderRadius: 8
        }} />
      </div>
      <div style={{ marginTop: 4, fontSize: 13, color: '#666' }}>
        {progress.done === progress.total && progress.total > 0 && !loading
          ? 'All URLs processed.'
          : `Pending: ${progress.total - progress.done} URLs`}
      </div>
    </div>
  );
}
