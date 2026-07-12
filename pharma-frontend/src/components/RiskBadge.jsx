const styles = {
  contraindicated: { bg: 'var(--danger-dim)', text: 'var(--danger)' },
  caution: { bg: 'var(--warning-dim)', text: 'var(--warning)' },
  minor: { bg: 'var(--minor-dim)', text: 'var(--text-secondary)' },
};

export default function RiskBadge({ risk }) {
  const s = styles[risk] || styles.minor;
  return (
    <span
      style={{
        background: s.bg,
        color: s.text,
        fontSize: 12,
        padding: '3px 9px',
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap',
      }}
    >
      {risk}
    </span>
  );
}
