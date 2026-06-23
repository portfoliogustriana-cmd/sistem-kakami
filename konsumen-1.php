<?php 
include 'koneksi.php'; 

// Query untuk mengambil nama konsumen, nomor telepon terakhir, total frekuensi order, dan total jumlah pcs
$query_konsumen = mysqli_query($koneksi, "
    SELECT 
        nama_konsumen, 
        MAX(no_telepon) AS no_telepon, 
        COUNT(id) AS total_orderan, 
        SUM(jumlah_pcs) AS total_pcs 
    FROM orders 
    GROUP BY nama_konsumen 
    ORDER BY total_pcs DESC
");
?> 
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar Konsumen - KAKAMI</title>
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
<body class="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 antialiased transition-colors duration-300">

    <?php include 'navbar.php'; ?>

    <div class="p-4 sm:p-8 w-full">
        <div class="max-w-7xl mx-auto space-y-6">
            
            <div class="flex flex-col sm:flex-row justify-between items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                <div>
                    <h2 class="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight"><svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> Database Konsumen</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Kelola data pelanggan dan analitik loyalitas pesanan.</p>
                </div>
                <span class="mt-3 sm:mt-0 text-[10px] bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-xl font-extrabold uppercase tracking-wider shadow-md shadow-slate-900/10 dark:shadow-black/30">
                    <svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> Urutan Loyalitas (Qty Terbanyak)
                </span>
            </div>

            <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-800 dark:bg-slate-900 text-white text-xs uppercase tracking-widest text-center">
                                <th class="p-4 w-16 font-semibold rounded-tl-lg">No</th>
                                <th class="p-4 text-left font-semibold">Nama Konsumen</th>
                                <th class="p-4 w-48 font-semibold">No. Telepon</th>
                                <th class="p-4 w-40 font-semibold">Kategori</th> 
                                <th class="p-4 w-36 font-semibold">Frekuensi</th>
                                <th class="p-4 w-40 font-semibold">Total Qty</th>
                                <th class="p-4 w-28 font-semibold rounded-tr-lg">Aksi</th> 
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
                            <?php 
                            $no = 1;
                            while($r = mysqli_fetch_assoc($query_konsumen)): 
                                $total_pcs = (int)$r['total_pcs'];
                                
                                if ($total_pcs >= 500) {
                                    $badge = '<span class="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase shadow-sm"><svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg> GOLD VIP</span>';
                                } elseif ($total_pcs >= 100) {
                                    $badge = '<span class="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase shadow-sm"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> SILVER</span>';
                                } else {
                                    $badge = '<span class="text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">REGULAR</span>';
                                }

                                $no_hp = $r['no_telepon'];
                                if(substr($no_hp, 0, 1) === '0') {
                                    $no_hp = '62' . substr($no_hp, 1);
                                }
                            ?>
                            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 text-center group">
                                <td class="p-4 font-mono text-xs text-slate-400 dark:text-slate-500"><?php echo $no++; ?></td>
                                <td class="p-4 text-left font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase text-xs"><?php echo htmlspecialchars($r['nama_konsumen']); ?></td>
                                <td class="p-4 font-mono text-xs">
                                    <?php if(!empty($r['no_telepon'])): ?>
                                        <div class="flex justify-center items-center gap-2">
                                            <span class="text-slate-600 dark:text-slate-300 font-semibold"><?php echo htmlspecialchars($r['no_telepon']); ?></span>
                                            <a href="https://wa.me/<?php echo $no_hp; ?>" target="_blank" title="Chat WhatsApp" class="text-[9px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-md hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all font-sans font-black tracking-wide">WA <svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 19V5h14M18 19l-7-7-7 7"></path></svg></a>
                                        </div>
                                    <?php else: ?>
                                        <span class="text-slate-300 dark:text-slate-600 italic">-</span>
                                    <?php endif; ?>
                                </td>
                                <td class="p-4"><?php echo $badge; ?></td> 
                                <td class="p-4 font-bold text-slate-700 dark:text-slate-300 text-xs"><?php echo $r['total_orderan']; ?>x Order</td>
                                <td class="p-4 font-black bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-gray-100 text-sm">
                                    <div class="bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-xl px-2 py-1 shadow-sm inline-block min-w-[80px]">
                                        <?php echo number_format($total_pcs); ?> <span class="text-[10px] font-normal text-slate-400 dark:text-slate-400">Pcs</span>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <a href="order.php?cari_nama=<?php echo urlencode($r['nama_konsumen']); ?>" class="inline-block bg-slate-900 dark:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transform hover:-translate-y-0.5 transition-all shadow-md shadow-slate-900/10 dark:shadow-black/30">Riwayat</a>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                            
                            <?php if(mysqli_num_rows($query_konsumen) == 0): ?>
                            <tr>
                                <td colspan="7" class="p-12 text-center text-slate-400 dark:text-slate-500 font-medium italic">Belum ada data konsumen tercatat.</td>
                            </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
            
        </div>
    </div>
</body>
</html>
