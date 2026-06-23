<?php
include 'koneksi.php';

if (!isset($KODE_RAHASIA_OWNER)) {
    $KODE_RAHASIA_OWNER = "KAKAMI77"; // Fallback default
}

if (isset($_POST['register'])) {
    $nama = mysqli_real_escape_string($koneksi, $_POST['nama_lengkap']);
    $username = mysqli_real_escape_string($koneksi, strtolower($_POST['username']));
    $role = mysqli_real_escape_string($koneksi, $_POST['role']);
    $no_wa = mysqli_real_escape_string($koneksi, trim($_POST['no_wa']));
    $kode_rahasia_input = trim($_POST['kode_rahasia']);
    
    // Verifikasi Kode Rahasia Owner! (Mencegah karyawan sembarangan register)
    if ($kode_rahasia_input !== $KODE_RAHASIA_OWNER) {
        $error = "KODE RAHASIA OWNER SALAH! Pendaftaran dibatalkan demi keamanan. Silakan minta kode ke owner.";
    } elseif (empty($no_wa)) {
        $error = "Nomor WhatsApp wajib dimasukkan!";
    } else {
        // Enkripsi Password agar aman dari bocor database
        $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

        $cek_user = mysqli_query($koneksi, "SELECT * FROM users WHERE username='$username'");
        if (mysqli_num_rows($cek_user) > 0) {
            $error = "Username sudah dipakai orang lain!";
        } else {
            // Simpan data pendaftaran
            $query_insert = mysqli_query($koneksi, "INSERT INTO users (username, password, nama_lengkap, no_wa, role) VALUES ('$username', '$password', '$nama', '$no_wa', '$role')");
            if ($query_insert) {
                $sukses = "Pendaftaran Berhasil! Silakan masuk halaman login.";
            } else {
                $error = "Terjadi kesalahan pada database: " . mysqli_error($koneksi);
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar Akun - KAKAMI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
    <script>
    tailwind.config = {
        darkMode: 'class',
    }
    </script>
    <script>
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    </script>
    <style>
        .dark { color-scheme: dark; }
        select option { background-color: #ffffff; color: #0f172a; }
        .dark select option { background-color: #1e293b; color: #f8fafc; }
        input:autofill, input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #0f172a !important;
        }
        .dark input:autofill, .dark input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
            -webkit-text-fill-color: #f8fafc !important;
        }
    </style>
</head>
<body class="bg-slate-50 dark:bg-slate-900 flex items-center justify-center min-h-screen transition-colors duration-300">
    <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-700 w-full max-w-md my-8">
        <div class="text-center mb-6">
            <!-- Client Logo -->
            <div class="flex justify-center mb-6">
                <img src="logo.png" alt="Client Logo" class="h-16 sm:h-20 w-auto dark:invert transition-all duration-300" />
            </div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide">Pendaftaran Karyawan</h2>
            <p class="text-[10px] font-bold text-slate-500 dark:text-slate-400">Verifikasi dengan owner diperlukan.</p>
        </div>

        <?php if(isset($error)): ?>
            <div class='bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold mb-4 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5'>
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <span><?php echo $error; ?></span>
            </div>
        <?php endif; ?>
        <?php if(isset($sukses)): ?>
            <div class='bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-bold mb-4 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5'>
                <svg class="w-4 h-4 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                <span><?php echo $sukses; ?></span>
            </div>
        <?php endif; ?>

        <form method="POST" class="space-y-4">
            <div>
                <label class="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <input type="text" name="nama_lengkap" placeholder="Nama Anda" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all" required>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Username</label>
                    <input type="text" name="username" placeholder="username" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all" required>
                </div>
                <div>
                    <label class="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Hak Akses</label>
                    <select name="role" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all">
                        <option value="Karyawan">Karyawan</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    Nomor WhatsApp Aktif
                </label>
                <input type="text" name="no_wa" placeholder="Contoh: 08123456789" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 outline-none transition-all" required>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Password Baru</label>
                    <input type="password" name="password" placeholder="Sandi rahasia" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all" required>
                </div>
                <div>
                    <label class="block text-[10px] font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <svg class="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        Rahasia Owner
                    </label>
                    <input type="password" name="kode_rahasia" placeholder="Kode Khusus" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-amber-200 dark:border-amber-900/50 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all" required>
                </div>
            </div>

            <button type="submit" name="register" class="w-full bg-slate-900 dark:bg-slate-700 text-white py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-black dark:hover:bg-slate-600 mt-2 transition-all">Daftar Sekarang</button>
        </form>
        <div class="text-center mt-6">
            <a href="login.php" class="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"><svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Kembali ke Login</a>
        </div>
    </div>
</body>
</html>
