import React from 'react';
import { useApi } from '../contexts/ApiContext';

export default function Dashboard() {
  const { token } = useApi();

  if (!token) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Welcome to Zebux Dashboard!
        </h2>
        <p className="text-gray-300 mb-6">
          Generate a token to start tracking your game data.
        </p>
        <a
          href="/token"
          className="glass-button-enhanced px-6 py-3 rounded-xl text-white font-medium inline-block"
        >
          Generate Token
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          📊 Your Game Data
        </h2>
        <p className="text-gray-300">
          Your dashboard is ready! Data will appear here once you integrate the Lua script.
        </p>
        
        <div className="mt-6 p-4 bg-black/20 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">
            🎮 Integration Instructions:
          </h3>
          <pre className="text-sm text-gray-300 overflow-x-auto">
{`local WebsiteSync = loadstring(game:HttpGet("${window.location.origin}/api/lua/sync.lua"))()
WebsiteSync.Init({
    token = "${token}",
    apiUrl = "${window.location.origin}/api",
    syncInterval = 5 * 60,
    autoStart = true
})`}
          </pre>
        </div>
      </div>
    </div>
  );
}
