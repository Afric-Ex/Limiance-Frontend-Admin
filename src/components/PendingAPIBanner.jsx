import React from 'react';

function PendingAPIBanner({ title, endpoints }) {
  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: 6,
          padding: '1rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#92400e'
        }}>
          <strong>Backend API Required</strong> — this queue is scaffolded but cannot display data or accept actions until the following endpoints are implemented.
        </div>
        <ul style={{ margin: 0, padding: '0 0 0 1.25rem', lineHeight: 1.8 }}>
          {endpoints.map(ep => <li key={ep}><code style={{ background: '#f3f4f6', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.8rem' }}>{ep}</code></li>)}
        </ul>
      </div>
    </div>
  );
}

export default PendingAPIBanner;
