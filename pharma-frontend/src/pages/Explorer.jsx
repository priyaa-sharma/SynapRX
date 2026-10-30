import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchDrugs, fetchDrug, fetchDrugLabel, fetchInteractionsFor } from '../api/client';
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

  const { data: centerDrug, loading: drugLoading, error: drugError } = useApi(
    () => (id ? fetchDrug(id) : Promise.resolve(null)),
    [id]
  );
  const {
    data: centerInteractions,
    loading: interactionsLoading,
    error: interactionsError,
  } = useApi(
    () => (centerDrug ? fetchInteractionsFor(centerDrug.id) : Promise.resolve([])),
    [centerDrug?.id]
  );
  const { data: centerLabel, loading: labelLoading, error: labelError } = useApi(
    () => (centerDrug ? fetchDrugLabel(centerDrug.id) : Promise.resolve(null)),
    [centerDrug?.id]
  );
  const { data: suggestions } = useApi(
    () => (query ? fetchDrugs({ search: query }) : Promise.resolve([])),
    [query]
  );
  const {
    data: catalog,
    loading: catalogLoading,
    error: catalogError,
  } = useApi(
    () => (id ? Promise.resolve([]) : fetchDrugs()),
    [id]
  );
  const catalogGroups = (catalog || []).reduce((groups, drug) => {
    const group = groups.find((item) => item.name === drug.class);
    if (group) group.drugs.push(drug);
    else groups.push({ name: drug.class, drugs: [drug] });
    return groups;
  }, []);

  if (!id || (!centerDrug && drugLoading)) {
    return (
      <div>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, margin: '0 0 6px' }}>
            Interaction explorer
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Select a medication to see recorded interaction pairs. This is not a complete interaction checker.
          </p>
        </header>
        <div style={{ position: 'relative', maxWidth: 320 }}>
          <input
            type="search"
            placeholder="Search a drug, e.g. sertraline"
            aria-label="Search a drug"
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
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setQuery('');
                    navigate(`/explorer/${d.id}`);
                  }}
                  style={{ display: 'block', width: '100%', border: 0, borderRadius: 0, padding: '9px 12px', textAlign: 'left', fontSize: 13 }}
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <section style={{ marginTop: 32, maxWidth: 900 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, margin: '0 0 4px' }}>
                Browse medications
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                Choose a medication to view its recorded interaction pairs.
              </p>
            </div>
            {!catalogLoading && !catalogError && catalog && (
              <span style={{ flexShrink: 0, color: 'var(--text-muted)', fontSize: 12 }}>
                {catalog.length} {catalog.length === 1 ? 'drug' : 'drugs'}
              </span>
            )}
          </div>
          {catalogLoading && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading the medication catalog…</p>
          )}
          {catalogError && (
            <p role="alert" style={{ fontSize: 13, color: 'var(--danger)' }}>
              Could not load the medication catalog ({catalogError}).
            </p>
          )}
          {!catalogLoading && !catalogError && catalogGroups.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No medications are available to browse.</p>
          )}
          {!catalogLoading && !catalogError && catalogGroups.length > 0 && (
            <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 8 }}>
              {catalogGroups.map((group) => (
                <section key={group.name} style={{ marginBottom: 18 }}>
                  <h3 style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {group.name}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
                    {group.drugs.map((drug) => (
                      <button
                        key={drug.id}
                        type="button"
                        onClick={() => navigate(`/explorer/${drug.id}`)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left' }}
                      >
                        <span>{drug.name}</span>
                        <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>›</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (drugError || !centerDrug) {
    return (
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500 }}>Interaction explorer</h1>
        <p role="alert" style={{ fontSize: 14, color: 'var(--danger)' }}>
          {drugError ? `Could not load this drug (${drugError}).` : `No drug found for "${id}".`}
        </p>
        <button onClick={() => navigate('/explorer')}>Choose another drug</button>
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

          {interactionsLoading && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              Loading recorded interaction data…
            </p>
          )}

          {interactionsError && (
            <p role="alert" style={{ fontSize: 13, color: 'var(--danger)', textAlign: 'center' }}>
              Could not load interaction records ({interactionsError}).
            </p>
          )}

          {!interactionsLoading && !interactionsError && n === 0 && (
            <div style={{ maxWidth: 460, margin: '8px auto 16px', padding: 14, background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 6px', textAlign: 'center' }}>
                No pairwise interactions are recorded for {centerDrug.name}
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
                This means the database has no curated interaction pairs for this drug. It does not mean the drug has no interactions.
              </p>
            </div>
          )}

          {n > 0 && (
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', padding: '0 8px' }}>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: riskColor.contraindicated, marginRight: 5 }} />Contraindicated</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: riskColor.caution, marginRight: 5 }} />Caution</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: riskColor.minor, marginRight: 5 }} />Minor</span>
            </div>
          )}
        </div>

        <div style={{ width: 240, borderLeft: '0.5px solid var(--border)', padding: 20 }}>
          {!selectedPair && n === 0 && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>Interaction data</p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                {interactionsError
                  ? 'Interaction records could not be retrieved.'
                  : 'Only curated drug-pair records appear as connections in this graph.'}
              </p>
              {labelLoading && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Checking the product label…</p>
              )}
              {labelError && (
                <p role="status" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Product-label interaction text could not be loaded.
                </p>
              )}
              {centerLabel?.sections?.find((section) => section.key === 'drug_interactions') && (
                <>
                  <p style={{ fontSize: 12, fontWeight: 500, margin: '0 0 6px' }}>
                    Product-label interaction text
                  </p>
                  <p style={{ maxHeight: 420, overflowY: 'auto', fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>
                    {centerLabel.sections.find((section) => section.key === 'drug_interactions').content.slice(0, 3000)}
                  </p>
                  {centerLabel.sections.find((section) => section.key === 'drug_interactions').truncated && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Showing the beginning of a longer label section.</p>
                  )}
                  {centerLabel.sourceUrl && (
                    <a href={centerLabel.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                      View source label
                    </a>
                  )}
                </>
              )}
              {centerLabel && !centerLabel.sections?.some((section) => section.key === 'drug_interactions') && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  No interaction section was returned in the matched product label.
                </p>
              )}
              <Link to={`/drug/${centerDrug.id}`} style={{ display: 'block', marginTop: 16, fontSize: 12 }}>
                View full drug profile
              </Link>
            </div>
          )}
          {!selectedPair && n > 0 && (
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
