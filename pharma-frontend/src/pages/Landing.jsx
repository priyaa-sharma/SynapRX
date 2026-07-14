export default function Landing({ onExplore }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 300,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}
      >
        Synap
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--accent-text)',
          marginBottom: 12,
        }}
      >
        RX
      </div>
      <div style={{ width: 28, height: 1, background: 'var(--accent)', marginBottom: 40 }} />

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 40,
          fontWeight: 300,
          lineHeight: 1.25,
          margin: '0 0 20px',
          maxWidth: 620,
          color: 'var(--text-primary)',
        }}
      >
        Your personal drug explorer.
      </h1>

      <p
        style={{
          fontSize: 15,
          fontWeight: 400,
          color: 'var(--text-secondary)',
          maxWidth: 480,
          lineHeight: 1.7,
          margin: '0 0 8px',
        }}
      >
        Explore, analyze, and ask queries about drugs and their mechanisms,
        interactions, and metabolism.
      </p>
      <p
        style={{
          fontSize: 13,
          fontWeight: 400,
          color: 'var(--text-muted)',
          maxWidth: 460,
          lineHeight: 1.7,
          margin: '0 0 48px',
        }}
      >
        SynapRX is a structured pharmacology reference built on a curated drug graph,
        expandable from public sources including RxNorm and OpenFDA, with
        a grounded Q&A assistant for exploring the data conversationally.
      </p>

      <button
        onClick={onExplore}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          padding: '12px 28px',
          fontSize: 14,
          fontWeight: 500,
          borderRadius: 'var(--radius)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-text)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
      >
        Explore SynapRX
      </button>

      <p
        style={{
          fontSize: 11,
          fontWeight: 300,
          color: 'var(--text-muted)',
          marginTop: 40,
          maxWidth: 400,
          lineHeight: 1.6,
        }}
      >
        Educational reference only. Not medical advice.
      </p>
    </div>
  );
}
