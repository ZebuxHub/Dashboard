import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { ApiProvider } from './contexts/ApiContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TokenGenerator from './pages/TokenGenerator';
import PlayerDetail from './pages/PlayerDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';

function App() {
  return (
    <ThemeProvider>
      <ApiProvider>
        <SocketProvider>
          <Router>
            <div className="App">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                  },
                }}
              />
              
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="player/:playerId" element={<PlayerDetail />} />
                </Route>
                <Route path="/token" element={<TokenGenerator />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </div>
          </Router>
        </SocketProvider>
      </ApiProvider>
    </ThemeProvider>
  );
}

export default App;