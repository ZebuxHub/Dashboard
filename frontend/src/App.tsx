import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './contexts/SocketContext';
import { ApiProvider } from './contexts/ApiContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TokenGenerator from './pages/TokenGenerator';
import PlayerDetail from './pages/PlayerDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-dark-900 flex items-center justify-center">
        <div className="glass-card rounded-3xl p-8 text-center">
          <div className="animate-spin-slow w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Zebux Dashboard</h2>
          <p className="text-gray-300">Loading your universal game tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ApiProvider>
        <SocketProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-dark-900">
              <Routes>
                {/* Public Routes */}
                <Route path="/token" element={<TokenGenerator />} />
                <Route path="/about" element={<About />} />
                
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminDashboard />} />
                
                {/* Protected Routes with Layout */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Navigate to="/" replace />} />
                  <Route path="player/:playerId" element={<PlayerDetail />} />
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {/* Global Toast Notifications */}
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
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </SocketProvider>
      </ApiProvider>
    </ThemeProvider>
  );
}

export default App;
