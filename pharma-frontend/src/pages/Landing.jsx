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
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawRule {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes signal {
          0%   { stroke-dashoffset: 12; }
          20%  { stroke-dashoffset: -100; }
          100% { stroke-dashoffset: -100; }
        }
        @keyframes nodePulse {
          0%   { transform: scale(1);   stroke: var(--border-strong); }
          4%   { transform: scale(1.35); stroke: var(--accent); }
          12%  { transform: scale(1);   stroke: var(--border-strong); }
          100% { transform: scale(1);   stroke: var(--border-strong); }
        }

        .rise {
          animation: fadeUp 0.8s ease-out both;
        }
        .rule {
          width: 28px;
          height: 1px;
          background: var(--accent);
          transform-origin: center;
          animation: drawRule 0.8s ease-out 0.35s both;
        }
        .signal-line {
          stroke: var(--accent);
          stroke-width: 1.5;
          stroke-dasharray: 12 88;
          stroke-dashoffset: 12;
          animation: signal 4.5s linear infinite;
        }
        .node {
          fill: var(--surface-2);
          stroke: var(--border-strong);
          stroke-width: 1.5;
          transform-box: fill-box;
          transform-origin: center;
          animation: nodePulse 4.5s ease-in-out infinite;
        }
        .landing-btn {
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 12px 28px;
          font-size: 14px;
          font-weight: 500;
          border-radius: var(--radius);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .landing-btn:hover {
          background: var(--accent-text);
        }
        .landing-btn .arrow {
          display: inline-block;
          transition: transform 0.25s ease;
        }
        .landing-btn:hover .arrow {
          transform: translateX(5px);
        }
      `}</style>

      <div
        className="rise"
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
        className="rise"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--accent-text)',
          marginBottom: 12,
          animationDelay: '0.15s',
        }}
      >
        RX
      </div>
      <div className="rule" style={{ marginBottom: 40 }} />

      <h1
        className="rise"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 40,
          fontWeight: 300,
          lineHeight: 1.25,
          margin: '0 0 20px',
          maxWidth: 620,
          color: 'var(--text-primary)',
          animationDelay: '0.5s',
        }}
      >
        Your intelligent drug explorer.
      </h1>

      <p
        className="rise"
        style={{
          fontSize: 15,
          fontWeight: 400,
          color: 'var(--text-secondary)',
          maxWidth: 480,
          lineHeight: 1.7,
          margin: '0 0 8px',
          animationDelay: '0.65s',
        }}
      >
        Explore, analyze, and ask questions about drug mechanisms,
        interactions, and metabolism.
      </p>
      <p
        className="rise"
        style={{
          fontSize: 13,
          fontWeight: 400,
          color: 'var(--text-muted)',
          maxWidth: 460,
          lineHeight: 1.7,
          margin: '0 0 48px',
          animationDelay: '0.8s',
        }}
      >
        A structured pharmacology reference built on a curated drug graph,
        expandable from public sources including RxNorm and OpenFDA, with
        a grounded Q&A assistant for exploring the data conversationally.
      </p>

      <button
        className="landing-btn rise"
        onClick={onExplore}
        style={{ animationDelay: '0.95s' }}
      >
        Explore SynapRX
        <span className="arrow" aria-hidden="true">→</span>
      </button>

      <svg
        className="rise"
        width="360"
        height="80"
        viewBox="0 0 360 80"
        aria-hidden="true"
        style={{ marginTop: 56, maxWidth: '100%', animationDelay: '1.15s' }}
      >
        {/* base connections */}
        <line x1="20" y1="42" x2="100" y2="18" stroke="var(--border)" strokeWidth="1.5" />
        <line x1="100" y1="18" x2="180" y2="56" stroke="var(--border)" strokeWidth="1.5" />
        <line x1="180" y1="56" x2="260" y2="22" stroke="var(--border)" strokeWidth="1.5" />
        <line x1="260" y1="22" x2="340" y2="44" stroke="var(--border)" strokeWidth="1.5" />

        {/* travelling signal, staggered along the chain */}
        <line className="signal-line" pathLength="100" x1="20" y1="42" x2="100" y2="18" style={{ animationDelay: '0s' }} />
        <line className="signal-line" pathLength="100" x1="100" y1="18" x2="180" y2="56" style={{ animationDelay: '0.9s' }} />
        <line className="signal-line" pathLength="100" x1="180" y1="56" x2="260" y2="22" style={{ animationDelay: '1.8s' }} />
        <line className="signal-line" pathLength="100" x1="260" y1="22" x2="340" y2="44" style={{ animationDelay: '2.7s' }} />

        {/* nodes pulse as the signal arrives */}
        <circle className="node" cx="20" cy="42" r="6" style={{ animationDelay: '0s' }} />
        <circle className="node" cx="100" cy="18" r="6" style={{ animationDelay: '0.9s' }} />
        <circle className="node" cx="180" cy="56" r="6" style={{ animationDelay: '1.8s' }} />
        <circle className="node" cx="260" cy="22" r="6" style={{ animationDelay: '2.7s' }} />
        <circle className="node" cx="340" cy="44" r="6" style={{ animationDelay: '3.6s' }} />
      </svg>

      <p
        className="rise"
        style={{
          fontSize: 11,
          fontWeight: 300,
          color: 'var(--text-muted)',
          marginTop: 24,
          maxWidth: 400,
          lineHeight: 1.6,
          animationDelay: '1.3s',
        }}
      >
        Educational reference only. Not medical advice.
      </p>
    </div>
  );
}