import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { ApiProvider } from './contexts/ApiContext.tsx';
import { SocketProvider } from './contexts/SocketContext.tsx';
import { Toaster } from 'react-hot-toast';

console.log('🚀 Zebux Dashboard starting...');
console.log('📍 Current URL:', window.location.href);
console.log('🎯 Root element:', document.getElementById('root'));

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found!');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <ApiProvider>
            <SocketProvider>
              <App />
              <Toaster position="bottom-right" reverseOrder={false} />
            </SocketProvider>
          </ApiProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
  
  console.log('✅ React app rendered successfully');
} catch (error) {
  console.error('❌ Failed to render React app:', error);
  
  // Fallback content
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: white; font-family: Arial, sans-serif; background: #1a1a2e; min-height: 100vh;">
        <h1>🚧 Loading Error</h1>
        <p>Failed to load the dashboard. Please check the console for details.</p>
        <p>Error: ${error.message}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px; background: #8B5CF6; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
}
