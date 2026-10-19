import React from 'react';

function PendingAPIBanner({ title, endpoints }) {
  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div style={{
        background: 'var(--color-background-card)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 8,
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          background: 'var(--warning-bg)',
          border: '1px solid transparent',
          borderRadius: 6,
          padding: '1rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: 'var(--warning-text)'
        }}>
          <strong>Backend API Required</strong> — this queue is scaffolded but cannot display data or accept actions until the following endpoints are implemented.
        </div>
        <ul style={{ margin: 0, padding: '0 0 0 1.25rem', lineHeight: 1.8 }}>
          {endpoints.map(ep => <li key={ep}><code style={{ background: 'var(--color-background-page)', color: 'var(--color-info-text)', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.8rem' }}>{ep}</code></li>)}
        </ul>
      </div>
    </div>
  );
}

export default PendingAPIBanner;
