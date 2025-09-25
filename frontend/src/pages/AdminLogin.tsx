import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useApi } from '../contexts/ApiContext';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { apiCall } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiCall('/admin/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (response.success) {
        // Store admin token
        localStorage.setItem('adminToken', response.token);
        toast.success('Login successful!');
        navigate('/admin/dashboard');
      } else {
        toast.error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4">
            <LockClosedIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Login</h1>
          <p className="text-gray-400 mt-2">
            Access the admin dashboard to manage users and monitor system activity
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8 rounded-xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="input-glass w-full px-4 py-3 rounded-lg focus-ring"
                placeholder="Enter admin username"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="input-glass w-full px-4 py-3 rounded-lg focus-ring"
                placeholder="Enter admin password"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !credentials.username || !credentials.password}
              className="glass-button-enhanced w-full py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Demo Credentials</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Username:</span>
              <span className="text-white font-mono">zimpyfile</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Password:</span>
              <span className="text-white font-mono">050042767</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            These are the default admin credentials for demonstration purposes.
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="h-5 w-5 text-yellow-400 mt-0.5">🔒</div>
            <div>
              <h4 className="text-sm font-medium text-yellow-400">Security Notice</h4>
              <p className="text-sm text-gray-300 mt-1">
                Admin access provides full control over the system. Only authorized personnel should have these credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
