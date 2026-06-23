import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, ShoppingBag, Users, Calendar, MapPin, Menu, Sun, Moon, LogOut } from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '../lib/storage';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme, onLogout }) => {
  const user = getCurrentUser();

  const handleSignOut = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar (logout)?')) {
      setCurrentUser(null);
      onLogout();
    }
  };

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="font-black text-xl tracking-tighter text-indigo-600 dark:text-indigo-400">KAKAMI</span>
            <span className="text-xl font-black text-slate-800 dark:text-white">ERP</span>
          </div>

          <div className="hidden md:flex flex-1 justify-center items-center gap-1">
            <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
            <NavItem to="/konsumen" icon={<Users size={18} />} label="Konsumen" />
            <NavItem to="/order" icon={<ShoppingBag size={18} />} label="Order" />
            <NavItem to="/keuangan" icon={<Wallet size={18} />} label="Keuangan" />
            <NavItem to="/spk" icon={<Calendar size={18} />} label="SPK" />
            <NavItem to="/tracking" icon={<MapPin size={18} />} label="Tracking" />
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-650 transition-all text-slate-700 dark:text-slate-300 shadow-sm"
              title="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>

            <div className="hidden md:block text-right">
              <p className="text-xs font-black text-slate-900 dark:text-white">{user?.nama_lengkap || 'Admin'}</p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider">{user?.role || 'Superadmin'}</p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all text-rose-600 dark:text-rose-400 shadow-sm"
              title="Sign Out (Keluar)"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
};

export default Navbar;
