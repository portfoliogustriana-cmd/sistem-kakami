<?php
include 'koneksi.php';

$id_order = (int)$_GET['id'];

$query_order = mysqli_query($koneksi, "SELECT * FROM orders WHERE id='$id_order'");
$order = mysqli_fetch_assoc($query_order);

if (!$order) {
    die("Data orderan tidak ditemukan!");
}

$query_items = mysqli_query($koneksi, "SELECT * FROM order_items WHERE order_id='$id_order' ORDER BY id ASC");
$items = [];

$rekap_size = [
    'XS' => 0, 'S' => 0, 'M' => 0, 'L' => 0, 'XL' => 0, 'XXL' => 0, '3XL' => 0, '4XL' => 0, '5XL' => 0,
    '2XL ANAK' => 0, 'XL ANAK' => 0, 'L ANAK' => 0, 'M ANAK' => 0, 'S ANAK' => 0, 'XS ANAK' => 0, 'XXS ANAK' => 0,
    'CUSTOM' => 0
];

$total_pendek = 0;
$total_panjang = 0;

// Array penampung nomor urut yang memiliki catatan khusus
$no_urut_dengan_catatan = [];
$counter_urut = 1;

while ($row = mysqli_fetch_assoc($query_items)) {
    $items[] = $row;
    
    $sz = strtoupper(trim($row['size']));
    if (array_key_exists($sz, $rekap_size)) {
        $rekap_size[$sz]++;
    } else {
        $rekap_size['CUSTOM']++;
    }

    $lgn = strtoupper(trim($row['lengan']));
    if ($lgn == 'PENDEK') {
        $total_pendek++;
    } elseif ($lgn == 'PANJANG') {
        $total_panjang++;
    }

    // Deteksi jika kolom keterangan diisi catatan khusus (bukan kosong atau strip)
    if (!empty(trim($row['keterangan'])) && trim($row['keterangan']) !== '-') {
        $no_urut_dengan_catatan[] = $counter_urut;
    }
    $counter_urut++;
}

$total_pcs = count($items) > 0 ? count($items) : $order['jumlah_pcs'];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>SPK - <?php echo $order['invoice_no']; ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <style>
        @media print {
            body { background-color: #ffffff; font-size: 10px; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
            /* Paksa browser mencetak warna latar belakang */
            .baris-panjang {
                background-color: #fef3c7 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .nomor-ada-catatan {
                background-color: #ef4444 !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .banner-peringatan {
                background-color: #fee2e2 !important;
                color: #991b1b !important;
                border: 2px solid #f87171 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
        table td, table th { padding: 3px 2px; border: 1px solid #000000; text-align: center; }
        
        .baris-panjang {
            background-color: #fef3c7 !important;
        }

        /* Style khusus tanda merah pada nomor urut yang memiliki catatan */
        .nomor-ada-catatan {
            background-color: #ef4444 !important;
            color: white !important;
            font-weight: 900 !important;
        }
    </style>
</head>
<body class="bg-gray-100 p-4 sm:p-8 min-h-screen flex flex-col items-center">

    <div class="max-w-4xl mx-auto mb-4 no-print flex flex-wrap justify-end gap-2">
        <button onclick="window.print()" class="bg-black text-white px-4 py-2 rounded font-bold text-xs uppercase hover:bg-gray-800 transition shadow-md"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-4-7v6H8v-6h8z"></path></svg> Cetak Printer</button>
        <button onclick="downloadPDF()" class="bg-red-600 text-white px-4 py-2 rounded font-bold text-xs uppercase hover:bg-red-700 transition shadow-md"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg> Download PDF</button>
        <button onclick="downloadJPEG()" class="bg-blue-600 text-white px-4 py-2 rounded font-bold text-xs uppercase hover:bg-blue-700 transition shadow-md"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg> Download JPEG</button>
    </div>

    <div id="spk-container" class="max-w-4xl mx-auto bg-white p-8 border border-black shadow-sm text-black font-sans">
        
        <div class="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
            <div>
                <img src="logo.png" alt="Client Logo" class="h-10 w-auto mb-1" />
                <p class="text-sm font-bold text-gray-700">PRODUCTION WORK ORDER</p>
            </div>
            <div class="flex items-center gap-4">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=<?php echo urlencode('SPK_INV:'.$order['invoice_no']); ?>" alt="QR Code" class="w-16 h-16 border border-black p-1 bg-white">
            </div>
        </div>

        <div class="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div class="space-y-1">
                <div><span class="w-36 inline-block font-medium text-gray-500">Konsumen/Client</span>: <span class="font-bold"><?php echo $order['nama_konsumen']; ?></span></div>
                <div><span class="w-36 inline-block font-medium text-gray-500">Nama Projek</span>: <span class="font-bold"><?php echo $order['nama_order']; ?></span></div>
                <div><span class="w-36 inline-block font-medium text-gray-500">Tgl Order</span>: <span class="font-mono"><?php echo date('d/m/Y', strtotime($order['tanggal_order'])); ?></span></div>
                <div><span class="w-36 inline-block font-bold text-red-600"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> DEADLINE SELESAI</span>: <span class="font-mono font-black text-red-600 bg-red-50 px-1 rounded"><?php echo !empty($order['deadline_kerja']) ? date('d/m/Y', strtotime($order['deadline_kerja'])) : date('d/m/Y', strtotime($order['tanggal_order'])); ?></span></div>
            </div>
            <div class="space-y-1">
                <div><span class="w-36 inline-block font-medium text-gray-500">Bahan Utama</span>: <span class="font-bold"><?php echo !empty($order['bahan_utama']) ? $order['bahan_utama'] : 'Jacquart'; ?></span></div>
                <div><span class="w-36 inline-block font-medium text-gray-500">Bahan Kerah</span>: <span class="font-bold"><?php echo !empty($order['bahan_kerah']) ? $order['bahan_kerah'] : '-'; ?></span></div>
                <div><span class="w-36 inline-block font-medium text-gray-500">Bahan Celana</span>: <span class="font-bold"><?php echo !empty($order['bahan_celana']) ? $order['bahan_celana'] : '-'; ?></span></div>
                <div><span class="w-36 inline-block font-medium text-gray-500 bg-yellow-100">Pola Baju/Potongan</span>: <span class="font-bold"><?php echo !empty($order['pola_baju']) ? $order['pola_baju'] : 'Standar (Set-In)'; ?></span></div>
            </div>
        </div>

        <?php if(!empty($order['catatan_darurat'])): ?>
            <div class="mb-4 bg-amber-50 border-2 border-amber-500 text-amber-900 p-3 rounded font-mono text-xs">
                <span class="font-black"><svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> CATATAN TAMBAHAN DARURAT / REVISI:</span><br>
                <?php echo nl2br($order['catatan_darurat']); ?>
            </div>
        <?php endif; ?>

        <?php if(!empty($no_urut_dengan_catatan)): ?>
            <div class="banner-peringatan mb-4 bg-red-100 text-red-800 border-2 border-red-400 p-2.5 rounded font-sans text-xs font-black tracking-wide uppercase">
                <svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> WAJIB CEK! Ada Catatan Khusen Pada Nomor Urut: 
                <?php 
                echo implode(', ', array_map(function($n) {
                    return "[ No. Urut $n ]";
                }, $no_urut_dengan_catatan)); 
                ?>
            </div>
        <?php endif; ?>

        <div class="mb-6 overflow-x-auto">
            <h3 class="text-xs font-bold uppercase tracking-wider mb-2"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M9 9l3 3 5-5"></path></svg> Rekapitulasi Jumlah Order Per Ukuran</h3>
            <table class="w-full border-collapse text-[9px] text-center border-black">
                <tr class="bg-gray-100 font-bold">
                    <th>SIZE</th>
                    <?php foreach($rekap_size as $size_name => $jml): ?>
                        <th class="p-1"><?php echo str_replace(' ANAK', '<br><span class="text-[8px] text-blue-600">Anak</span>', $size_name); ?></th>
                    <?php endforeach; ?>
                    <th class="bg-black text-white px-2">TOTAL</th>
                </tr>
                <tr>
                    <td class="font-bold bg-gray-50">JML</td>
                    <?php foreach($rekap_size as $size_name => $jml): ?>
                        <td class="font-bold <?php echo ($jml > 0) ? 'bg-yellow-50 text-black font-black' : 'text-gray-400'; ?>"><?php echo $jml; ?></td>
                    <?php endforeach; ?>
                    <td class="font-black bg-gray-100 text-xs"><?php echo $total_pcs; ?> Pcs</td>
                </tr>
            </table>

            <div class="mt-2 flex gap-4 text-[10px] font-bold uppercase tracking-wide">
                <div class="bg-gray-50 px-3 py-1.5 border border-black rounded flex items-center gap-1.5 shadow-sm">
                    <span><svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg> Total Lengan Pendek:</span>
                    <span class="text-xs font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"><?php echo $total_pendek; ?> Pcs</span>
                </div>
                <div class="bg-gray-50 px-3 py-1.5 border border-black rounded flex items-center gap-1.5 shadow-sm">
                    <span><svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg> Total Lengan Panjang:</span>
                    <span class="text-xs font-black text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200"><?php echo $total_panjang; ?> Pcs</span>
                </div>
            </div>
        </div>

        <div class="mb-6">
            <h3 class="text-xs font-bold uppercase tracking-wider mb-2"><svg class="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> Daftar Item Produksi</h3>
            <table class="w-full border-collapse text-[9px] text-center border-black">
                <thead>
                    <tr class="bg-black text-white uppercase text-[8px]">
                        <th>No</th>
                        <th class="text-left px-1">Nama Depan</th> 
                        <th>No. Png</th> 
                        <th class="text-left px-1">Nama Png</th> 
                        <th>Size</th>
                        <th>Lengan</th>
                        <th>Tgn<br>Kn</th><th>Tgn<br>Kr</th>
                        <th>Cln<br>Kn</th><th>Cln<br>Kr</th>
                        <th>Bju<br>Dpn</th><th>Bju<br>Blk</th>
                        <th>Krh</th>
                        <th class="text-left px-1">Ket</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $no = 1; 
                    foreach($items as $item): 
                        $isPanjang = (strtoupper(trim($item['lengan'])) === 'PANJANG');
                        $row_class = $isPanjang ? 'baris-panjang' : '';

                        // FITUR BARU: Deteksi jika baris ini punya catatan khusus untuk menandai nomor urut
                        $hasCatatan = (!empty(trim($item['keterangan'])) && trim($item['keterangan']) !== '-');
                        $td_no_class = $hasCatatan ? 'nomor-ada-catatan' : 'font-bold';
                    ?>
                    <tr class="<?php echo $row_class; ?>">
                        <td class="<?php echo $td_no_class; ?>"><?php echo $no++; ?></td>
                        <td class="text-left font-bold px-1"><?php echo htmlspecialchars($item['nama_player']); ?></td>
                        <td class="font-mono font-bold bg-gray-50 text-xs"><?php echo htmlspecialchars($item['no_player']); ?></td>
                        <td class="text-left font-bold px-1 text-blue-900"><?php echo htmlspecialchars($item['nama_punggung'] ?? '-'); ?></td>
                        <td class="font-bold bg-yellow-50 text-black"><?php echo strtoupper($item['size']); ?></td>
                        <td class="font-bold"><?php echo strtoupper($item['lengan']); ?></td>
                        <td class="w-7"></td> <td class="w-7"></td> 
                        <td class="w-7"></td> <td class="w-7"></td> 
                        <td class="w-7"></td> <td class="w-7"></td> 
                        <td class="w-7"></td> 
                        <td class="text-[8px] text-left px-1 bg-red-50/30 <?php echo $hasCatatan ? 'font-black text-red-900 bg-red-100/50' : ''; ?>"><?php echo htmlspecialchars($item['keterangan']); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <?php if(!empty($order['foto_mockup'])): ?>
            <div class="mb-6 page-break-inside-avoid">
                <h3 class="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black pb-1"><svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.2 0 4-1.8 4-4 0-.54-.22-1.03-.57-1.39-.36-.37-.88-.57-1.42-.57H12c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6v1c0 .55.45 1 1 1s1-.45 1-1c0-4.42-3.58-8-8-8z"></path></svg> Lampiran Visual Mockup Desain</h3>
                <div class="flex flex-col gap-4">
                    <?php 
                    $list_cetak_foto = explode(',', $order['foto_mockup']);
                    foreach($list_cetak_foto as $ft):
                        if(empty($ft) || !file_exists('uploads/'.$ft)) continue;
                    ?>
                        <div class="border border-black p-2 bg-white rounded shadow-sm">
                            <img src="uploads/<?php echo $ft; ?>" class="w-full h-auto object-contain">
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>

        <div class="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-gray-300 text-xs page-break-inside-avoid">
            <div>
                <h4 class="font-bold uppercase mb-1 text-gray-500">Catatan Utama Produksi:</h4>
                <div class="text-gray-700 font-mono text-[10px] whitespace-pre-line leading-relaxed">
                    <?php echo !empty($order['catatan_produksi_spk']) ? nl2br(htmlspecialchars($order['catatan_produksi_spk'])) : "- Detail cetakan harus tajam\n- Pastikan obrasan jahit rapi"; ?>
                </div>
            </div>
            <div class="grid grid-cols-3 text-center border-l pl-4 border-gray-300">
                <div class="flex flex-col justify-between h-20">
                    <span class="font-bold text-gray-500">Operator</span>
                    <span class="border-b border-black mx-2 pb-1">......................</span>
                </div>
                <div class="flex flex-col justify-between h-20">
                    <span class="font-bold text-gray-500">QC</span>
                    <span class="border-b border-black mx-2 pb-1">......................</span>
                </div>
                <div class="flex flex-col justify-between h-20">
                    <span class="font-bold text-gray-500">Admin</span>
                    <span class="font-black border-b border-black mx-2 pb-1 text-purple-900 uppercase">
                        <?php echo !empty($order['dibuat_oleh']) ? htmlspecialchars($order['dibuat_oleh']) : 'Kakami'; ?>
                    </span>
                </div>
            </div>
        </div>
    </div>

    <script>
        function downloadPDF() {
            const element = document.getElementById('spk-container');
            const invoiceNo = "<?php echo $order['invoice_no']; ?>";
            
            const opt = {
                margin:       0.15,
                filename:     'SPK-' + invoiceNo + '.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        }

        function downloadJPEG() {
            const element = document.getElementById('spk-container');
            const invoiceNo = "<?php echo $order['invoice_no']; ?>";
            
            html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'SPK-' + invoiceNo + '.jpg';
                link.href = canvas.toDataURL('image/jpeg', 0.95);
                link.click();
            });
        }
    </script>
    <div class="no-print mt-8 w-full">
        <?php include 'footer.php'; ?>
    </div>
</body>
</html>