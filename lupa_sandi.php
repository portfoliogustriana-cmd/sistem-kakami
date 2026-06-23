<?php
include 'koneksi.php';

// ==========================================
// FALLBACKS UNTUK INTEGRASI AMAN (PLUG & PLAY)
// ==========================================
// Jika koneksi.php di lokal user belum memiliki variable & function di bawah,
// kita deklarasikan di sini agar tidak memicu fatal error di server XAMPP lokal.
if (!isset($KODE_RAHASIA_OWNER)) {
    $KODE_RAHASIA_OWNER = "KAKAMI77";
}

if (!isset($WA_API_TOKEN) || $WA_API_TOKEN === "GANTI_DENGAN_TOKEN_FONNTE_ANDA") {
    $WA_API_TOKEN = "F9mm5GfND1PdapcjnEtb"; 
}

if (!isset($WA_GATEWAY_PROVIDER)) {
    $WA_GATEWAY_PROVIDER = "fonnte";
}

if (!function_exists('format_nomor_wa')) {
    function format_nomor_wa($nomor) {
        $nomor = preg_replace('/[^0-9]/', '', $nomor);
        if (substr($nomor, 0, 2) === '08') {
            $nomor = '628' . substr($nomor, 2);
        } elseif (substr($nomor, 0, 1) === '8') {
            $nomor = '62' . $nomor;
        }
        return $nomor;
    }
}

if (!function_exists('kirim_wa_otp')) {
    function kirim_wa_otp($no_wa, $message) {
        global $WA_API_TOKEN, $WA_GATEWAY_PROVIDER;
        
        // Jika token masih bawaan atau kosong, berikan info status simulasinya
        if (empty($WA_API_TOKEN) || $WA_API_TOKEN === "GANTI_DENGAN_TOKEN_FONNTE_ANDA" || $WA_API_TOKEN === "") {
            return [
                'status' => 'info',
                'message' => 'INFO: API WhatsApp otomatis siap! Pengiriman asli akan aktif setelah Token Fonnte Anda diisi di koneksi.php.'
            ];
        }
        
        $target = format_nomor_wa($no_wa);
        $curl = curl_init();
        
        if ($WA_GATEWAY_PROVIDER === "fonnte") {
            curl_setopt_array($curl, array(
                CURLOPT_URL => 'https://api.fonnte.com/send',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => array(
                    'target' => $target,
                    'message' => $message,
                    'countryCode' => '62',
                ),
                CURLOPT_HTTPHEADER => array(
                    "Authorization: " . $WA_API_TOKEN
                ),
            ));
        } else {
            curl_setopt_array($curl, array(
                CURLOPT_URL => 'https://api.starsender.online/api/send',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => json_encode(array(
                    'to' => $target,
                    'message' => $message
                )),
                CURLOPT_HTTPHEADER => array(
                    "Authorization: Bearer " . $WA_API_TOKEN,
                    "Content-Type: application/json"
                ),
            ));
        }
        
        $response = curl_exec($curl);
        $err = curl_error($curl);
        curl_close($curl);
        
        if ($err) {
            return [
                'status' => 'error',
                'message' => 'Gagal koneksi ke gateway WA: ' . $err
            ];
        } else {
            $result = json_decode($response, true);
            $is_success = false;
            if (isset($result['status'])) {
                if ($result['status'] === true || $result['status'] === 'true' || $result['status'] === 'success' || $result['status'] == 1) {
                    $is_success = true;
                }
            }
            
            if ($is_success) {
                return [
                    'status' => 'success',
                    'message' => 'BERHASIL: OTP terkirim otomatis secara instan via WhatsApp gateway!'
                ];
            } else {
                $err_msg = isset($result['detail']) ? $result['detail'] : (isset($result['reason']) ? $result['reason'] : $response);
                return [
                    'status' => 'failed',
                    'message' => 'Gateway merespon gagal: ' . $err_msg
                ];
            }
        }
    }
}

$step = 1;
$error = null;
$sukses = null;

// Ambil data untuk dipertahankan antar step via POST
$username_reset = isset($_POST['username_reset']) ? mysqli_real_escape_string($koneksi, $_POST['username_reset']) : '';
$no_wa_reset = isset($_POST['no_wa_reset']) ? mysqli_real_escape_string($koneksi, $_POST['no_wa_reset']) : '';
$saved_otp = isset($_POST['saved_otp']) ? $_POST['saved_otp'] : '';
$user_id_reset = isset($_POST['user_id_reset']) ? (int)$_POST['user_id_reset'] : 0;

// ============================================
// STEP 1: KIRIM KODE OTP (CEK DATA USERNAME & WA)
// ============================================
if (isset($_POST['kirim_otp'])) {
    $username = mysqli_real_escape_string($koneksi, strtolower($_POST['username']));
    $no_wa = mysqli_real_escape_string($koneksi, trim($_POST['no_wa']));

    if (empty($username) || empty($no_wa)) {
        $error = "Semua kolom data verifikasi wajib diisi!";
    } else {
        // Cek username dan nomor WA apakah sesuai di database
        $cek = mysqli_query($koneksi, "SELECT id, no_wa, nama_lengkap FROM users WHERE username='$username' AND no_wa='$no_wa'");
        if (mysqli_num_rows($cek) > 0) {
            $data_user = mysqli_fetch_assoc($cek);
            
            // Generate 6 digit angka OTP acak
            $otp_baru = rand(100000, 999999);
            $expires_at = date('Y-m-d H:i:s', strtotime('+15 minutes'));
            
            // Simpan kode OTP ke database
            $id_update = $data_user['id'];
            $update_otp = mysqli_query($koneksi, "UPDATE users SET otp_code='$otp_baru', otp_expires_at='$expires_at' WHERE id='$id_update'");
            
            if ($update_otp) {
                // KIRIM WA OTP OTOMATIS SECARA REAL-TIME/BACKGROUND LANGSUNG KE NOMOR TUJUAN!
                $pesan_otp = "[KAKAMI-WYSPORT] Halo " . $data_user['nama_lengkap'] . " (@" . $username . "), kode OTP reset sandi KAKAMI Anda adalah: *" . $otp_baru . "*. Silakan masukkan kode tersebut di halaman pemulihan. Berlaku 15 menit.";
                
                $response_wa = kirim_wa_otp($no_wa, $pesan_otp);
                
                $step = 2; // Lanjut ke step masukkan OTP & kode owner
                $username_reset = $username;
                $no_wa_reset = $no_wa;
                $saved_otp = $otp_baru;
                $user_id_reset = $id_update;
                
                if ($response_wa['status'] === 'success') {
                    $sukses = "KODE OTP BERHASIL DIKIRIM! Kode otorisasi telah dikirimkan menggunakan WhatsApp Gateway otomatis ke nomor: " . $no_wa . ". Silakan periksa pesan masuk WhatsApp di ponsel Anda!";
                } elseif ($response_wa['status'] === 'info') {
                    $sukses = "MOHON PERHATIAN: Kode OTP berhasil dibuat di sistem kami. Pengiriman otomatis akan berjalan secara penuh setelah Token WhatsApp API Anda dikonfigurasi di koneksi.php.";
                } else {
                    $sukses = "Kode OTP berhasil diproses di sistem kami, namun pengiriman via pihak ketiga gagal: " . $response_wa['message'] . ". Silakan hubungi administrator Anda.";
                }
            } else {
                $error = "Terjadi kesalahan sistem saat membuat kode OTP!";
            }
        } else {
            $error = "Username dan Nomor WhatsApp tidak cocok atau tidak terdaftar di sistem!";
        }
    }
}

// ============================================
// STEP 2: VERIFIKASI KODE OTP & KODE RAHSIA OWNER
// ============================================
if (isset($_POST['verifikasi_otp'])) {
    $otp_input = trim($_POST['otp_code_input']);
    $kode_owner_input = trim($_POST['kode_rahasia']);
    
    // Validasi Kode Rahasia Owner 
    if ($kode_owner_input !== $KODE_RAHASIA_OWNER) {
        $error = "KODE RAHASIA OWNER SALAH! Reset sandi diblokir demi keamanan. Silakan lapor ke owner.";
        $step = 2;
    } elseif (empty($otp_input)) {
        $error = "Masukkan kode OTP 6 Digit yang dikirim ke nomor WhatsApp Anda!";
        $step = 2;
    } else {
        // Cek kecocokan OTP di database
        $cek_data = mysqli_query($koneksi, "SELECT otp_code, otp_expires_at FROM users WHERE id='$user_id_reset'");
        if (mysqli_num_rows($cek_data) > 0) {
            $data_db = mysqli_fetch_assoc($cek_data);
            $sekarang = date('Y-m-d H:i:s');
            
            if ($sekarang > $data_db['otp_expires_at']) {
                $error = "Masa berlaku kode OTP telah kedaluwarsa (berlaku 15 menit). Silakan kirim ulang OTP.";
                $step = 1;
            } elseif ($data_db['otp_code'] !== $otp_input) {
                $error = "KODE OTP WHATSAPP SALAH! Silakan cek kembali pesan WhatsApp Anda.";
                $step = 2;
            } else {
                // OTP Benar, lanjut ke step ganti password
                $step = 3;
                $sukses = "Identitas terverifikasi dengan sangat ketat! Silakan setel kata sandi baru.";
            }
        } else {
            $error = "Pengguna tidak ditemukan.";
            $step = 1;
        }
    }
}

// ============================================
// STEP 3: SIMPAN PASSWORD BARU
// ============================================
if (isset($_POST['ganti_sandi'])) {
    $password_baru = $_POST['password_baru'];
    
    if (empty($password_baru) || strlen($password_baru) < 5) {
        $error = "Sandi baru minimal terdiri atas 5 karakter!";
        $step = 3;
    } else {
        // Enkripsi password baru
        $hashed_pass = password_hash($password_baru, PASSWORD_DEFAULT);
        
        // Update password dan kosongkan sisa OTP agar tidak bisa disalahgunakan lagi
        $update_pass = mysqli_query($koneksi, "UPDATE users SET password='$hashed_pass', otp_code=NULL, otp_expires_at=NULL WHERE id='$user_id_reset'");
        
        if ($update_pass) {
            $sukses = "Selamat! Kata sandi Anda kini telah berhasil dinonaktifkan/diganti dengan yang baru. Silakan login kembali.";
            $step = 4;
        } else {
            $error = "Gagal memperbarui kata sandi: " . mysqli_error($koneksi);
            $step = 3;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem Verifikasi Ketat - KAKAMI</title>
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
<body class="bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-300">
    
    <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-700 w-full max-w-md my-4">
        
        <div class="text-center mb-6">
            <!-- Client Logo -->
            <div class="flex justify-center mb-6">
                <img src="logo.png" alt="Client Logo" class="h-16 w-auto dark:invert transition-all duration-300" />
            </div>
        </div>

        <?php if($step == 1): ?>
            <!-- ================= STEP 1 UI ================= -->
            <div class="text-center mb-5">
                <h2 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5 justify-center">
                    <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> 
                    Pemulihan Akun
                </h2>
                <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Masukkan Username dan Nomor WA aktif Anda untuk mengirimkan kode OTP keamanan.</p>
            </div>

            <?php if(!empty($error)): ?>
                <div class='bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-[10px] font-bold mb-4 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5'>
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span><?php echo $error; ?></span>
                </div>
            <?php endif; ?>
            
            <form method="POST" class="space-y-4">
                <div>
                    <label class="block text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">Username Akun</label>
                    <input type="text" name="username" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-550" placeholder="Contoh: dion" required>
                </div>
                <div>
                    <label class="block text-[10px] font-extrabold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">Nomor WhatsApp Terdaftar</label>
                    <input type="text" name="no_wa" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-550" placeholder="Contoh: 08123456789" required>
                </div>
                
                <button type="submit" name="kirim_otp" class="w-full bg-emerald-600 dark:bg-emerald-700 text-white py-3.5 rounded-xl font-extrabold text-[11px] uppercase tracking-widest hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-md flex items-center justify-center gap-1.5 mt-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.25 0l-2.25 1.5"></path></svg>
                    Kirim OTP via WhatsApp
                </button>
            </form>
            
        <?php elseif($step == 2): ?>
            <!-- ================= STEP 2 UI ================= -->
            <div class="text-center mb-5">
                <div class="inline-flex w-11 h-11 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-full items-center justify-center mb-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h2 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">Masukkan Kode OTP</h2>
                <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-normal mt-1">Kode 6 digit telah dikirimkan ke nomor WhatsApp <span class="text-emerald-600 dark:text-emerald-400 font-extrabold"><?php echo htmlspecialchars($no_wa_reset); ?></span>.</p>
            </div>

            <?php if(!empty($sukses)): ?>
                <div class='bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-[10px] font-bold mb-4 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-1.5'>
                    <svg class="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                    <span><?php echo $sukses; ?></span>
                </div>
            <?php endif; ?>

            <?php if(!empty($error)): ?>
                <div class='bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-[10px] font-bold mb-4 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5'>
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span><?php echo $error; ?></span>
                </div>
            <?php endif; ?>
            
            <form method="POST" class="space-y-4">
                <!-- Data untuk di-pass ke controller berikutnya -->
                <input type="hidden" name="username_reset" value="<?php echo htmlspecialchars($username_reset); ?>">
                <input type="hidden" name="no_wa_reset" value="<?php echo htmlspecialchars($no_wa_reset); ?>">
                <input type="hidden" name="saved_otp" value="<?php echo htmlspecialchars($saved_otp); ?>">
                <input type="hidden" name="user_id_reset" value="<?php echo $user_id_reset; ?>">

                <div>
                    <label class="block text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1">Kode OTP 6-Digit</label>
                    <input type="text" name="otp_code_input" maxlength="6" pattern="[0-9]{6}" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-indigo-200 dark:border-indigo-900/60 p-4 rounded-xl text-center text-xl font-black tracking-[0.4em] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-indigo-300" placeholder="000000" required autofocus>
                </div>
                <div>
                    <label class="block text-[10px] font-extrabold text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1 justify-between">
                        <span>Kode Rahasia Owner (Izin Reset)</span>
                        <span class="text-[9px] hover:underline text-slate-400 cursor-pointer" onclick="alert('Mintalah kode rahasia owner saat ini kepada Atasan/Pemilik untuk mengizinkan reset password Anda.')">Apa ini?</span>
                    </label>
                    <input type="password" name="kode_rahasia" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-amber-200 dark:border-amber-900/40 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-amber-300" placeholder="Masukkan kode rahasia dari Owner..." required>
                </div>
                
                <button type="submit" name="verifikasi_otp" class="w-full bg-slate-900 dark:bg-slate-700 text-white py-3.5 rounded-xl font-extrabold text-[11px] uppercase tracking-widest hover:bg-black dark:hover:bg-slate-600 transition-all shadow-md flex items-center justify-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    Verifikasi Otorisasi
                </button>
            </form>

        <?php elseif($step == 3): ?>
            <!-- ================= STEP 3 UI ================= -->
            <div class="text-center mb-5">
                <div class="inline-flex w-11 h-11 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-full items-center justify-center mb-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                </div>
                <h2 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">Setel Sandi Baru</h2>
                <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">Gunakan kombinasi kata sandi yang kuat dan mudah Anda ingat sekarang.</p>
            </div>

            <?php if(!empty($error)): ?>
                <div class='bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-[10px] font-bold mb-4 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5'>
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span><?php echo $error; ?></span>
                </div>
            <?php endif; ?>
            
            <form method="POST" class="space-y-4">
                <input type="hidden" name="user_id_reset" value="<?php echo $user_id_reset; ?>">
                <div>
                    <label class="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Kata Sandi Baru</label>
                    <input type="password" name="password_baru" class="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 outline-none transition-all placeholder-slate-400" placeholder="Ketik kata sandi baru..." required autofocus>
                </div>
                <button type="submit" name="ganti_sandi" class="w-full bg-emerald-500 dark:bg-emerald-600 text-white py-3.5 rounded-xl font-extrabold text-[11px] uppercase tracking-widest hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-md">Simpan Sandi Baru</button>
            </form>

        <?php elseif($step == 4): ?>
            <!-- ================= STEP 4 UI (SUCCESS) ================= -->
            <div class="text-center py-4">
                <div class="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 class="text-lg font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-wide mb-2">Kata Sandi Diperbarui!</h2>
                <p class="text-[11px] font-bold text-slate-550 dark:text-slate-400 mb-6 leading-relaxed"><?php echo $sukses; ?></p>
                <a href="login.php" class="inline-block w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-extrabold text-[11px] uppercase tracking-widest hover:bg-black dark:hover:bg-slate-200 transition-all">Ke Halaman Login</a>
            </div>
        <?php endif; ?>

        <?php if($step != 4): ?>
        <div class="text-center mt-6">
            <a href="login.php" class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"><svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Batal & Kembali</a>
        </div>
        <?php endif; ?>
    </div>

</body>
</html>
