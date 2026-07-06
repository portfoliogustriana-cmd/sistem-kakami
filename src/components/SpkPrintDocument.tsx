import React, { useState } from "react";
import { X, Printer, FileText, AlertTriangle, Layers, Download } from "lucide-react";
import { Order, OrderItem } from "../lib/storage";
import brandLogo from "../assets/logo.png";
import agencyLogo from "../assets/images/agency-logo.png";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface SpkPrintDocumentProps {
  order: Order;
  allItems: OrderItem[];
  onClose: () => void;
}

export const SpkPrintDocument: React.FC<SpkPrintDocumentProps> = ({
  order,
  allItems,
  onClose,
}) => {
  const o = order;

  // Predefined custom sorting order for sizes
  const SIZE_ORDER_MAP: { [key: string]: number } = {
    'XXS ANAK': 1,
    'XS ANAK': 2,
    'S ANAK': 3,
    'M ANAK': 4,
    'L ANAK': 5,
    'XL ANAK': 6,
    '2XL ANAK': 7,
    '3XL ANAK': 8,
    '4XL ANAK': 9,
    '5XL ANAK': 10,
    'XXS': 11,
    'XS': 12,
    'S': 13,
    'M': 14,
    'L': 15,
    'XL': 16,
    'XXL': 17,
    '2XL': 17, // Treat 2XL same as XXL
    '3XL': 18,
    '4XL': 19,
    '5XL': 20,
    '6XL': 21,
    'CUSTOM': 99,
  };

  const getSizeWeight = (sizeStr: string): number => {
    const clean = (sizeStr || "").toUpperCase().trim();
    if (SIZE_ORDER_MAP[clean] !== undefined) {
      return SIZE_ORDER_MAP[clean];
    }
    if (clean === "2XL") return 17;
    if (/^\d+XL$/.test(clean)) {
      const num = parseInt(clean);
      return 15 + num; // e.g. 3XL -> 18, 4XL -> 19
    }
    if (/^\d+XL\s+ANAK$/.test(clean)) {
      const num = parseInt(clean);
      return 5 + num; // e.g. 2XL ANAK -> 7, 3XL ANAK -> 8
    }
    return 50;
  };

  const oItemsUnsorted = allItems.filter((it) => it.order_id === o.id);
  const oItems = [...oItemsUnsorted].sort((a, b) => {
    const wA = getSizeWeight(a.size);
    const wB = getSizeWeight(b.size);
    if (wA !== wB) return wA - wB;
    // secondary sort: name or player number
    return (a.nama_player || '').localeCompare(b.nama_player || '');
  });

  const sizeTotals: { [key: string]: number } = {
    'XS': 0, 'S': 0, 'M': 0, 'L': 0, 'XL': 0, 'XXL': 0, '3XL': 0, '4XL': 0, '5XL': 0,
    '2XL ANAK': 0, 'XL ANAK': 0, 'L ANAK': 0, 'M ANAK': 0, 'S ANAK': 0, 'XS ANAK': 0, 'XXS ANAK': 0,
    'CUSTOM': 0
  };
  let shortSleeve = 0;
  let longSleeve = 0;
  const alertUruts: number[] = [];

  oItems.forEach((it, index) => {
    const sz = (it.size || '').toUpperCase().trim();
    if (sizeTotals[sz] !== undefined) {
      sizeTotals[sz]++;
    } else {
      sizeTotals['CUSTOM']++;
    }

    const lgn = (it.lengan || '').toUpperCase().trim();
    if (lgn === 'PENDEK') {
      shortSleeve++;
    } else if (lgn === 'PANJANG') {
      longSleeve++;
    }

    if (it.keterangan && typeof it.keterangan === 'string' && it.keterangan.trim() !== '' && it.keterangan.trim() !== '-') {
      alertUruts.push(index + 1);
    }
  });

  const totalPcsComputed = oItems.length > 0 ? oItems.length : o.jumlah_pcs;

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    const printContent = document.getElementById("printable-spk-container");
    if (!printContent) return;

    try {
      setIsDownloading(true);

      const canvas = await html2canvas(printContent, {
        scale: 2, // High-quality resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      let page = 1;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -page * pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        page++;
      }

      pdf.save(`SPK-${o.invoice_no}.pdf`);
    } catch (err) {
      console.error("Gagal mengunduh PDF:", err);
      alert("Gagal mengunduh PDF. Coba gunakan tombol 'Cetak Printer' lalu pilih opsi 'Simpan sebagai PDF'.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-spk-container');
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((el) => el.outerHTML)
        .join('\n');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cetak SPK - ${o.invoice_no}</title>
            ${styles}
            <style>
              body { background: white !important; padding: 20mm; color: black !important; font-family: sans-serif; }
              #printable-spk-container { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; }
              .no-print { display: none !important; }
              @media print {
                @page { size: auto; margin: 10mm; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-4 sm:p-6 no-print-overlay">
      <div className="bg-white text-black w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-8 self-start my-8 border border-black flex flex-col space-y-6">
        {/* Header Controller Controls Overlay */}
        <div className="flex justify-between items-center border-b pb-4 border-black no-print">
          <div className="flex items-center gap-1.5 text-black font-extrabold text-xs uppercase">
            <span>SPK Cetakan Produksi - {o.invoice_no}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-[11px] px-4 py-2 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-sm transition-colors"
            >
              <Download size={13} />
              {isDownloading ? "Mengunduh..." : "Download PDF"}
            </button>
            <button
              onClick={handlePrint}
              className="bg-black hover:bg-black text-white font-black text-[11px] px-4 py-2 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-sm"
            >
              <Printer size={13} />
              Cetak Printer
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-black hover:text-black bg-white rounded-full"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PRINT CONTAINER ACCENT WITH SOLID BLACK BORDERS */}
        <div
          id="printable-spk-container"
          className="space-y-6 p-6 border border-black bg-white text-black font-sans leading-relaxed text-xs"
        >
          {/* LOGO & WORK ORDER LETTERHEAD */}
          <div className="flex justify-between items-center border-b-2 border-black pb-4">
            <div className="flex items-center gap-3">
              <img src={brandLogo} alt="Brand Logo" className="h-12 w-auto object-contain" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-black mt-0.5">PRODUCTION WORK ORDER</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <img src={agencyLogo} alt="Agency Logo" className="h-6 w-auto grayscale opacity-80" />
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent('SPK_INV:' + o.invoice_no)}`} alt="QR Code" className="w-14 h-14 border border-black p-0.5 bg-white" />
            </div>
          </div>

          {/* TWO-COLUMN GENERAL SPECIFICATION GRID */}
          <div className="grid grid-cols-2 gap-6 text-[11px]">
            <div className="space-y-1.5 font-bold">
              <div>
                <span className="w-28 inline-block font-medium text-black">Konsumen/Client</span>: <span className="font-extrabold text-black uppercase">{o.nama_konsumen}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-medium text-black">Nama Projek</span>: <span className="font-extrabold text-black uppercase">{o.nama_order}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-medium text-black">Tgl Order</span>: <span className="font-mono">{o.tanggal_order}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-black text-black">DEADLINE SELESAI</span>: <span className="font-mono font-black text-black bg-white px-1.5 py-0.5 border border-black rounded">{o.deadline_kerja || o.tanggal_order}</span>
              </div>
            </div>
            <div className="space-y-1.5 font-bold">
              <div>
                <span className="w-28 inline-block font-medium text-black">Bahan Utama</span>: <span className="font-extrabold text-black uppercase">{o.bahan_utama || '-'}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-medium text-black">Bahan Kerah</span>: <span className="font-extrabold text-black uppercase">{o.bahan_kerah || '-'}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-medium text-black">Bahan Celana</span>: <span className="font-extrabold text-black uppercase">{o.bahan_celana || '-'}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-medium text-black">Pola Baju/Potongan</span>: <span className="bg-white text-black border border-dashed border-black px-1.5 py-0.5 rounded font-black uppercase">{o.pola_baju || 'Standar (Set-In)'}</span>
              </div>
            </div>
          </div>

          {/* CONDITIONAL EMERGENCY REVISION NOTICES */}
          {o.catatan_darurat && (
            <div className="bg-white border-2 border-black text-black p-3 rounded-lg font-mono text-xs">
              <span className="font-black flex items-center gap-1 text-black mb-1">
                <AlertTriangle size={14} className="text-black" />
                CATATAN TAMBAHAN DARURAT / REVISI:
              </span>
              <p className="whitespace-pre-line leading-relaxed">{o.catatan_darurat}</p>
            </div>
          )}

          {/* DANGEROUS CHECKS ALERTS PANEL */}
          {alertUruts.length > 0 && (
            <div className="bg-white text-black border-2 border-black p-2.5 rounded-lg text-xs font-black tracking-wide uppercase flex items-center gap-1.5 leading-snug">
              <AlertTriangle size={15} className="text-black shrink-0" />
              <span>WAJIB CEK! Ada Catatan Khusus Pada Nomor Urut: {alertUruts.map(n => `[ No. Urut ${n} ]`).join(', ')}</span>
            </div>
          )}

          {/* REKAPITULASI SIZE TABLE GRAPH */}
          <div className="space-y-2">
            <h3 className="font-black uppercase text-[10px] tracking-wide flex items-center gap-1 text-black">
              <Layers size={13} /> Rekapitulasi Jumlah Order Per Ukuran
            </h3>
            <table className="w-full text-center border-collapse border border-black text-[9px] font-bold">
              <thead>
                <tr className="bg-white">
                  <th className="border border-black p-1">SIZE</th>
                  {Object.keys(sizeTotals).map((sz) => (
                    <th key={sz} className="border border-black p-1 text-[8px] leading-tight">
                      {sz.includes('ANAK') ? (
                        <>
                          {sz.replace(' ANAK', '')}
                          <br />
                          <span className="text-[7.2px] text-black font-black uppercase">Anak</span>
                        </>
                      ) : (
                        sz
                      )}
                    </th>
                  ))}
                  <th className="border border-black p-1 bg-black text-white w-14">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black bg-white font-black p-1 uppercase text-black">JML</td>
                  {Object.entries(sizeTotals).map(([sz, val], idx) => (
                    <td
                      key={idx}
                      className={`border border-black p-1 font-mono font-black ${val > 0 ? 'bg-white text-black font-black text-xs' : 'text-black'}`}
                    >
                      {val}
                    </td>
                  ))}
                  <td className="border border-black bg-white font-extrabold text-[10px] p-1 font-mono">{totalPcsComputed} Pcs</td>
                </tr>
              </tbody>
            </table>

            {/* SLEEVE TYPE SUMMARIES BADGES */}
            <div className="flex gap-4 text-[10px] font-black uppercase mt-2">
              <div className="bg-white border border-black px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm">
                <span>Total Lengan Pendek:</span>
                <span className="text-xs font-black text-black bg-white px-2 py-0.5 rounded border border-black font-mono">{shortSleeve} Pcs</span>
              </div>
              <div className="bg-white border border-black px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm">
                <span>Total Lengan Panjang:</span>
                <span className="text-xs font-black text-black bg-white px-2 py-0.5 rounded border border-black font-mono">{longSleeve} Pcs</span>
              </div>
            </div>
          </div>

          {/* DETAILED PLAYER ATTRIBUTE TABLE FOR JAHIT-POTONG OPERATORS */}
          <div className="space-y-2">
            <h3 className="font-black uppercase text-[10px] tracking-wide text-black">
              📋 Daftar Item Produksi
            </h3>
            {oItems.length > 0 ? (
              <table className="w-full text-center border-collapse border border-black text-[9px] font-bold">
                <thead>
                  <tr className="bg-black text-white uppercase text-[8px] tracking-tight">
                    <th className="border border-black p-1 w-6">No</th>
                    <th className="border border-black p-1 text-left px-1.5">Nama Depan</th>
                    <th className="border border-black p-1 w-10">No. Png</th>
                    <th className="border border-black p-1 text-left px-1.5">Nama Png</th>
                    <th className="border border-black p-1 w-10">Size</th>
                    <th className="border border-black p-1 w-12">Lengan</th>
                    <th className="border border-black p-1 w-7 text-[7px] leading-none">Tgn<br />Kn</th>
                    <th className="border border-black p-1 w-7 text-[7px] leading-none">Tgn<br />Kr</th>
                    <th className="border border-black p-1 w-7 text-[7px] leading-none">Cln<br />Kn</th>
                    <th className="border border-black p-1 w-7 text-[7px] leading-none">Cln<br />Kr</th>
                    <th className="border border-black p-1 w-7 text-[7px] leading-none">Bju<br />Dpn</th>
                    <th className="border border-black p-1 w-7 text-[7px] leading-none">Bju<br />Blk</th>
                    <th className="border border-black p-1 w-7 text-[7px] leading-none font-bold">Krh</th>
                    <th className="border border-black p-1 text-left px-1.5">Ket</th>
                  </tr>
                </thead>
                <tbody>
                  {oItems.map((item, index) => {
                    const isLongSleeve = (item.lengan || '').toUpperCase() === 'PANJANG';
                    const hasNotes = item.keterangan && item.keterangan.trim() !== '' && item.keterangan.trim() !== '-';

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-white ${isLongSleeve ? 'bg-white/30' : ''}`}
                      >
                        <td className={`border border-black p-1 font-mono font-black ${hasNotes ? 'bg-black text-white font-black' : ''}`}>
                          {index + 1}
                        </td>
                        <td className="border border-black p-1 text-left px-1.5 uppercase font-black text-black">{item.nama_player}</td>
                        <td className="border border-black p-1 font-mono text-center font-black text-[10px] bg-white">{item.no_player || '-'}</td>
                        <td className="border border-black p-1 text-left px-1.5 uppercase font-black text-black">{item.nama_punggung || '-'}</td>
                        <td className="border border-black p-1 text-center font-black uppercase bg-white text-black">{item.size}</td>
                        <td className="border border-black p-1 text-center font-extrabold uppercase">{item.lengan}</td>
                        {/* Operator Physical Pencil mark checklists */}
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className={`border border-black p-1 text-left px-1.5 ${hasNotes ? 'font-black text-black bg-white' : 'text-black font-medium'}`}>
                          {item.keterangan || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="border border-dashed border-black p-6 text-center text-black font-bold italic rounded">
                Daftar rincian sizing detail belum diinput di tab Produksi. SPK secara umum tetap dapat dicetak berdasarkan info jumlah pcs ({o.jumlah_pcs} Pcs) di atas.
              </div>
            )}
          </div>

          {/* SPK DESIGN VISUAL MOCKUP SECTION AT THE BOTTOM FOR QUALITY ASSISTANCE */}
          {o.foto_mockup && (
            <div className="space-y-2 page-break-inside-avoid">
              <h3 className="font-black uppercase text-[10px] tracking-wide text-black border-b border-black pb-1">
                🎨 Lampiran Visual Mockup Desain
              </h3>
              <div className="flex flex-col gap-4">
                {o.foto_mockup.startsWith('data:image') ? (
                  <div className="border border-black p-2 bg-white rounded shadow-sm text-center">
                    <img src={o.foto_mockup} alt="Mockup" className="max-h-[320px] mx-auto object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  o.foto_mockup.split(',').filter(f => f.trim() !== '').map((imgUrl, i) => (
                    <div key={i} className="border border-black p-2 bg-white rounded shadow-sm text-center">
                      <img src={imgUrl} alt={`Mockup ${i + 1}`} className="max-h-[320px] mx-auto object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CORE PRODUCTION NOTES & THREE SIGNATURE COLUMNS */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-black text-[11px] page-break-inside-avoid">
            <div>
              <h4 className="font-extrabold uppercase mb-1 text-black">Catatan Utama Produksi:</h4>
              <p className="text-black font-mono text-[9.5px] whitespace-pre-line leading-relaxed">
                {o.catatan_produksi_spk || "- Detail cetakan harus tajam\n- Pastikan obrasan jahit rapi"}
              </p>
            </div>
            <div className="grid grid-cols-3 text-center border-l pl-4 border-black">
              <div className="flex flex-col justify-between h-20">
                <span className="font-extrabold text-black">Operator</span>
                <span className="border-b border-black mx-2 pb-1">......................</span>
              </div>
              <div className="flex flex-col justify-between h-20">
                <span className="font-extrabold text-black">QC</span>
                <span className="border-b border-black mx-2 pb-1">......................</span>
              </div>
              <div className="flex flex-col justify-between h-20">
                <span className="font-extrabold text-black">Admin</span>
                <span className="font-black border-b border-black mx-2 pb-1 text-black uppercase leading-tight">
                  {o.dibuat_oleh || 'Kakami'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
