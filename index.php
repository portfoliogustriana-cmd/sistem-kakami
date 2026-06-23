<?php 
include 'koneksi_auth.php'; 
include 'koneksi.php'; 

// KODE DARURAT
mysqli_query($koneksi, "ALTER TABLE orders ADD COLUMN IF NOT EXISTS bahan_utama VARCHAR(100) DEFAULT 'Jacquart'");
mysqli_query($koneksi, "ALTER TABLE orders ADD COLUMN IF NOT EXISTS bentuk_kerah VARCHAR(100) DEFAULT 'V-Neck Tumpuk'");
mysqli_query($koneksi, "ALTER TABLE orders ADD COLUMN IF NOT EXISTS jenis_orderan VARCHAR(100) DEFAULT 'Full Order'");
mysqli_query($koneksi, "ALTER TABLE orders ADD COLUMN IF NOT EXISTS jenis_produk VARCHAR(100) DEFAULT 'Jersey'");

// FILTER WAKTU
$bulan_filter = $_GET['bulan'] ?? date('Y-m'); 

// --- 1. QUERY METRIK UTAMA (FINANSIAL) ---
$masuk = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT SUM(nominal) as total FROM transactions WHERE jenis='Pemasukan' AND tanggal LIKE '$bulan_filter%'"))['total'] ?? 0;
$keluar = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT SUM(nominal) as total FROM transactions WHERE jenis='Pengeluaran' AND tanggal LIKE '$bulan_filter%'"))['total'] ?? 0;
$margin = $masuk - $keluar;
$total_order = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT SUM(total_harga) as t FROM orders WHERE tanggal_order LIKE '$bulan_filter%'"))['t'] ?? 0;
$total_pcs = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT SUM(jumlah_pcs) as t_pcs FROM orders WHERE tanggal_order LIKE '$bulan_filter%'"))['t_pcs'] ?? 0;

// --- 2. QUERY RANGKUMAN TRACKING PRODUKSI ---
$q_track = mysqli_query($koneksi, "SELECT status_tracking, COUNT(id) as jml FROM orders WHERE tanggal_order LIKE '$bulan_filter%' GROUP BY status_tracking");
$track_data = ['DP' => 0, 'Produksi' => 0, 'Jait' => 0, 'Checking' => 0, 'Selesai' => 0];
$total_orderan_tracking = 0;
while($tr = mysqli_fetch_assoc($q_track)) {
    $st = $tr['status_tracking'] ? $tr['status_tracking'] : 'DP';
    if(isset($track_data[$st])) {
        $track_data[$st] += $tr['jml'];
        $total_orderan_tracking += $tr['jml'];
    }
}

// --- 3. QUERY RANGKUMAN SPK KOSONG ---
$q_spk_alert = mysqli_query($koneksi, "SELECT o.id, o.invoice_no, o.nama_order, o.jenis_produk, o.jumlah_pcs, (SELECT COUNT(id) FROM order_items WHERE order_id=o.id) as total_terinput FROM orders o WHERE o.tanggal_order LIKE '$bulan_filter%' HAVING total_terinput < o.jumlah_pcs ORDER BY o.tanggal_order DESC LIMIT 5");

// --- 4. QUERY TOP KONSUMEN BULAN INI ---
$q_top_konsumen = mysqli_query($koneksi, "SELECT nama_konsumen, COUNT(id) as freq, SUM(jumlah_pcs) as qty FROM orders WHERE tanggal_order LIKE '$bulan_filter%' GROUP BY nama_konsumen ORDER BY qty DESC LIMIT 5");

// --- 5. QUERY ORDER BELUM LUNAS MELEWATI DEADLINE ---
$hari_ini = date('Y-m-d');
$q_piutang = mysqli_query($koneksi, "SELECT invoice_no, nama_konsumen, (total_harga - dp) as sisa_hutang, deadline_kerja FROM orders WHERE tanggal_order LIKE '$bulan_filter%' AND status_bayar != 'Lunas' AND deadline_kerja <= '$hari_ini' ORDER BY deadline_kerja ASC LIMIT 5");
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Super Dashboard - KAKAMI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark ::-webkit-scrollbar-thumb { background: #475569; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }
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
    
    <div class="p-4 sm:p-8 w-full">
        <div class="max-w-7xl mx-auto space-y-6">
            
            <!-- HEADER GLASSMORPHISM -->
            <div class="flex flex-col md:flex-row justify-between items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 relative overflow-hidden">
                <div class="absolute right-0 top-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-100 dark:bg-indigo-900/30 rounded-full blur-3xl opacity-60"></div>
                <div class="relative z-10">
                    <h2 class="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight flex items-center gap-2">
                        <span class="text-slate-800 dark:text-white"><svg class="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></span> Command Center
                    </h2>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest mt-1">Sistem Pemantauan Terintegrasi 360°</p>
                </div>
                
                <form method="GET" class="mt-4 md:mt-0 flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative z-10">
                    <label class="font-extrabold text-[10px] text-slate-400 dark:text-slate-500 pl-2 uppercase tracking-wider">Periode Data:</label>
                    <input type="month" name="bulan" value="<?php echo $bulan_filter; ?>" class="border-none bg-slate-50 dark:bg-slate-700 p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 text-xs font-bold cursor-pointer transition text-slate-700 dark:text-slate-100">
                    <button type="submit" class="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-600 text-white px-5 py-2 rounded-xl font-extrabold text-[10px] uppercase tracking-widest hover:from-black hover:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-500 transform active:scale-95 transition-all shadow-md shadow-slate-900/20 dark:shadow-black/40">Sinkronisasi</button>
                </form>
            </div>

            <!-- 5 KARTU METRIK UTAMA (TIDAK BERUBAH DARI SEBELUMNYA) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                <!-- 1. Pemasukan -->
                <div class="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 border-l-8 border-l-emerald-500 hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start">
                        <h3 class="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">Pemasukan Kas</h3>
                        <span class="text-slate-400 group-hover:text-emerald-500 transition duration-300"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg></span>
                    </div>
                    <p class="text-xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">Rp <?php echo number_format($masuk, 0, ',', '.'); ?></p>
                </div>
                
                <!-- 2. Pengeluaran -->
                <div class="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 border-l-8 border-l-slate-400 dark:border-l-slate-600 hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start">
                        <h3 class="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">Pengeluaran</h3>
                        <span class="text-slate-400 group-hover:text-slate-600 transition duration-300"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg></span>
                    </div>
                    <p class="text-xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">Rp <?php echo number_format($keluar, 0, ',', '.'); ?></p>
                </div>

                <!-- 3. Status Profit -->
                <?php if ($margin >= 0): ?>
                    <div class="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 p-5 rounded-3xl shadow-lg shadow-slate-900/10 dark:shadow-none text-white border-l-8 border-l-emerald-400 dark:border-l-emerald-500 hover:-translate-y-1 transition-all group relative overflow-hidden">
                        <div class="absolute right-0 top-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl"></div>
                        <div class="flex justify-between items-start relative z-10">
                            <h3 class="text-slate-400 dark:text-slate-300 text-[10px] font-extrabold uppercase tracking-widest">Status Finansial</h3>
                            <span class="text-[9px] bg-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm border border-emerald-400/30">Untung</span>
                        </div>
                        <p class="text-xl font-black text-white mt-2 tracking-tight relative z-10">Rp <?php echo number_format($margin, 0, ',', '.'); ?></p>
                    </div>
                <?php else: ?>
                    <div class="bg-gradient-to-br from-rose-500 to-red-600 dark:from-rose-800 dark:to-rose-900 p-5 rounded-3xl shadow-lg shadow-red-500/20 dark:shadow-none text-white border-l-8 border-l-white dark:border-l-rose-200 hover:-translate-y-1 transition-all group relative overflow-hidden">
                        <div class="absolute right-0 top-0 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                        <div class="flex justify-between items-start relative z-10">
                            <h3 class="text-rose-200 text-[10px] font-extrabold uppercase tracking-widest">Status Finansial</h3>
                            <span class="text-[9px] bg-white text-rose-600 dark:bg-rose-200 dark:text-rose-900 px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm animate-pulse">Rugi <svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></span>
                        </div>
                        <p class="text-xl font-black text-white mt-2 tracking-tight relative z-10">- Rp <?php echo number_format(abs($margin), 0, ',', '.'); ?></p>
                    </div>
                <?php endif; ?>
                
                <!-- 4. Nilai Order -->
                <div class="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 border-l-8 border-l-indigo-500 hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start">
                        <h3 class="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">Nilai Omset</h3>
                        <span class="text-slate-400 group-hover:text-indigo-500 transition duration-300"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></span>
                    </div>
                    <p class="text-xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">Rp <?php echo number_format($total_order, 0, ',', '.'); ?></p>
                </div>
                
                <!-- 5. Total Qty -->
                <div class="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 border-l-8 border-l-purple-500 hover:-translate-y-1 transition-all group">
                    <div class="flex justify-between items-start">
                        <h3 class="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">Volume Produksi</h3>
                        <span class="text-slate-400 group-hover:text-purple-500 transition duration-300"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></span>
                    </div>
                    <p class="text-xl font-black text-slate-900 dark:text-white mt-2 tracking-tight"><?php echo number_format($total_pcs); ?> <span class="text-xs font-bold text-slate-400 dark:text-slate-500">Pcs</span></p>
                </div>
            </div>

            <!-- GRID AREA BARU: RANGKUMAN MODUL BAWAHAN -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- BAGIAN KIRI (LEBAR): Rangkuman Tracking & SPK -->
                <div class="lg:col-span-2 space-y-6">
                    
                    <!-- PANEL 1: RADAR TRACKING PRODUKSI -->
                    <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                        <div class="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-700 pb-3">
                            <h3 class="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2"><span><svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></span> Radar Distribusi Logistik</h3>
                            <a href="tracking.php?bulan=<?php echo $bulan_filter; ?>" class="text-[9px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg uppercase hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 transition-all">Kelola</a>
                        </div>
                        
                        <?php if($total_orderan_tracking == 0): ?>
                            <p class="text-xs text-center text-slate-400 dark:text-slate-500 italic py-4">Belum ada orderan masuk di bulan ini.</p>
                        <?php else: ?>
                            <div class="space-y-4">
                                <?php 
                                $colors = ['DP'=>'bg-slate-400', 'Produksi'=>'bg-blue-500', 'Jait'=>'bg-purple-500', 'Checking'=>'bg-orange-500', 'Selesai'=>'bg-emerald-500'];
                                foreach($track_data as $status => $jumlah): 
                                    $persen = round(($jumlah / $total_orderan_tracking) * 100);
                                    $bg = $colors[$status] ?? 'bg-slate-300';
                                ?>
                                <div>
                                    <div class="flex justify-between text-[10px] font-extrabold mb-1 uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                        <span>Tahap: <?php echo $status; ?> (<?php echo $jumlah; ?> Nota)</span>
                                        <span><?php echo $persen; ?>%</span>
                                    </div>
                                    <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden shadow-inner">
                                        <div class="<?php echo $bg; ?> h-2 rounded-full transition-all duration-1000" style="width: <?php echo $persen; ?>%"></div>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>

                    <!-- PANEL 2: ALERT BERKAS SPK KOSONG -->
                    <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                        <div class="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                            <h3 class="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2"><span><svg class="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></span> Peringatan Berkas SPK</h3>
                            <a href="spk.php?bulan=<?php echo $bulan_filter; ?>" class="text-[9px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg uppercase hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 transition-all">Lihat SPK</a>
                        </div>
                        
                        <div class="space-y-3">
                            <?php if(mysqli_num_rows($q_spk_alert) == 0): ?>
                                <p class="text-xs text-center text-slate-400 dark:text-slate-500 italic py-2"><svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg> Semua antrean nota sudah dilengkapi rincian SPK ukurannya.</p>
                            <?php else: ?>
                                <?php while($spk = mysqli_fetch_assoc($q_spk_alert)): ?>
                                    <div class="flex justify-between items-center p-3 border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/20 rounded-2xl group hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                        <div>
                                            <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                <span class="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider"><?php echo $spk['invoice_no']; ?></span>
                                                <span class="bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase tracking-tight"><?php echo htmlspecialchars($spk['jenis_produk'] ?? 'Jersey'); ?></span>
                                            </div>
                                            <h4 class="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase"><?php echo $spk['nama_order']; ?></h4>
                                            <p class="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1">Terinput: <?php echo $spk['total_terinput']; ?> dari <?php echo $spk['jumlah_pcs']; ?> Pcs</p>
                                        </div>
                                        <a href="spk.php?isi_id=<?php echo $spk['id']; ?>&bulan=<?php echo $bulan_filter; ?>" class="text-[9px] bg-rose-500 text-white font-black px-3 py-2 rounded-xl uppercase tracking-widest shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-all">Isi SPK</a>
                                    </div>
                                <?php endwhile; ?>
                            <?php endif; ?>
                        </div>
                    </div>

                </div>

                <!-- BAGIAN KANAN (SEMPIT): Konsumen & Piutang -->
                <div class="space-y-6">
                    
                    <!-- PANEL 3: TOP KONSUMEN -->
                    <div class="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-900/20 border border-slate-800 text-white relative overflow-hidden">
                        <div class="absolute right-0 top-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
                        <div class="relative z-10">
                            <h3 class="text-sm font-black uppercase tracking-wider text-white mb-5 border-b border-slate-700 pb-3 flex items-center gap-2"><span><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg></span> Top 5 Klien Loyal</h3>
                            
                            <div class="space-y-4">
                                <?php if(mysqli_num_rows($q_top_konsumen) == 0): ?>
                                    <p class="text-xs text-center text-slate-500 italic">Belum ada transaksi.</p>
                                <?php else: ?>
                                    <?php $rank=1; while($k = mysqli_fetch_assoc($q_top_konsumen)): ?>
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-700">#<?php echo $rank++; ?></div>
                                            <div class="flex-1">
                                                <h4 class="text-[11px] font-extrabold uppercase tracking-wide text-indigo-200"><?php echo $k['nama_konsumen']; ?></h4>
                                                <p class="text-[9px] font-bold text-slate-400">Order: <?php echo $k['freq']; ?>x | Vol: <span class="text-emerald-400"><?php echo $k['qty']; ?> Pcs</span></p>
                                            </div>
                                        </div>
                                    <?php endwhile; ?>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>

                    <!-- PANEL 4: ALERT NOTA BELUM LUNAS JATUH TEMPO -->
                    <div class="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl shadow-sm border border-amber-200 dark:border-amber-800/50">
                        <h3 class="text-sm font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-4 border-b border-amber-200 dark:border-amber-800/50 pb-3 flex items-center gap-2"><span><svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></span> Jatuh Tempo Belum Lunas</h3>
                        
                        <div class="space-y-3">
                            <?php if(mysqli_num_rows($q_piutang) == 0): ?>
                                <p class="text-xs text-center text-amber-600/70 dark:text-amber-400/80 font-bold italic py-4">Semua nota lunas atau belum lewat target.</p>
                            <?php else: ?>
                                <?php while($piutang = mysqli_fetch_assoc($q_piutang)): ?>
                                    <div class="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-amber-100 dark:border-slate-700 shadow-sm relative">
                                        <div class="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-2xl">LEWAT BATAS</div>
                                        <h4 class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1"><?php echo $piutang['invoice_no']; ?></h4>
                                        <p class="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase my-1"><?php echo $piutang['nama_konsumen']; ?></p>
                                        <div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                            <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500">Sisa Tagihan:</span>
                                            <span class="text-[11px] font-black text-rose-600 dark:text-rose-400 font-mono">Rp <?php echo number_format($piutang['sisa_hutang'], 0, ',', '.'); ?></span>
                                        </div>
                                    </div>
                                <?php endwhile; ?>
                            <?php endif; ?>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    </div>


    <?php include 'footer.php'; ?>
</body>
</html>