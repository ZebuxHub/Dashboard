import React from 'react';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-dark-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="glass-card rounded-3xl p-6 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              🎮 Zebux Dashboard
            </h1>
            <p className="text-gray-300">
              Universal Game Data Tracker
            </p>
          </div>
        </header>
        
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
