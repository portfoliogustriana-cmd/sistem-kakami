import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Key, Lock, AlertCircle } from "lucide-react";
import {
  getCurrentUser,
  getStoredUsers,
  saveStoredUsers,
  setCurrentUser,
} from "../lib/storage";
const GantiPassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const handleUpdate = () => {
    if (!currentUser) return;
    if (currentUser.password !== oldPassword) {
      setError("Password lama salah.");
      return;
    }
    if (currentUser.pin_keamanan !== pin) {
      setError("PIN keamanan salah.");
      return;
    }
    const users = getStoredUsers();
    const updatedUsers = users.map((u) =>
      u.id === currentUser.id ? { ...u, password: newPassword } : u,
    );
    saveStoredUsers(updatedUsers);
    const updatedUser = updatedUsers.find((u) => u.id === currentUser.id)!;
    setCurrentUser(updatedUser);
    setSuccess("Password berhasil diperbarui!");
    setError("");
    setOldPassword("");
    setNewPassword("");
    setPin("");
  };
  return (
    <div className="p-4 sm:p-8 w-full max-w-md mx-auto">
      {" "}
      <h2 className="text-xl font-black mb-6 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5" /> Ganti Password
      </h2>{" "}
      <div className="bg-white p-6 rounded-3xl border border-black shadow-xl">
        {" "}
        {error && (
          <div className="mb-4 p-3 bg-white text-black text-xs font-bold rounded-lg">
            {error}
          </div>
        )}{" "}
        {success && (
          <div className="mb-4 p-3 bg-white text-black text-xs font-bold rounded-lg">
            {success}
          </div>
        )}{" "}
        <div className="space-y-4">
          {" "}
          <input
            type="password"
            placeholder="Password Lama"
            className="w-full p-4 bg-white border rounded-xl text-xs"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />{" "}
          <input
            type="password"
            placeholder="Password Baru"
            className="w-full p-4 bg-white border rounded-xl text-xs"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />{" "}
          <input
            type="password"
            placeholder="PIN Keamanan"
            className="w-full p-4 bg-white border rounded-xl text-xs"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />{" "}
          <button
            onClick={handleUpdate}
            className="w-full bg-black text-white p-4 rounded-xl font-bold text-xs uppercase hover:bg-black"
          >
            {" "}
            Simpan Password Baru{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};
export default GantiPassword;
