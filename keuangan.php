<?php 
error_reporting(E_ALL); ini_set('display_errors', 1);
include 'koneksi_auth.php'; 
include 'koneksi.php'; 
$bulan_filter = $_GET['bulan'] ?? date('Y-m');

// 1. PROSES HAPUS TRANSAKSI & SINKRONISASI KE TABEL ORDERS
if (isset($_GET['hapus'])) {
    $id_hapus = (int)$_GET['hapus'];
    $cek_transaksi = mysqli_query($koneksi, "SELECT * FROM transactions WHERE id='$id_hapus'");
    $data_transaksi = mysqli_fetch_assoc($cek_transaksi);
    
    if ($data_transaksi) {
        $keterangan = $data_transaksi['keterangan'];
        $nominal_hapus = $data_transaksi['nominal'];
        
        if (strpos($keterangan, 'INV/') !== false) {
            preg_match('/INV\/[0-9]+/', $keterangan, $matches);
            if (!empty($matches[0])) {
                $invoice_no = $matches[0];
                $cek_order = mysqli_query($koneksi, "SELECT * FROM orders WHERE invoice_no='$invoice_no'");
                $data_order = mysqli_fetch_assoc($cek_order);
                
                if ($data_order) {
                    $id_order = $data_order['id'];
                    $dp_baru = max(0, $data_order['dp'] - $nominal_hapus);
                    $status_baru = 'DP'; 
                    mysqli_query($koneksi, "UPDATE orders SET dp='$dp_baru', status_bayar='$status_baru' WHERE id='$id_order'");
                }
            }
        }
        mysqli_query($koneksi, "DELETE FROM transactions WHERE id='$id_hapus'");
    }
    header("Location: keuangan.php?bulan=$bulan_filter");
    exit();
}

// 2. PROSES TAMBAH TRANSAKSI MANUAL
if (isset($_POST['tambah_transaksi'])) {
    $jenis = $_POST['jenis'];
    $kategori = $_POST['kategori'];
    $nominal = $_POST['nominal'];
    $tanggal = $_POST['tanggal'];
    $keterangan = $_POST['keterangan'];
    mysqli_query($koneksi, "INSERT INTO transactions (jenis, kategori, nominal, tanggal, keterangan) VALUES ('$jenis', '$kategori', '$nominal', '$tanggal', '$keterangan')");
    header("Location: keuangan.php?bulan=" . substr($tanggal, 0, 7));
    exit();
}

$query_result = mysqli_query($koneksi, "SELECT * FROM transactions WHERE tanggal LIKE '$bulan_filter%' ORDER BY tanggal DESC, id DESC");
$query = $query_result ? $query_result : mysqli_query($koneksi, "SELECT 1 LIMIT 0"); // Empty fallback

$masuk = 0;
$q_masuk = mysqli_query($koneksi, "SELECT SUM(nominal) as total FROM transactions WHERE jenis='Pemasukan' AND tanggal LIKE '$bulan_filter%'");
if ($q_masuk) {
    $row = mysqli_fetch_assoc($q_masuk);
    $masuk = $row['total'] ?? 0;
} else {
    echo "<div class='bg-red-500 text-white p-4'>DB Error Masuk: " . mysqli_error($koneksi) . "</div>";
}

$keluar = 0;
$q_keluar = mysqli_query($koneksi, "SELECT SUM(nominal) as total FROM transactions WHERE jenis='Pengeluaran' AND tanggal LIKE '$bulan_filter%'");
if ($q_keluar) {
    $row = mysqli_fetch_assoc($q_keluar);
    $keluar = $row['total'] ?? 0;
} else {
     echo "<div class='bg-red-500 text-white p-4'>DB Error Keluar: " . mysqli_error($koneksi) . "</div>";
}

$saldo = $masuk - $keluar;
?> 
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ERP Keuangan & Akuntansi | KAKAMI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark ::-webkit-scrollbar-thumb { background: #475569; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }
        
        /* Tab Transitions */
        .tab-content { display: none; opacity: 0; transition: opacity 0.3s ease-in-out; }
        .tab-content.active { display: block; opacity: 1; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
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
</head>
<body class="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 antialiased transition-colors duration-300 flex flex-col min-h-screen">

    <?php include 'navbar.php'; ?>
    
    <div class="p-4 sm:p-8 w-full max-w-screen-2xl mx-auto flex-grow flex flex-col gap-6">

        <!-- Top ERP Navigation -->
        <div class="w-full relative z-10 pb-2">
            <nav class="flex overflow-x-auto gap-2 ERP-Tabs hide-scrollbar">
                <button data-tab="tab-arus-kas" class="tab-btn whitespace-nowrap flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-full transition-all text-slate-900 dark:text-white bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                    <i data-lucide="wallet" class="w-4 h-4 text-emerald-500"></i> Kas & Jurnal
                </button>
                <button data-tab="tab-piutang" class="tab-btn whitespace-nowrap flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded-full transition-all text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800/80 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <i data-lucide="arrow-down-to-line" class="w-4 h-4 text-blue-500"></i> Pendapatan & Piutang
                </button>
                <button data-tab="tab-hutang" class="tab-btn whitespace-nowrap flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded-full transition-all text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800/80 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <i data-lucide="shopping-cart" class="w-4 h-4 text-orange-500"></i> Pengeluaran & Hutang
                </button>
                <button data-tab="tab-produksi" class="tab-btn whitespace-nowrap flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded-full transition-all text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800/80 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <i data-lucide="factory" class="w-4 h-4 text-amber-500"></i> Biaya Produksi & HPP
                </button>
                <button data-tab="tab-payroll" class="tab-btn whitespace-nowrap flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded-full transition-all text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800/80 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <i data-lucide="users-2" class="w-4 h-4 text-rose-500"></i> Payroll Borongan
                </button>
                <button data-tab="tab-laporan" class="tab-btn whitespace-nowrap flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded-full transition-all text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800/80 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <i data-lucide="bar-chart-3" class="w-4 h-4 text-indigo-500"></i> Laporan & Laba-Rugi
                </button>
            </nav>
        </div>

        <!-- Main Content Area -->
        <div class="flex-grow w-full max-w-full overflow-hidden">
            
            <!-- TAB 1: ARUS KAS (Existing Feature) -->
            <div id="tab-arus-kas" class="tab-content active space-y-6">
                <!-- Data Highlight Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div class="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-md border border-slate-200/60 dark:border-slate-700/60 border-l-8 border-l-emerald-500 hover:-translate-y-1 transition-all duration-300">
                        <h3 class="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Pemasukan</h3>
                        <p class="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">Rp <?php echo number_format($masuk, 0, ',', '.'); ?></p>
                    </div>
                    <div class="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-md border border-slate-200/60 dark:border-slate-700/60 border-l-8 border-l-rose-400 hover:-translate-y-1 transition-all duration-300">
                        <h3 class="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Pengeluaran</h3>
                        <p class="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">Rp <?php echo number_format($keluar, 0, ',', '.'); ?></p>
                    </div>
                    <div class="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 p-5 rounded-3xl shadow-lg border-l-8 border-l-indigo-400 hover:-translate-y-1 transition-all duration-300">
                        <h3 class="text-xs font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Net Cash / Saldo</h3>
                        <p class="text-2xl font-black text-white mt-2 tracking-tight">Rp <?php echo number_format($saldo, 0, ',', '.'); ?></p>
                    </div>
                </div>

                <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                    <!-- Form Transaksi -->
                    <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 space-y-4">
                        <h2 class="text-base font-extrabold border-b pb-3 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2"><i data-lucide="plus-square" class="w-4 h-4"></i> Input Kas Manual</h2>
                        <form method="POST" class="flex flex-col gap-3.5">
                            <div>
                                <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Jenis Transaksi</label>
                                <select name="jenis" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-bold outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all cursor-pointer text-slate-800 dark:text-slate-200" required>
                                    <option value="Pemasukan">Pemasukan (IN)</option>
                                    <option value="Pengeluaran">Pengeluaran (OUT)</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Kategori Biaya</label>
                                <input name="kategori" placeholder="Bahan Baku, Ongkir, Gaji..." class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all placeholder-slate-400 dark:placeholder-slate-500 font-semibold text-slate-800 dark:text-slate-200" required>
                            </div>
                            <div>
                                <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Nominal Rupiah</label>
                                <input type="number" name="nominal" placeholder="Contoh: 500000" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all placeholder-slate-400 dark:placeholder-slate-500 font-mono font-bold text-slate-800 dark:text-slate-200" required>
                            </div>
                            <div>
                                <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Tanggal</label>
                                <input type="date" name="tanggal" value="<?php echo date('Y-m-d'); ?>" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all font-semibold cursor-pointer text-slate-800 dark:text-slate-200" required>
                            </div>
                            <div>
                                <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Keterangan Tambahan</label>
                                <textarea name="keterangan" rows="3" placeholder="Tulis detail catatan kas..." class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all placeholder-slate-400 dark:placeholder-slate-500 resize-none text-slate-800 dark:text-slate-200" required></textarea>
                            </div>
                            <button type="submit" name="tambah_transaksi" class="w-full bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-600 text-white py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:from-black hover:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-500 transform hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-slate-900/20 dark:shadow-none mt-2">
                                <i data-lucide="save" class="w-4 h-4 inline-block mr-1"></i> Simpan Transaksi
                            </button>
                        </form>
                    </div>

                    <!-- Tabel Jurnal / Arus Kas -->
                    <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 xl:col-span-2 space-y-4">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 border-slate-100 dark:border-slate-700">
                            <h2 class="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2"><i data-lucide="book-open" class="w-4 h-4 text-emerald-500"></i> Jurnal Arus Kas (GL)</h2>
                            <form method="GET" class="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-1 rounded-xl shadow-sm">
                                <input type="month" name="bulan" value="<?php echo $bulan_filter; ?>" class="bg-transparent border-none p-1.5 focus:outline-none text-xs font-bold cursor-pointer text-slate-700 dark:text-slate-200">
                                <button type="submit" class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-black dark:hover:bg-slate-200 transition-all">Filter</button>
                            </form>
                        </div>

                        <div class="overflow-x-auto rounded-xl">
                            <table class="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr class="bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest text-center border-b border-slate-200 dark:border-slate-700">
                                        <th class="p-4 font-extrabold text-left rounded-tl-xl">Tanggal</th>
                                        <th class="p-4 font-extrabold w-20">Arus</th>
                                        <th class="p-4 font-extrabold">Kategori</th>
                                        <th class="p-4 font-extrabold text-left">Keterangan</th>
                                        <th class="p-4 font-extrabold text-right">Nominal</th>
                                        <th class="p-4 font-extrabold rounded-tr-xl">Aksi</th> 
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    <?php if ($query): while($r = mysqli_fetch_assoc($query)): ?>
                                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors duration-200 text-center group">
                                        <td class="p-4 font-mono text-xs text-slate-500 text-left"><?php echo date('d/m/Y', strtotime($r['tanggal'])); ?></td>
                                        <td class="p-4">
                                            <?php echo ($r['jenis'] == 'Pemasukan') ? '<span class="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-2 py-1 rounded-md text-[9px] font-black tracking-widest shadow-sm">IN</span>' : '<span class="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 px-2 py-1 rounded-md text-[9px] font-black tracking-widest shadow-sm">OUT</span>'; ?>
                                        </td>
                                        <td class="p-4 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide"><?php echo htmlspecialchars($r['kategori']); ?></td>
                                        <td class="p-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed"><?php echo htmlspecialchars($r['keterangan']); ?></td>
                                        <td class="p-4 text-right font-black text-slate-900 dark:text-slate-200 font-mono text-xs">Rp <?php echo number_format($r['nominal'], 0, ',', '.'); ?></td>
                                        <td class="p-4">
                                            <a href="keuangan.php?hapus=<?php echo $r['id']; ?>&bulan=<?php echo $bulan_filter; ?>" onclick="return confirm('Yakin ingin menghapus transaksi ini?')" class="text-[9px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-800 px-3 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider shadow-sm flex items-center justify-center w-max mx-auto border border-red-200 dark:border-red-900/50">
                                                <i data-lucide="trash-2" class="w-3 h-3 mr-1"></i>Hapus
                                            </a>
                                        </td>
                                    </tr>
                                    <?php endwhile; endif; ?>
                                    
                                    <?php if(!$query || mysqli_num_rows($query) == 0): ?>
                                    <tr>
                                        <td colspan="6" class="p-16 text-center text-slate-400 dark:text-slate-500 font-medium italic bg-slate-50 dark:bg-slate-900/20 rounded-b-xl border-x border-b border-slate-100 dark:border-slate-800">Tidak ada arus data jurnal di bulan ini.</td>
                                    </tr>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 2: PENDAPATAN & PIUTANG -->
            <div id="tab-piutang" class="tab-content">
                <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-md border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div class="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-800">
                        <i data-lucide="arrow-down-to-line" class="w-10 h-10 text-blue-500"></i>
                    </div>
                    <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Manajemen Pendapatan & Piutang</h2>
                    <p class="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed mb-8">
                        Modul ini mengelola pencatatan invoice (faktur), pembayaran pelunasan Order (Termin/DP), serta pengingat tagihan (Aging Receivables) berdasarkan database <strong>orders</strong>.
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                        <div class="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
                            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Daftar Invoice Terbuka</h4>
                            <p class="text-xs text-slate-500">Pantau Klien yang belum melunasi barang pesanan mereka (Status: DP).</p>
                        </div>
                        <div class="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
                            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Penerimaan Pembayaran</h4>
                            <p class="text-xs text-slate-500">API Endpoint POST /api/finance/receivables/dp otomatis masuk jurnal.</p>
                        </div>
                    </div>
                    <button class="mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black transition-all">
                        <i data-lucide="rocket" class="w-4 h-4"></i> Segera Hadir di Update V2 
                    </button>
                </div>
            </div>

            <!-- TAB PENGELUARAN & HUTANG -->
            <div id="tab-hutang" class="tab-content">
                <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-md border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div class="w-20 h-20 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6 border border-orange-100 dark:border-orange-800">
                        <i data-lucide="shopping-cart" class="w-10 h-10 text-orange-500"></i>
                    </div>
                    <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Manajemen Pengeluaran & Hutang</h2>
                    <p class="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed mb-8">
                        Modul ini mengelola pencatatan hutang supplier, pembelian bahan baku, kas kecil, dan pembayaran biaya overhead pabrik.
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                        <div class="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
                            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Hutang Supplier (Accounts Payable)</h4>
                            <p class="text-xs text-slate-500">Pantau tagihan bahan baku dari supplier yang belum jatuh tempo.</p>
                        </div>
                        <div class="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
                            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Pembayaran Kas Kecil</h4>
                            <p class="text-xs text-slate-500">Pencatatan biaya overhead, listrik, operasional, dan konsumsi harian.</p>
                        </div>
                    </div>
                    <button class="mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black transition-all">
                        <i data-lucide="rocket" class="w-4 h-4"></i> Segera Hadir di Update V2 
                    </button>
                </div>
            </div>

            <!-- TAB 3: BIAYA PRODUKSI & HPP -->
            <div id="tab-produksi" class="tab-content">
                <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-md border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div class="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6 border border-amber-100 dark:border-amber-800">
                        <i data-lucide="factory" class="w-10 h-10 text-amber-500"></i>
                    </div>
                    <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Biaya Produksi & Kalkulasi HPP</h2>
                    <p class="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed mb-8">
                        Modul Job Order Costing. Melacak pengeluaran bahan baku (Kain, Aksesoris) dan biaya upah secara spesifik untuk setiap SPK yang berjalan untuk menghitung <strong>HPP akurat per potong pakaian</strong>.
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                        <div class="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
                            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Material Issue (FIFO/Average)</h4>
                            <p class="text-xs text-slate-500">Catat pemakaian kain per gulung/kilo yang dibebankan ke SPK-XYZ.</p>
                        </div>
                        <div class="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
                            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Cost of Goods Manufactured</h4>
                            <p class="text-xs text-slate-500">Pantau margin laba per SPK = (Harga Jual SO) - (Biaya Bahan + Jahit + Overhead).</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 4: PAYROLL BORONGAN -->
            <div id="tab-payroll" class="tab-content">
                <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-md border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div class="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6 border border-rose-100 dark:border-rose-800">
                        <i data-lucide="users-2" class="w-10 h-10 text-rose-500"></i>
                    </div>
                    <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Sistem Penggajian & Borongan</h2>
                    <p class="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed mb-8">
                        Manajemen upah penjahit berbasis borongan (Piece Rate). Menghitung otomatis upah berdasarkan jumlah barang yang selesai (dikurangi reject/cacat), serta manajemen potong kasbon.
                    </p>
                    <div class="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-left text-xs text-slate-600 dark:text-slate-400 shadow-inner">
                        <span class="text-purple-600 dark:text-purple-400">POST</span> /api/production/piece-rate<br><br>
                        {<br>
                        &nbsp;&nbsp;"employee_id": 15,<br>
                        &nbsp;&nbsp;"production_order_id": 880,<br>
                        &nbsp;&nbsp;"qty_selesai": 50,<br>
                        &nbsp;&nbsp;"tarif_per_pcs": 4500.00<br>
                        }
                    </div>
                </div>
            </div>

            <!-- TAB 5: LAPORAN & TUTUP BUKU -->
            <div id="tab-laporan" class="tab-content">
                <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-md border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div class="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-800">
                        <i data-lucide="bar-chart-3" class="w-10 h-10 text-indigo-500"></i>
                    </div>
                    <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Laporan Keuangan & Tutup Buku</h2>
                    <p class="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed mb-8">
                        Menghasilkan Laporan Laba/Rugi komprehensif, Neraca Saldo, serta fitur Tutup Buku Bulanan (Month-End Close) untuk mengunci periode transaksi jurnal agar tidak bisa diubah lagi.
                    </p>
                    <div class="flex gap-4">
                         <button class="bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all opacity-70 cursor-not-allowed">
                            <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Export Laba/Rugi
                        </button>
                        <button class="bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose-100 transition-all opacity-70 cursor-not-allowed">
                            <i data-lucide="lock" class="w-4 h-4"></i> Tutup Buku Periode Ini
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- Include Footer -->
    <div class="mt-auto">
        <?php include 'footer.php'; ?>
    </div>

    <script>
        lucide.createIcons();

        // Simple Tab Logic Document with Hash & LocalStorage Support
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        function activateTab(targetId) {
            tabBtns.forEach(b => {
                b.classList.remove('text-slate-900', 'dark:text-white', 'bg-white', 'dark:bg-slate-800', 'shadow-sm', 'border-slate-200', 'dark:border-slate-700', 'font-bold');
                b.classList.add('text-slate-500', 'hover:bg-white', 'dark:text-slate-400', 'dark:hover:bg-slate-800/80', 'hover:shadow-sm', 'border-transparent', 'hover:border-slate-200', 'dark:hover:border-slate-700', 'font-semibold');
            });
            tabContents.forEach(c => c.classList.remove('active'));

            const activeBtn = document.querySelector(`.tab-btn[data-tab="${targetId}"]`);
            const activeContent = document.getElementById(targetId);

            if (activeBtn && activeContent) {
                activeBtn.classList.remove('text-slate-500', 'hover:bg-white', 'dark:text-slate-400', 'dark:hover:bg-slate-800/80', 'hover:shadow-sm', 'border-transparent', 'hover:border-slate-200', 'dark:hover:border-slate-700', 'font-semibold');
                activeBtn.classList.add('text-slate-900', 'dark:text-white', 'bg-white', 'dark:bg-slate-800', 'shadow-sm', 'border-slate-200', 'dark:border-slate-700', 'font-bold');
                activeContent.classList.add('active');
                
                // Save to localStorage and Hash
                localStorage.setItem('activeKeuanganTab', targetId);
                history.replaceState(null, null, '#' + targetId);
            }
        }

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-tab');
                activateTab(targetId);
            });
        });

        // Initialize active tab from Hash or LocalStorage
        window.addEventListener('DOMContentLoaded', () => {
            let initialTab = 'tab-arus-kas'; // Default
            
            const hash = window.location.hash.substring(1);
            const storedIndex = localStorage.getItem('activeKeuanganTab');
            
            if (hash && document.getElementById(hash)) {
                initialTab = hash;
            } else if (storedIndex && document.getElementById(storedIndex)) {
                initialTab = storedIndex;
            }
            
            activateTab(initialTab);
        });
    </script>
</body>
</html>