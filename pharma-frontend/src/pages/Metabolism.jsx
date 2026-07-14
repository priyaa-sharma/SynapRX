import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchMetabolism, fetchMetabolismOverlaps, fetchDrugs } from '../api/client';
import { useApi } from '../api/useApi';

const enzymes = ['CYP2D6', 'CYP3A4', 'CYP2C19', 'CYP1A2', 'CYP2B6'];

const strengthStyle = {
  strong: { bg: 'var(--danger-dim)', color: 'var(--danger)' },
  moderate: { bg: 'var(--warning-dim)', color: 'var(--warning)' },
  weak: { bg: 'var(--warning-dim)', color: 'var(--warning)' },
};

export default function Metabolism() {
  const { data: allDrugs } = useApi(() => fetchDrugs(), []);
  const { data: metabolismRows } = useApi(() => fetchMetabolism(), []);
  const { data: overlaps } = useApi(() => fetchMetabolismOverlaps(), []);

  const byDrug = useMemo(() => {
    const map = new Map();
    (metabolismRows || []).forEach((row) => {
      if (!map.has(row.drug_id)) map.set(row.drug_id, { id: row.drug_id, name: row.drug_name, entries: [] });
      map.get(row.drug_id).entries.push(row);
    });
    return [...map.values()];
  }, [metabolismRows]);

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, margin: '0 0 6px' }}>
          CYP450 metabolism dashboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
          Check which drugs share liver enzyme pathways.
        </p>
      </header>

      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }} />
              {enzymes.map((e) => (
                <th key={e} style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {e}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byDrug.map((d) => (
              <tr key={d.id}>
                <td style={{ padding: '8px 12px', fontWeight: 500, borderTop: '0.5px solid var(--border)' }}>
                  <Link to={`/drug/${d.id}`}>{d.name}</Link>
                </td>
                {enzymes.map((enzyme) => {
                  const entry = d.entries.find((m) => m.enzyme === enzyme);
                  const style = entry?.role === 'inhibitor' ? strengthStyle[entry.strength] : null;
                  return (
                    <td
                      key={enzyme}
                      style={{
                        textAlign: 'center',
                        padding: '8px 12px',
                        borderTop: '0.5px solid var(--border)',
                        background: style?.bg,
                        color: style?.color || 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      {entry ? (entry.role === 'substrate' ? 'substrate' : `${entry.strength} inhibitor`) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
            {byDrug.length === 0 && (
              <tr><td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--danger)', marginRight: 5, verticalAlign: -1 }} />Strong inhibitor</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--warning)', marginRight: 5, verticalAlign: -1 }} />Weak/moderate inhibitor</span>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, margin: '0 0 12px' }}>
        Auto-flagged overlaps
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
        Pairs where one drug strongly or moderately inhibits an enzyme the other depends on to metabolize.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(overlaps || []).map((o, i) => {
          const inhibitorDrug = (allDrugs || []).find((d) => d.name === o.inhibitor_name);
          const substrateDrug = (allDrugs || []).find((d) => d.name === o.substrate_name);
          return (
            <div
              key={i}
              style={{
                background: 'var(--warning-dim)',
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--warning)',
              }}
            >
              {inhibitorDrug ? (
                <Link to={`/drug/${inhibitorDrug.id}`} style={{ color: 'var(--warning)', fontWeight: 500 }}>{o.inhibitor_name}</Link>
              ) : <strong>{o.inhibitor_name}</strong>}
              {' '}({o.inhibitor_strength} {o.enzyme} inhibitor) may slow clearance of{' '}
              {substrateDrug ? (
                <Link to={`/drug/${substrateDrug.id}`} style={{ color: 'var(--warning)', fontWeight: 500 }}>{o.substrate_name}</Link>
              ) : <strong>{o.substrate_name}</strong>}
              {' '}(a {o.enzyme} substrate).
            </div>
          );
        })}
        {overlaps && overlaps.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No overlaps detected in the current dataset.</p>
        )}
      </div>
    </div>
  );
}
