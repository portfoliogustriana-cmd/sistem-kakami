import React, { useState, useEffect } from 'react';
import { Key, User as UserIcon, Phone, Shield, CheckCircle, ArrowLeft, Lock, UserPlus, Sparkles } from 'lucide-react';
import { getStoredUsers, saveStoredUsers, setCurrentUser, User } from '../lib/storage';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<number>(1); // 1 = Login, 2 = Register, 3 = Reset S1 (Phone/User), 4 = Reset S2 (OTP & Owner Code), 5 = Reset S3 (New Password), 6 = Reset S4 (Success)
  
  // Auth Store
  const [users, setUsers] = useState<User[]>([]);

  // Form states - Login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState('Admin');

  // Form states - Register
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNamaLengkap, setRegNamaLengkap] = useState('');
  const [regRole, setRegRole] = useState('Admin');
  const [regNoWa, setRegNoWa] = useState('');
  const [regKodeOwner, setRegKodeOwner] = useState('');
  const [regPin, setRegPin] = useState('');

  // Form states - Reset Password S1
  const [resetUsername, setResetUsername] = useState('');
  const [resetNoWa, setResetNoWa] = useState('');

  // Form states - Reset Password S2
  const [otpInput, setOtpInput] = useState('');
  const [ownerCodeInput, setOwnerCodeInput] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [activeResetUserId, setActiveResetUserId] = useState<number | null>(null);

  // Form states - Reset Password S3
  const [newPassword, setNewPassword] = useState('');

  // Generic Alerts
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing users
  useEffect(() => {
    setUsers(getStoredUsers());
  }, [step]);

  const clearAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  // 1. LOGIN HANDLER
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!loginUsername || !loginPassword) {
      setError('Username dan kata sandi wajib diisi!');
      return;
    }

    const matchedUser = users.find(
      (un) => un.username.toLowerCase() === loginUsername.toLowerCase()
    );

    if (!matchedUser) {
      setError('Pengguna tidak ditemukan!');
      return;
    }

    if (matchedUser.password !== loginPassword) {
      setError('Kata sandi salah! Periksa kembali.');
      return;
    }

    // Role safety verification
    if (matchedUser.role !== loginRole) {
      setError(`Peran (Role) terpilih "${loginRole}" tidak sesuai dengan role terdaftar.`);
      return;
    }

    // Success login
    setCurrentUser(matchedUser);
    onLoginSuccess();
  };

  // 2. REGISTER HANDLER
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!regUsername || !regPassword || !regNamaLengkap || !regNoWa || !regPin) {
      setError('Lengkapi semua kolom formulir!');
      return;
    }

    // Check pre-existing username
    const exists = users.some(
      (u) => u.username.toLowerCase() === regUsername.toLowerCase()
    );
    if (exists) {
      setError('Username sudah digunakan oleh staf lain!');
      return;
    }

    // Safety constraint: If registering as Owner, owner secret key is validation requirement
    if (regRole === 'Owner' && regKodeOwner !== 'KAKAMI77') {
      setError('KODE RAHASIA OWNER SALAH! Registrasi Owner ditolak.');
      return;
    }

    const newUser: User = {
      id: Date.now(),
      username: regUsername.toLowerCase().trim(),
      nama_lengkap: regNamaLengkap.trim(),
      role: regRole,
      no_wa: regNoWa.trim(),
      password: regPassword,
      pin_keamanan: regPin
    };

    const updatedUsers = [...users, newUser];
    saveStoredUsers(updatedUsers);
    setUsers(updatedUsers);

    setSuccess('Registrasi sukses! Silakan login.');
    // Reset fields
    setRegUsername('');
    setRegPassword('');
    setRegNamaLengkap('');
    setRegNoWa('');
    setRegKodeOwner('');
    setRegPin('');
    // Back to logins
    setTimeout(() => {
      setStep(1);
      clearAlerts();
    }, 1500);
  };

  // 3. RESET PASSWORD S1 - SEND OTP
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!resetUsername || !resetNoWa) {
      setError('Semua kolom verifikasi wajib diisi!');
      return;
    }

    const matched = users.find(
      (u) =>
        u.username.toLowerCase() === resetUsername.toLowerCase().trim() &&
        u.no_wa.trim() === resetNoWa.trim()
    );

    if (!matched) {
      setError('Username dan Nomor WhatsApp tidak cocok atau tidak terdaftar di sistem!');
      return;
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(generatedOtp);
    setActiveResetUserId(matched.id);

    // Save temporary OTP in the user instance (simulating database write)
    const updatedUsers = users.map((u) => {
      if (u.id === matched.id) {
        return {
          ...u,
          otp_code: generatedOtp,
          otp_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        };
      }
      return u;
    });
    saveStoredUsers(updatedUsers);

    setSuccess(
      `KODE OTP BERHASIL DIBUAT! [Simulasi WA Gateway: OTP Anda adalah *${generatedOtp}*]. Masukkan di halaman berikutnya.`
    );
    setTimeout(() => {
      setStep(4);
      setError(null);
    }, 2000);
  };

  // 4. RESET PASSWORD S2 - VERIFY OTP & OWNER CODE
  const handleVerifyOtpAndOwner = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!otpInput) {
      setError('Masukkan kode OTP 6-Digit!');
      return;
    }

    if (ownerCodeInput !== 'KAKAMI77') {
      setError('KODE RAHASIA OWNER SALAH! Reset sandi diblokir demi keamanan.');
      return;
    }

    const matchedUser = users.find((u) => u.id === activeResetUserId);
    if (!matchedUser) {
      setError('Sesi kedaluwarsa atau user tidak valid.');
      setStep(3);
      return;
    }

    if (otpInput !== matchedUser.otp_code) {
      setError('KODE OTP WHATSAPP SALAH! Silakan cek kembali.');
      return;
    }

    // Successful step
    setSuccess('Otorisasi berhasil dikonfirmasi! Sandi dapat diubah.');
    setTimeout(() => {
      setStep(5);
      clearAlerts();
    }, 1500);
  };

  // 5. RESET PASSWORD S3 - SAVE NEW PASSWORD
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!newPassword || newPassword.length < 5) {
      setError('Sandi baru wajib terdiri dari minimal 5 karakter!');
      return;
    }

    const updated = users.map((u) => {
      if (u.id === activeResetUserId) {
        return {
          ...u,
          password: newPassword,
          otp_code: undefined,
          otp_expires_at: undefined
        };
      }
      return u;
    });

    saveStoredUsers(updated);
    setStep(6);
  };

  const handleReturnToLogin = () => {
    clearAlerts();
    setStep(1);
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 w-full max-w-md shadow-xl dark:shadow-none space-y-6">
        
        {/* Brand Header */}
        <div className="text-center font-black">
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="text-2xl tracking-tighter text-indigo-600 dark:text-indigo-400">KAKAMI</span>
            <span className="text-2xl text-slate-800 dark:text-white">ERP</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-extrabold">SI Apparel & Konveksi Terpusat</p>
        </div>

        {/* Global alerts */}
        {error && (
          <div className="bg-rose-55 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3.5 rounded-2xl text-[10px] font-black border border-rose-150 dark:border-rose-990 flex items-start gap-2 animate-in fade-in duration-200">
            <Shield className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-2xl text-[10px] font-black border border-emerald-150 dark:border-emerald-800/40 flex items-start gap-2 animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            <span className="leading-snug">{success}</span>
          </div>
        )}

        {/* ======================= STEP 1: LOGIN ======================= */}
        {step === 1 && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs font-bold">
            <div className="text-center">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Login Otorisasi Pengguna</h3>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5">Akses modul ERP KAKAMI sesuai fungsionalitas jabatan.</p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase block mb-1">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Contoh: admin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 pl-9 pr-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-400 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase block mb-1">Kata Sandi</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 pl-9 pr-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-400 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase block mb-1 font-sans">Role Jabatan</label>
              <select
                value={loginRole}
                onChange={(e) => setLoginRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-2.5 rounded-xl text-xs font-black text-slate-808 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-400"
              >
                <option value="Admin">Admin</option>
                <option value="Owner">Owner</option>
                <option value="Operator">Operator / Penjahit</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] py-3.5 rounded-xl uppercase tracking-widest transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
            >
               Masuk ke Keuangan ERP
            </button>

            <div className="flex justify-between items-center pt-2 text-[10px] font-extrabold">
              <button
                type="button"
                onClick={() => {
                  clearAlerts();
                  setStep(3);
                }}
                className="text-slate-405 dark:text-slate-400 hover:text-indigo-600"
              >
                Lupa Sandi?
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAlerts();
                  setStep(2);
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <UserPlus size={12} /> Staf Baru / Daftar
              </button>
            </div>
          </form>
        )}

        {/* ======================= STEP 2: REGISTER ======================= */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs font-bold">
            <div className="text-center">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Pendaftaran Staf Baru</h3>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5">Sistem data terintegrasi, registrasi divalidasi ketat.</p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase block mb-1">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Contoh: Dion Pratama"
                value={regNamaLengkap}
                onChange={(e) => setRegNamaLengkap(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-2.5 rounded-xl text-xs font-bold text-slate-808 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase block mb-1">Username</label>
                <input
                  type="text"
                  placeholder="admin_baru"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-2.5 rounded-xl text-xs font-bold text-slate-808 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase block mb-1 font-sans">Kata Sandi</label>
                <input
                  type="password"
                  placeholder="Sandi min 5"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-2.5 rounded-xl text-xs font-bold text-slate-808 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase block mb-1">Jabatan (Role)</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-2.5 rounded-xl text-xs font-black text-slate-808 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                  <option value="Operator">Operator</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase block mb-1">PIN Reset Sandi</label>
                <input
                  type="password"
                  placeholder="Sandi PIN"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-2.5 rounded-xl text-xs font-bold text-slate-808 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-emerald-600 uppercase block mb-1">No. Handphone Whatsapp Aktif</label>
              <input
                type="text"
                placeholder="081xxx (Untuk WA OTP)"
                value={regNoWa}
                onChange={(e) => setRegNoWa(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-2.5 rounded-xl text-xs font-bold text-slate-808 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                required
              />
            </div>

            {/* Owner Safety Verification Key */}
            {regRole === 'Owner' && (
              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-250 dark:border-amber-900/45 space-y-1">
                <label className="block text-[9px] font-extrabold text-amber-600 uppercase">KODE RAHASIA OWNER (DIORGA UTAMA) *</label>
                <input
                  type="password"
                  placeholder="Kode dari Atasan/Laporan Utama"
                  value={regKodeOwner}
                  onChange={(e) => setRegKodeOwner(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-amber-250 p-2 rounded-xl text-xs font-bold text-slate-880 outline-none"
                  required
                />
                <p className="text-[8px] text-amber-505 leading-relaxed font-semibold">Khusus akun role Owner harus memasukkan token utama demi mencegah intrusi.</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] py-3.5 rounded-xl uppercase tracking-widest transition-all shadow-md"
            >
              Daftarkan Akun
            </button>

            <button
              type="button"
              onClick={handleReturnToLogin}
              className="w-full text-slate-400 hover:text-slate-700 transition flex items-center justify-center gap-1.5 text-[10px]"
            >
              <ArrowLeft size={13} /> Batal & Kembali
            </button>
          </form>
        )}

        {/* ======================= STEP 3: RESET SANDI S1 ======================= */}
        {step === 3 && (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs font-bold">
            <div className="text-center">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Pemulihan Akun Staf</h3>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5">Verifikasi identitas ketat via nomor WA aktif terdaftar.</p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Username Akun</label>
              <input
                type="text"
                placeholder="Ketik username Anda..."
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-emerald-600 uppercase block mb-1">Nomor WhatsApp Terdaftar</label>
              <input
                type="text"
                placeholder="Ketik No WA aktif terdaftar..."
                value={resetNoWa}
                onChange={(e) => setResetNoWa(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] py-3.5 rounded-xl uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Phone size={13} /> Kirim OTP via WhatsApp
            </button>

            <button
              type="button"
              onClick={handleReturnToLogin}
              className="w-full text-slate-400 hover:text-slate-700 transition flex items-center justify-center gap-1.5 text-[10px]"
            >
              <ArrowLeft size={13} /> Batal & Kembali
            </button>
          </form>
        )}

        {/* ======================= STEP 4: RESET SANDI S2 (OTP & Owner Code) ======================= */}
        {step === 4 && (
          <form onSubmit={handleVerifyOtpAndOwner} className="space-y-4 text-xs font-bold">
            <div className="text-center">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Masukkan Kode Otorisasi</h3>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5">Sandi hanya bisa disetel jika kode OTP & owner divalidasi aman.</p>
            </div>

            {/* Simulated Live OTP indicator for perfect ease of testing */}
            <div className="bg-amber-50/70 dark:bg-slate-900 border border-amber-200 dark:border-slate-700 p-3 rounded-2xl space-y-1 animate-pulse">
              <div className="text-[9px] text-amber-700 font-black flex items-center gap-1">
                <Sparkles size={11} /> MONITOR WHATSAPP GATEWAY (SIMULASI API):
              </div>
              <p className="text-[11px] text-slate-805 dark:text-slate-200 leading-snug">
                Pesan terkirim ke <span className="font-mono text-indigo-600">{resetNoWa}</span>:<br />
                Kode OTP reset sandi KAKAMI Anda adalah: <span className="text-xs bg-indigo-50 dark:bg-slate-800 text-indigo-700 px-1.5 py-0.5 font-mono font-black border border-indigo-200 rounded">{simulatedOtp}</span>
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-indigo-600 uppercase block mb-1">Kode OTP 6-Digit</label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-3 rounded-xl text-center text-lg font-black tracking-[0.3em] outline-none focus:ring-2 focus:ring-indigo-600 font-mono text-slate-800 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-amber-600 uppercase block mb-1 flex items-center justify-between">
                <span>Kode Rahasia Owner (Izin Reset)</span>
              </label>
              <input
                type="password"
                placeholder="Masukkan Kode Rahasia Owner..."
                value={ownerCodeInput}
                onChange={(e) => setOwnerCodeInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
              <p className="text-[8px] text-slate-400 mt-1 leading-relaxed font-semibold">Gunakan kode rahasia owner saat ini (Contoh demo: <span className="font-mono font-black">KAKAMI77</span>) untuk mende-eskalasi kunci sistem.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-black text-white font-black text-[11px] py-3.5 rounded-xl uppercase tracking-widest transition-all shadow-md"
            >
              Verifikasi Otorisasi
            </button>

            <button
              type="button"
              onClick={() => {
                clearAlerts();
                setStep(3);
              }}
              className="w-full text-slate-400 hover:text-slate-700 transition flex items-center justify-center gap-1.5 text-[10px]"
            >
              <ArrowLeft size={13} /> Kirim Ulang OTP
            </button>
          </form>
        )}

        {/* ======================= STEP 5: RESET SANDI S3 (New Password) ======================= */}
        {step === 5 && (
          <form onSubmit={handleSaveNewPassword} className="space-y-4 text-xs font-bold">
            <div className="text-center">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Setel Sandi Baru</h3>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5">Identitas terverifikasi dengan aman! Tulis kata sandi baru Anda.</p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Sandi Baru</label>
              <input
                type="password"
                placeholder="Masukkan sandi baru..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-650 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] py-3.5 rounded-xl uppercase tracking-widest transition-all shadow-md"
            >
              Simpan Sandi Baru
            </button>
          </form>
        )}

        {/* ======================= STEP 6: RESET SANDI S4 (Success) ======================= */}
        {step === 6 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-emerald-600 uppercase tracking-wide">Kata Sandi Diperbarui!</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">Selamat! Sandi lama berhasil dihapus dan diganti dengan yang baru. Silakan log masuk kembali.</p>
            </div>
            <button
              onClick={handleReturnToLogin}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-extrabold text-[11px] uppercase tracking-widest hover:bg-black dark:hover:bg-slate-200 transition-all shadow-sm"
            >
              Ke Halaman Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
