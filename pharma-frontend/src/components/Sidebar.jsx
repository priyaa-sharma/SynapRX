import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Drugs', icon: '⬡', end: true },
  { to: '/explorer', label: 'Explorer', icon: '◈' },
  { to: '/metabolism', label: 'Metabolism', icon: '▦' },
  { to: '/history', label: 'History', icon: '⌇' },
  { to: '/ask', label: 'Ask', icon: '◐' },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 210,
        borderRight: '0.5px solid var(--border)',
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 8px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">
            <circle cx="2" cy="7" r="2" fill="var(--accent)" />
            <line x1="4" y1="7" x2="18" y2="7" stroke="var(--accent)" strokeWidth="1" opacity="0.4" />
            <circle cx="20" cy="7" r="2" fill="var(--accent)">
              <animate attributeName="cx" values="4;18;4" dur="3.2s" repeatCount="indefinite" />
            </circle>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em' }}>
            PharmaLens
          </span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 10px',
              borderRadius: 'var(--radius)',
              fontSize: 14,
              color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
            })}
          >
            <span aria-hidden="true" style={{ fontSize: 13, width: 16, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <div
        style={{
          borderTop: '0.5px solid var(--border)',
          paddingTop: 12,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        Educational reference only. Not medical advice.
      </div>
    </aside>
  );
}
