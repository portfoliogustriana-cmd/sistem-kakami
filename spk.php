<?php 
include 'koneksi_auth.php'; 
include 'koneksi.php'; 

try {
    mysqli_query($koneksi, "ALTER TABLE orders ADD COLUMN dibuat_oleh VARCHAR(100) NULL DEFAULT 'Kakami' AFTER catatan_produksi_spk");
} catch (Exception $e) {}

$bulan_filter = $_GET['bulan'] ?? date('Y-m');

if (isset($_POST['simpan_spk'])) {
    $order_id = (int)$_POST['order_id'];
    $bahan = mysqli_real_escape_string($koneksi, trim($_POST['bahan_utama']));
    $kerah = mysqli_real_escape_string($koneksi, trim($_POST['bentuk_kerah']));
    $jenis = mysqli_real_escape_string($koneksi, trim($_POST['jenis_orderan']));
    $b_celana = mysqli_real_escape_string($koneksi, trim($_POST['bahan_celana']));
    $b_kerah = mysqli_real_escape_string($koneksi, trim($_POST['bahan_kerah']));
    $b_manset = mysqli_real_escape_string($koneksi, trim($_POST['bahan_manset']));
    $pola_baju = mysqli_real_escape_string($koneksi, trim($_POST['pola_baju']));
    $c_darurat = mysqli_real_escape_string($koneksi, trim($_POST['catatan_darurat']));
    $c_produksi = mysqli_real_escape_string($koneksi, trim($_POST['catatan_produksi_spk']));
    $dibuat_oleh = mysqli_real_escape_string($koneksi, $_SESSION['nama_lengkap']); 
    $deadline = $_POST['deadline_kerja'];
    
    $arr_foto_lama = !empty($_POST['foto_lama']) ? explode(',', $_POST['foto_lama']) : [];
    $arr_foto_baru = [];

    if (isset($_FILES['foto_mockup']['name'][0]) && !empty($_FILES['foto_mockup']['name'][0])) {
        $total_files = count($_FILES['foto_mockup']['name']);
        for ($i = 0; $i < $total_files; $i++) {
            if ($_FILES['foto_mockup']['error'][$i] === 0) {
                $nama_file = $_FILES['foto_mockup']['name'][$i];
                $tmp_name = $_FILES['foto_mockup']['tmp_name'][$i];
                $ekstensi_valid = ['jpg', 'jpeg', 'png'];
                $ekstensi_file = strtolower(pathinfo($nama_file, PATHINFO_EXTENSION));
                if (in_array($ekstensi_file, $ekstensi_valid)) {
                    $nama_foto_db = "mockup_" . $order_id . "_" . time() . "_" . $i . "." . $ekstensi_file;
                    if (move_uploaded_file($tmp_name, 'uploads/' . $nama_foto_db)) {
                        $arr_foto_baru[] = $nama_foto_db;
                    }
                }
            }
        }
    }

    $final_arr_foto = array_merge($arr_foto_lama, $arr_foto_baru);
    $string_foto_db = implode(',', $final_arr_foto);

    mysqli_query($koneksi, "UPDATE orders SET 
        bahan_utama='$bahan', bentuk_kerah='$kerah', jenis_orderan='$jenis',
        bahan_celana='$b_celana', bahan_kerah='$b_kerah', bahan_manset='$b_manset',
        pola_baju='$pola_baju', catatan_darurat='$c_darurat', catatan_produksi_spk='$c_produksi', 
        dibuat_oleh='$dibuat_oleh', deadline_kerja='$deadline', foto_mockup='$string_foto_db'
        WHERE id='$order_id'");

    mysqli_query($koneksi, "DELETE FROM order_items WHERE order_id='$order_id'");

    if (isset($_POST['no_player'])) {
        $temp_items = [];
        $size_weights = [
            'XXS ANAK' => 1, 'XS ANAK' => 2, 'S ANAK' => 3, 'M ANAK' => 4, 'L ANAK' => 5, 'XL ANAK' => 6, '2XL ANAK' => 7,
            'XS' => 8, 'S' => 9, 'M' => 10, 'L' => 11, 'XL' => 12, 'XXL' => 13, '3XL' => 14, '4XL' => 15, '5XL' => 16, 'CUSTOM' => 99
        ];

        foreach ($_POST['no_player'] as $key => $val) {
            $no_p = mysqli_real_escape_string($koneksi, $_POST['no_player'][$key]);
            $nama_p = mysqli_real_escape_string($koneksi, $_POST['nama_punggung'][$key]); 
            $nama_d = mysqli_real_escape_string($koneksi, $_POST['nama_player'][$key]);   
            $size = mysqli_real_escape_string($koneksi, $_POST['size'][$key]);
            $lengan = mysqli_real_escape_string($koneksi, $_POST['lengan'][$key]);
            $gender = mysqli_real_escape_string($koneksi, $_POST['gender'][$key]);
            $ket = mysqli_real_escape_string($koneksi, $_POST['keterangan_item'][$key]);

            if (!empty($size)) {
                $sz_upper = strtoupper(trim($size));
                $weight = $size_weights[$sz_upper] ?? 90; 
                $temp_items[] = [
                    'no_player' => $no_p, 'nama_punggung' => $nama_p, 'nama_player' => $nama_d,
                    'size' => $size, 'lengan' => $lengan, 'gender' => $gender, 'keterangan' => $ket, 'weight' => $weight
                ];
            }
        }

        usort($temp_items, function($a, $b) { return $a['weight'] <=> $b['weight']; });

        foreach ($temp_items as $item) {
            mysqli_query($koneksi, "INSERT INTO order_items (order_id, no_player, nama_player, nama_punggung, size, lengan, keterangan, gender) 
            VALUES ('$order_id', '{$item['no_player']}', '{$item['nama_player']}', '{$item['nama_punggung']}', '{$item['size']}', '{$item['lengan']}', '{$item['keterangan']}', '{$item['gender']}')");
        }
    }
    header("Location: spk.php?isi_id=$order_id&bulan=$bulan_filter");
    exit();
}

if (isset($_GET['hapus_foto']) && isset($_GET['id_proj'])) {
    $proj_id = (int)$_GET['id_proj'];
    $foto_target = $_GET['hapus_foto'];
    $get_proj = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT foto_mockup FROM orders WHERE id='$proj_id'"));
    if ($get_proj) {
        $arr_f = explode(',', $get_proj['foto_mockup']);
        $arr_f = array_diff($arr_f, [$foto_target]);
        $str_f = implode(',', $arr_f);
        mysqli_query($koneksi, "UPDATE orders SET foto_mockup='$str_f' WHERE id='$proj_id'");
        if(file_exists('uploads/'.$foto_target)) unlink('uploads/'.$foto_target);
    }
    header("Location: spk.php?isi_id=$proj_id&bulan=$bulan_filter");
    exit();
}

$selected_order = null;
$items_spk = [];
$history_data = []; 

if (isset($_GET['isi_id'])) {
    $id_isi = (int)$_GET['isi_id'];
    $selected_order = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT * FROM orders WHERE id='$id_isi'"));
    $get_items = mysqli_query($koneksi, "SELECT * FROM order_items WHERE order_id='$id_isi' ORDER BY id ASC");
    while($row = mysqli_fetch_assoc($get_items)) { $items_spk[] = $row; }

    try {
        $history_query = mysqli_query($koneksi, "SELECT id, invoice_no, nama_order, bahan_utama, bahan_kerah, bahan_celana, bahan_manset, bentuk_kerah, pola_baju FROM orders WHERE id != '$id_isi' ORDER BY id DESC LIMIT 20");
        if($history_query) {
            while($hq = mysqli_fetch_assoc($history_query)){ $history_data[] = $hq; }
        }
    } catch(Exception $e) {}
}

$query_orders = mysqli_query($koneksi, "SELECT o.*, (SELECT COUNT(id) FROM order_items WHERE order_id=o.id) as total_terinput FROM orders o WHERE o.tanggal_order LIKE '$bulan_filter%' ORDER BY o.tanggal_order DESC");
$spk_orders_list = [];
while ($row = mysqli_fetch_assoc($query_orders)) {
    $spk_orders_list[] = $row;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manajemen SPK Produksi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = { darkMode: 'class' }
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    </script>
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    </style>
</head>
<body class="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 antialiased transition-colors duration-300 flex flex-col min-h-screen">

<?php include 'navbar.php'; ?>

    <div class="p-4 sm:p-8 w-full">
        <div class="max-w-7xl mx-auto space-y-6">
            
            <?php if($selected_order): ?>
            <div class="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 space-y-6 relative overflow-hidden">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 class="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">MANAJEMEN SPK PRODUKSI</h2>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs font-black text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-wider"><?php echo $selected_order['invoice_no']; ?></span>
                            <span class="text-xs font-black text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/50 px-2 py-0.5 rounded-md uppercase tracking-wider"><?php echo htmlspecialchars($selected_order['jenis_produk'] ?? 'Jersey'); ?></span>
                            <span class="text-xs text-slate-400 font-semibold">Target Produksi: <span class="text-slate-700 dark:text-slate-300 font-bold"><?php echo $selected_order['jumlah_pcs']; ?> Pcs</span></span>
                        </div>
                    </div>
                    <a href="spk.php?bulan=<?php echo $bulan_filter; ?>" class="mt-4 sm:mt-0 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl font-extrabold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-wider">
                        <svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg> Tutup Form
                    </a>
                </div>

                <?php if(!empty($history_data)): ?>
                <div class="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                    <span class="text-[11px] font-extrabold text-indigo-800 dark:text-indigo-400 tracking-wide uppercase"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Salin Spesifikasi Dari Project Lama:</span>
                    <select id="autoFillSpecs" class="w-full sm:w-auto border border-indigo-200 dark:border-indigo-800 p-2 text-xs rounded-xl bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" onchange="copySpecs(this.value)">
                        <option value="">-- Pilih Project Sebelumnya --</option>
                        <?php foreach($history_data as $hd): ?>
                            <option value="<?php echo htmlspecialchars(json_encode($hd)); ?>"><?php echo $hd['invoice_no'] . ' - ' . $hd['nama_order']; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <?php endif; ?>

                <form method="POST" class="space-y-8" id="formSPK" enctype="multipart/form-data">
                    <input type="hidden" name="order_id" value="<?php echo $selected_order['id']; ?>">
                    <input type="hidden" name="foto_lama" value="<?php echo $selected_order['foto_mockup'] ?? ''; ?>">
                    
                    <div class="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-5">
                        <h3 class="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Spesifikasi Material & Waktu</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <?php
                            $fields = [
                                'bahan_utama' => ['Bahan Utama Baju', 'Jacquart'],
                                'bahan_kerah' => ['Bahan Kerah', 'Pique Premium'],
                                'bahan_celana' => ['Bahan Celana', 'Lotto Super'],
                                'bahan_manset' => ['Bahan Manset', '-'],
                                'bentuk_kerah' => ['Bentuk Kerah', 'V-Neck Tumpuk'],
                                'pola_baju' => ['Pola / Potongan Baju', 'Pola Standar (Set-In)'],
                                'jenis_orderan' => ['Jenis Orderan', 'Full Order']
                            ];
                            foreach($fields as $name => $info):
                            ?>
                            <div>
                                <label class="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase"><?php echo $info[0]; ?>:</label>
                                <input type="text" name="<?php echo $name; ?>" value="<?php echo !empty($selected_order[$name]) ? htmlspecialchars($selected_order[$name]) : $info[1]; ?>" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none font-bold text-xs text-slate-700 dark:text-slate-200 transition-all shadow-sm" required>
                            </div>
                            <?php endforeach; ?>
                            <div>
                                <label class="block text-[10px] font-extrabold text-rose-500 mb-1.5 uppercase"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Deadline Selesai:</label>
                                <input type="date" name="deadline_kerja" value="<?php echo !empty($selected_order['deadline_kerja']) ? $selected_order['deadline_kerja'] : $selected_order['tanggal_order']; ?>" class="w-full bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-2.5 rounded-xl outline-none font-extrabold text-xs text-rose-700 dark:text-rose-300 transition-all cursor-pointer shadow-sm" required>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div>
                                <label class="block text-[10px] font-extrabold text-purple-600 mb-1.5 uppercase"><svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> Dibuat Oleh (Sistem):</label>
                                <input type="text" class="w-full bg-purple-100 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 p-2.5 rounded-xl font-extrabold text-xs text-purple-800 dark:text-purple-300 outline-none shadow-sm cursor-not-allowed" value="<?php echo $_SESSION['nama_lengkap']; ?>" readonly>
                            </div>
                            <div>
                                <label class="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg> Catatan Produksi:</label>
                                <textarea name="catatan_produksi_spk" rows="2" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none font-medium text-xs text-slate-700 dark:text-slate-200 transition-all shadow-sm resize-none"><?php echo !empty($selected_order['catatan_produksi_spk']) ? htmlspecialchars($selected_order['catatan_produksi_spk']) : "- Detail cetakan harus tajam\n- Obras bersih dari sisa benang"; ?></textarea>
                            </div>
                            <div>
                                <label class="block text-[10px] font-extrabold text-amber-600 mb-1.5 uppercase"><svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Catatan Darurat/Revisi:</label>
                                <textarea name="catatan_darurat" rows="2" class="w-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-2.5 rounded-xl outline-none font-semibold text-xs text-amber-800 dark:text-amber-300 transition-all shadow-sm resize-none" placeholder="Ketik info revisi..."><?php echo htmlspecialchars($selected_order['catatan_darurat'] ?? ''); ?></textarea>
                            </div>
                        </div>

                        <div class="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
                            <label class="block text-[10px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg> Upload Mockup Desain (Multiple):</label>
                            <div class="bg-white dark:bg-slate-800 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl space-y-3">
                                <input type="file" name="foto_mockup[]" accept="image/*" multiple class="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-extrabold file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300 cursor-pointer">
                                
                                <?php if(!empty($selected_order['foto_mockup'])): ?>
                                    <div class="pt-3 border-t border-slate-100 dark:border-slate-700">
                                        <div class="flex flex-wrap gap-4">
                                            <?php 
                                            $list_f = explode(',', $selected_order['foto_mockup']);
                                            foreach($list_f as $foto_item):
                                                if(empty($foto_item)) continue;
                                            ?>
                                                <div class="relative group border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 bg-slate-50 dark:bg-slate-900">
                                                    <img src="uploads/<?php echo $foto_item; ?>" class="w-16 h-16 object-cover rounded">
                                                    <a href="spk.php?id_proj=<?php echo $selected_order['id']; ?>&hapus_foto=<?php echo $foto_item; ?>&bulan=<?php echo $bulan_filter; ?>" onclick="return confirm('Hapus foto?')" class="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md">×</a>
                                                </div>
                                            <?php endforeach; ?>
                                        </div>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div>
                                <h3 class="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200"><svg class="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> Rincian List Jersey Pemain</h3>
                            </div>
                            <div class="flex items-center gap-3 w-full md:w-auto">
                                <input type="text" id="liveSearch" onkeyup="filterTabel()" placeholder="Cari Nama / Nomor..." class="w-full md:w-56 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-200">
                                <button type="button" onclick="tambahBarisBaju()" class="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase tracking-wider shadow-md"><svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg> Tambah Baris</button>
                            </div>
                        </div>

                        <div id="duplicateWarning" class="hidden bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 text-[11px] p-3 rounded-xl border border-rose-200 flex items-center gap-2">
                            <span><svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> PERINGATAN: Ditemukan Nomor Punggung Ganda!</span>
                        </div>

                        <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
                            <table class="w-full text-sm text-center border-collapse">
                                <thead>
                                    <tr class="bg-slate-800 dark:bg-slate-950 text-white font-semibold text-[11px] uppercase tracking-widest">
                                        <th class="p-3 w-10">No</th>
                                        <th class="p-3 w-20">No. Punggung</th>
                                        <th class="p-3 text-left w-40">Nama Punggung</th>
                                        <th class="p-3 text-left w-40">Nama Depan</th>
                                        <th class="p-3 w-28">Size</th> 
                                        <th class="p-3 w-28">Lengan</th>
                                        <th class="p-3 w-24">Gender</th>
                                        <th class="p-3 text-left">Keterangan</th>
                                        <th class="p-3 w-12">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="wrapper_baris_baju" class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <?php if(empty($items_spk)): ?>
                                        <tr class="baris-baju hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td class="p-2.5 text-center text-[11px] font-extrabold text-slate-400 index-nomor">1</td>
                                            <td class="p-2.5"><input type="text" name="no_player[]" onkeyup="cekDuplikat()" class="input-no-player w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-center text-xs font-black outline-none text-slate-800 dark:text-slate-200" placeholder="-"></td>
                                            <td class="p-2.5"><input type="text" name="nama_punggung[]" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-bold uppercase outline-none text-slate-800 dark:text-slate-200" placeholder="NAMA PUNGGUNG"></td>
                                            <td class="p-2.5"><input type="text" name="nama_player[]" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-bold uppercase outline-none text-slate-800 dark:text-slate-200" placeholder="NAMA DEPAN"></td>
                                            <td class="p-2.5">
                                                <select name="size[]" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer" required>
                                                    <optgroup label="Ukuran Dewasa">
                                                        <option value="M">M</option><option value="S">S</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
                                                    </optgroup>
                                                    <option value="CUSTOM"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg> CUSTOM</option>
                                                </select>
                                            </td>
                                            <td class="p-2.5">
                                                <select name="lengan[]" onchange="ubahWarnaLengan(this)" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                                                    <option value="PENDEK">PENDEK</option><option value="PANJANG">PANJANG</option>
                                                </select>
                                            </td>
                                            <td class="p-2.5"><select name="gender[]" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-[11px] font-extrabold text-slate-700 dark:text-slate-300"><option value="PRIA">PRIA</option><option value="WANITA">WANITA</option></select></td>
                                            <td class="p-2.5"><input type="text" name="keterangan_item[]" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300" placeholder="-"></td>
                                            <td class="p-2.5"><button type="button" onclick="hapusBarisBaju(this)" class="text-slate-400 hover:text-rose-600 font-bold text-lg">×</button></td>
                                        </tr>
                                    <?php else: ?>
                                        <?php $no = 1; foreach($items_spk as $it): ?>
                                            <tr class="baris-baju hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                <td class="p-2.5 text-center text-[11px] font-extrabold text-slate-400 index-nomor"><?php echo $no++; ?></td>
                                                <td class="p-2.5"><input type="text" name="no_player[]" onkeyup="cekDuplikat()" value="<?php echo htmlspecialchars($it['no_player']); ?>" class="input-no-player w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-center text-xs font-black text-slate-800 dark:text-slate-200"></td>
                                                <td class="p-2.5"><input type="text" name="nama_punggung[]" value="<?php echo htmlspecialchars($it['nama_punggung'] ?? ''); ?>" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-bold uppercase text-slate-800 dark:text-slate-200"></td>
                                                <td class="p-2.5"><input type="text" name="nama_player[]" value="<?php echo htmlspecialchars($it['nama_player']); ?>" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-bold uppercase text-slate-800 dark:text-slate-200"></td>
                                                <td class="p-2.5">
                                                    <select name="size[]" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-black text-slate-800 dark:text-slate-200" required>
                                                        <optgroup label="Ukuran Dewasa">
                                                            <?php 
                                                            $adult_sizes = ['XS','S','M','L','XL','XXL','3XL','4XL','5XL'];
                                                            foreach($adult_sizes as $sz){
                                                                $sel = (strtoupper($it['size']) == strtoupper($sz)) ? 'selected' : '';
                                                                echo "<option value='$sz' $sel>$sz</option>";
                                                            }
                                                            ?>
                                                        </optgroup>
                                                        <option value="CUSTOM" <?php echo (strtoupper($it['size']) == 'CUSTOM') ? 'selected' : ''; ?>><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg> CUSTOM</option>
                                                    </select>
                                                </td>
                                                <td class="p-2.5">
                                                    <select name="lengan[]" onchange="ubahWarnaLengan(this)" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                                                        <option value="PENDEK" <?php echo ($it['lengan']=='PENDEK')?'selected':''; ?>>PENDEK</option>
                                                        <option value="PANJANG" <?php echo ($it['lengan']=='PANJANG')?'selected':''; ?>>PANJANG</option>
                                                    </select>
                                                </td>
                                                <td class="p-2.5"><select name="gender[]" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-[11px] font-extrabold text-slate-700 dark:text-slate-300"><option value="PRIA" <?php echo ($it['gender']=='PRIA')?'selected':''; ?>>PRIA</option><option value="WANITA" <?php echo ($it['gender']=='WANITA')?'selected':''; ?>>WANITA</option></select></td>
                                                <td class="p-2.5"><input type="text" name="keterangan_item[]" value="<?php echo htmlspecialchars($it['keterangan']); ?>" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300"></td>
                                                <td class="p-2.5"><button type="button" onclick="hapusBarisBaju(this)" class="text-slate-400 hover:text-rose-600 font-bold text-lg">×</button></td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <button type="submit" id="btnSimpan" name="simpan_spk" class="w-full bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 dark:text-slate-900 text-white p-4 font-extrabold rounded-2xl text-[11px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl">
                        <svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg> SIMPAN SELURUH SPESIFIKASI & UKURAN SPK
                    </button>
                </form>
            </div>
            <?php endif; ?>

            <div class="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 border-slate-100 dark:border-slate-800 gap-3">
                    <h2 class="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wide"><svg class="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> Monitoring Berkas SPK Produksi</h2>
                    <form method="GET" class="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 rounded-xl shadow-sm">
                        <input type="month" name="bulan" value="<?php echo $bulan_filter; ?>" class="bg-transparent border-none p-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <button type="submit" class="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase">Filter</button>
                    </form>
                </div>

                <div class="hidden md:block overflow-x-auto">
                    <table class="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-800 dark:bg-slate-950 text-white text-[11px] uppercase tracking-widest text-center">
                                <th class="p-4 w-28">Tgl Order</th>
                                <th class="p-4 text-left">Nama Project & Pelanggan</th>
                                <th class="p-4 w-28">Target Qty</th>
                                <th class="p-4 w-36">List Terinput</th>
                                <th class="p-4 w-44">Status Berkas</th>
                                <th class="p-4 w-32">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            <?php foreach($spk_orders_list as $r): 
                                $target = (int)$r['jumlah_pcs'];
                                $terinput = (int)$r['total_terinput'];
                            ?>
                            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/20 text-center">
                                <td class="p-4 text-xs font-mono text-slate-500"><?php echo date('d/m/Y', strtotime($r['tanggal_order'])); ?></td>
                                <td class="p-4 text-left">
                                    <span class="text-[10px] font-black text-slate-400 block uppercase tracking-widest mb-0.5"><?php echo $r['invoice_no']; ?></span>
                                    <span class="font-extrabold text-slate-900 dark:text-white block text-xs uppercase"><?php echo htmlspecialchars($r['nama_order']); ?></span>
                                    <div class="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-semibold"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg> <?php echo htmlspecialchars($r['nama_konsumen']); ?></div>
                                </td>
                                <td class="p-4 font-black text-slate-700 dark:text-slate-300 text-xs"><?php echo $target; ?> Pcs</td>
                                <td class="p-4 font-mono font-black text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/40 text-xs rounded-xl">
                                    <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 shadow-sm inline-block min-w-[70px]">
                                        <?php echo $terinput; ?> / <?php echo $target; ?>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <?php if($terinput == 0): ?>
                                        <span class="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"><svg class="w-[1em] h-[1em] mb-0.5 inline-block text-red-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle></svg> Kosong</span>
                                    <?php elseif($terinput < $target): ?>
                                        <span class="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"><svg class="w-[1em] h-[1em] mb-0.5 inline-block text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle></svg> Blm Lengkap</span>
                                    <?php else: ?>
                                        <span class="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"><svg class="w-[1em] h-[1em] mb-0.5 inline-block text-green-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle></svg> Siap Cetak</span>
                                    <?php endif; ?>
                                </td>
                                <td class="p-4 space-y-2">
                                    <a href="spk.php?isi_id=<?php echo $r['id']; ?>&bulan=<?php echo $bulan_filter; ?>" class="block bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-extrabold hover:bg-slate-900 hover:text-white transition-all uppercase tracking-wider text-center"><svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> Kelola List</a>
                                    <?php if($terinput > 0): ?>
                                        <a href="cetak_spk.php?id=<?php echo $r['id']; ?>" target="_blank" class="block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold hover:opacity-90 transition-all uppercase tracking-wider text-center"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-4-7v6H8v-6h8z"></path></svg> Cetak SPK</a>
                                    <?php endif; ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <!-- MOBILE VIEW: SPK INTERACTIVE CARDS -->
                <div class="block md:hidden space-y-4">
                    <?php if(empty($spk_orders_list)): ?>
                        <div class="text-center py-10 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
                            <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">Belum ada data spk di bulan ini</p>
                        </div>
                    <?php else: ?>
                        <?php foreach($spk_orders_list as $r): 
                            $target = (int)$r['jumlah_pcs'];
                            $terinput = (int)$r['total_terinput'];
                        ?>
                        <div class="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/80 p-4.5 rounded-3xl shadow-sm space-y-3.5 relative overflow-hidden">
                            <!-- Header: Tanggal & Invoice -->
                            <div class="flex justify-between items-center border-b pb-2.5 border-slate-100 dark:border-slate-700/50">
                                <span class="text-[9px] font-mono font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-md tracking-wider leading-none"><?php echo date('d/m/Y', strtotime($r['tanggal_order'])); ?></span>
                                <span class="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase"><?php echo htmlspecialchars($r['invoice_no']); ?></span>
                            </div>

                            <!-- Title details -->
                            <div class="space-y-1">
                                <h4 class="font-extrabold text-slate-850 dark:text-slate-100 text-[13px] uppercase leading-snug"><?php echo htmlspecialchars($r['nama_order']); ?></h4>
                                <div class="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                    <svg class="w-3.5 h-3.5 inline-block text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    <span><?php echo htmlspecialchars($r['nama_konsumen']); ?></span>
                                </div>
                            </div>

                            <!-- Progress & Status Info -->
                            <div class="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                                <div class="space-y-0.5">
                                    <span class="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase block tracking-wider">Progress Input</span>
                                    <span class="text-xs font-black font-mono text-slate-850 dark:text-slate-200"><?php echo $terinput; ?> <span class="text-slate-400 font-medium">/</span> <?php echo $target; ?> <span class="text-[9.5px] font-bold text-slate-400">Pcs</span></span>
                                </div>
                                <div class="space-y-0.5 text-right flex flex-col items-end justify-center">
                                    <span class="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase block tracking-wider mb-1">Status Berkas</span>
                                    <?php if($terinput == 0): ?>
                                        <span class="bg-rose-50 dark:bg-rose-950/30 text-rose-605 dark:text-rose-400 border border-rose-150 dark:border-rose-900/50 px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider">KOSONG</span>
                                    <?php elseif($terinput < $target): ?>
                                        <span class="bg-amber-50 dark:bg-amber-950/30 text-amber-605 dark:text-amber-400 border border-amber-150 dark:border-amber-900/50 px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider">BLM LENGKAP</span>
                                    <?php else: ?>
                                        <span class="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/50 px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider">SIAP CETAK</span>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <!-- Action Bar -->
                            <div class="flex items-center gap-2 border-t pt-2.5 border-slate-100 dark:border-slate-700/50">
                                <a href="spk.php?isi_id=<?php echo $r['id']; ?>&bulan=<?php echo $bulan_filter; ?>" class="flex-1 bg-slate-900 dark:bg-slate-750 text-white px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-center shadow-xs flex items-center justify-center gap-1">
                                    <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    Kelola List
                                </a>
                                <?php if($terinput > 0): ?>
                                    <a href="cetak_spk.php?id=<?php echo $r['id']; ?>" target="_blank" class="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-center shadow-xs flex items-center justify-center gap-1">
                                        <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-4-7v6H8v-6h8z"></path></svg>
                                        Cetak SPK
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

        </div>
    </div>

    <script>
        function ubahWarnaLengan(selectEl) {
            const row = selectEl.closest('tr');
            if (selectEl.value === 'PANJANG') {
                row.classList.remove('hover:bg-slate-50', 'bg-white');
                row.classList.add('bg-amber-50/60', 'dark:bg-amber-950/30', 'hover:bg-amber-100/60');
            } else {
                row.classList.remove('bg-amber-50/60', 'dark:bg-amber-950/30', 'hover:bg-amber-100/60');
                row.classList.add('hover:bg-slate-50');
            }
        }

        function copySpecs(jsonStr) {
            if(!jsonStr) return;
            let data = JSON.parse(jsonStr);
            document.querySelector('input[name="bahan_utama"]').value = data.bahan_utama || '';
            document.querySelector('input[name="bahan_kerah"]').value = data.bahan_kerah || '';
            document.querySelector('input[name="bahan_celana"]').value = data.bahan_celana || '';
            document.querySelector('input[name="bahan_manset"]').value = data.bahan_manset || '';
            document.querySelector('input[name="bentuk_kerah"]').value = data.bentuk_kerah || '';
            document.querySelector('input[name="pola_baju"]').value = data.pola_baju || '';
        }

        function filterTabel() {
            let input = document.getElementById("liveSearch").value.toUpperCase();
            let baris = document.querySelectorAll(".baris-baju");
            baris.forEach(tr => {
                let noInput = tr.querySelector('input[name="no_player[]"]');
                let nPunggungInput = tr.querySelector('input[name="nama_punggung[]"]');
                let nDepanInput = tr.querySelector('input[name="nama_player[]"]');
                if (noInput && nPunggungInput && nDepanInput) {
                    if (noInput.value.toUpperCase().indexOf(input) > -1 || nPunggungInput.value.toUpperCase().indexOf(input) > -1 || nDepanInput.value.toUpperCase().indexOf(input) > -1) {
                        tr.style.display = "";
                    } else {
                        tr.style.display = "none";
                    }
                }
            });
        }

        function cekDuplikat() {
            const inputs = document.querySelectorAll('.input-no-player');
            let values = {};
            let adaDuplikat = false;
            inputs.forEach(input => {
                input.classList.remove('bg-rose-100', 'border-rose-500', 'text-rose-700', 'dark:bg-rose-950/40');
                input.classList.add('bg-white', 'dark:bg-slate-800', 'border-slate-200', 'dark:border-slate-700');
            });
            inputs.forEach(input => {
                let val = input.value.trim();
                if(val !== "" && val !== "-") {
                    if(values[val]) { values[val].push(input); adaDuplikat = true; } 
                    else { values[val] = [input]; }
                }
            });
            for(let key in values) {
                if(values[key].length > 1) {
                    values[key].forEach(inp => {
                        inp.classList.remove('bg-white', 'dark:bg-slate-800', 'border-slate-200', 'dark:border-slate-700');
                        inp.classList.add('bg-rose-100', 'dark:bg-rose-950/40', 'border-rose-500', 'text-rose-700');
                    });
                }
            }
            const warning = document.getElementById('duplicateWarning');
            if(warning) { if(adaDuplikat) warning.classList.remove('hidden'); else warning.classList.add('hidden'); }
        }

        function hitungUlangNomor() {
            document.querySelectorAll('#wrapper_baris_baju .index-nomor').forEach((td, index) => { td.innerText = index + 1; });
            cekDuplikat();
        }

        function tambahBarisBaju() {
            const tbody = document.getElementById('wrapper_baris_baju');
            const tr = document.createElement('tr');
            tr.className = "baris-baju hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-200";
            tr.innerHTML = `
                <td class="p-2.5 text-center text-[11px] font-extrabold text-slate-400 index-nomor"></td>
                <td class="p-2.5"><input type="text" name="no_player[]" onkeyup="cekDuplikat()" class="input-no-player w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-center text-xs font-black outline-none text-slate-800 dark:text-slate-200" placeholder="-"></td>
                <td class="p-2.5"><input type="text" name="nama_punggung[]" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-bold uppercase outline-none text-slate-800 dark:text-slate-200" placeholder="NAMA PUNGGUNG"></td>
                <td class="p-2.5"><input type="text" name="nama_player[]" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-bold uppercase outline-none text-slate-800 dark:text-slate-200" placeholder="NAMA DEPAN"></td>
                <td class="p-2.5">
                    <select name="size[]" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer" required>
                        <optgroup label="Ukuran Dewasa">
                            <option value="M">M</option><option value="S">S</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
                        </optgroup>
                        <option value="CUSTOM"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg> CUSTOM</option>
                    </select>
                </td>
                <td class="p-2.5">
                    <select name="lengan[]" onchange="ubahWarnaLengan(this)" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                        <option value="PENDEK">PENDEK</option><option value="PANJANG">PANJANG</option>
                    </select>
                </td>
                <td class="p-2.5"><select name="gender[]" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-[11px] font-extrabold text-slate-700 dark:text-slate-300"><option value="PRIA">PRIA</option><option value="WANITA">WANITA</option></select></td>
                <td class="p-2.5"><input type="text" name="keterangan_item[]" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300" placeholder="-"></td>
                <td class="p-2.5"><button type="button" onclick="hapusBarisBaju(this)" class="text-slate-400 hover:text-rose-600 font-bold text-lg">×</button></td>
            `;
            tbody.appendChild(tr);
            hitungUlangNomor();
            ubahWarnaLengan(tr.querySelector('select[name="lengan[]"]'));
        }
        
        function hapusBarisBaju(btn) {
            const row = btn.parentNode.parentNode;
            row.parentNode.removeChild(row);
            hitungUlangNomor();
        }

        window.onload = function() {
            cekDuplikat();
            document.querySelectorAll('select[name="lengan[]"]').forEach(select => { ubahWarnaLengan(select); });
        };
    </script>

    <?php include 'footer.php'; ?>
</body>
</html>