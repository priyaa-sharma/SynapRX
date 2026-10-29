import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const navItems = [
  { to: '/', label: 'Drugs', end: true },
  { to: '/explorer', label: 'Explorer' },
  { to: '/metabolism', label: 'Metabolism' },
  { to: '/history', label: 'History' },
  { to: '/ask', label: 'Ask' },
];

export default function Sidebar() {
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setSignOutError(error.message);
    } catch (error) {
      setSignOutError(error.message || 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside
      style={{
        width: 220,
        borderRight: '1px solid var(--border)',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 300,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
          }}
        >
          Synap
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent-text)',
            }}
          >
            RX
          </span>
        </div>
        <div style={{ width: 28, height: 1, background: 'var(--accent)', marginTop: 6 }} />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              fontSize: 14,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
              background: isActive ? 'var(--surface-3)' : 'transparent',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {signOutError && (
        <p role="alert" style={{ color: 'var(--danger)', fontSize: 11, lineHeight: 1.5 }}>
          Could not sign out: {signOutError}
        </p>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        style={{ width: '100%', marginBottom: 14 }}
      >
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 14,
          fontSize: 11,
          fontWeight: 300,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        Educational reference only. Not medical advice.
      </div>
    </aside>
  );
}
