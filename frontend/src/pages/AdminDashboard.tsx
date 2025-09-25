import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-dark-900 p-4">
      <div className="container mx-auto">
        <div className="glass-card rounded-3xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            👨‍💼 Admin Dashboard
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                👥 Total Users
              </h3>
              <p className="text-3xl font-bold text-primary-400">
                Loading...
              </p>
            </div>
            
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                🎫 Active Tokens
              </h3>
              <p className="text-3xl font-bold text-green-400">
                Loading...
              </p>
            </div>
            
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                📊 Data Points
              </h3>
              <p className="text-3xl font-bold text-blue-400">
                Loading...
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-gray-300">
              Full admin functionality will be available once the backend is fully integrated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
