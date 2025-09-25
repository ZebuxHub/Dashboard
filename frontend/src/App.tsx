import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TokenGenerator from './pages/TokenGenerator';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PlayerDetail from './pages/PlayerDetail';
import About from './pages/About';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="token" element={<TokenGenerator />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="player/:id" element={<PlayerDetail />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}

export default App;
