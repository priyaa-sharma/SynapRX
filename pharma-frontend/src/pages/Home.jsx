import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDrugs, fetchClasses } from '../api/client';
import { useApi } from '../api/useApi';

const classGroups = [
  { name: 'Mental health & neurology', classes: ['SSRI', 'SNRI', 'TCA', 'MAOI', 'ADHD medication', 'CNS depressant', 'Anticonvulsant', 'Antipsychotic', 'Other CNS medication', 'Migraine medication'] },
  { name: 'Heart & blood', classes: ['Antihypertensive', 'Anticoagulant', 'Antiplatelet', 'Lipid-lowering'] },
  { name: 'Infections', classes: ['Antibiotic', 'Antifungal', 'Antiviral'] },
  { name: 'Metabolic & hormones', classes: ['Antidiabetic', 'Endocrine therapy', 'Bone health medication', 'Gout medication'] },
  { name: 'Pain & inflammation', classes: ['NSAID', 'Opioid', 'Analgesic / antipyretic'] },
  { name: 'Respiratory & digestive', classes: ['Respiratory medication', 'Gastrointestinal medication', 'Antihistamine'] },
  { name: 'Cancer & immune system', classes: ['Antineoplastic', 'Immunosuppressant'] },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [activeClass, setActiveClass] = useState(null);
  const [classQuery, setClassQuery] = useState('');
  const classFilterRef = useRef(null);

  const { data: classesData } = useApi(() => fetchClasses(), []);
  const classes = useMemo(
    () => (classesData || []).map((c) => c.name).sort((a, b) => a.localeCompare(b)),
    [classesData]
  );
  const groupedClasses = useMemo(() => {
    const assignedClasses = new Set(classGroups.flatMap((group) => group.classes));
    const groups = classGroups.map((group) => ({
      ...group,
      classes: group.classes.filter((name) => classes.includes(name)),
    })).filter((group) => group.classes.length > 0);
    const otherClasses = classes.filter((name) => !assignedClasses.has(name));

    if (otherClasses.length > 0) groups.push({ name: 'Other medications', classes: otherClasses });
    return groups;
  }, [classes]);
  const filteredGroups = useMemo(() => {
    const normalizedQuery = classQuery.trim().toLowerCase();
    return groupedClasses
      .map((group) => ({
        ...group,
        classes: group.classes.filter((name) => name.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((group) => group.classes.length > 0);
  }, [classQuery, groupedClasses]);

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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          type="search"
          placeholder="Search a drug or brand name"
          aria-label="Search a drug or brand name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 'min(100%, 360px)', minHeight: 42, flex: '1 1 260px' }}
        />

        <details ref={classFilterRef} style={{ position: 'relative', flex: '0 1 240px' }}>
          <summary
            style={{
              display: 'flex',
              minHeight: 42,
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '9px 13px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 13,
              listStyle: 'none',
            }}
          >
            <span>{activeClass || 'All classes'}</span>
            <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>▾</span>
          </summary>
          <div
            style={{
              position: 'absolute',
              zIndex: 5,
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              maxHeight: 390,
              overflowY: 'auto',
              padding: 8,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg)',
              boxShadow: '0 12px 30px rgba(61, 36, 16, 0.12)',
            }}
          >
            <input
              type="search"
              placeholder="Find a class…"
              aria-label="Find a drug class"
              value={classQuery}
              onChange={(e) => setClassQuery(e.target.value)}
              style={{ width: '100%', marginBottom: 6 }}
            />
            <button
              type="button"
              aria-pressed={!activeClass}
              onClick={() => {
                setActiveClass(null);
                classFilterRef.current.open = false;
              }}
              style={{
                width: '100%',
                borderColor: !activeClass ? 'var(--border)' : 'transparent',
                background: !activeClass ? 'var(--surface-2)' : 'transparent',
                textAlign: 'left',
              }}
            >
              All classes
            </button>
            {filteredGroups.map((group) => (
              <section key={group.name} style={{ marginTop: 8 }}>
                <h2 style={{ margin: '8px 8px 4px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {group.name}
                </h2>
                {group.classes.map((name) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={activeClass === name}
                    onClick={() => {
                      setActiveClass(name);
                      classFilterRef.current.open = false;
                    }}
                    style={{
                      width: '100%',
                      borderColor: activeClass === name ? 'var(--border)' : 'transparent',
                      background: activeClass === name ? 'var(--surface-2)' : 'transparent',
                      textAlign: 'left',
                    }}
                  >
                    {name}
                  </button>
                ))}
              </section>
            ))}
            {filteredGroups.length === 0 && (
              <p style={{ margin: 8, color: 'var(--text-muted)', fontSize: 12 }}>No matching classes.</p>
            )}
          </div>
        </details>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', minHeight: 30, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {activeClass && (
            <button
              type="button"
              onClick={() => setActiveClass(null)}
              aria-label={`Remove ${activeClass} filter`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 9px',
                borderColor: 'var(--border)',
                background: 'var(--accent-dim)',
                color: 'var(--accent-text)',
                fontSize: 11,
              }}
            >
              {activeClass}<span aria-hidden="true">×</span>
            </button>
          )}
        </div>
        <span aria-live="polite" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {loading ? 'Updating results…' : !error && drugs ? `${drugs.length} ${drugs.length === 1 ? 'drug' : 'drugs'}` : ''}
        </span>
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
                {(d.brand_names || []).join(', ') || 'Generic ingredient'} ·{' '}
                {d.approval_year ? `approved ${d.approval_year}` : 'approval year not recorded'}
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
