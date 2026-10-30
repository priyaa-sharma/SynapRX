import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchDrug, fetchDrugLabel, fetchInteractionsFor } from '../api/client';
import { useApi } from '../api/useApi';
import RiskBadge from '../components/RiskBadge';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'mechanism', label: 'Mechanism' },
  { id: 'interactions', label: 'Interactions' },
  { id: 'metabolism', label: 'Metabolism' },
  { id: 'history', label: 'History' },
];

function LabelSection({ section }) {
  return (
    <section key={section.key} style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: 14 }}>
      <h3 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 8px' }}>{section.title}</h3>
      <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
        {section.content}
      </p>
      {section.truncated && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 0' }}>
          This section is longer; showing its opening portion.
        </p>
      )}
    </section>
  );
}

function getLabelSection(label, key) {
  return label?.sections?.find((section) => section.key === key);
}

export default function DrugDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const { data: drug, loading, error } = useApi(() => fetchDrug(id), [id]);
  const { data: drugLabel, loading: labelLoading, error: labelError } = useApi(
    () => (drug ? fetchDrugLabel(drug.id) : Promise.resolve(null)),
    [drug?.id]
  );
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

  const mechanismLabel = getLabelSection(drugLabel, 'mechanism_of_action')
    || getLabelSection(drugLabel, 'clinical_pharmacology');
  const metabolismLabels = ['metabolism', 'pharmacokinetics']
    .map((key) => getLabelSection(drugLabel, key))
    .filter(Boolean);
  if (metabolismLabels.length === 0) {
    const clinicalPharmacology = getLabelSection(drugLabel, 'clinical_pharmacology');
    if (clinicalPharmacology) metabolismLabels.push(clinicalPharmacology);
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
          {drug.approval_year ? `Approved ${drug.approval_year}` : 'Approval year not recorded'} · half-life{' '}
          {drug.half_life_hours ? `${drug.half_life_hours} hours` : 'not recorded'}
        </p>
      </header>

      {drugLabel?.stale && drugLabel.refreshError && (
        <p role="status" style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>
          Showing previously cached FDA label data. Refresh failed: {drugLabel.refreshError}
        </p>
      )}

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

      {tab === 'overview' && (
        <div>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: '0 0 18px' }}>
            {drug.class_description || `${drug.name} is listed in the ${drug.class} class.`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {labelLoading && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading current public drug-label information…</p>
            )}
            {labelError && (
              <p role="alert" style={{ fontSize: 13, color: 'var(--danger)' }}>
                FDA/DailyMed details could not be loaded ({labelError}). The locally recorded drug information is still available in the other tabs.
              </p>
            )}
            {!labelLoading && drugLabel && !drugLabel.found && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                No matching FDA label was found for this ingredient. This does not mean the medicine is unapproved or that no information exists.
              </p>
            )}
            {drugLabel?.found && (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Label: {drugLabel.productName}
                  {drugLabel.manufacturer ? ` · ${drugLabel.manufacturer}` : ''}
                  {drugLabel.route ? ` · ${drugLabel.route}` : ''}
                  {drugLabel.effectiveDate ? ` · updated ${drugLabel.effectiveDate}` : ''}
                  {' · '}
                  <a href={drugLabel.sourceUrl} target="_blank" rel="noreferrer">View source label</a>
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
                  OpenFDA reformats manufacturer-submitted labeling; the API content is not verified by FDA. Labels vary by product and are not medical advice.
                </p>
                {drugLabel.sections.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    A label was found, but it contains no readable sections in the returned record.
                  </p>
                )}
                {drugLabel.sections.map((section) => <LabelSection key={section.key} section={section} />)}
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'mechanism' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Curated targets and source-reported mechanism information
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {drug.mechanisms.map((m, i) => (
              <div key={i} style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {m.target === 'NIH RxClass MOA class' ? 'NIH RxClass mechanism class' : m.target}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
                  {m.target === 'NIH RxClass MOA class' ? m.action : m.target}
                </div>
                {m.target !== 'NIH RxClass MOA class' && (
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {m.action}
                  </div>
                )}
                {m.notes && (
                  <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-muted)', margin: '8px 0 0' }}>{m.notes}</p>
                )}
              </div>
            ))}
            {drug.mechanisms.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No mechanism data recorded yet.</p>
            )}
          </div>
          {mechanismLabel && (
            <div style={{ marginTop: 16 }}>
              <LabelSection section={mechanismLabel} />
            </div>
          )}
        </div>
      )}

      {tab === 'interactions' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Notable interaction risks
          </p>
          {(!drugInteractions || drugInteractions.length === 0) && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No curated pairwise interaction records for this drug. Check the product-label information below when available; the graph is not a complete interaction checker.
            </p>
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
          {getLabelSection(drugLabel, 'drug_interactions') && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Product-label information; not a complete interaction checker.
              </p>
              <LabelSection section={getLabelSection(drugLabel, 'drug_interactions')} />
            </div>
          )}
          <button onClick={() => navigate(`/explorer/${drug.id}`)} style={{ marginTop: 16 }}>
            Open in explorer ↗
          </button>
        </div>
      )}

      {tab === 'metabolism' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Recorded CYP450 enzyme pathways
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
          {metabolismLabels.map((section) => (
            <div key={section.key} style={{ marginTop: 16 }}>
              <LabelSection section={section} />
            </div>
          ))}
          {drug.metabolism.length === 0 && metabolismLabels.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              No CYP450 pathway records or matching label metabolism sections are available for this drug.
            </p>
          )}
          <button onClick={() => navigate('/metabolism')} style={{ marginTop: 16 }}>
            Compare across drugs ↗
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', marginTop: 0 }}>
            DailyMed records revisions to product labels, not a medicine’s discovery or FDA-approval history. Historical milestones appear only when recorded in this project’s curated data.
          </p>
          {drug.history.map((h, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>{h.year_label}</div>
              <strong style={{ fontSize: 14 }}>{h.title}</strong>
              <p style={{ fontSize: 14, margin: '4px 0 0' }}>{h.description}</p>
            </div>
          ))}
          {drugLabel?.labelHistory?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 500 }}>Product-label revisions</h3>
              {drugLabel.labelHistory.map((entry, i) => (
                <div key={`${entry.version}-${entry.publishedDate}-${i}`} style={{ marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Version {entry.version}</strong>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {entry.publishedDate ? ` · published ${entry.publishedDate}` : ''}
                  </span>
                </div>
              ))}
              {drugLabel.historySource && (
                <a href={drugLabel.historySource} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                  DailyMed revision history source
                </a>
              )}
            </div>
          )}
          {drugLabel?.historyError && (
            <p role="status" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{drugLabel.historyError}</p>
          )}
          {drug.history.length === 0 && !drugLabel?.labelHistory?.length && !drugLabel?.historyError && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No drug-specific historical milestones or label revisions are available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
