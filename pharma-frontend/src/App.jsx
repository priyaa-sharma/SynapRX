import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Home from './pages/Home';
import DrugDetail from './pages/DrugDetail';
import Explorer from './pages/Explorer';
import Metabolism from './pages/Metabolism';
import History from './pages/History';
import Ask from './pages/Ask';
import AuthPage from './pages/AuthPage';

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setAuthLoading(false);
      }
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setAuthError(error.message);
        } else {
          setSession(data.session);
        }
        setAuthLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(error.message || 'Could not verify your session.');
        setAuthLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (location.pathname === '/login') {
    return <AuthPage />;
  }

  if (authLoading) return null;

  if (authError) {
    return <p role="alert">Could not verify your login: {authError}</p>;
  }

  if (!session) {
    if (location.pathname !== '/') {
      return <Navigate to="/login" replace />;
    }
    return <Landing onExplore={() => navigate('/login')} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 40px', maxWidth: 980 }}>
        <div key={location.pathname} className="page-enter">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/drug/:id" element={<DrugDetail />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/explorer/:id" element={<Explorer />} />
            <Route path="/metabolism" element={<Metabolism />} />
            <Route path="/history" element={<History />} />
            <Route path="/ask" element={<Ask />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}