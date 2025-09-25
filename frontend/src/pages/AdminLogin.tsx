import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        toast.success('Login successful!');
        navigate('/admin');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Login error');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-dark-900 flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🔐 Admin Login
          </h1>
          <p className="text-gray-300">
            Access the admin dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full input-glass rounded-xl px-4 py-3 focus-ring"
              placeholder="Enter admin username"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full input-glass rounded-xl px-4 py-3 focus-ring"
              placeholder="Enter admin password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button-enhanced py-4 px-6 rounded-xl text-white font-medium disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="spinner mr-3"></div>
                Logging in...
              </div>
            ) : (
              '🚀 Login'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
