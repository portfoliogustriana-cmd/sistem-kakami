import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Konsumen from './pages/Konsumen';
import OrderPage from './pages/Order';
import Keuangan from './pages/Keuangan';
import Spk from './pages/Spk';
import Tracking from './pages/Tracking';
import { Login } from './pages/Login';
import { getCurrentUser } from './lib/storage';

const App = () => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemDark ? 'dark' : 'light';
  });

  // Apply Class to root on mount and theme state change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = () => {
    setCurrentUser(getCurrentUser());
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 antialiased flex flex-col font-sans transition-colors duration-300">
        <Navbar theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />
        <main className="flex-grow flex flex-col w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/konsumen" element={<Konsumen />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/keuangan" element={<Keuangan />} />
            <Route path="/spk" element={<Spk />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/produksi" element={<Navigate to="/tracking" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
