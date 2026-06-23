<?php 
include 'koneksi.php'; 

$id = (int)$_GET['id'];
$query = mysqli_query($koneksi, "SELECT * FROM orders WHERE id='$id'");
$r = mysqli_fetch_assoc($query);

if (!$r) {
    die("<div class='p-8 text-center text-red-650 font-bold'>Data orderan tidak ditemukan!</div>");
}

$sisa = $r['total_harga'] - $r['dp'];
$is_lunas = ($r['status_bayar'] === 'Lunas' || $sisa <= 0);

// Helper function untuk format tanggal Indonesia
function formatTanggalIndo4($tanggal) {
    if (empty($tanggal)) return '-';
    $bulan_array = [
        1 => 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    $split = explode('-', $tanggal);
    if (count($split) === 3) {
        return $split[2] . ' ' . $bulan_array[(int)$split[1]] . ' ' . $split[0];
    }
    return $tanggal;
}

// Function terbilang rupiah untuk Indonesia
function terbilangKecil($nilai) {
    $nilai = abs((float)$nilai);
    $huruf = array("", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas");
    $temp = "";
    if ($nilai < 12) {
        $temp = " " . $huruf[$nilai];
    } else if ($nilai < 20) {
        $temp = terbilangKecil($nilai - 10). " Belas";
    } else if ($nilai < 100) {
        $temp = terbilangKecil((int)($nilai/10))." Puluh". terbilangKecil($nilai % 10);
    } else if ($nilai < 200) {
        $temp = " Seratus" . terbilangKecil($nilai - 100);
    } else if ($nilai < 1000) {
        $temp = terbilangKecil((int)($nilai/100)) . " Ratus" . terbilangKecil($nilai % 100);
    } else if ($nilai < 2000) {
        $temp = " Seribu" . terbilangKecil($nilai - 1000);
    } else if ($nilai < 1000000) {
        $temp = terbilangKecil((int)($nilai/1000)) . " Ribu" . terbilangKecil($nilai % 1000);
    } else if ($nilai < 1000000000) {
        $temp = terbilangKecil((int)($nilai/1000000)) . " Juta" . terbilangKecil($nilai % 1000000);
    } else if ($nilai < 1000000000000) {
        $temp = terbilangKecil((int)($nilai/1000000000)) . " Milyar" . terbilangKecil(fmod($nilai, 1000000000));
    }
    return trim($temp);
}

// Parser untuk uraian spesifikasi pesanan / tambahan surcharge dari kalkulator
function parseDetailPesananKecil($text) {
    if (empty($text)) {
        return ['general' => '-', 'variations' => [], 'summary' => []];
    }
    
    $general = "";
    $variations = [];
    $summary = [];
    
    if (strpos($text, '*Rincian Variasi Harga:*') !== false) {
        $parts = explode('*Rincian Variasi Harga:*', $text);
        $general = trim($parts[0]);
        $rincian_block = trim($parts[1]);
        
        $subparts = explode('========================', $rincian_block);
        $rincian_body = trim($subparts[0]);
        if (isset($subparts[1])) {
            $general .= "\n" . trim($subparts[1]);
        }
        
        $lines = explode("\n", $rincian_body);
        $in_summary = false;
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            if (strpos($line, '---') !== false) {
                $in_summary = true;
                continue;
            }
            
            if ($in_summary) {
                $summary[] = $line;
            } else {
                if (strpos($line, '-') === 0) {
                    $variations[] = ltrim($line, '- ');
                } else {
                    $variations[] = $line;
                }
            }
        }
    } else {
        $general = $text;
    }
    
    return [
        'general' => trim($general),
        'variations' => $variations,
        'summary' => $summary
    ];
}

$parsed_details = parseDetailPesananKecil($r['detail_pesanan']);

// Extract base price info from the generated spec details if it exists
// e.g. "Harga Dasar: Rp 100.000/pcs"
$base_price_info = 0;
if (preg_match('/Harga Dasar:\s*Rp\s*([\d\.]+)/i', $r['detail_pesanan'], $base_match)) {
    $base_price_info = (int)str_replace('.', '', $base_match[1]);
}

$variations_list = [];
$total_surcharge_info = 0;
if (!empty($parsed_details['variations'])) {
    foreach ($parsed_details['variations'] as $v) {
        if (preg_match('/^(.*?):\s*(\d+)\s*pcs\s*x\s*Rp\s*([\d\.]+)\s*=\s*Rp\s*([\d\.]+)/i', trim($v), $matches)) {
            $var_name = trim($matches[1]);
            $qty = (int)$matches[2];
            $unit_price = (int)str_replace('.', '', $matches[3]);
            $subtotal = (int)str_replace('.', '', $matches[4]);
            $variations_list[] = [
                'name' => $var_name,
                'qty' => $qty,
                'unit_price' => $unit_price,
                'subtotal' => $subtotal
            ];
            $total_surcharge_info += $subtotal;
        } else {
            if (preg_match('/= Rp\s*([\d\.]+)/', $v, $match)) {
                $subtotal = (int)str_replace('.', '', $match[1]);
                $total_surcharge_info += $subtotal;
                $variations_list[] = [
                    'name' => trim($v),
                    'qty' => 0,
                    'unit_price' => 0,
                    'subtotal' => $subtotal
                ];
            }
        }
    }
}

// Fallback if base_price_info not found in comments, compute it from final unit price and total surcharge average
if ($base_price_info <= 0) {
    $base_price_info = $r['harga_satuan'] - ($total_surcharge_info / ($r['jumlah_pcs'] > 0 ? $r['jumlah_pcs'] : 1));
}

// Split-pricing calculation logic to generate perfectly categorized row lines
$total_pcs = $r['jumlah_pcs'];
$base_price = $base_price_info;

$lines_to_render = [];
$assigned_pcs = 0;

foreach ($variations_list as $var) {
    if ($var['qty'] > 0) {
        $var_qty = $var['qty'];
        // Prevent assigned pcs from exceeding total_pcs
        if ($assigned_pcs + $var_qty > $total_pcs) {
            $var_qty = $total_pcs - $assigned_pcs;
        }
        
        if ($var_qty > 0) {
            $full_unit_price = $base_price + $var['unit_price'];
            $jenis_p = !empty($r['jenis_produk']) ? trim($r['jenis_produk']) : 'Jersey';
            $lines_to_render[] = [
                'name' => $jenis_p . ' Custom (' . $var['name'] . ')',
                'qty' => $var_qty,
                'price' => $full_unit_price,
                'subtotal' => $var_qty * $full_unit_price
            ];
            $assigned_pcs += $var_qty;
        }
    } else {
        // Flat surcharge (e.g., flat design fee/surcharge)
        $lines_to_render[] = [
            'name' => 'Tambahan: ' . $var['name'],
            'qty' => 0,
            'price' => 0,
            'subtotal' => $var['subtotal']
        ];
    }
}

// Leftover quantities are considered standard pricing
$remaining_pcs = $total_pcs - $assigned_pcs;
if ($remaining_pcs > 0) {
    array_unshift($lines_to_render, [
        'name' => $r['nama_order'] . ' (Pola Standar)',
        'qty' => $remaining_pcs,
        'price' => $base_price,
        'subtotal' => $remaining_pcs * $base_price
    ]);
} else if (empty($lines_to_render)) {
    $lines_to_render[] = [
        'name' => $r['nama_order'] . ' (Pola Standar)',
        'qty' => $total_pcs,
        'price' => $base_price,
        'subtotal' => $total_pcs * $base_price
    ];
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nota_Kecil_<?php echo $r['invoice_no']; ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;950&family=JetBrains+Mono:wght@400;500;750;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #0f172a; /* Slate dark modern desktop background */
        }
        .font-mono-custom {
            font-family: 'JetBrains Mono', monospace;
        }
        
        /* Realistic Continuous Pinfeed styling */
        .pinfeed-hole {
            width: 10px;
            height: 10px;
            border-radius: 9999px;
            background-color: #0f172a;
            border: 1.5px solid #cbd5e1;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.15);
        }

        /* Screen Scalable zoom container for perfect design */
        #zoom-wrapper {
            transform-origin: top center;
            transition: transform 0.15s ease-out;
        }

        /* DESIGNED SPECIFICALLY FOR LANDSCAPE WIDESCREEN / A5 LANDSCAPE (210mm x 148mm) */
        @media print {
            @page {
                size: 105mm 148mm; /* exactly 10.5 x 14.8 cm */
                margin: 0;
            }
            body {
                background: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .no-print {
                display: none !important;
            }
            /* Clean up parent block element during printing to prevent flex gaps or blank sheet issues */
            .w-full.flex.justify-center.overflow-x-auto {
                display: block !important;
                width: auto !important;
                height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
            }
            #zoom-wrapper {
                transform: scale(1) !important;
                width: 105mm !important;
                height: 148mm !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
            }
            #receipt-container {
                width: 105mm !important;
                height: 148mm !important;
                box-shadow: none !important;
                border: 1px solid #475569 !important;
                border-radius: 0 !important;
                padding: 4mm 5mm !important;
                margin: 0 !important;
                background-color: #ffffff !important;
                box-sizing: border-box !important;
            }
            .pinfeed-strip, .pinfeed-hole {
                display: none !important;
            }
            .print-dark-text {
                color: #000000 !important;
            }
            .print-border-black {
                border-color: #000000 !important;
            }
            .bg-slate-900 {
                background-color: #1e293b !important;
            }
            .text-white {
                color: #ffffff !important;
            }
        }
    </style>
</head>
<body class="p-4 sm:p-6 antialiased text-slate-800 min-h-screen flex flex-col items-center">

    <!-- CONTROL NAVIGATION PANEL (HIDDEN WHEN PRINTED) -->
    <div id="utility_panel" class="max-w-xl mx-auto mb-5 no-print flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <a href="order.php" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all transform active:scale-95 flex items-center gap-1">
            ← Kembali
        </a>
        <div class="flex flex-wrap gap-1.5 justify-end w-full sm:w-auto">
            <button onclick="window.print()" class="bg-indigo-650 hover:bg-indigo-650 text-white px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all transform active:scale-95 flex items-center gap-1 shadow-md">
                🖨️ Print / PDF
            </button>
            <button onclick="downloadJPEG()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all transform active:scale-95 flex items-center gap-1 shadow-md">
                🖼️ WhatsApp Share (JPG)
            </button>
        </div>
    </div>

    <!-- MAIN EXQUISITE SCALABLE MEMO RECEIPT VIEWPORT -->
    <div class="w-full flex justify-center overflow-x-auto py-2">
        <!-- Scale Wrapper to present neat 10.5 x 14.8 cm form factor (396px x 558px approx) -->
        <div id="zoom-wrapper" class="w-[396px] h-[558px] min-w-[396px] mx-auto">
            
            <!-- EXCITING 2-PLY-LIKE CONVECTIVE APPAREL MEMO CANVAS -->
            <div id="receipt-container" class="w-full h-full bg-white border border-slate-300 rounded-xl shadow-2xl relative p-4 flex flex-col justify-between overflow-hidden">
                
                <!-- TOP HEADER ACCENT LINES -->
                <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-indigo-650 to-emerald-500"></div>



                <div class="space-y-2 flex-1 flex flex-col">
                    
                    <!-- BRAND LOGO & CORE INFO HEADER -->
                    <div class="flex justify-between items-start border-b border-dashed border-slate-200 pb-1.5">
                        <div>
                            <img src="logo.png" alt="Client Logo" class="h-6 w-auto mb-1" />
                            <p class="text-[7px] font-black uppercase tracking-wider text-slate-500 mt-0.5">Premium Sportswear & Jersey Custom</p>
                            <p class="text-[7px] text-slate-400 mt-0.5 leading-none">Jl. Pajajaran No. 24, Bdg | WA: +62 821-2345-6789</p>
                        </div>
                        <div class="text-right">
                            <span class="text-[9px] font-mono-custom font-black text-rose-600 bg-rose-50 border border-rose-100 px-1 py-0.5 rounded uppercase block tracking-tight leading-none">
                                <?php echo $r['invoice_no']; ?>
                            </span>
                            <span class="text-[7px] text-slate-400 block font-bold uppercase mt-1">NOTA KONTAN / PRODUKSI</span>
                        </div>
                    </div>

                    <!-- CUSTOMER & INVOICE SECONDARY INFOS -->
                    <div class="grid grid-cols-2 gap-2 text-[8.5px] bg-slate-50 border border-slate-150 p-2 rounded-md leading-tight">
                        <div class="space-y-0.5">
                            <span class="text-[6.5px] font-extrabold text-slate-400 uppercase tracking-wider block">KLIEN:</span>
                            <div class="font-black text-slate-900 uppercase">👤 <?php echo htmlspecialchars($r['nama_konsumen']); ?></div>
                            <?php if(!empty($r['no_telepon'])): ?>
                                <div class="font-bold text-slate-600">📞 <?php echo htmlspecialchars($r['no_telepon']); ?></div>
                            <?php endif; ?>
                        </div>
                        <div class="space-y-0.5 text-right border-l border-dashed border-slate-200 pl-2">
                            <span class="text-[6.5px] font-extrabold text-slate-400 uppercase tracking-wider block">WAKTU & STATUS:</span>
                            <div class="font-bold text-slate-700">Tgl: <?php echo formatTanggalIndo4($r['tanggal_order']); ?></div>
                            <div class="pt-0.5">
                                <?php if($is_lunas): ?>
                                    <span class="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded-full font-black text-[6.5px] tracking-wider uppercase">LUNAS ✓</span>
                                <?php else: ?>
                                    <span class="bg-amber-100 text-amber-800 px-1 py-0.5 rounded-full font-black text-[6.5px] tracking-wider uppercase">PIUTANG-DP</span>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>

                    <!-- ORDER TABLE (MAIN PRODUCT & VARIATIONS SPLIT) -->
                    <div class="overflow-hidden border border-slate-200 rounded-md bg-white">
                        <table class="w-full text-[8.5px] leading-tight">
                            <thead>
                                <tr class="bg-slate-900 text-white font-black uppercase text-[6.5px] tracking-wider">
                                    <th class="p-1 px-1.5 text-left">Uraian Order Apparel</th>
                                    <th class="p-1 px-1 text-center w-[35px]">Qty</th>
                                    <th class="p-1 px-1 text-right w-[65px]">Harga</th>
                                    <th class="p-1 px-1.5 text-right w-[75px]">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                                <?php foreach ($lines_to_render as $line): ?>
                                <tr class="hover:bg-slate-50/50 <?php echo $line['qty'] == 0 ? 'bg-slate-50/40 text-slate-500' : ''; ?>">
                                    <td class="p-1 px-1.5 font-black text-slate-900 leading-none">
                                        <?php echo htmlspecialchars($line['name']); ?>
                                        <?php if ($line['qty'] > 0 && strpos($line['name'], 'Pola Standar') !== false): ?>
                                            <span class="block text-[6.5px] font-sans font-bold text-slate-400 uppercase mt-0.5">Custom Sublimation</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="p-1 px-1 text-center font-bold text-slate-800 font-mono-custom">
                                        <?php echo $line['qty'] > 0 ? $line['qty'] . ' pcs' : '-'; ?>
                                    </td>
                                    <td class="p-1 px-1 text-right text-slate-600 font-mono-custom">
                                        <?php echo $line['price'] > 0 ? 'Rp ' . number_format($line['price'], 0, ',', '.') : '-'; ?>
                                    </td>
                                    <td class="p-1 px-1.5 text-right font-black text-slate-950 font-mono-custom">
                                        Rp <?php echo number_format($line['subtotal'], 0, ',', '.'); ?>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- DESIGN POLA / SPEC NOTES -->
                    <?php if (!empty($parsed_details['general']) && $parsed_details['general'] !== '-'): ?>
                        <div class="bg-slate-50/70 border border-slate-200 p-1 rounded-md text-[7px] leading-tight">
                            <span class="text-[6px] font-black text-slate-400 block uppercase px-1">Spesifikasi:</span>
                            <p class="text-slate-650 italic font-medium whitespace-pre-line px-1"><?php echo htmlspecialchars($parsed_details['general']); ?></p>
                        </div>
                    <?php endif; ?>

                </div>

                <!-- LOWER PORTION: BILLING CARD & SIGN-OFFS -->
                <div class="space-y-2 pt-2 border-t border-dashed border-slate-200">
                    
                    <!-- EXQUISITE LED CARD STATS -->
                    <div class="grid grid-cols-2 gap-2 items-center">
                        <!-- Left signatures -->
                        <div class="grid grid-cols-2 text-center text-[7px] text-slate-500 gap-1 mt-0.5">
                            <div class="flex flex-col justify-between h-12">
                                <span class="text-[6.5px] font-black uppercase text-slate-400">Klien</span>
                                <div class="mx-0.5 border-b border-slate-300 pb-0.5 font-bold text-slate-700 uppercase leading-none">
                                    <?php echo html_escape_kecil($r['nama_konsumen']); ?>
                                </div>
                            </div>
                            <div class="flex flex-col justify-between h-12">
                                <span class="text-[6.5px] font-black uppercase text-slate-400">Kasir</span>
                                <div class="mx-0.5 border-b border-slate-300 pb-0.5 font-black text-indigo-705 uppercase leading-none">
                                    Admin
                                </div>
                            </div>
                        </div>

                        <!-- Right values billing tally block -->
                        <div class="space-y-0.5 text-[8.5px] font-mono-custom font-medium leading-none pl-2 border-l border-slate-100">
                            <div class="flex justify-between">
                                <span class="text-slate-450 text-[7.5px]">Bruto</span>
                                <span class="font-bold text-slate-650">Rp <?php echo number_format($raw_base = $r['jumlah_pcs'] * $base_price_info, 0, ',', '.'); ?></span>
                            </div>
                            <?php if ($total_surcharge_info > 0): ?>
                                <div class="flex justify-between text-indigo-600">
                                    <span class="text-slate-455 text-[7.5px]">+ Surch.</span>
                                    <span class="font-bold">+Rp <?php echo number_format($total_surcharge_info, 0, ',', '.'); ?></span>
                                </div>
                            <?php endif; ?>
                            <?php if ($r['diskon'] > 0): ?>
                                <div class="flex justify-between text-red-650">
                                    <span class="text-slate-455 text-[7.5px]">- Disc</span>
                                    <span class="font-bold">-Rp <?php echo number_format($r['diskon'], 0, ',', '.'); ?></span>
                                </div>
                            <?php endif; ?>
                            <div class="flex justify-between font-sans font-black text-[9.5px] text-slate-900 border-t border-slate-200 pt-1 pb-1">
                                <span>NET TOTAL:</span>
                                <span>Rp <?php echo number_format($r['total_harga'], 0, ',', '.'); ?></span>
                            </div>
                            <div class="flex justify-between text-emerald-600 text-[8.5px]">
                                <span class="text-slate-405 text-[7.5px]">DP Masuk</span>
                                <span class="font-black">Rp <?php echo number_format($r['dp'], 0, ',', '.'); ?></span>
                            </div>
                            <div class="flex justify-between bg-slate-100 p-1 rounded font-sans font-black text-[9.5px] items-center text-rose-700 border border-slate-200 mt-1 leading-none">
                                <span class="text-[6.5px] uppercase tracking-wider text-slate-500">Sisa:</span>
                                <span><?php echo $sisa <= 0 ? 'LUNAS ✓' : 'Rp '.number_format($sisa, 0, ',', '.'); ?></span>
                            </div>
                        </div>                 </div>
                    </div>

                    <!-- FOOTER & QR VALIDATION CODA -->
                    <div class="flex items-center justify-between text-[7px] text-slate-400 border-t border-slate-150 pt-1 pb-0.5">
                        <div class="leading-tight">
                            <span class="font-black text-slate-500 block uppercase text-[7.2px]">SYARAT & KREDIT</span>
                            <span>Barang dicetak sesuai order. Komplain reject dilayani max 3 hari.</span>
                        </div>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=<?php echo urlencode('INV:'.$r['invoice_no'].':TOTAL:'.$r['total_harga']); ?>" class="w-6 h-6 rounded border border-slate-200 p-0.2 bg-white">
                    </div>

                    <!-- MINIMALIST TERBILANG CENTRED AT THE VERY BOTTOM -->
                    <div class="text-center text-[7.5px] leading-tight text-slate-400 mt-0.5">
                        Terbilang: <span class="font-black italic text-slate-700">"* <?php echo terbilangKecil($r['total_harga']); ?> Rupiah *"</span>
                    </div>

                </div>

            </div> <!-- /EXQUISITE MEMO receipt-container -->
            
        </div>
    </div>

    <!-- REUSABILITY IN-FILE ESCAPE BYPASS -->
    <?php
    function html_escape_kecil($val) {
        return htmlspecialchars($val);
    }
    ?>

    <!-- INTERTACTIVE ZOOM RATIO SCRIPT -->
    <script>
        let currentZoomFactor = 1.0;
        const zoomWrapper = document.getElementById('zoom-wrapper');

        function changeZoom(val) {
            currentZoomFactor = Math.min(Math.max(currentZoomFactor + val, 0.4), 1.8);
            document.getElementById('zoom-label').innerText = Math.round(currentZoomFactor * 100) + '%';
            zoomWrapper.style.transform = `scale(${currentZoomFactor})`;
        }

        // Auto-scale to fill narrow viewports perfectly on smartphone or tablet preview browsers
        window.addEventListener('DOMContentLoaded', () => {
            const viewportWidth = window.innerWidth;
            if (viewportWidth < 420) {
                currentZoomFactor = (viewportWidth / 400);
                if (currentZoomFactor < 0.3) currentZoomFactor = 0.3;
                zoomWrapper.style.transform = `scale(${currentZoomFactor})`;
                document.getElementById('zoom-label').innerText = Math.round(currentZoomFactor * 100) + '%';
            }
        });

        // High resolution snapshot jpeg generation for WhatsApp integration sharing
        function downloadJPEG() {
            const element = document.getElementById('receipt-container');
            const invoiceNo = "<?php echo str_replace('/', '-', $r['invoice_no']); ?>";
            
            html2canvas(element, { scale: 3, useCORS: true }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'Nota_Kecil_' + invoiceNo + '.jpg';
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
