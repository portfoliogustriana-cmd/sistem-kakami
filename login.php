<?php
session_start();
include 'koneksi.php';

// Jika sudah login, jangan boleh ke halaman login lagi
if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

if (isset($_POST['login'])) {
    $username = mysqli_real_escape_string($koneksi, $_POST['username']);
    $password = $_POST['password'];

    $cek = mysqli_query($koneksi, "SELECT * FROM users WHERE username='$username'");
    if (mysqli_num_rows($cek) > 0) {
        $data = mysqli_fetch_assoc($cek);
        // Verifikasi password yang di-hash
        if (password_verify($password, $data['password'])) {
            $_SESSION['user_id'] = $data['id'];
            $_SESSION['username'] = $data['username'];
            $_SESSION['nama_lengkap'] = $data['nama_lengkap'];
            $_SESSION['role'] = $data['role'];
            
            header("Location: index.php");
            exit();
        } else {
            $error = "Password yang Anda masukkan salah!";
        }
    } else {
        $error = "Username tidak terdaftar!";
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login System - KAKAMI</title>
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
<body class="bg-slate-50 dark:bg-slate-900 flex items-center justify-center min-h-screen relative overflow-hidden transition-colors duration-300">
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl"></div>

    <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700/50 w-full max-w-md relative z-10">
        <div class="text-center mb-8">
            <!-- Client Logo -->
            <div class="flex justify-center mb-6">
                <img src="logo.png" alt="Client Logo" class="h-16 sm:h-20 w-auto drop-shadow-md dark:invert transition-all duration-300" />
            </div>
            <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-5">Production Command Center</p>
        </div>

        <?php if(isset($error)): ?>
            <div class="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold mb-6 border border-rose-200 dark:border-rose-800/50 text-center animate-bounce">
                <svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> <?php echo $error; ?>
            </div>
        <?php endif; ?>

        <form method="POST" class="space-y-5">
            <div>
                <label class="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Username</label>
                <input type="text" name="username" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500" placeholder="Ketik username..." required>
            </div>
            <div>
                <label class="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Password</label>
                <input type="password" name="password" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500" placeholder="••••••••" required>
            </div>
            <div class="flex justify-between items-center px-1">
                <a href="register.php" class="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition">Buat Akun Baru</a>
                <a href="lupa_sandi.php" class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition">Lupa Sandi?</a>
            </div>
            <button type="submit" name="login" class="w-full bg-gradient-to-r from-slate-900 to-slate-700 dark:from-indigo-600 dark:to-indigo-500 text-white py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:from-black hover:to-slate-800 dark:hover:from-indigo-500 dark:hover:to-indigo-400 shadow-xl shadow-slate-900/20 dark:shadow-indigo-900/20 transform hover:-translate-y-0.5 transition-all">
                MASUK SISTEM <svg class="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </button>
        </form>
    </div>
</body>
</html>