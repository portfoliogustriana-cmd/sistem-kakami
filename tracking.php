<?php 
include 'koneksi_auth.php'; 
include 'koneksi.php'; 

// 1. KODE DARURAT
mysqli_query($koneksi, "ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_tracking VARCHAR(50) DEFAULT 'DP'");
mysqli_query($koneksi, "ALTER TABLE orders ADD COLUMN IF NOT EXISTS kendala_produksi TEXT NULL");
mysqli_query($koneksi, "ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_updated_status DATETIME NULL");

// 2. TANGKAP FILTER
$bulan_filter = $_GET['bulan'] ?? date('Y-m'); 
$status_aktif = $_GET['status'] ?? ''; 

// 3. PROSES UPDATE
if (isset($_POST['update_tracking'])) {
    $id_order = (int)$_POST['id_order'];
    $status_baru = mysqli_real_escape_string($koneksi, $_POST['status_tracking']);
    $kendala = mysqli_real_escape_string($koneksi, $_POST['kendala_produksi']);
    
    mysqli_query($koneksi, "UPDATE orders SET 
        status_tracking='$status_baru', 
        kendala_produksi='$kendala', 
        last_updated_status=NOW() 
        WHERE id='$id_order'");
    
    header("Location: tracking.php?bulan=$bulan_filter&status=$status_aktif");
    exit();
}

// 4. REKAP STATUS
$q_track = mysqli_query($koneksi, "SELECT status_tracking, COUNT(id) as jml FROM orders WHERE tanggal_order LIKE '$bulan_filter%' GROUP BY status_tracking");
$track_rekap = ['DP' => 0, 'Produksi' => 0, 'Jait' => 0, 'Checking' => 0, 'Selesai' => 0];
while($tr = mysqli_fetch_assoc($q_track)) {
    $st = $tr['status_tracking'] ? $tr['status_tracking'] : 'DP';
    if(isset($track_rekap[$st])) $track_rekap[$st] += $tr['jml'];
}

// 5. AMBIL DATA TABEL
$sql_tabel = "SELECT * FROM orders WHERE tanggal_order LIKE '$bulan_filter%'";
if ($status_aktif !== '') { $sql_tabel .= " AND status_tracking='$status_aktif'"; }
$sql_tabel .= " ORDER BY id DESC";
$query_tracking = mysqli_query($koneksi, $sql_tabel);
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tracking Order - KAKAMI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
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
        <div class="max-w-7xl mx-auto space-y-8">
            
            <!-- HEADER BERGAYA GLASSMORPHISM -->
            <div class="flex flex-col md:flex-row justify-between items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                <div>
                    <h2 class="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight"><svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Monitor Produksi</h2>
                    <h2 class="text-slate-900 dark:text-white font-black">Judul</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Pantau pergerakan orderan secara *real-time*.</p>
                </div>
                <form method="GET" class="mt-4 md:mt-0 flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <label class="font-bold text-xs text-slate-600 dark:text-slate-300 pl-2">Filter Bulan:</label>
                    <input type="month" name="bulan" value="<?php echo $bulan_filter; ?>" class="border-none bg-slate-50 dark:bg-slate-700 p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 text-xs font-semibold cursor-pointer transition text-slate-800 dark:text-slate-100">
                    <button type="submit" class="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-600 text-white px-5 py-2 rounded-xl font-bold hover:from-black hover:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-500 transform hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/20 dark:shadow-black/40 text-xs">Cari</button>
                </form>
            </div>

            <!-- KOTAK INDIKATOR DENGAN EFEK HOVER MELAYANG -->
            <div>
                <div class="flex justify-between items-end mb-4 px-2">
                    <h3 class="text-sm font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-widest"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M9 9l3 3 5-5"></path></svg> Filter Status Visual</h3>
                    <?php if($status_aktif !== ''): ?>
                        <a href="tracking.php?bulan=<?php echo $bulan_filter; ?>" class="text-[10px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold px-4 py-1.5 rounded-full border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all uppercase tracking-wider shadow-sm"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg> Reset Filter</a>
                    <?php endif; ?>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <?php 
                    $menu_status = [
                        ['id' => 'DP', 'icon' => '<svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>', 'name' => 'DP / Masuk', 'bg' => 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700/50', 'border' => 'border-slate-200 dark:border-slate-700', 'text' => 'text-slate-800 dark:text-slate-200'],
                        ['id' => 'Produksi', 'icon' => '<svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-4-7v6H8v-6h8z"></path></svg>', 'name' => 'Produksi', 'bg' => 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', 'border' => 'border-blue-200 dark:border-blue-800/50', 'text' => 'text-blue-800 dark:text-blue-300'],
                        ['id' => 'Jait', 'icon' => '<svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>', 'name' => 'Jait', 'bg' => 'from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20', 'border' => 'border-purple-200 dark:border-purple-800/50', 'text' => 'text-purple-800 dark:text-purple-300'],
                        ['id' => 'Checking', 'icon' => '<svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>', 'name' => 'Checking', 'bg' => 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20', 'border' => 'border-amber-200 dark:border-amber-800/50', 'text' => 'text-orange-800 dark:text-orange-300'],
                        ['id' => 'Selesai', 'icon' => '<svg class="w-[1em] h-[1em] inline-block mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>', 'name' => 'Selesai', 'bg' => 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20', 'border' => 'border-emerald-200 dark:border-emerald-800/50', 'text' => 'text-emerald-800 dark:text-emerald-300']
                    ];
                    foreach($menu_status as $m): 
                        $active = ($status_aktif == $m['id']);
                        $active_class = $active ? 'ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-slate-800 dark:ring-slate-400 scale-105 shadow-md' : 'hover:-translate-y-1 hover:shadow-lg opacity-80 hover:opacity-100';
                    ?>
                    <a href="tracking.php?bulan=<?php echo $bulan_filter; ?>&status=<?php echo $m['id']; ?>" class="block bg-gradient-to-br <?php echo $m['bg']; ?> border <?php echo $m['border']; ?> p-5 rounded-3xl text-center transition-all duration-300 <?php echo $active_class; ?>">
                        <div class="text-3xl mb-2 drop-shadow-sm"><?php echo $m['icon']; ?></div>
                        <div class="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1"><?php echo $m['name']; ?></div>
                        <div class="text-3xl font-black <?php echo $m['text']; ?>"><?php echo $track_rekap[$m['id']]; ?></div>
                    </a>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- TABEL TRACKING PREMIUM -->
            <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
                <div class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-6 flex justify-between items-center rounded-t-3xl">
                    <div>
                        <h2 class="text-base font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200"><svg class="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> Logistik Order Terkini</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                            <?php echo ($status_aktif == '') ? 'Menampilkan seluruh antrean.' : 'Memfilter orderan: <strong class="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 px-2 py-0.5 rounded shadow-sm border dark:border-slate-600">'.$status_aktif.'</strong>'; ?>
                        </p>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-800 dark:bg-slate-900 text-white text-xs uppercase tracking-widest text-center">
                                <th class="p-4 w-56 text-left font-semibold rounded-tl-lg">Informasi Project</th>
                                <th class="p-4 w-40 font-semibold">Target SLA</th>
                                <th class="p-4 w-56 font-semibold">Live Progress</th>
                                <th class="p-4 min-w-[320px] font-semibold rounded-tr-lg">Aksi & Kendala</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
                            <?php if(mysqli_num_rows($query_tracking) == 0): ?>
                                <tr>
                                    <td colspan="4" class="p-12 text-center text-slate-400 dark:text-slate-500 font-medium"><svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg> Keren! Tidak ada orderan yang tertumpuk di tahapan ini.</td>
                                </tr>
                            <?php else: ?>
                                <?php while($row = mysqli_fetch_assoc($query_tracking)): 
                                    $stat = $row['status_tracking'] ?? 'DP';
                                    
                                    // GRADIENT PROGRESS BAR
                                    $prog = ['DP'=>20, 'Produksi'=>40, 'Jait'=>60, 'Checking'=>80, 'Selesai'=>100];
                                    $val = $prog[$stat] ?? 20;
                                    $grad_color = 'from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600';
                                    if ($stat == 'Produksi') $grad_color = 'from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-600 shadow-blue-500/50';
                                    if ($stat == 'Jait') $grad_color = 'from-purple-400 to-fuchsia-500 dark:from-purple-500 dark:to-fuchsia-600 shadow-purple-500/50';
                                    if ($stat == 'Checking') $grad_color = 'from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 shadow-orange-500/50';
                                    if ($stat == 'Selesai') $grad_color = 'from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600 shadow-teal-500/50';

                                    // MODERN SLA BADGES
                                    $selisih = (strtotime($row['deadline_kerja'] ?? $row['tanggal_order']) - strtotime(date('Y-m-d'))) / 86400;
                                    
                                    if ($stat == 'Selesai') {
                                        $badge_html = "<span class='bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm'><svg class='w-[1em] h-[1em] inline-block mb-1' fill='none' stroke='currentColor' viewBox='0 0 24 24' stroke-width='3'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg> Tuntas</span>";
                                    } elseif ($selisih < 0) {
                                        $badge_html = "<span class='bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-lg shadow-red-500/40 animate-pulse inline-block'><svg class='w-[1em] h-[1em] mb-0.5 inline-block' fill='none' stroke='currentColor' viewBox='0 0 24 24' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'></path></svg> TELAT ".abs(floor($selisih))." HARI</span>";
                                    } elseif ($selisih <= 3) {
                                        $badge_html = "<span class='bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-lg shadow-orange-500/30'><svg class='w-[1em] h-[1em] inline-block mb-1' fill='none' stroke='currentColor' viewBox='0 0 24 24' stroke-width='3'><path stroke-linecap='round' stroke-linejoin='round' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'></path></svg> Mepet ($selisih hari)</span>";
                                    } else {
                                        $badge_html = "<span class='bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide'>Aman ($selisih hari)</span>";
                                    }
                                ?>
                                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 text-center group">
                                    
                                    <!-- INFO PROJECT -->
                                    <td class="p-5 text-left border-r border-slate-100 dark:border-slate-700/50 align-top">
                                        <span class="inline-block bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-1"><?php echo htmlspecialchars($row['invoice_no']); ?></span>
                                        <span class="font-extrabold text-slate-900 dark:text-white block text-sm uppercase group-hover:text-slate-700 dark:group-hover:text-slate-300 transition"><?php echo htmlspecialchars($row['nama_order']); ?></span>
                                        <div class="flex items-center gap-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                                            <div class="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-[8px]"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg></div>
                                            <?php echo htmlspecialchars($row['nama_konsumen']); ?>
                                        </div>
                                        <a href="cetak_spk.php?id=<?php echo $row['id']; ?>" target="_blank" class="inline-flex items-center gap-1 mt-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase hover:bg-slate-800 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all shadow-sm">
                                            <span><svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></span> Lihat SPK
                                        </a>
                                    </td>
                                    
                                    <!-- TARGET & SLA -->
                                    <td class="p-5 border-r border-slate-100 dark:border-slate-700/50 align-top">
                                        <div class="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 border border-slate-100 dark:border-slate-600/50 inline-block text-center w-full">
                                            <div class="font-black text-xl text-slate-800 dark:text-white leading-none"><?php echo (int)$row['jumlah_pcs']; ?> <span class="text-xs font-semibold text-slate-400 dark:text-slate-500">Pcs</span></div>
                                            <div class="w-full h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                                            <div class="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Tenggat Waktu:</div>
                                            <div class="font-bold text-slate-700 dark:text-slate-300 text-xs mb-2"><?php echo date('d M Y', strtotime($row['deadline_kerja'] ?? $row['tanggal_order'])); ?></div>
                                            <?php echo $badge_html; ?>
                                        </div>
                                    </td>
                                    
                                    <!-- PROGRESS BAR -->
                                    <td class="p-5 border-r border-slate-100 dark:border-slate-700/50 align-middle">
                                        <div class="w-full bg-slate-100 dark:bg-slate-700 h-3.5 rounded-full overflow-hidden shadow-inner border border-slate-200/60 dark:border-slate-600/50 mb-2 relative">
                                            <div class="h-full bg-gradient-to-r <?php echo $grad_color; ?> rounded-full transition-all duration-700 ease-out flex items-center justify-end shadow-md" style="width: <?php echo $val; ?>%">
                                                <?php if($val > 20): ?>
                                                    <span class="text-[8px] font-black text-white/90 pr-1.5"><?php echo $val; ?>%</span>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <div class="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest"><?php echo $stat; ?></div>
                                            <div class="text-[9px] text-slate-400 dark:text-slate-500 font-semibold bg-slate-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-600/50" title="Terakhir diupdate"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <?php echo $row['last_updated_status'] ? date('d/m H:i', strtotime($row['last_updated_status'])) : '-'; ?></div>
                                        </div>
                                    </td>
                                    
                                    <!-- UPDATE AKSI -->
                                    <td class="p-5 align-top">
                                        <form method="POST" class="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                                            <input type="hidden" name="id_order" value="<?php echo $row['id']; ?>">
                                            <input type="hidden" name="update_tracking" value="1">
                                            
                                            <select name="status_tracking" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 p-2.5 rounded-xl text-[11px] font-extrabold uppercase outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 transition-all cursor-pointer shadow-sm">
                                                <option value="DP" <?php echo ($stat=='DP'?'selected':''); ?>><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> Tahap 1: DP</option>
                                                <option value="Produksi" <?php echo ($stat=='Produksi'?'selected':''); ?>><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-4-7v6H8v-6h8z"></path></svg> Tahap 2: Produksi</option>
                                                <option value="Jait" <?php echo ($stat=='Jait'?'selected':''); ?>><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Tahap 3: Jait</option>
                                                <option value="Checking" <?php echo ($stat=='Checking'?'selected':''); ?>><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Tahap 4: QC</option>
                                                <option value="Selesai" <?php echo ($stat=='Selesai'?'selected':''); ?>><svg class="w-[1em] h-[1em] inline-block mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg> Tahap 5: Selesai</option>
                                            </select>
                                            
                                            <textarea name="kendala_produksi" rows="3" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-[11px] outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 transition-all shadow-sm resize-none placeholder-slate-400 dark:placeholder-slate-500 text-slate-600 dark:text-slate-200" placeholder="Ketik kendala di sini..."><?php echo htmlspecialchars($row['kendala_produksi'] ?? ''); ?></textarea>
                                            
                                            <button type="submit" class="w-full bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:from-black hover:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700 transform hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-slate-900/20 dark:shadow-black/40 flex justify-center items-center gap-2">
                                                <span><svg class="w-[1em] h-[1em] inline-block mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg></span> Simpan
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                                <?php endwhile; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </div>

    <?php include 'footer.php'; ?>
</body>
</html>
