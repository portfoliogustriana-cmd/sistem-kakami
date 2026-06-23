<?php 
include 'koneksi_auth.php'; 
include 'koneksi.php'; 
$bulan_filter = $_GET['bulan'] ?? date('Y-m');

// Ensure database table has the column jenis_produk
mysqli_query($koneksi, "ALTER TABLE orders ADD COLUMN IF NOT EXISTS jenis_produk VARCHAR(100) DEFAULT 'Jersey'");

// 1. PROSES HAPUS ORDER
if (isset($_GET['hapus'])) {
    $id_hapus = (int)$_GET['hapus'];
    mysqli_query($koneksi, "DELETE FROM orders WHERE id='$id_hapus'");
    header("Location: order.php?bulan=$bulan_filter");
    exit();
}

// 2. PROSES UPDATE DATA KONSUMEN
if (isset($_POST['update_master_konsumen'])) {
    $nama_lama = mysqli_real_escape_string($koneksi, $_POST['konsumen_nama_lama']);
    $nama_baru = mysqli_real_escape_string($koneksi, trim($_POST['konsumen_nama_baru']));
    $telepon_baru = mysqli_real_escape_string($koneksi, trim($_POST['konsumen_telepon_baru']));

    if (!empty($nama_baru)) {
        mysqli_query($koneksi, "UPDATE orders SET nama_konsumen='$nama_baru', no_telepon='$telepon_baru' WHERE nama_konsumen='$nama_lama'");
    }
    header("Location: order.php?bulan=$bulan_filter");
    exit();
}

// 3. PROSES TAMBAH & UPDATE ORDER
if (isset($_POST['tambah_order'])) {
    $id_edit = $_POST['id_edit'] ?? '';
    $tanggal = $_POST['tanggal_order'];
    $konsumen = trim($_POST['nama_konsumen']); 
    $telepon = trim($_POST['no_telepon'] ?? '');
    $order = $_POST['nama_order'];
    $jenis_produk = mysqli_real_escape_string($koneksi, $_POST['jenis_produk'] ?? 'Jersey');
    $satuan = (int)$_POST['harga_satuan'];
    $pcs = (int)$_POST['jumlah_pcs'];
    $diskon = (int)($_POST['diskon'] ?? 0); 
    $total = ($satuan * $pcs) - $diskon; 
    $dp = (int)$_POST['dp'];
    $detail = $_POST['detail_pesanan'];
    $status_bayar = ($dp >= $total) ? 'Lunas' : 'DP';

    if (!empty($id_edit)) {
        mysqli_query($koneksi, "UPDATE orders SET 
            tanggal_order='$tanggal', nama_konsumen='$konsumen', no_telepon='$telepon', 
            nama_order='$order', jenis_produk='$jenis_produk', harga_satuan='$satuan', jumlah_pcs='$pcs', 
            diskon='$diskon', total_harga='$total', dp='$dp', 
            detail_pesanan='$detail', status_bayar='$status_bayar' 
            WHERE id='$id_edit'");
    } else {
        $invoice = "INV/" . date('YmdHis'); 
        mysqli_query($koneksi, "INSERT INTO orders (invoice_no, tanggal_order, nama_konsumen, no_telepon, nama_order, jenis_produk, harga_satuan, jumlah_pcs, diskon, total_harga, dp, detail_pesanan, status_bayar) 
        VALUES ('$invoice', '$tanggal', '$konsumen', '$telepon', '$order', '$jenis_produk', '$satuan', '$pcs', '$diskon', '$total', '$dp', '$detail', '$status_bayar')");
        
        if ($dp > 0) {
            $keterangan_kas = "DP Order: $invoice - $konsumen ($order)";
            mysqli_query($koneksi, "INSERT INTO transactions (jenis, kategori, nominal, tanggal, keterangan) VALUES ('Pemasukan', 'Penjualan', '$dp', '$tanggal', '$keterangan_kas')");
        }
    }
    header("Location: order.php?bulan=" . substr($tanggal, 0, 7));
    exit();
}

// 4. PROSES CICILAN
if (isset($_GET['cicil']) && isset($_GET['nominal'])) {
    $id_cicil = (int)$_GET['cicil'];
    $nominal_cicil = (int)$_GET['nominal'];
    
    $cek_order = mysqli_query($koneksi, "SELECT * FROM orders WHERE id='$id_cicil'");
    $data_order = mysqli_fetch_assoc($cek_order);
    $sisa_sekarang = $data_order['total_harga'] - $data_order['dp'];
    $bayar_valid = min($nominal_cicil, $sisa_sekarang);
    
    if ($bayar_valid > 0) {
        $dp_baru = $data_order['dp'] + $bayar_valid;
        $status_baru = ($dp_baru >= $data_order['total_harga']) ? 'Lunas' : 'DP';
        mysqli_query($koneksi, "UPDATE orders SET dp='$dp_baru', status_bayar='$status_baru' WHERE id='$id_cicil'");
        mysqli_query($koneksi, "INSERT INTO transactions (jenis, kategori, nominal, tanggal, keterangan) VALUES ('Pemasukan', 'Cicilan', '$bayar_valid', '" . date('Y-m-d') . "', 'Cicilan: " . $data_order['invoice_no'] . "')");
    }
    header("Location: order.php?bulan=$bulan_filter");
    exit();
}

$data_edit = null;
if (isset($_GET['edit'])) {
    $id_edit = (int)$_GET['edit'];
    $cek_edit = mysqli_query($koneksi, "SELECT * FROM orders WHERE id='$id_edit'");
    $data_edit = mysqli_fetch_assoc($cek_edit);
}

$query = mysqli_query($koneksi, "SELECT * FROM orders WHERE tanggal_order LIKE '$bulan_filter%' ORDER BY tanggal_order DESC, id DESC");
$orders_list = [];
while ($row = mysqli_fetch_assoc($query)) {
    $orders_list[] = $row;
}
$master_konsumen = mysqli_query($koneksi, "SELECT nama_konsumen, MAX(no_telepon) as no_telepon FROM orders GROUP BY nama_konsumen");
$json_konsumen = [];
while($k = mysqli_fetch_assoc($master_konsumen)){ $json_konsumen[] = $k; }
?> 
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order KAKAMI</title>
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
            
            <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 space-y-4">
                <h2 class="text-base font-extrabold border-b pb-3 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white uppercase tracking-wide">
                    <svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path><path d="M3.27 6.96L12 12l8.73-5.04M12 22V12"></path></svg> <?php echo $data_edit ? 'Edit Orderan: '.$data_edit['invoice_no'] : 'Input Nota Order Baru'; ?>
                </h2>
                <form method="POST" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="hidden" name="id_edit" value="<?php echo $data_edit['id'] ?? ''; ?>">
                    
                    <div>
                        <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Tanggal Pesanan</label>
                        <input type="date" name="tanggal_order" value="<?php echo $data_edit['tanggal_order'] ?? date('Y-m-d'); ?>" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-semibold outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all cursor-pointer text-slate-800 dark:text-slate-200" required>
                    </div>
                    
                    <div>
                        <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Integrasi Klien</label>
                        <div class="flex gap-2">
                            <input id="input_nama" name="nama_konsumen" value="<?php echo $data_edit['nama_konsumen'] ?? ''; ?>" placeholder="Kunci Nama Pelanggan" class="flex-1 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-bold outline-none text-slate-600 dark:text-slate-300 uppercase placeholder-slate-400 dark:placeholder-slate-500" readonly required>
                            <button type="button" onclick="bukaModalKonsumen()" class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider hover:bg-black dark:hover:bg-slate-200 transform active:scale-95 transition-all shadow-md">Hubungkan <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Kontak Telepon</label>
                        <input id="input_telepon" name="no_telepon" value="<?php echo $data_edit['no_telepon'] ?? ''; ?>" placeholder="Otomatis sinkron..." class="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-mono outline-none text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500" readonly>
                    </div>
                    
                    <div>
                        <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Jenis Produk</label>
                        <select name="jenis_produk" id="input_jenis_produk" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-bold outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all cursor-pointer text-slate-800 dark:text-slate-200" required>
                            <?php 
                            $options = ['Jersey', 'Kemeja', 'Jaket', 'Kaos', 'Poloshirt', 'Lainnya'];
                            $selected_jenis = $data_edit['jenis_produk'] ?? 'Jersey';
                            foreach ($options as $opt) {
                                $sel = ($selected_jenis == $opt) ? 'selected' : '';
                                echo "<option value=\"$opt\" $sel>$opt</option>";
                            }
                            ?>
                        </select>
                    </div>
                    
                    <div>
                        <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Nama Desain / Nama Project</label>
                        <input name="nama_order" value="<?php echo $data_edit['nama_order'] ?? ''; ?>" placeholder="Contoh: SMAN 1 Jersey Futsal atau Almamater Kemeja" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Harga Satuan (Rp)</label>
                        <input id="input_harga_satuan" name="harga_satuan" type="number" value="<?php echo $data_edit['harga_satuan'] ?? ''; ?>" placeholder="Contoh: 150000" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all font-mono font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Volume Kuantitas (Pcs)</label>
                        <input id="input_jumlah_pcs" name="jumlah_pcs" type="number" value="<?php echo $data_edit['jumlah_pcs'] ?? ''; ?>" placeholder="Contoh: 12" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Potongan Diskon (Rp)</label>
                        <input id="input_diskon" name="diskon" type="number" value="<?php echo $data_edit['diskon'] ?? ''; ?>" placeholder="Kosongkan jika tidak ada" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500" >
                    </div>
                    <div>
                        <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Uang Muka / DP Terbayar (Rp)</label>
                        <input id="input_dp" name="dp" type="number" value="<?php echo $data_edit['dp'] ?? ''; ?>" placeholder="Ketik nominal DP awal" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all font-mono font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500" required>
                    </div>

                    <!-- ASISTEN KALKULATOR HARGA & VARIASI (Tangan Panjang, Jumbo Size, Karet, dll) -->
                    <div class="md:col-span-2 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                        <div class="flex justify-between items-center cursor-pointer select-none" onclick="toggleCalcPanel()">
                            <span class="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <span class="bg-indigo-100 dark:bg-indigo-900/40 p-1.5 rounded-lg">💡</span>
                                ASISTEN HITUNG VARIASI HARGA & SPESIFIKASI
                            </span>
                            <span id="calc_toggle_icon" class="text-[10px] font-black bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md text-slate-500 dark:text-slate-300">TUTUP ▲</span>
                        </div>
                        
                        <div id="calc_panel" class="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 border-t border-slate-150 dark:border-slate-700 animate-fade-in">
                            <!-- Kolom Kiri: Input Dasar & Potongan Nego -->
                            <div class="md:col-span-4 space-y-4.5 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h4 class="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b pb-1.5 border-slate-100 dark:border-slate-800">Rumus Dasar</h4>
                                <div>
                                    <label class="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Harga Dasar (Pola Standar / Pcs)</label>
                                    <input id="calc_base" type="number" value="<?php echo isset($data_edit['harga_satuan']) ? $data_edit['harga_satuan'] : '100000'; ?>" oninput="hitungKalkulator()" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Nego / Diskon Satuan (Rp/pcs)</label>
                                    <input id="calc_nego" type="number" value="0" oninput="hitungKalkulator()" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs font-black text-red-655 dark:text-red-400 outline-none focus:ring-2 focus:ring-red-500" placeholder="0">
                                </div>
                                <div class="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-center">
                                    <span class="text-[9px] font-bold text-indigo-550 dark:text-indigo-400 uppercase block mb-0.5">ESTIMASI HARGA SATUAN (RATA-RATA)</span>
                                    <span id="calc_live_total" class="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">Rp 100.000</span>
                                </div>
                            </div>
                            
                            <!-- Kolom Kanan: Pilihan Variasi Surcharge + Qty -->
                            <div class="md:col-span-8 flex flex-col gap-3">
                                <div class="flex justify-between items-center">
                                    <p class="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Detail Tambahan Spesifikasi & Volume Per-Item:</p>
                                    <span class="text-[9px] font-bold text-slate-400 uppercase">Input Jumlah Laptop/Pikir manual</span>
                                </div>

                                <div class="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                                    <!-- Variasi 1: Lengan Panjang -->
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:border-indigo-150 transition-all shadow-xs gap-2">
                                        <label class="flex items-center gap-2 cursor-pointer select-none min-w-[130px] sm:max-w-[150px]">
                                            <input type="checkbox" id="v_panjang" onchange="syncCheckboxQty('v_panjang')" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                                            <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300">Lengan Panjang</span>
                                        </label>
                                        <div class="flex items-center gap-1">
                                            <input type="number" id="v_panjang_qty" value="0" oninput="syncQtyCheckbox('v_panjang')" placeholder="Qty" class="w-12 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[11px] text-center font-bold text-slate-800 dark:text-slate-200">
                                            <button type="button" onclick="setQtyToMax('v_panjang')" class="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-1 rounded font-black uppercase">Semua</button>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <span class="text-[9px] text-slate-405 font-bold">+Rp</span>
                                            <input type="number" id="v_panjang_val" value="15000" oninput="hitungKalkulator()" class="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[10px] text-right font-black text-slate-700 dark:text-slate-300">
                                        </div>
                                        <span id="v_panjang_sub" class="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 min-w-[70px] text-right">Rp 0</span>
                                    </div>

                                    <!-- Variasi 2: Rib Karet Manset -->
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:border-indigo-150 transition-all shadow-xs gap-2">
                                        <label class="flex items-center gap-2 cursor-pointer select-none min-w-[130px] sm:max-w-[150px]">
                                            <input type="checkbox" id="v_karet" onchange="syncCheckboxQty('v_karet')" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                                            <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300">Karet/Rib Manset</span>
                                        </label>
                                        <div class="flex items-center gap-1">
                                            <input type="number" id="v_karet_qty" value="0" oninput="syncQtyCheckbox('v_karet')" placeholder="Qty" class="w-12 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[11px] text-center font-bold text-slate-800 dark:text-slate-200">
                                            <button type="button" onclick="setQtyToMax('v_karet')" class="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-1 rounded font-black uppercase">Semua</button>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <span class="text-[9px] text-slate-405 font-bold">+Rp</span>
                                            <input type="number" id="v_karet_val" value="5000" oninput="hitungKalkulator()" class="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[10px] text-right font-black text-slate-700 dark:text-slate-300">
                                        </div>
                                        <span id="v_karet_sub" class="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 min-w-[70px] text-right">Rp 0</span>
                                    </div>

                                    <!-- Variasi 3: Size 2XL -->
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:border-indigo-150 transition-all shadow-xs gap-2">
                                        <label class="flex items-center gap-2 cursor-pointer select-none min-w-[130px] sm:max-w-[150px]">
                                            <input type="checkbox" id="v_2xl" onchange="syncCheckboxQty('v_2xl')" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                                            <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300">Size Jumbo: 2XL</span>
                                        </label>
                                        <div class="flex items-center gap-1">
                                            <input type="number" id="v_2xl_qty" value="0" oninput="syncQtyCheckbox('v_2xl')" placeholder="Qty" class="w-12 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[11px] text-center font-bold text-slate-800 dark:text-slate-200">
                                            <button type="button" onclick="setQtyToMax('v_2xl')" class="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-1 rounded font-black uppercase">Semua</button>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <span class="text-[9px] text-slate-405 font-bold">+Rp</span>
                                            <input type="number" id="v_2xl_val" value="5000" oninput="hitungKalkulator()" class="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[10px] text-right font-black text-slate-700 dark:text-slate-300">
                                        </div>
                                        <span id="v_2xl_sub" class="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 min-w-[70px] text-right">Rp 0</span>
                                    </div>

                                    <!-- Variasi 4: Size 3XL -->
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:border-indigo-150 transition-all shadow-xs gap-2">
                                        <label class="flex items-center gap-2 cursor-pointer select-none min-w-[130px] sm:max-w-[150px]">
                                            <input type="checkbox" id="v_3xl" onchange="syncCheckboxQty('v_3xl')" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                                            <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300">Size Jumbo: 3XL</span>
                                        </label>
                                        <div class="flex items-center gap-1">
                                            <input type="number" id="v_3xl_qty" value="0" oninput="syncQtyCheckbox('v_3xl')" placeholder="Qty" class="w-12 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[11px] text-center font-bold text-slate-800 dark:text-slate-200">
                                            <button type="button" onclick="setQtyToMax('v_3xl')" class="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-1 rounded font-black uppercase">Semua</button>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <span class="text-[9px] text-slate-405 font-bold">+Rp</span>
                                            <input type="number" id="v_3xl_val" value="10000" oninput="hitungKalkulator()" class="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[10px] text-right font-black text-slate-700 dark:text-slate-300">
                                        </div>
                                        <span id="v_3xl_sub" class="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 min-w-[70px] text-right">Rp 0</span>
                                    </div>

                                    <!-- Variasi 5: Size 4XL -->
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:border-indigo-150 transition-all shadow-xs gap-2">
                                        <label class="flex items-center gap-2 cursor-pointer select-none min-w-[130px] sm:max-w-[150px]">
                                            <input type="checkbox" id="v_4xl" onchange="syncCheckboxQty('v_4xl')" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                                            <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300">Size Jumbo: 4XL</span>
                                        </label>
                                        <div class="flex items-center gap-1">
                                            <input type="number" id="v_4xl_qty" value="0" oninput="syncQtyCheckbox('v_4xl')" placeholder="Qty" class="w-12 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[11px] text-center font-bold text-slate-800 dark:text-slate-200">
                                            <button type="button" onclick="setQtyToMax('v_4xl')" class="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-1 rounded font-black uppercase">Semua</button>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <span class="text-[9px] text-slate-405 font-bold">+Rp</span>
                                            <input type="number" id="v_4xl_val" value="15000" oninput="hitungKalkulator()" class="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[10px] text-right font-black text-slate-700 dark:text-slate-300">
                                        </div>
                                        <span id="v_4xl_sub" class="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 min-w-[70px] text-right">Rp 0</span>
                                    </div>

                                    <!-- Variasi 6: Size 5XL -->
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:border-indigo-150 transition-all shadow-xs gap-2">
                                        <label class="flex items-center gap-2 cursor-pointer select-none min-w-[130px] sm:max-w-[150px]">
                                            <input type="checkbox" id="v_5xl" onchange="syncCheckboxQty('v_5xl')" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                                            <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300">Size Jumbo: 5XL</span>
                                        </label>
                                        <div class="flex items-center gap-1">
                                            <input type="number" id="v_5xl_qty" value="0" oninput="syncQtyCheckbox('v_5xl')" placeholder="Qty" class="w-12 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[11px] text-center font-bold text-slate-800 dark:text-slate-200">
                                            <button type="button" onclick="setQtyToMax('v_5xl')" class="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-1 rounded font-black uppercase">Semua</button>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <span class="text-[9px] text-slate-405 font-bold">+Rp</span>
                                            <input type="number" id="v_5xl_val" value="20000" oninput="hitungKalkulator()" class="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[10px] text-right font-black text-slate-700 dark:text-slate-300">
                                        </div>
                                        <span id="v_5xl_sub" class="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 min-w-[70px] text-right">Rp 0</span>
                                    </div>

                                    <!-- Variasi 7: Kerah Polo / V-neck -->
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:border-indigo-150 transition-all shadow-xs gap-2">
                                        <label class="flex items-center gap-2 cursor-pointer select-none min-w-[130px] sm:max-w-[150px]">
                                            <input type="checkbox" id="v_kerah" onchange="syncCheckboxQty('v_kerah')" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                                            <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300">Kerah Polo/Custom</span>
                                        </label>
                                        <div class="flex items-center gap-1">
                                            <input type="number" id="v_kerah_qty" value="0" oninput="syncQtyCheckbox('v_kerah')" placeholder="Qty" class="w-12 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[11px] text-center font-bold text-slate-800 dark:text-slate-200">
                                            <button type="button" onclick="setQtyToMax('v_kerah')" class="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-1 rounded font-black uppercase">Semua</button>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <span class="text-[9px] text-slate-405 font-bold">+Rp</span>
                                            <input type="number" id="v_kerah_val" value="5000" oninput="hitungKalkulator()" class="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[10px] text-right font-black text-slate-700 dark:text-slate-300">
                                        </div>
                                        <span id="v_kerah_sub" class="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 min-w-[70px] text-right">Rp 0</span>
                                    </div>

                                    <!-- Variasi 8: Custom Kain / Bordir / Lainnya -->
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:border-indigo-150 transition-all shadow-xs gap-2">
                                        <div class="flex items-center gap-2 select-none min-w-[130px] sm:max-w-[155px] flex-1">
                                            <input type="checkbox" id="v_custom" onchange="syncCheckboxQty('v_custom')" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                                            <input type="text" id="v_custom_desc" value="Bordir Komputer" oninput="hitungKalkulator()" placeholder="Custom Lain..." class="bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 w-full p-0 leading-sm">
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <input type="number" id="v_custom_qty" value="0" oninput="syncQtyCheckbox('v_custom')" placeholder="Qty" class="w-12 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[11px] text-center font-bold text-slate-800 dark:text-slate-200">
                                            <button type="button" onclick="setQtyToMax('v_custom')" class="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-1 rounded font-black uppercase">Semua</button>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <span class="text-[9px] text-slate-405 font-bold">+Rp</span>
                                            <input type="number" id="v_custom_val" value="10000" oninput="hitungKalkulator()" class="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[10px] text-right font-black text-slate-700 dark:text-slate-300">
                                        </div>
                                        <span id="v_custom_sub" class="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 min-w-[70px] text-right">Rp 0</span>
                                    </div>

                                    <!-- Variasi 9: Tambahan Lainnya -->
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:border-indigo-150 transition-all shadow-xs gap-2">
                                        <div class="flex items-center gap-2 select-none min-w-[130px] sm:max-w-[155px] flex-1">
                                            <input type="checkbox" id="v_lainnya" onchange="syncCheckboxQty('v_lainnya')" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                                            <input type="text" id="v_lainnya_desc" value="Kerah Zipper / Custom Kain" oninput="hitungKalkulator()" placeholder="Tambahan Lain..." class="bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 w-full p-0 leading-sm">
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <input type="number" id="v_lainnya_qty" value="0" oninput="syncQtyCheckbox('v_lainnya')" placeholder="Qty" class="w-12 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[11px] text-center font-bold text-slate-800 dark:text-slate-200">
                                            <button type="button" onclick="setQtyToMax('v_lainnya')" class="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-1 rounded font-black uppercase">Semua</button>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <span class="text-[9px] text-slate-405 font-bold">+Rp</span>
                                            <input type="number" id="v_lainnya_val" value="15000" oninput="hitungKalkulator()" class="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-1 rounded-lg font-mono text-[10px] text-right font-black text-slate-700 dark:text-slate-300">
                                        </div>
                                        <span id="v_lainnya_sub" class="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 min-w-[70px] text-right">Rp 0</span>
                                    </div>
                                </div>

                                <!-- Checklist setting & tombol apply -->
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                                    <div class="space-y-1">
                                        <label class="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                                            <input type="checkbox" id="auto_apply_live" onchange="hitungKalkulator()" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600">
                                            <span>Otomatis Sinkron Ke Form</span>
                                        </label>
                                        <label class="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                            <input type="checkbox" id="auto_append_notes" checked class="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600">
                                            <span>Tulis Spesifikasi Ke Kolom Catatan</span>
                                        </label>
                                    </div>
                                    <button type="button" id="terapkan_btn" onclick="terapkanHargaKeSatuan()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-5 py-2.5 rounded-xl uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-1">
                                        Terapkan & Tulis ✓
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="md:col-span-2">
                        <label class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Rincian / Detail Pesanan</label>
                        <textarea id="input_detail_pesanan" name="detail_pesanan" rows="2" placeholder="Catatan tambahan spesifikasi order..." class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all resize-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"><?php echo $data_edit['detail_pesanan'] ?? ''; ?></textarea>
                    </div>
                    
                    <div class="md:col-span-2 flex flex-col sm:flex-row gap-2 pt-2">
                        <button type="submit" name="tambah_order" class="flex-1 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-600 text-white py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:from-black hover:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-500 transform hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md shadow-slate-900/10 dark:shadow-none">
                            <?php echo $data_edit ? '<svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Update Nota Orderan' : '<svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg> Simpan Nota Orderan'; ?>
                        </button>
                        <?php if($data_edit): ?>
                            <a href="order.php?bulan=<?php echo $bulan_filter; ?>" class="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs text-center py-3 px-6 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all uppercase tracking-wider">Batal</a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>

            <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 border-slate-100 dark:border-slate-700">
                    <h2 class="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wide"><svg class="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> Antrean Log Nota Order</h2>
                    <form method="GET" class="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 p-1 rounded-xl shadow-sm">
                        <input type="month" name="bulan" value="<?php echo $bulan_filter; ?>" class="bg-transparent border-none p-1.5 focus:outline-none text-xs font-bold cursor-pointer dark:text-slate-200 text-slate-700">
                        <button type="submit" class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-black dark:hover:bg-slate-200 transition-all">Filter</button>
                    </form>
                </div>

                <!-- SUMMARY TOTALS CARDS -->
                <?php
                $sum_res = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT SUM(jumlah_pcs) as tot_pcs, SUM(total_harga) as tot_harga, SUM(dp) as tot_dp FROM orders WHERE tanggal_order LIKE '$bulan_filter%'"));
                $tot_pcs = $sum_res['tot_pcs'] ?? 0;
                $tot_harga = $sum_res['tot_harga'] ?? 0;
                $tot_dp = $sum_res['tot_dp'] ?? 0;
                $tot_sisa = $tot_harga - $tot_dp;
                ?>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                    <div class="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                        <div class="space-y-1">
                            <span class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Qty (Pcs)</span>
                            <span class="text-xl font-black text-slate-900 dark:text-white font-mono"><?php echo number_format($tot_pcs, 0, ',', '.'); ?> <span class="text-xs font-bold text-slate-550">Pcs</span></span>
                        </div>
                        <div class="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-xl">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        </div>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                        <div class="space-y-1">
                            <span class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total DP / Uang Masuk</span>
                            <span class="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">Rp <?php echo number_format($tot_dp, 0, ',', '.'); ?></span>
                        </div>
                        <div class="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                        <div class="space-y-1">
                            <span class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Piutang & Sisa</span>
                            <span class="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">Rp <?php echo number_format($tot_sisa, 0, ',', '.'); ?></span>
                        </div>
                        <div class="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 rounded-xl">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                    </div>
                </div>

                <div class="hidden md:block overflow-x-auto">
                    <table class="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-800 dark:bg-slate-900 text-white text-xs uppercase tracking-widest text-center">
                                <th class="p-4 w-24 font-semibold rounded-tl-lg">Tanggal</th> 
                                <th class="p-4 font-semibold">Project & Invoice</th>
                                <th class="p-4 font-semibold">Konsumen</th>
                                <th class="p-4 w-20 font-semibold">Qty</th>
                                <th class="p-4 w-32 font-semibold">Total Tagihan</th>
                                <th class="p-4 w-32 font-semibold">Terbayar</th>
                                <th class="p-4 w-28 font-semibold">Status</th>
                                <th class="p-4 w-28 font-semibold rounded-tr-lg">Kelola</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
                            <?php foreach($orders_list as $r): 
                                $sisa = $r['total_harga'] - $r['dp'];
                                $id_row = $r['id'];
                            ?>
                            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 text-center relative group">
                                <td class="p-4 font-mono text-[11px] text-slate-400 dark:text-slate-500"><?php echo date('d/m/Y', strtotime($r['tanggal_order'])); ?></td> 
                                <td class="p-4 text-left">
                                    <div class="flex items-center gap-1.5 flex-wrap">
                                        <span class="font-black text-slate-800 dark:text-slate-200 text-xs block uppercase leading-tight"><?php echo htmlspecialchars($r['nama_order']); ?></span>
                                        <span class="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/50 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-tight"><?php echo htmlspecialchars($r['jenis_produk'] ?? 'Jersey'); ?></span>
                                    </div>
                                    <span class="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 block mt-0.5"><?php echo htmlspecialchars($r['invoice_no']); ?></span>
                                </td>
                                <td class="p-4 text-left">
                                    <span class="font-extrabold text-slate-900 dark:text-slate-200 block text-xs uppercase"><?php echo htmlspecialchars($r['nama_konsumen']); ?></span>
                                    <span class="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono block mt-0.5"><?php echo htmlspecialchars($r['no_telepon']); ?></span>
                                </td>
                                <td class="p-4 font-black text-slate-700 dark:text-slate-300 text-xs"><?php echo $r['jumlah_pcs']; ?> Pcs</td>
                                <td class="p-4 font-extrabold text-slate-900 dark:text-slate-200 font-mono text-xs">Rp <?php echo number_format($r['total_harga'], 0, ',', '.'); ?></td>
                                <td class="p-4 font-bold text-slate-600 dark:text-slate-400 font-mono text-xs">Rp <?php echo number_format($r['dp'], 0, ',', '.'); ?></td>
                                <td class="p-4">
                                    <?php echo ($r['status_bayar'] == 'Lunas') ? '<span class="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1 rounded-full text-[9px] font-black tracking-widest shadow-sm">LUNAS</span>' : '<span class="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/50 px-2 py-1 rounded-full text-[9px] font-black tracking-wider shadow-sm block">SISA:<br>'.number_format($sisa, 0, ',', '.').'</span>'; ?>
                                </td>
                                
                                <td class="p-4 relative">
                                    <button onclick="toggleDropdown(<?php echo $id_row; ?>)" class="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 transition-all w-full uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm">
                                        Menu ▾
                                    </button>
                                    
                                    <div id="dropdown-<?php echo $id_row; ?>" class="hidden absolute right-4 mt-1 w-32 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 text-left ring-1 ring-black/5 animate-fade-in">
                                        <a href="nota.php?id=<?php echo $id_row; ?>" target="_blank" class="block bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-2 py-1.5 rounded-lg text-[10px] font-extrabold hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 transition text-center uppercase tracking-wider"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-4-7v6H8v-6h8z"></path></svg> Cetak</a>
                                        
                                        <?php if($r['status_bayar'] != 'Lunas'): ?>
                                            <button onclick="let n = prompt('Masukkan nominal cicilan (Rp):'); if(n){ window.location.href='order.php?cicil=<?php echo $id_row; ?>&bulan=<?php echo $bulan_filter; ?>&nominal='+n; }" class="block bg-slate-900 dark:bg-slate-600 text-white px-2 py-1.5 rounded-lg text-[10px] w-full font-extrabold hover:bg-black dark:hover:bg-slate-500 transition text-center uppercase tracking-wider"><svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Cicil</button>
                                        <?php endif; ?>

                                        <a href="order.php?edit=<?php echo $id_row; ?>&bulan=<?php echo $bulan_filter; ?>" class="block bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-extrabold py-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 transition text-center uppercase tracking-wider"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> Edit</a>
                                        <a href="order.php?hapus=<?php echo $id_row; ?>&bulan=<?php echo $bulan_filter; ?>" onclick="return confirm('Hapus orderan <?php echo $r['invoice_no']; ?>?')" class="block bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-extrabold py-1.5 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition text-center uppercase tracking-wider"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg> Hapus</a>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                        <tfoot>
                            <tr class="bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-750 font-extrabold text-xs text-center text-slate-800 dark:text-slate-200">
                                <td colspan="3" class="p-4 text-right uppercase tracking-wider font-black text-slate-400 dark:text-slate-500">Total Periode Ini:</td>
                                <td class="p-4 font-black font-mono text-slate-900 dark:text-white"><?php echo number_format($tot_pcs, 0, ',', '.'); ?> Pcs</td>
                                <td class="p-4 font-black font-mono text-slate-900 dark:text-white">Rp <?php echo number_format($tot_harga, 0, ',', '.'); ?></td>
                                <td class="p-4 font-black font-mono text-emerald-600 dark:text-emerald-400">Rp <?php echo number_format($tot_dp, 0, ',', '.'); ?></td>
                                <td class="p-4 font-black font-mono text-rose-600 dark:text-rose-450">Rp <?php echo number_format($tot_sisa, 0, ',', '.'); ?></td>
                                <td class="p-4"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- MOBILE VIEW: GORGEOUS CARD-BASED RESPONSIVE LIST -->
                <div class="block md:hidden space-y-4">
                    <?php if (empty($orders_list)): ?>
                        <div class="text-center py-10 bg-slate-50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
                            <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">Belum ada data orderan di bulan ini</p>
                        </div>
                    <?php else: ?>
                        <?php foreach($orders_list as $r): 
                            $sisa = $r['total_harga'] - $r['dp'];
                            $id_row = $r['id'];
                        ?>
                        <div class="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/80 p-4.5 rounded-3xl shadow-sm space-y-3.5 relative overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600">
                            <!-- Header: Tanggal & Invoice -->
                            <div class="flex justify-between items-center border-b pb-2.5 border-slate-100 dark:border-slate-700/50">
                                <span class="text-[9px] font-mono font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-md tracking-wider leading-none"><?php echo date('d/m/Y', strtotime($r['tanggal_order'])); ?></span>
                                <span class="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase"><?php echo htmlspecialchars($r['invoice_no']); ?></span>
                            </div>
                            
                            <!-- Main Details -->
                            <div class="space-y-2">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <h4 class="font-extrabold text-slate-850 dark:text-slate-100 text-[13px] uppercase leading-snug"><?php echo htmlspecialchars($r['nama_order']); ?></h4>
                                    <span class="bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-tight"><?php echo htmlspecialchars($r['jenis_produk'] ?? 'Jersey'); ?></span>
                                </div>
                                
                                <div class="flex items-start justify-between text-xs pt-1.5 leading-normal gap-4">
                                    <div class="space-y-0.5 max-w-[65%]">
                                        <span class="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase block tracking-wider">Konsumen</span>
                                        <span class="font-bold text-slate-800 dark:text-slate-200 block text-xs truncate"><?php echo htmlspecialchars($r['nama_konsumen']); ?></span>
                                        <?php if (!empty($r['no_telepon'])): ?>
                                            <span class="text-[9.5px] font-mono text-slate-400 dark:text-slate-500 font-bold block"><?php echo htmlspecialchars($r['no_telepon']); ?></span>
                                        <?php endif; ?>
                                    </div>
                                    <div class="text-right min-w-[30%]">
                                        <span class="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase block tracking-wider">Jumlah</span>
                                        <span class="font-black text-slate-850 dark:text-slate-100 text-xs font-mono block mt-0.5"><?php echo $r['jumlah_pcs']; ?> Pcs</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Financial breakdown -->
                            <div class="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-2xl text-center border border-slate-100 dark:border-slate-850">
                                <div>
                                    <span class="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase block tracking-wider">Total</span>
                                    <span class="text-[10.5px] font-bold font-mono text-slate-800 dark:text-slate-200 block mt-0.5">Rp <?php echo number_format($r['total_harga'], 0, ',', '.'); ?></span>
                                </div>
                                <div>
                                    <span class="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase block tracking-wider">DP</span>
                                    <span class="text-[10.5px] font-bold font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">Rp <?php echo number_format($r['dp'], 0, ',', '.'); ?></span>
                                </div>
                                <div>
                                    <span class="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase block tracking-wider">Sisa</span>
                                    <span class="text-[10.5px] font-bold font-mono text-rose-600 dark:text-rose-400 block mt-0.5">Rp <?php echo number_format($sisa, 0, ',', '.'); ?></span>
                                </div>
                            </div>

                            <!-- Status and Action bar -->
                            <div class="flex items-center justify-between gap-2 border-t pt-2.5 border-slate-100 dark:border-slate-700/50">
                                <div>
                                    <?php echo ($r['status_bayar'] == 'Lunas') ? '<span class="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-150 dark:border-emerald-900 px-2.5 py-1 rounded-full text-[8px] font-black tracking-widest leading-none">LUNAS</span>' : '<span class="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 border border-amber-150 dark:border-amber-900 px-2.5 py-1 rounded-full text-[8px] font-black tracking-wider leading-none">BELUM LUNAS</span>'; ?>
                                </div>

                                <!-- Fast Inline Actions instead of hidden dropdowns for excellent mobile UX -->
                                <div class="flex items-center gap-1.5 flex-wrap justify-end">
                                    <a href="nota.php?id=<?php echo $id_row; ?>" target="_blank" class="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase border border-slate-200 dark:border-slate-600 tracking-wider flex items-center gap-0.5 transition shadow-xs">Cetak</a>
                                    
                                    <?php if($r['status_bayar'] != 'Lunas'): ?>
                                        <button onclick="let n = prompt('Masukkan nominal cicilan (Rp):'); if(n){ window.location.href='order.php?cicil=<?php echo $id_row; ?>&bulan=<?php echo $bulan_filter; ?>&nominal='+n; }" class="bg-slate-900 dark:bg-slate-600 text-white px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider flex items-center transition shadow-xs">Cicil</button>
                                    <?php endif; ?>

                                    <a href="order.php?edit=<?php echo $id_row; ?>&bulan=<?php echo $bulan_filter; ?>" class="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase border border-slate-200 dark:border-slate-600 tracking-wider flex items-center transition shadow-xs">Edit</a>
                                    
                                    <a href="order.php?hapus=<?php echo $id_row; ?>&bulan=<?php echo $bulan_filter; ?>" onclick="return confirm('Hapus orderan <?php echo $r['invoice_no']; ?>?')" class="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg text-[9px] font-extrabold py-1 px-2 tracking-wider hover:bg-rose-600 hover:text-white transition">Hapus</a>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>   </div>
            </div>
        </div>
    </div>

    <div id="modal_konsumen" class="hidden fixed inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <div class="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-700 transform transition-all space-y-4">
            <div class="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-700">
                <h3 class="font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-wide" id="modal_title">Hubungkan Database Konsumen</h3>
                <button type="button" onclick="tutupModalKonsumen()" class="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-2xl transition-colors">&times;</button>
            </div>
            
            <div id="view_pencarian" class="space-y-3">
                <input id="cari_nama" onkeyup="filterKonsumen()" placeholder="Ketik nama / nomor telepon pelanggan..." class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-semibold outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-200">
                
                <div class="max-h-52 overflow-y-auto border border-slate-100 dark:border-slate-700 rounded-2xl p-1.5 space-y-1 bg-slate-50/50 dark:bg-slate-900/50" id="box_list_konsumen"></div>

                <div class="border-t pt-3 border-slate-100 dark:border-slate-700">
                    <p class="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">Belum Terdaftar? Daftarkan Baru:</p>
                    <div class="grid grid-cols-2 gap-2 mb-3">
                        <input id="baru_nama" placeholder="Nama Pelanggan Baru" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all font-semibold uppercase text-slate-800 dark:text-slate-200">
                        <input id="baru_telepon" placeholder="Nomor WA (08...)" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all font-mono text-slate-800 dark:text-slate-200">
                    </div>
                    <button type="button" onclick="buatKonsumenBaru()" class="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2.5 text-xs font-extrabold rounded-xl uppercase tracking-widest hover:bg-black dark:hover:bg-slate-200 shadow-md shadow-slate-900/10 dark:shadow-none"><svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg> Daftarkan Klien Baru</button>
                </div>
            </div>

            <form id="form_edit_konsumen" method="POST" class="hidden space-y-3">
                <p class="text-[10px] text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl border border-amber-200 dark:border-amber-800/50 font-medium leading-relaxed"><svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Peringatan: Mengubah data ini akan otomatis memutakhirkan nomor WA dan nama pada seluruh log riwayat orderan lama milik pelanggan ini.</p>
                <input type="hidden" name="konsumen_nama_lama" id="edit_nama_lama">
                <div>
                    <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Nama Konsumen:</label>
                    <input type="text" name="konsumen_nama_baru" id="edit_nama_baru" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 text-slate-800 dark:text-slate-200" required>
                </div>
                <div>
                    <label class="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Nomor Telepon:</label>
                    <input type="text" name="konsumen_telepon_baru" id="edit_telepon_baru" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-mono font-bold outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 text-slate-800 dark:text-slate-200">
                </div>
                <div class="flex gap-2 pt-2">
                    <button type="button" onclick="batalEditKonsumen()" class="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-extrabold p-2.5 text-xs rounded-xl uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-600">Kembali</button>
                    <button type="submit" name="update_master_konsumen" class="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold p-2.5 text-xs rounded-xl uppercase tracking-widest hover:bg-black dark:hover:bg-slate-200 shadow-md">Simpan Perubahan</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const dataKonsumen = <?php echo json_encode($json_konsumen); ?>;

        // ASISTEN HITUNG VARIASI HARGA UTILS
        function toggleCalcPanel() {
            const panel = document.getElementById('calc_panel');
            const icon = document.getElementById('calc_toggle_icon');
            if (panel.classList.contains('hidden')) {
                panel.classList.remove('hidden');
                icon.innerText = 'TUTUP ▲';
            } else {
                panel.classList.add('hidden');
                icon.innerText = 'BUKA ▼';
            }
        }

        // Helper to set quantity automatically
        function setQtyToMax(id) {
            const mainQty = parseInt(document.getElementById('input_jumlah_pcs').value) || 0;
            if (mainQty <= 0) {
                alert('Silakan isi Volume Kuantitas (Pcs) di atas terlebih dahulu!');
                return;
            }
            document.getElementById(id + '_qty').value = mainQty;
            document.getElementById(id).checked = true;
            hitungKalkulator();
        }

        // Synchronize when checkbox is checked/unchecked
        function syncCheckboxQty(id) {
            const cb = document.getElementById(id);
            const qtyInput = document.getElementById(id + '_qty');
            if (cb.checked) {
                if (parseInt(qtyInput.value) <= 0 || !qtyInput.value) {
                    const mainQty = parseInt(document.getElementById('input_jumlah_pcs').value) || 0;
                    qtyInput.value = mainQty > 0 ? mainQty : 1;
                }
            } else {
                qtyInput.value = 0;
            }
            hitungKalkulator();
        }

        // Synchronize when quantity is typed/changed
        function syncQtyCheckbox(id) {
            const cb = document.getElementById(id);
            const qtyInput = document.getElementById(id + '_qty');
            const qty = parseInt(qtyInput.value) || 0;
            if (qty > 0) {
                cb.checked = true;
            } else {
                cb.checked = false;
            }
            hitungKalkulator();
        }

        function hitungKalkulator() {
            const base = parseInt(document.getElementById('calc_base').value) || 0;
            const nego = parseInt(document.getElementById('calc_nego').value) || 0;
            const mainQty = parseInt(document.getElementById('input_jumlah_pcs').value) || 1;
            
            const listVariasi = ['v_panjang', 'v_karet', 'v_2xl', 'v_3xl', 'v_4xl', 'v_5xl', 'v_kerah', 'v_custom', 'v_lainnya'];
            let totalSurcharge = 0;
            
            listVariasi.forEach(id => {
                const cb = document.getElementById(id);
                const qtyVal = parseInt(document.getElementById(id + '_qty').value) || 0;
                const priceVal = parseInt(document.getElementById(id + '_val').value) || 0;
                
                let subtotal = 0;
                if (cb.checked && qtyVal > 0) {
                    subtotal = qtyVal * priceVal;
                }
                
                totalSurcharge += subtotal;
                document.getElementById(id + '_sub').innerText = 'Rp ' + subtotal.toLocaleString('id-ID');
            });

            // Hitung rata-rata surcharge per pcs
            const avgSurcharge = totalSurcharge / (mainQty > 0 ? mainQty : 1);
            const totalUnit = Math.round(base + avgSurcharge - nego);
            
            document.getElementById('calc_live_total').innerText = 'Rp ' + totalUnit.toLocaleString('id-ID');
            
            // Auto apply ke form jika dicentang
            if (document.getElementById('auto_apply_live').checked) {
                document.getElementById('input_harga_satuan').value = totalUnit;
                tulisSpesifikasiKeCatatan(false);
            }
        }

        function terapkanHargaKeSatuan() {
            const base = parseInt(document.getElementById('calc_base').value) || 0;
            const nego = parseInt(document.getElementById('calc_nego').value) || 0;
            const mainQty = parseInt(document.getElementById('input_jumlah_pcs').value) || 1;
            
            const listVariasi = ['v_panjang', 'v_karet', 'v_2xl', 'v_3xl', 'v_4xl', 'v_5xl', 'v_kerah', 'v_custom', 'v_lainnya'];
            let totalSurcharge = 0;
            
            listVariasi.forEach(id => {
                const cb = document.getElementById(id);
                const qtyVal = parseInt(document.getElementById(id + '_qty').value) || 0;
                const priceVal = parseInt(document.getElementById(id + '_val').value) || 0;
                
                if (cb.checked && qtyVal > 0) {
                    totalSurcharge += (qtyVal * priceVal);
                }
            });

            const avgSurcharge = totalSurcharge / (mainQty > 0 ? mainQty : 1);
            const totalUnit = Math.round(base + avgSurcharge - nego);
            
            document.getElementById('input_harga_satuan').value = totalUnit;
            
            if (document.getElementById('auto_append_notes').checked) {
                tulisSpesifikasiKeCatatan(true);
            } else {
                flashTerapkanButton();
            }
        }

        function flashTerapkanButton() {
            const btn = document.getElementById('terapkan_btn');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = 'BERHASIL ✓';
                btn.classList.replace('bg-emerald-600', 'bg-indigo-600');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.replace('bg-indigo-600', 'bg-emerald-600');
                }, 1500);
            }
        }

        function tulisSpesifikasiKeCatatan(forceFeedback) {
            const listVariasi = [
                { id: 'v_panjang', label: 'Lengan Panjang' },
                { id: 'v_karet', label: 'Rib Karet Manset' },
                { id: 'v_2xl', label: 'Size 2XL' },
                { id: 'v_3xl', label: 'Size 3XL' },
                { id: 'v_4xl', label: 'Size 4XL' },
                { id: 'v_5xl', label: 'Size 5XL' },
                { id: 'v_kerah', label: 'Kerah Polo/Custom' },
                { id: 'v_custom', label: 'Custom' },
                { id: 'v_lainnya', label: 'Lainnya' }
            ];
            
            let specsLine = [];
            let totalSurcharge = 0;
            const base = parseInt(document.getElementById('calc_base').value) || 0;
            const mainQty = parseInt(document.getElementById('input_jumlah_pcs').value) || 1;
            const nego = parseInt(document.getElementById('calc_nego').value) || 0;

            listVariasi.forEach(item => {
                const cb = document.getElementById(item.id);
                const qtyVal = parseInt(document.getElementById(item.id + '_qty').value) || 0;
                const priceVal = parseInt(document.getElementById(item.id + '_val').value) || 0;
                
                if (cb.checked && qtyVal > 0) {
                    const subtotal = qtyVal * priceVal;
                    totalSurcharge += subtotal;
                    let labelName = item.label;
                    if (item.id === 'v_custom') {
                        labelName = document.getElementById('v_custom_desc').value.trim() || 'Custom Surcharge';
                    } else if (item.id === 'v_lainnya') {
                        labelName = document.getElementById('v_lainnya_desc').value.trim() || 'Tambahan Lainnya';
                    }
                    specsLine.push(`- ${labelName}: ${qtyVal} pcs x Rp ${priceVal.toLocaleString('id-ID')} = Rp ${subtotal.toLocaleString('id-ID')}`);
                }
            });
            
            const txtArea = document.getElementById('input_detail_pesanan');
            let currentVal = txtArea.value.trim();
            
            // Hapus blok autogen lama agar tidak bertumpuk
            currentVal = currentVal.replace(/\*Rincian Variasi Harga:\*[\s\S]*?========================/g, '').trim();
            currentVal = currentVal.replace(/\[Spesifikasi: [^\]]+\]/g, '').trim();

            if (specsLine.length > 0) {
                const avgSurcharge = Math.round(totalSurcharge / mainQty);
                const finalUnit = base + avgSurcharge - nego;
                
                let specBlock = `*Rincian Variasi Harga:*
` + specsLine.join('\n') + `
----------------------------------------
Harga Dasar: Rp ${base.toLocaleString('id-ID')}/pcs
Variasi Tambahan: +Rp ${totalSurcharge.toLocaleString('id-ID')} (Rata-rata: +Rp ${avgSurcharge.toLocaleString('id-ID')}/pcs)
` + (nego > 0 ? `Nego/Diskon: -Rp ${nego.toLocaleString('id-ID')}/pcs\n` : ``) + `Harga Satuan Rata-rata: Rp ${finalUnit.toLocaleString('id-ID')}/pcs
========================`;
                
                if (currentVal.length > 0) {
                    txtArea.value = currentVal + '\n\n' + specBlock;
                } else {
                    txtArea.value = specBlock;
                }
            } else {
                txtArea.value = currentVal;
            }
            
            if (forceFeedback) {
                flashTerapkanButton();
            }
        }

        // Automatic spec recovery on edit page load
        function parseDetailPesananToCalculator(text) {
            const listMap = [
                { id: 'v_panjang', label: 'Lengan Panjang' },
                { id: 'v_karet', label: 'Rib Karet Manset' },
                { id: 'v_2xl', label: 'Size 2XL' },
                { id: 'v_3xl', label: 'Size 3XL' },
                { id: 'v_4xl', label: 'Size 4XL' },
                { id: 'v_5xl', label: 'Size 5XL' },
                { id: 'v_kerah', label: 'Kerah Polo/Custom' }
            ];

            const lines = text.split('\n');
            lines.forEach(line => {
                const match = line.match(/^\-\s*(.*?):\s*(\d+)\s*pcs\s*x\s*Rp\s*([\d\.]+)\s*=\s*Rp\s*([\d\.]+)/i);
                if (match) {
                    const name = match[1].trim();
                    const qty = parseInt(match[2]) || 0;
                    const price = parseInt(match[3].replace(/\./g, '')) || 0;

                    let matched = false;
                    listMap.forEach(item => {
                        if (item.label.toLowerCase() === name.toLowerCase()) {
                            const cb = document.getElementById(item.id);
                            if (cb) cb.checked = true;
                            const qInput = document.getElementById(item.id + '_qty');
                            if (qInput) qInput.value = qty;
                            const pInput = document.getElementById(item.id + '_val');
                            if (pInput) pInput.value = price;
                            matched = true;
                        }
                    });

                    if (!matched) {
                        const vCustomCb = document.getElementById('v_custom');
                        const vLainnyaCb = document.getElementById('v_lainnya');

                        if (vCustomCb && !vCustomCb.checked) {
                            vCustomCb.checked = true;
                            const vCustomDesc = document.getElementById('v_custom_desc');
                            if (vCustomDesc) vCustomDesc.value = name;
                            document.getElementById('v_custom_qty').value = qty;
                            document.getElementById('v_custom_val').value = price;
                        } else if (vLainnyaCb && !vLainnyaCb.checked) {
                            vLainnyaCb.checked = true;
                            const vLainnyaDesc = document.getElementById('v_lainnya_desc');
                            if (vLainnyaDesc) vLainnyaDesc.value = name;
                            document.getElementById('v_lainnya_qty').value = qty;
                            document.getElementById('v_lainnya_val').value = price;
                        }
                    }
                }
            });
            hitungKalkulator();
        }

        window.addEventListener('DOMContentLoaded', () => {
            const detailArea = document.getElementById('input_detail_pesanan');
            if (detailArea && detailArea.value) {
                parseDetailPesananToCalculator(detailArea.value);
            }
        });

        function bukaModalKonsumen() {
            document.getElementById('modal_konsumen').classList.remove('hidden');
            batalEditKonsumen(); 
            document.getElementById('cari_nama').focus();
        }

        function tutupModalKonsumen() {
            document.getElementById('modal_konsumen').classList.add('hidden');
            document.getElementById('cari_nama').value = '';
            document.getElementById('baru_nama').value = '';
            document.getElementById('baru_telepon').value = '';
        }

        function renderListKonsumen(data) {
            const box = document.getElementById('box_list_konsumen');
            box.innerHTML = '';
            
            if(data.length === 0) {
                box.innerHTML = '<p class="text-xs italic text-slate-400 dark:text-slate-500 p-4 text-center font-medium">Nama klien tidak terdaftar. Silakan buat baru di bawah.</p>';
                return;
            }

            data.forEach(item => {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center p-2.5 hover:bg-white dark:hover:bg-slate-700 bg-white/40 dark:bg-slate-800/40 border border-transparent hover:border-slate-100 dark:hover:border-slate-600 rounded-xl transition-all text-xs text-slate-800 dark:text-slate-200";
                div.innerHTML = `
                    <div>
                        <span class="font-extrabold text-slate-800 dark:text-slate-200 uppercase">${item.nama_konsumen}</span> 
                        <span class="text-[10px] text-slate-400 dark:text-slate-500 block font-mono font-bold mt-0.5">${item.no_telepon ? item.no_telepon : '-'}</span>
                    </div>
                    <div class="flex gap-1.5">
                        <button type="button" onclick="aksiEditKonsumen('${item.nama_konsumen}', '${item.no_telepon}')" class="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-slate-600 dark:text-slate-300 transition-all"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> KELOLA</button>
                        <button type="button" onclick="pilihKonsumen('${item.nama_konsumen}', '${item.no_telepon}')" class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-200 px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wider">PILIH</button>
                    </div>
                `;
                box.appendChild(div);
            });
        }

        function filterKonsumen() {
            const keyword = document.getElementById('cari_nama').value.toLowerCase();
            const hasilFilter = dataKonsumen.filter(item => {
                return item.nama_konsumen.toLowerCase().includes(keyword) || (item.no_telepon && item.no_telepon.includes(keyword));
            });
            renderListKonsumen(hasilFilter);
        }

        function pilihKonsumen(nama, telepon) {
            document.getElementById('input_nama').value = nama;
            document.getElementById('input_telepon').value = telepon;
            tutupModalKonsumen();
        }

        function buatKonsumenBaru() {
            const nama = document.getElementById('baru_nama').value.trim();
            const telepon = document.getElementById('baru_telepon').value.trim();
            if(nama === '') { alert('Nama konsumen baru tidak boleh kosong!'); return; }
            document.getElementById('input_nama').value = nama;
            document.getElementById('input_telepon').value = telepon;
            tutupModalKonsumen();
        }

        function aksiEditKonsumen(nama, telepon) {
            document.getElementById('modal_title').innerText = "Mutakhirkan Data Konsumen";
            document.getElementById('view_pencarian').classList.add('hidden');
            document.getElementById('form_edit_konsumen').classList.remove('hidden');
            
            document.getElementById('edit_nama_lama').value = nama;
            document.getElementById('edit_nama_baru').value = nama;
            document.getElementById('edit_telepon_baru').value = (telepon === 'null' || telepon === 'undefined') ? '' : telepon;
        }

        function batalEditKonsumen() {
            document.getElementById('modal_title').innerText = "Hubungkan Database Konsumen";
            document.getElementById('view_pencarian').classList.remove('hidden');
            document.getElementById('form_edit_konsumen').classList.add('hidden');
            renderListKonsumen(dataKonsumen);
        }

        function toggleDropdown(id) {
            unsetDropdowns(id);
            var dropdown = document.getElementById('dropdown-' + id);
            if (dropdown.classList.contains('hidden')) { dropdown.classList.remove('hidden'); } else { dropdown.classList.add('hidden'); }
        }
        function unsetDropdowns(exceptId) {
            var dropdowns = document.querySelectorAll('[id^="dropdown-"]');
            dropdowns.forEach(function(item) { if(item.id !== 'dropdown-' + exceptId) { item.classList.add('hidden'); } });
        }
        window.onclick = function(event) {
            if (!event.target.matches('button')) {
                var dropdowns = document.querySelectorAll('[id^="dropdown-"]');
                dropdowns.forEach(function(item) { item.classList.add('hidden'); });
            }
        }
    </script>

    <?php include 'footer.php'; ?>
</body>
</html>