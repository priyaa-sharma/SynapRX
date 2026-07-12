import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import DrugDetail from './pages/DrugDetail';
import Explorer from './pages/Explorer';
import Metabolism from './pages/Metabolism';
import History from './pages/History';
import Ask from './pages/Ask';

export default function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 40px', maxWidth: 980 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/drug/:id" element={<DrugDetail />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/explorer/:id" element={<Explorer />} />
          <Route path="/metabolism" element={<Metabolism />} />
          <Route path="/history" element={<History />} />
          <Route path="/ask" element={<Ask />} />
        </Routes>
      </main>
    </div>
  );
}
