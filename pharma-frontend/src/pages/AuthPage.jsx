import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AuthPage() {
  const [mode, setMode] = useState('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.state?.signupSuccess) return;

    setMode('sign-in');
    setEmail(location.state.email || '');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setMessage('Your account has been created. Please check your email and verify your address before logging in.');
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
      } else if (data.session) {
        if (window.location.hash.includes('type=recovery')) {
          setMode('reset-password');
        } else {
          navigate('/', { replace: true });
        }
      }
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  function changeMode(nextMode) {
    setMode(nextMode);
    setMessage('');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if ((mode === 'sign-up' || mode === 'reset-password') && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'reset-password') {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setPassword('');
        setConfirmPassword('');
        setMode('sign-in');
        setMessage('Your password has been updated. You can now sign in with it.');
      } else if (mode === 'sign-up') {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        if (data.session) {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) throw signOutError;
        }
        navigate('/login', {
          replace: true,
          state: { signupSuccess: true, email },
        });
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        if (data.session) {
          navigate('/', { replace: true });
        } else {
          setError('Sign in succeeded but no session was returned. Please try again.');
        }
      }
    } catch (authError) {
      setError(authError.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first, then choose Forgot password.');
      setMessage('');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (authError) throw authError;
      setMessage('If an account exists for that email, a password reset link will be sent.');
    } catch (authError) {
      setError(authError.message || 'Could not request a password reset.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/login` },
      });
      if (authError) throw authError;
    } catch (authError) {
      setError(authError.message || 'Google sign-in could not be started.');
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" to="/" aria-label="SynapRX home">
          <span>SYNAP</span>
          <strong>RX</strong>
        </Link>
        <div className="auth-rule" />
        <p className="auth-eyebrow">
          {mode === 'reset-password' ? 'ACCOUNT RECOVERY' : 'WELCOME TO SYNAPRX'}
        </p>
        <h1 id="auth-title">
          {mode === 'sign-up'
            ? 'Create your account'
            : mode === 'reset-password'
              ? 'Choose a new password'
              : 'Welcome back'}
        </h1>
        <p className="auth-intro">
          {mode === 'sign-up'
            ? 'Save your place and explore pharmacology with SynapRX.'
            : mode === 'reset-password'
              ? 'Use a new password for your SynapRX account.'
              : 'Sign in to continue to your drug explorer.'}
        </p>

        {mode === 'sign-in' && message && (
          <p className="auth-feedback success" role="status">{message}</p>
        )}

        {mode !== 'reset-password' && <div className="auth-tabs" role="tablist" aria-label="Account options">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'sign-in'}
            className={mode === 'sign-in' ? 'active' : ''}
            onClick={() => changeMode('sign-in')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'sign-up'}
            className={mode === 'sign-up' ? 'active' : ''}
            onClick={() => changeMode('sign-up')}
          >
            Create account
          </button>
        </div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'sign-up' && (
            <label>
              Name
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          )}
          {mode !== 'reset-password' && (
            <label>
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
          )}
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === 'reset-password' ? 'New password' : 'Enter your password'}
              minLength={6}
              required
            />
          </label>
          {(mode === 'sign-up' || mode === 'reset-password') && (
            <label>
              Confirm password
              <input
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                minLength={6}
                required
              />
            </label>
          )}

          {mode === 'sign-in' && (
            <button
              className="auth-forgot"
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Forgot password?
            </button>
          )}

          {error && <p className="auth-feedback error" role="alert">{error}</p>}
          {message && mode !== 'sign-in' && (
            <p className="auth-feedback success" role="status">{message}</p>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? 'Please wait…'
              : mode === 'sign-up'
                ? 'Create account'
                : mode === 'reset-password'
                  ? 'Update password'
                  : 'Sign in'}
          </button>
        </form>

        {mode !== 'reset-password' && (
          <>
            <div className="auth-divider"><span>or continue with</span></div>
            <button
              className="auth-google"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18">
                <path fill="#4285F4" d="M19.6 10.23c0-.68-.06-1.36-.18-2.02H10v3.83h5.39a4.62 4.62 0 0 1-2 3.03v2.48h3.24c1.9-1.75 2.97-4.33 2.97-7.32Z" />
                <path fill="#34A853" d="M10 20c2.7 0 4.97-.9 6.63-2.45l-3.24-2.48c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.75-5.59-4.1H1.07v2.55A10 10 0 0 0 10 20Z" />
                <path fill="#FBBC05" d="M4.41 11.92a6 6 0 0 1 0-3.84V5.53H1.07a10 10 0 0 0 0 8.94l3.34-2.55Z" />
                <path fill="#EA4335" d="M10 3.98c1.47 0 2.8.5 3.84 1.52l2.88-2.88A9.6 9.6 0 0 0 10 0a10 10 0 0 0-8.93 5.53l3.34 2.55C5.2 5.73 7.4 3.98 10 3.98Z" />
              </svg>
              Sign in with Google
            </button>
          </>
        )}
        <Link className="auth-back" to="/">Back to SynapRX</Link>
        <p className="auth-disclaimer">Educational reference only. Not medical advice.</p>
      </section>
    </main>
  );
}
