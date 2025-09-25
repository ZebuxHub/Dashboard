import { useState } from 'react';
import { KeyIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useApi } from '../contexts/ApiContext';
import toast from 'react-hot-toast';

const TokenGenerator = () => {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { apiCall } = useApi();

  const generateToken = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiCall('/tokens/generate', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim() })
      });

      if (response.success) {
        setToken(response.token);
        toast.success('Token generated successfully!');
      } else {
        toast.error(response.error || 'Failed to generate token');
      }
    } catch (error) {
      console.error('Token generation error:', error);
      toast.error('Failed to generate token');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = async () => {
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success('Token copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy token');
    }
  };

  const copyLuaCode = async () => {
    const luaCode = `-- Zebux Dashboard Integration
loadstring(game:HttpGet("${window.location.origin}/api/lua/sync.lua"))()

-- Set your token
WebsiteSync.SetToken("${token}")

-- Start syncing (optional - auto-starts by default)
WebsiteSync.Start()

-- Check status
print("Sync Status:", WebsiteSync.GetStatus())`;

    try {
      await navigator.clipboard.writeText(luaCode);
      toast.success('Lua code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy Lua code');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
          <KeyIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Generate API Token</h1>
        <p className="text-gray-400 mt-2">
          Create a secure token to sync your game data with the dashboard
        </p>
      </div>

      {/* Token Generation Form */}
      <div className="glass-card p-8 rounded-xl border border-white/10">
        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Roblox Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-glass w-full px-4 py-3 rounded-lg focus-ring"
              placeholder="Enter your Roblox username"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1">
              This will be used to identify your data on the dashboard
            </p>
          </div>

          <button
            onClick={generateToken}
            disabled={isLoading || !username.trim()}
            className="glass-button-enhanced w-full py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="spinner"></div>
                <span>Generating...</span>
              </div>
            ) : (
              'Generate Token'
            )}
          </button>
        </div>
      </div>

      {/* Generated Token */}
      {token && (
        <div className="glass-card p-8 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Your API Token</h3>
          
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={token}
                readOnly
                className="input-glass w-full px-4 py-3 pr-12 rounded-lg font-mono text-sm"
              />
              <button
                onClick={copyToken}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <CheckIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <ClipboardIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="h-5 w-5 text-yellow-400 mt-0.5">⚠️</div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-400">Important Security Notice</h4>
                  <p className="text-sm text-gray-300 mt-1">
                    Keep this token secure and never share it publicly. Anyone with this token can access your game data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integration Instructions */}
      {token && (
        <div className="glass-card p-8 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Step 1: Copy the Lua Code</h4>
              <div className="relative">
                <pre className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
{`-- Zebux Dashboard Integration
loadstring(game:HttpGet("${window.location.origin}/api/lua/sync.lua"))()

-- Set your token
WebsiteSync.SetToken("${token}")

-- Start syncing (optional - auto-starts by default)
WebsiteSync.Start()

-- Check status
print("Sync Status:", WebsiteSync.GetStatus())`}
                </pre>
                <button
                  onClick={copyLuaCode}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ClipboardIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Step 2: Execute in Roblox</h4>
              <p className="text-sm text-gray-400">
                Paste and execute this code in your Roblox executor. The script will automatically start syncing your game data every 5 minutes.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Step 3: Monitor Dashboard</h4>
              <p className="text-sm text-gray-400">
                Return to the dashboard to see your real-time game data, including coins, pets, eggs, and more!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="glass-card p-8 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Real-time Sync', desc: 'Automatic data synchronization every 5 minutes' },
            { title: 'Secure Token', desc: 'Unique lifetime token for your account' },
            { title: 'Multi-device', desc: 'Use the same token across multiple devices' },
            { title: 'Historical Data', desc: 'Track your progress over time with charts' },
            { title: 'Live Dashboard', desc: 'Beautiful real-time dashboard interface' },
            { title: 'Mobile Friendly', desc: 'Access your data from any device' }
          ].map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="h-2 w-2 bg-purple-400 rounded-full mt-2"></div>
              <div>
                <h4 className="text-sm font-medium text-white">{feature.title}</h4>
                <p className="text-xs text-gray-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenGenerator;
