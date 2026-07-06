import React, { useState } from "react";
import { getStoredUsers, setCurrentUser } from "../lib/storage";
interface LoginProps {
  onLoginSuccess: () => void;
}
export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getStoredUsers();
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.password === password.trim(),
    );
    if (user) {
      setCurrentUser(user);
      onLoginSuccess();
    } else {
      setError("Username atau password salah.");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white transition-colors duration-300">
      {" "}
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-black"
      >
        {" "}
        <div className="text-center mb-8">
          {" "}
          <h2 className="text-2xl font-black text-black tracking-tight uppercase">
            Sistem Produksi
          </h2>{" "}
          <p className="text-black text-xs font-medium mt-1 uppercase tracking-widest">
            Silakan Masuk Untuk Melanjutkan
          </p>{" "}
        </div>{" "}
        {error && (
          <div className="mb-4 p-3 bg-white border-black text-black text-[11px] font-bold rounded-lg text-center">
            {" "}
            {error}{" "}
          </div>
        )}{" "}
        <div className="space-y-4">
          {" "}
          <input
            placeholder="Username"
            className="w-full p-4 bg-white border border-black rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-black transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />{" "}
          <input
            placeholder="Password"
            type="password"
            className="w-full p-4 bg-white border border-black rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-black transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />{" "}
        </div>{" "}
        <button className="w-full mt-6 bg-black hover:bg-black text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-sm active:scale-[0.98]">
          {" "}
          Masuk Sekarang{" "}
        </button>{" "}
      </form>{" "}
    </div>
  );
};
