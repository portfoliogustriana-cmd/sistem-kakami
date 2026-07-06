import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  ShoppingBag,
  Users,
  Menu,
  Sun,
  Moon,
  LogOut,
  Key,
  X,
  Contact,
  FileText,
  BadgeDollarSign,
  Truck,
  FileSignature,
} from "lucide-react";
import { getCurrentUser, setCurrentUser } from "../lib/storage";
import { User } from "../lib/storage";
interface NavbarProps { onLogout: () => void; user: User | null; }
const Navbar: React.FC<NavbarProps> = ({ onLogout, user }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleSignOut = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar (logout)?")) {
      setCurrentUser(null);
      onLogout();
    }
  };
  const navItems = [
    { to: "/", icon: <LayoutDashboard size={13} />, label: "Dashboard" },
    { to: "/konsumen", icon: <Contact size={13} />, label: "Konsumen" },
    { to: "/order", icon: <ShoppingBag size={13} />, label: "Order" },
    { to: "/keuangan", icon: <Wallet size={13} />, label: "Keuangan" },
    { to: "/penggajian", icon: <BadgeDollarSign size={13} />, label: "Gaji" },
    { to: "/kontrak", icon: <FileSignature size={13} />, label: "Kontrak" },
    { to: "/spk", icon: <FileText size={13} />, label: "SPK" },
    { to: "/tracking", icon: <Truck size={13} />, label: "Tracking" },
    ...(user?.role === "Owner"
      ? [{ to: "/users", icon: <Users size={13} />, label: "User" }]
      : []),
    { to: "/ganti-password", icon: <Key size={13} />, label: "Password" },
  ];
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-black transition-all duration-300">
      {" "}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {" "}
        <div className="flex justify-between h-16">
          {" "}
          {/* Logo Section */}{" "}
          <div className="flex items-center mr-2">
            {" "}
            <Link to="/" className="flex items-center gap-2">
              {" "}
              <img
                src="/logo.png"
                alt="Logo"
                className="h-8 w-auto"
              />{" "}
            </Link>{" "}
          </div>{" "}
          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-0.5 overflow-x-auto hide-scrollbar mx-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1 px-1.5 py-1 rounded-md text-[8.5px] font-extrabold uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${isActive ? "bg-black text-white" : "text-black hover:bg-black/5"}`
                }
              >
                {item.icon} <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
          {/* Right Section: Theme & Profile */}{" "}
          <div className="hidden lg:flex items-center gap-3 ml-4 pl-4 border-l border-black">
            {" "}
            {" "}
            <div className="flex items-center gap-3 pl-2">
              {" "}
              <div className="flex flex-col items-end">
                {" "}
                <span className="text-xs font-bold text-black leading-none">
                  {" "}
                  {user?.nama_lengkap || "Admin"}{" "}
                </span>{" "}
                <span className="text-[10px] font-black uppercase tracking-widest text-black mt-1">
                  {" "}
                  {user?.role || "User"}{" "}
                </span>{" "}
              </div>{" "}
              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl bg-white text-black hover:bg-black/5 transition-colors"
                title="Keluar"
              >
                {" "}
                <LogOut size={18} />{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
          {/* Mobile menu button */}{" "}
          <div className="flex lg:hidden items-center gap-2">
            {" "}
            {" "}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-black hover:bg-black/5"
            >
              {" "}
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Mobile Navigation Menu */}{" "}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-white flex flex-col p-4 animate-in slide-in-from-top duration-300 overflow-y-auto">
          {" "}
          <div className="flex items-center gap-4 p-4 mb-4 bg-white rounded-2xl">
            {" "}
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
              {" "}
              <span className="font-black text-black text-lg">
                {" "}
                {user?.nama_lengkap?.charAt(0).toUpperCase() || "U"}{" "}
              </span>{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="font-bold text-black">
                {user?.nama_lengkap || "Admin"}
              </p>{" "}
              <p className="text-xs font-black uppercase tracking-widest text-black">
                {user?.role || "User"}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex flex-col gap-1 flex-1">
            {" "}
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive ? "bg-black text-white shadow-sm" : "text-black hover:bg-black/5"}`
                }
              >
                {" "}
                {item.icon} <span>{item.label}</span>{" "}
              </NavLink>
            ))}{" "}
          </div>{" "}
          <button
            onClick={handleSignOut}
            className="mt-6 flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-white text-black font-bold border border-black"
          >
            {" "}
            <LogOut size={20} /> <span>Keluar Aplikasi</span>{" "}
          </button>{" "}
        </div>
      )}{" "}
    </nav>
  );
};
export default Navbar;
