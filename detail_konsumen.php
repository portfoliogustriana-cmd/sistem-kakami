<?php 
require_once 'koneksi.php';
require_once 'koneksi_auth.php';

$nama = isset($_GET['nama']) ? mysqli_real_escape_string($koneksi, $_GET['nama']) : '';

if(empty($nama)){
    header("Location: konsumen.php");
    exit;
}

// Data Konsumen (Summary)
$q_summary = mysqli_query($koneksi, "SELECT nama_konsumen, MAX(no_telepon) as no_telepon, COUNT(id) as total_order, SUM(jumlah_pcs) as total_pcs, SUM(total_harga) as total_belanja FROM orders WHERE nama_konsumen = '$nama'");
$summary = mysqli_fetch_assoc($q_summary);

// If not found or total order is 0
if($summary['total_order'] == 0){
    echo "<script>alert('Data konsumen tidak ditemukan.'); window.location='konsumen.php';</script>";
    exit;
}

// Order List
$q_orders = mysqli_query($koneksi, "SELECT * FROM orders WHERE nama_konsumen = '$nama' ORDER BY id DESC");

$no_hp = $summary['no_telepon'];
if(!empty($no_hp) && substr($no_hp, 0, 1) === '0') {
    $no_hp = '62' . substr($no_hp, 1);
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detail Konsumen - <?php echo htmlspecialchars($nama); ?> - KAKAMI</title>
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
        <div class="max-w-7xl mx-auto space-y-6">
            
            <!-- Page Header & Summary -->
            <div class="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                <div class="flex items-center gap-5">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-500/30">
                        <?php echo strtoupper(substr($nama, 0, 1)); ?>
                    </div>
                    <div>
                        <div class="flex items-center gap-3">
                            <h2 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white uppercase"><?php echo htmlspecialchars($nama); ?></h2>
                            <?php if($summary['total_pcs'] >= 500): ?>
                                <span class="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm"><svg class="w-[1em] h-[1em] mb-0.5 inline-block mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg> GOLD VIP</span>
                            <?php elseif($summary['total_pcs'] >= 100): ?>
                                <span class="bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> SILVER</span>
                            <?php endif; ?>
                        </div>
                        <div class="mt-1 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <?php if(!empty($summary['no_telepon'])): ?>
                                <a href="https://wa.me/<?php echo $no_hp; ?>" target="_blank" class="flex items-center gap-1.5 hover:text-emerald-500 transition-colors"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> <?php echo htmlspecialchars($summary['no_telepon']); ?></a>
                            <?php else: ?>
                                <span>No HP tidak tersedia</span>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap gap-4 w-full lg:w-auto">
                    <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex-1 lg:flex-none lg:w-40">
                        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1"><svg class="w-[1em] h-[1em] mb-0.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>Total Order</div>
                        <div class="text-2xl font-black text-slate-800 dark:text-white"><?php echo $summary['total_order']; ?> <span class="text-xs font-semibold text-slate-400">Kali</span></div>
                    </div>
                    <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex-1 lg:flex-none lg:w-40">
                        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1"><svg class="w-[1em] h-[1em] mb-0.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>Total Qty</div>
                        <div class="text-2xl font-black text-slate-800 dark:text-white"><?php echo number_format($summary['total_pcs']); ?> <span class="text-xs font-semibold text-slate-400">Pcs</span></div>
                    </div>
                </div>
            </div>

            <!-- List Orders -->
            <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div class="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> Riwayat Seluruh Orderan</h3>
                    <a href="konsumen.php" class="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-xl transition-all shadow-sm">Kembali</a>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-800 dark:bg-slate-900 text-white text-xs uppercase tracking-widest text-center">
                                <th class="p-4 w-16 font-semibold">No</th>
                                <th class="p-4 text-left font-semibold">Tanggal & Order</th>
                                <th class="p-4 w-32 font-semibold">Qty</th>
                                <th class="p-4 w-40 font-semibold">Total Harga</th>
                                <th class="p-4 w-40 font-semibold">Status Bayar</th>
                                <th class="p-4 w-40 font-semibold">Tracking</th>
                                <th class="p-4 w-32 font-semibold">Aksi</th> 
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
                            <?php 
                            $no = 1;
                            while($r = mysqli_fetch_assoc($q_orders)): 
                                // Pembayaran Status
                                $status_byr = $r['status_bayar'] ?? 'Belum Lunas';
                                if($status_byr == 'Lunas') {
                                    $byr_badge = '<span class="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-2 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase shadow-sm"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg> Lunas</span>';
                                } else {
                                    $byr_badge = '<span class="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-2 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase shadow-sm"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Belum Lunas</span>';
                                }

                                // Tracking Status
                                $stat = $r['status_tracking'] ?? 'DP';
                                if ($stat == 'Selesai') {
                                    $track_badge = "<span class='bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm'>Tuntas</span>";
                                } elseif ($stat == 'DP') {
                                    $track_badge = "<span class='bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase'>DP</span>";
                                } else {
                                    $track_badge = "<span class='bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 px-2 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase'>".$stat."</span>";
                                }
                            ?>
                            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 text-center group">
                                <td class="p-4 font-mono text-xs text-slate-400 dark:text-slate-500"><?php echo $no++; ?></td>
                                <td class="p-4 text-left">
                                    <div class="font-mono text-[10px] text-slate-400 dark:text-slate-500 mb-1"><?php echo date('d M Y', strtotime($r['tanggal_order'])); ?></div>
                                    <div class="font-bold text-slate-800 dark:text-white text-xs leading-snug line-clamp-2" title="<?php echo htmlspecialchars($r['nama_order']); ?>"><?php 
                                        $desc = htmlspecialchars($r['nama_order']); 
                                        echo strlen($desc) > 50 ? substr($desc, 0, 50).'...' : $desc;
                                    ?></div>
                                </td>
                                <td class="p-4 font-black bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-gray-100 text-sm">
                                    <?php echo (int)$r['jumlah_pcs']; ?> <span class="text-[10px] font-normal text-slate-400 dark:text-slate-500">Pcs</span>
                                </td>
                                <td class="p-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Rp <?php echo number_format($r['total_harga'],0,',','.'); ?>
                                </td>
                                <td class="p-4"><?php echo $byr_badge; ?></td>
                                <td class="p-4"><?php echo $track_badge; ?></td>
                                <td class="p-4">
                                    <a href="nota.php?id=<?php echo $r['id']; ?>" class="inline-block bg-slate-900 dark:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transform hover:-translate-y-0.5 transition-all shadow-md shadow-slate-900/10 dark:shadow-black/30"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> Nota</a>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
            </div>
            
        </div>
    </div>

    <?php include 'footer.php'; ?>
</body>
</html>
