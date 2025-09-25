import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function TokenGenerator() {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tokens/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hwid: 'web-generator',
          metadata: {
            source: 'web',
            userAgent: navigator.userAgent,
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setToken(data.token);
        toast.success('Token generated successfully!');
      } else {
        toast.error('Failed to generate token');
      }
    } catch (error) {
      toast.error('Error generating token');
      console.error('Token generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    toast.success('Token copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-dark-900 flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🎫 Generate API Token
          </h1>
          <p className="text-gray-300">
            Create a secure token to sync your game data
          </p>
        </div>

        <div className="space-y-6">
          <button
            onClick={generateToken}
            disabled={loading}
            className="w-full glass-button-enhanced py-4 px-6 rounded-xl text-white font-medium text-lg disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="spinner mr-3"></div>
                Generating...
              </div>
            ) : (
              '🔑 Generate New Token'
            )}
          </button>

          {token && (
            <div className="space-y-4">
              <div className="p-4 bg-black/20 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Your Token:
                </h3>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-3 bg-black/30 rounded-lg text-green-400 text-sm break-all">
                    {token}
                  </code>
                  <button
                    onClick={copyToken}
                    className="glass-button-enhanced px-4 py-3 rounded-lg text-white"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div className="p-4 bg-black/20 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-2">
                  🎮 Add to Your Roblox Script:
                </h3>
                <pre className="text-sm text-gray-300 overflow-x-auto p-3 bg-black/30 rounded-lg">
{`local WebsiteSync = loadstring(game:HttpGet("${window.location.origin}/api/lua/sync.lua"))()
WebsiteSync.Init({
    token = "${token}",
    apiUrl = "${window.location.origin}/api",
    syncInterval = 5 * 60,
    autoStart = true
})`}
                </pre>
              </div>

              <div className="text-center">
                <a
                  href="/"
                  className="glass-button-enhanced px-6 py-3 rounded-xl text-white font-medium inline-block"
                >
                  📊 Go to Dashboard
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
