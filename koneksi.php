    <?php
    $host = "localhost";
    $user = "root";
    $pass = "";
    $db   = "konveksi_db";
    $koneksi = mysqli_connect($host, $user, $pass, $db);

    // ==========================================
    // CONFIG HAK AKSES & KODE KEAMANAN (OWNER)
    // ==========================================
    // Ganti kode di bawah ini dengan kode rahasia pilihan Anda.
    // Kode ini wajib dimasukkan oleh karyawan saat registrasi & reset kata sandi.
    $KODE_RAHASIA_OWNER = "KAKAMI77";

    // ==========================================
    // CONFIG AUTOMATED WHATSAPP GATEWAY (API)
    // ==========================================
    // Sistem ini mendukung pengiriman WA otomatis instan tanpa perlu masuk WA web manual!
    // Silakan isi Token Fonnte Anda di bawah ini (Daftar gratis di fonnte.com untuk mendapatkan token).
    $WA_API_TOKEN = "F9mm5GfND1PdapcjnEtb"; // <--- Masukkan token fonnte Anda di sini
    $WA_GATEWAY_PROVIDER = "fonnte"; // Pilihan: "fonnte" atau "starsender"

    if (!function_exists('format_nomor_wa')) {
        /**
        * Format nomor WhatsApp agar sesuai dengan standar internasional (dimulai dengan 62)
        */
        function format_nomor_wa($nomor) {
            // Hilangkan semua karakter non-digit
            $nomor = preg_replace('/[^0-9]/', '', $nomor);
            
            // Jika diawali dengan '08', ubah menjadi '628'
            if (substr($nomor, 0, 2) === '08') {
                $nomor = '628' . substr($nomor, 2);
            }
            // Jika diawali dengan '8', tambahkan '62'
            elseif (substr($nomor, 0, 1) === '8') {
                $nomor = '62' . $nomor;
            }
            
            return $nomor;
        }
    }

    if (!function_exists('kirim_wa_otp')) {
        /**
        * Kirim pesan WhatsApp otomatis secara real-time / background server langsung ke HP penerima
        */
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
                // Mendukung Starsender jika dipilih
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
                        "Authorization: " . $WA_API_TOKEN,
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
                
                // Cek indikator sukses respons API Fonnte / Starsender
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

    // Migrasi database otomatis agar sistem berjalan tanpa error
    if ($koneksi) {
        // 1. Tambah kolom pin_keamanan jika belum ada (untuk reset sandi super ketat)
        $check_pin = mysqli_query($koneksi, "SHOW COLUMNS FROM users LIKE 'pin_keamanan'");
        if ($check_pin && mysqli_num_rows($check_pin) == 0) {
            mysqli_query($koneksi, "ALTER TABLE users ADD COLUMN pin_keamanan VARCHAR(255) NULL AFTER password");
        }
        
        // 2. Berikan opsi NULL pada kolom lama no_wa agar registrasi baru tetap lancar tanpa error database
        $check_wa = mysqli_query($koneksi, "SHOW COLUMNS FROM users LIKE 'no_wa'");
        if ($check_wa && mysqli_num_rows($check_wa) > 0) {
            mysqli_query($koneksi, "ALTER TABLE users MODIFY COLUMN no_wa VARCHAR(50) NULL");
        }

        // 3. Tambah kolom otp_code untuk verifikasi OTP via WhatsApp
        $check_otp = mysqli_query($koneksi, "SHOW COLUMNS FROM users LIKE 'otp_code'");
        if ($check_otp && mysqli_num_rows($check_otp) == 0) {
            mysqli_query($koneksi, "ALTER TABLE users ADD COLUMN otp_code VARCHAR(10) NULL AFTER pin_keamanan");
        }

        // 4. Tambah kolom otp_expires_at untuk waktu kedaluwarsa kode OTP
        $check_otp_exp = mysqli_query($koneksi, "SHOW COLUMNS FROM users LIKE 'otp_expires_at'");
        if ($check_otp_exp && mysqli_num_rows($check_otp_exp) == 0) {
            mysqli_query($koneksi, "ALTER TABLE users ADD COLUMN otp_expires_at DATETIME NULL AFTER otp_code");
        }
    }
    ?>