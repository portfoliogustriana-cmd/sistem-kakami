import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Shield } from "lucide-react";
import { getStoredUsers, saveStoredUsers, User } from "../lib/storage";
const ManajemenUser = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    username: "",
    nama_lengkap: "",
    role: "Operator",
    no_wa: "",
    password: "",
  });
  useEffect(() => {
    setUsers(getStoredUsers());
  }, []);
  const handleAddUser = () => {
    if (!newUser.username || !newUser.password)
      return alert("Username dan Password wajib diisi");
    const userToSave: User = { id: Date.now(), ...newUser };
    const updated = [...users, userToSave];
    setUsers(updated);
    saveStoredUsers(updated);
    setNewUser({
      username: "",
      nama_lengkap: "",
      role: "Operator",
      no_wa: "",
      password: "",
    });
  };
  const handleDeleteUser = (id: number) => {
    if (users.length <= 1) return alert("Minimal harus ada 1 pengguna");
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    saveStoredUsers(updated);
  };
  return (
    <div className="p-4 sm:p-8 w-full max-w-4xl mx-auto">
      {" "}
      <h2 className="text-xl font-black mb-6 flex items-center gap-2">
        <Users className="w-5 h-5" /> Manajemen Pengguna
      </h2>{" "}
      <div className="flex gap-4 mb-6">
        {" "}
        <button
          onClick={() => {
            localStorage.setItem(
              "kakami_users",
              JSON.stringify([
                {
                  id: 1,
                  username: "admin",
                  nama_lengkap: "Admin Kakami",
                  role: "Admin",
                  no_wa: "08123456789",
                  password: "admin",
                  pin_keamanan: "123456",
                },
                {
                  id: 2,
                  username: "owner",
                  nama_lengkap: "Owner Kakami",
                  role: "Owner",
                  no_wa: "08571234567",
                  password: "owner",
                  pin_keamanan: "777777",
                },
                {
                  id: 3,
                  username: "operator",
                  nama_lengkap: "Jojo Operator",
                  role: "Operator",
                  no_wa: "08198765432",
                  password: "operator",
                  pin_keamanan: "111222",
                },
              ]),
            );
            setUsers(getStoredUsers());
            alert("Users telah direset ke default!");
          }}
          className="bg-black text-white p-2 rounded font-bold flex items-center justify-center gap-2"
        >
          {" "}
          <Shield className="w-4 h-4" /> Reset ke Default{" "}
        </button>{" "}
      </div>{" "}
      <div className="bg-white p-6 rounded-2xl border border-black mb-6">
        {" "}
        <h3 className="text-sm font-bold mb-4">Tambah Pengguna Baru</h3>{" "}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {" "}
          <input
            placeholder="Username"
            className="p-2 border rounded"
            value={newUser.username}
            onChange={(e) =>
              setNewUser({ ...newUser, username: e.target.value })
            }
          />{" "}
          <input
            placeholder="Nama Lengkap"
            className="p-2 border rounded"
            value={newUser.nama_lengkap}
            onChange={(e) =>
              setNewUser({ ...newUser, nama_lengkap: e.target.value })
            }
          />{" "}
          <select
            className="p-2 border rounded"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            {" "}
            <option>Owner</option> <option>Admin</option>{" "}
            <option>Operator</option>{" "}
          </select>{" "}
          <input
            placeholder="Password"
            type="password"
            className="p-2 border rounded"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
          />{" "}
          <button
            onClick={handleAddUser}
            className="bg-black text-white p-2 rounded font-bold flex items-center justify-center gap-2"
          >
            {" "}
            <Plus className="w-4 h-4" /> Tambah Pengguna{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-white p-6 rounded-2xl border border-black">
        {" "}
        <table className="w-full text-xs">
          {" "}
          <thead>
            {" "}
            <tr className="text-left border-b">
              {" "}
              <th className="p-2">Username</th> <th className="p-2">Nama</th>{" "}
              <th className="p-2">Role</th> <th className="p-2">Aksi</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody>
            {" "}
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                {" "}
                <td className="p-2 font-mono">{u.username}</td>{" "}
                <td className="p-2">{u.nama_lengkap}</td>{" "}
                <td className="p-2 font-bold">{u.role}</td>{" "}
                <td className="p-2">
                  {" "}
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="text-black"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>{" "}
                </td>{" "}
              </tr>
            ))}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>
  );
};
export default ManajemenUser;
