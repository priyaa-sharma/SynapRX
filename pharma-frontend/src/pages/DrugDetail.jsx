import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchDrug, fetchInteractionsFor } from '../api/client';
import { useApi } from '../api/useApi';
import RiskBadge from '../components/RiskBadge';

const tabs = [
  { id: 'mechanism', label: 'Mechanism' },
  { id: 'interactions', label: 'Interactions' },
  { id: 'metabolism', label: 'Metabolism' },
  { id: 'history', label: 'History' },
];

export default function DrugDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('mechanism');

  const { data: drug, loading, error } = useApi(() => fetchDrug(id), [id]);
  const { data: drugInteractions } = useApi(
    () => (drug ? fetchInteractionsFor(drug.id) : Promise.resolve([])),
    [drug?.id]
  );

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading…</p>;
  }

  if (error || !drug) {
    return (
      <div>
        <p style={{ color: 'var(--danger)', fontSize: 14 }}>
          {error ? `Couldn't load this drug (${error}).` : `No drug found for "${id}".`}
        </p>
        <Link to="/">← Back to drug list</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>← Drugs</Link>

      <header style={{ margin: '14px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, margin: 0 }}>
              {drug.name}
            </h1>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {(drug.brand_names || []).join(', ')}
            </span>
          </div>
          <span
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent-text)',
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 'var(--radius)',
            }}
          >
            {drug.class}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 0' }}>
          Approved {drug.approval_year} · half-life {drug.half_life_hours ? `${drug.half_life_hours} hours` : 'not recorded'}
        </p>
      </header>

      <div style={{ display: 'flex', gap: 20, borderBottom: '0.5px solid var(--border)', marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              borderRadius: 0,
              background: 'none',
              padding: '8px 2px',
              fontSize: 14,
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: tab === t.id ? 500 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mechanism' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Primary targets and receptor activity
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {drug.mechanisms.map((m, i) => (
              <div key={i} style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Target</div>
                <div style={{ fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{m.target}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.action}</div>
              </div>
            ))}
            {drug.mechanisms.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No mechanism data recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'interactions' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Notable interaction risks
          </p>
          {(!drugInteractions || drugInteractions.length === 0) && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No interactions recorded for this drug yet.</p>
          )}
          <div style={{ border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {drugInteractions?.map((interaction, i) => (
              <div
                key={i}
                onClick={() => navigate(`/explorer/${drug.id}`)}
                style={{
                  padding: '13px 16px',
                  borderTop: i === 0 ? 'none' : '0.5px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{interaction.other_name}</span>
                  <RiskBadge risk={interaction.risk_level} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{interaction.risk_label}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate(`/explorer/${drug.id}`)} style={{ marginTop: 16 }}>
            Open in explorer ↗
          </button>
        </div>
      )}

      {tab === 'metabolism' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Liver enzyme pathways (CYP450)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {drug.metabolism.map((m, i) => (
              <div key={i} style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{m.enzyme}</div>
                <div style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>
                  {m.role}{m.strength ? ` (${m.strength})` : ''}
                </div>
              </div>
            ))}
            {drug.metabolism.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No metabolism data recorded yet.</p>
            )}
          </div>
          <button onClick={() => navigate('/metabolism')} style={{ marginTop: 16 }}>
            Compare across drugs ↗
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div style={{ borderLeft: '0.5px solid var(--border)', paddingLeft: 16, marginLeft: 4 }}>
          {drug.history.map((h, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>{h.year_label}</div>
              <p style={{ fontSize: 14, margin: 0 }}>{h.description}</p>
            </div>
          ))}
          {drug.history.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No history recorded yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
