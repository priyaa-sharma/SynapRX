import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDrugs, fetchDrug, fetchInteractionsFor } from '../api/client';
import { useApi } from '../api/useApi';
import RiskBadge from '../components/RiskBadge';

const riskColor = {
  contraindicated: '#c25a6b',
  caution: '#c78a4a',
  minor: '#a99ba0',
};

export default function Explorer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedPair, setSelectedPair] = useState(null);

  const { data: centerDrug } = useApi(
    () => (id ? fetchDrug(id) : Promise.resolve(null)),
    [id]
  );
  const { data: centerInteractions } = useApi(
    () => (id ? fetchInteractionsFor(id) : Promise.resolve([])),
    [id]
  );

  const { data: suggestions } = useApi(
    () => (query ? fetchDrugs({ search: query }) : Promise.resolve([])),
    [query]
  );

  if (!id || !centerDrug) {
    return (
      <div>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, margin: '0 0 6px' }}>
            Interaction explorer
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Select a medication to see everything it interacts with.
          </p>
        </header>
        <div style={{ position: 'relative', maxWidth: 320 }}>
          <input
            type="search"
            placeholder="Search a drug, e.g. sertraline"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%' }}
          />
          {suggestions && suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                background: 'var(--surface-2)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                zIndex: 1,
              }}
            >
              {suggestions.slice(0, 6).map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/explorer/${d.id}`)}
                  style={{ padding: '9px 12px', fontSize: 13, cursor: 'pointer' }}
                >
                  {d.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const interactionsList = centerInteractions || [];
  const n = interactionsList.length;
  const radius = 130;
  const centerX = 220;
  const centerY = 180;
  const positions = interactionsList.map((_, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, margin: '0 0 4px' }}>
            Interaction explorer
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Centered on <strong style={{ color: 'var(--text-primary)' }}>{centerDrug.name}</strong>
          </p>
        </div>
        <button onClick={() => navigate('/explorer')}>Change drug</button>
      </div>

      <div style={{ display: 'flex', gap: 20, background: 'var(--surface-1)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border)' }}>
        <div style={{ flex: 1, padding: 20 }}>
          <svg width="100%" viewBox="0 0 440 360" role="img" aria-label={`Interaction graph centered on ${centerDrug.name}`}>
            {interactionsList.map((interaction, i) => (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={positions[i].x}
                y2={positions[i].y}
                stroke={riskColor[interaction.risk_level]}
                strokeWidth={interaction.risk_level === 'contraindicated' ? 2 : 1.4}
                strokeDasharray={interaction.risk_level === 'caution' ? '4 3' : 'none'}
                opacity={0.8}
              />
            ))}

            <g onClick={() => setSelectedPair(null)} style={{ cursor: 'pointer' }}>
              <circle cx={centerX} cy={centerY} r={40} fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="1" />
              <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--accent-text)" fontFamily="var(--font-body)">
                {centerDrug.name}
              </text>
            </g>

            {interactionsList.map((interaction, i) => (
              <g
                key={i}
                onClick={() => setSelectedPair(interaction)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={positions[i].x}
                  cy={positions[i].y}
                  r={32}
                  fill={`${riskColor[interaction.risk_level]}22`}
                  stroke={riskColor[interaction.risk_level]}
                  strokeWidth="1"
                />
                <text
                  x={positions[i].x}
                  y={positions[i].y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="11"
                  fill="var(--text-primary)"
                >
                  {interaction.other_name}
                </text>
              </g>
            ))}
          </svg>

          {n === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              No recorded interactions for {centerDrug.name} yet.
            </p>
          )}

          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', padding: '0 8px' }}>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: riskColor.contraindicated, marginRight: 5 }} />Contraindicated</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: riskColor.caution, marginRight: 5 }} />Caution</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: riskColor.minor, marginRight: 5 }} />Minor</span>
          </div>
        </div>

        <div style={{ width: 240, borderLeft: '0.5px solid var(--border)', padding: 20 }}>
          {!selectedPair && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Click a node to see the interaction detail.
            </p>
          )}
          {selectedPair && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>Selected pair</p>
              <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 12px' }}>
                {centerDrug.name} + {selectedPair.other_name}
              </p>
              <div style={{ marginBottom: 12 }}>
                <RiskBadge risk={selectedPair.risk_level} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
                {selectedPair.mechanism_note}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Source: {selectedPair.source}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
