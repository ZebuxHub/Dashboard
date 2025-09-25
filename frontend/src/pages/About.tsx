import React from 'react';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-dark-900 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="glass-card rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              🎮 About Zebux Dashboard
            </h1>
            <p className="text-xl text-gray-300">
              Universal Game Data Tracker with Real-time Sync
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                ✨ Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-2">📊 Real-time Data</h3>
                  <p className="text-gray-300 text-sm">Live updates from your Lua scripts</p>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-2">📈 Historical Charts</h3>
                  <p className="text-gray-300 text-sm">Track progress over time</p>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-2">🔄 Multi-Account</h3>
                  <p className="text-gray-300 text-sm">Manage multiple game accounts</p>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-2">📱 Mobile Ready</h3>
                  <p className="text-gray-300 text-sm">Works on all devices</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                🎯 How It Works
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Generate Token</h3>
                    <p className="text-gray-300">Create a secure API token for your account</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Add to Script</h3>
                    <p className="text-gray-300">Integrate our Lua module into your Roblox script</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Watch Data Sync</h3>
                    <p className="text-gray-300">Your game data automatically syncs to the dashboard</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                🔒 Security & Privacy
              </h2>
              <div className="glass-card rounded-xl p-6">
                <ul className="space-y-2 text-gray-300">
                  <li>• 🔐 Secure token-based authentication</li>
                  <li>• 🖥️ HWID/IP locking for device security</li>
                  <li>• 🚫 No personal data collection</li>
                  <li>• 🔄 Data encrypted in transit</li>
                  <li>• 👨‍💼 Admin controls for user management</li>
                </ul>
              </div>
            </section>

            <section className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                🚀 Ready to Get Started?
              </h2>
              <div className="space-x-4">
                <a
                  href="/token"
                  className="glass-button-enhanced px-6 py-3 rounded-xl text-white font-medium inline-block"
                >
                  🎫 Generate Token
                </a>
                <a
                  href="/"
                  className="glass-button-enhanced px-6 py-3 rounded-xl text-white font-medium inline-block"
                >
                  📊 Dashboard
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
