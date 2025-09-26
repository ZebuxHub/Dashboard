import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  HomeIcon, 
  KeyIcon, 
  UserGroupIcon, 
  CogIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Generate Token', href: '/token', icon: KeyIcon },
    { name: 'Admin', href: '/admin/login', icon: CogIcon },
    { name: 'About', href: '/about', icon: UserGroupIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'} pb-20`}>
      {/* Top Header - Simple */}
      <header className="glass-card border-b border-white/10 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
              <h1 className="text-xl font-bold text-white">Zebux Dashboard</h1>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="glass-card px-6 py-3 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-300 ${
                    active
                      ? 'bg-purple-600 text-white shadow-lg scale-110'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={item.name}
                >
                  <Icon className={`h-6 w-6 ${active ? 'mb-1' : ''} transition-all duration-300`} />
                  {active && (
                    <span className="text-xs font-medium">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Status Footer */}
      <footer className="fixed bottom-4 right-4 z-40">
        <div className="glass-card px-4 py-2 rounded-lg border border-white/10">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
