import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { Footer } from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import Konsumen from "./pages/Konsumen";
import OrderPage from "./pages/Order";
import Keuangan from "./pages/Keuangan";
import Spk from "./pages/Spk";
import Tracking from "./pages/Tracking";
import Penggajian from "./pages/Penggajian";
import Kontrak from "./pages/KontrakKaryawan";
import ManajemenUser from "./pages/ManajemenUser";
import GantiPassword from "./pages/GantiPassword";
import { Login } from "./pages/Login";
import {
  getCurrentUser,
  setCurrentUser as setStorageCurrentUser,
  getStoredUsers,
} from "./lib/storage";
import { ErrorBoundary } from "./components/ErrorBoundary";
const App = () => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  useEffect(() => { document.documentElement.classList.remove('dark'); const handleKeyDown = (e: KeyboardEvent) => { if (e.ctrlKey && e.altKey && e.key === 'o') { const users = getStoredUsers(); const owner = users.find(u => u.role === 'Owner'); if (owner) { setStorageCurrentUser(owner); setCurrentUser(owner); alert('Berhasil login sebagai Owner!'); } } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, []); const handleLoginSuccess = () => { setCurrentUser(getCurrentUser()); }; const handleLogout = () => { setCurrentUser(null); setStorageCurrentUser(null); }; if (!currentUser) { return <Login onLoginSuccess={handleLoginSuccess} />; } return ( <BrowserRouter> <div className="min-h-screen bg-white text-black antialiased flex flex-col font-sans transition-colors duration-300"> <Navbar onLogout={handleLogout} user={currentUser} /> <main className="flex-grow flex flex-col w-full px-2 sm:px-4 md:px-8 py-6"> <Routes> <Route path="/" element={<Dashboard />} /> <Route path="/konsumen" element={<Konsumen />} /> <Route path="/order" element={<OrderPage />} /> <Route path="/keuangan" element={<ErrorBoundary><Keuangan /></ErrorBoundary>} /> <Route path="/penggajian" element={<Penggajian />} /> <Route path="/kontrak" element={<ErrorBoundary><Kontrak /></ErrorBoundary>} /> <Route path="/users" element={<ManajemenUser />} /> <Route path="/ganti-password" element={<GantiPassword />} /> <Route path="/spk" element={<Spk />} /> <Route path="/tracking" element={<Tracking />} /> <Route path="/produksi" element={<Navigate to="/tracking" replace />} /> <Route path="*" element={<Navigate to="/" replace />} /> </Routes> </main> <Footer /> </div> </BrowserRouter> );
};
export default App;
