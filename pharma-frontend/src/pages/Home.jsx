import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchDrugs, fetchClasses } from '../api/client';
import { useApi } from '../api/useApi';

export default function Home() {
  const [query, setQuery] = useState('');
  const [activeClass, setActiveClass] = useState(null);

  const { data: classesData } = useApi(() => fetchClasses(), []);
  const classes = useMemo(() => (classesData || []).map((c) => c.name), [classesData]);

  const { data: drugs, loading, error } = useApi(
    () => fetchDrugs({ search: query || undefined, drugClass: activeClass || undefined }),
    [query, activeClass]
  );

  return (
    <div>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, margin: '0 0 6px' }}>
          Drug reference
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Mechanism, interactions, metabolism, and history.
        </p>
      </header>

      <input
        type="search"
        placeholder="Search a drug or brand name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: 320, marginBottom: 20 }}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          onClick={() => setActiveClass(null)}
          style={{
            background: !activeClass ? 'var(--accent-dim)' : 'transparent',
            borderColor: !activeClass ? 'var(--accent)' : 'var(--border-strong)',
            color: !activeClass ? 'var(--accent-text)' : 'var(--text-secondary)',
          }}
        >
          All classes
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

      {error && (
        <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
          Couldn't reach the backend ({error}). Is it running on {import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}?
        </p>
      )}

      <div
        style={{
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Loading drugs...
          </div>
        )}
        {!loading && !error && drugs?.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No drugs match that search.
          </div>
        )}
        {!loading && drugs?.map((d, i) => (
          <Link
            key={d.id}
            to={`/drug/${d.id}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '13px 18px',
              borderTop: i === 0 ? 'none' : '0.5px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {(d.brand_names || []).join(', ')} · approved {d.approval_year}
              </div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '3px 9px',
              }}
            >
              {d.class}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
