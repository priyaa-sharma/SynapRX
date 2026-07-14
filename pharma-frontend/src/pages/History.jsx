import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHistory, fetchClasses } from '../api/client';
import { useApi } from '../api/useApi';

export default function History() {
  const [activeClass, setActiveClass] = useState(null);

  const { data: classesData } = useApi(() => fetchClasses(), []);
  const classes = (classesData || []).map((c) => c.name);

  const { data: events, loading } = useApi(
    () => fetchHistory({ drugClass: activeClass || undefined }),
    [activeClass]
  );

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, margin: '0 0 6px' }}>
          History timeline
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
          Trace drug development from historical discovery to modern approval.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveClass(null)}
            style={{
              background: !activeClass ? 'var(--accent-dim)' : 'transparent',
              borderColor: !activeClass ? 'var(--accent)' : 'var(--border-strong)',
              color: !activeClass ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            All
          </button>
          {classes.map((c) => (
            <button
              key={c}
              onClick={() => setActiveClass(c)}
              style={{
                background: activeClass === c ? 'var(--accent-dim)' : 'transparent',
                borderColor: activeClass === c ? 'var(--accent)' : 'var(--border-strong)',
                color: activeClass === c ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <div style={{ position: 'relative', paddingLeft: 100 }}>
        <div style={{ position: 'absolute', left: 90, top: 6, bottom: 6, width: 1, background: 'var(--border)' }} />
        {(events || []).map((e, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: 24 }}>
            <div style={{ position: 'absolute', left: -100, width: 80, textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {e.year_label}
            </div>
            <div style={{ position: 'absolute', left: -14, top: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
            <div style={{ paddingLeft: 8 }}>
              {e.drug_id ? (
                <Link to={`/drug/${e.drug_id}`} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {e.drug_name || e.title}
                </Link>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 500 }}>{e.title}</span>
              )}
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{e.description}</p>
            </div>
          </div>
        ))}
        {!loading && events && events.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No history events for this class yet.</p>
        )}
      </div>
    </div>
  );
}
