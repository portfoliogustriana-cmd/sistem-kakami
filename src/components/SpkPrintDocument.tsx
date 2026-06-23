import React from 'react';
import { X, Printer, FileText, AlertTriangle, Layers } from 'lucide-react';
import { Order, OrderItem } from '../lib/storage';

interface SpkPrintDocumentProps {
  order: Order;
  allItems: OrderItem[];
  onClose: () => void;
}

export const SpkPrintDocument: React.FC<SpkPrintDocumentProps> = ({ order, allItems, onClose }) => {
  const o = order;
  const oItems = allItems.filter((it) => it.order_id === o.id);

  // Initialize size recap matrix
  const sizeTotals: { [key: string]: number } = {
    'XS': 0, 'S': 0, 'M': 0, 'L': 0, 'XL': 0, 'XXL': 0, '3XL': 0, '4XL': 0, '5XL': 0,
    '2XL ANAK': 0, 'XL ANAK': 0, 'L ANAK': 0, 'M ANAK': 0, 'S ANAK': 0, 'XS ANAK': 0, 'XXS ANAK': 0,
    'CUSTOM': 0
  };

  let shortSleeve = 0;
  let longSleeve = 0;
  const alertUruts: number[] = [];

  oItems.forEach((it, index) => {
    const sz = it.size.toUpperCase().trim();
    if (sizeTotals[sz] !== undefined) {
      sizeTotals[sz]++;
    } else {
      sizeTotals['CUSTOM']++;
    }

    const lgn = it.lengan.toUpperCase().trim();
    if (lgn === 'PENDEK') {
      shortSleeve++;
    } else if (lgn === 'PANJANG') {
      longSleeve++;
    }

    if (it.keterangan && it.keterangan.trim() !== '' && it.keterangan.trim() !== '-') {
      alertUruts.push(index + 1);
    }
  });

  const totalPcsComputed = oItems.length > 0 ? oItems.length : o.jumlah_pcs;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-4 sm:p-6 no-print-overlay">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-8 self-start my-8 border border-slate-200 flex flex-col space-y-6">
        
        {/* Header Controller Controls Overlay */}
        <div className="flex justify-between items-center border-b pb-4 border-slate-100 no-print">
          <div className="flex items-center gap-1.5 text-slate-500 font-extrabold text-xs uppercase">
            <span>SPK Cetakan Produksi - {o.invoice_no}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] px-4 py-2 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-650/10"
            >
              <Printer size={13} /> Cetak Printer
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 bg-slate-50 rounded-full"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PRINT CONTAINER ACCENT WITH SOLID BLACK BORDERS */}
        <div id="printable-spk-container" className="space-y-6 p-6 border border-black bg-white text-black font-sans leading-relaxed text-xs">
          
          {/* LOGO & WORK ORDER LETTERHEAD */}
          <div className="flex justify-between items-center border-b-2 border-black pb-4">
            <div>
              <div className="font-extrabold text-lg text-black tracking-tight">KAKAMI APPAREL</div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-0.5">PRODUCTION WORK ORDER</p>
            </div>
            <div>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent('SPK_INV:' + o.invoice_no)}`} 
                alt="QR Code" 
                className="w-14 h-14 border border-black p-0.5 bg-white"
              />
            </div>
          </div>

          {/* TWO-COLUMN GENERAL SPECIFICATION GRID */}
          <div className="grid grid-cols-2 gap-6 text-[11px]">
            <div className="space-y-1.5 font-bold">
              <div>
                <span className="w-28 inline-block font-medium text-slate-600">Konsumen/Client</span>: <span className="font-extrabold text-black uppercase">{o.nama_konsumen}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-medium text-slate-600">Nama Projek</span>: <span className="font-extrabold text-black uppercase">{o.nama_order}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-medium text-slate-600">Tgl Order</span>: <span className="font-mono">{o.tanggal_order}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-black text-rose-600">DEADLINE SELESAI</span>: <span className="font-mono font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 border border-rose-200 rounded">{o.deadline_kerja || o.tanggal_order}</span>
              </div>
            </div>
            <div className="space-y-1.5 font-bold">
              <div>
                <span className="w-28 inline-block font-medium text-slate-600">Bahan Utama</span>: <span className="font-extrabold text-black uppercase">{o.bahan_utama || '-'}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-medium text-slate-600">Bahan Kerah</span>: <span className="font-extrabold text-black uppercase">{o.bahan_kerah || '-'}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-medium text-slate-600">Bahan Celana</span>: <span className="font-extrabold text-black uppercase">{o.bahan_celana || '-'}</span>
              </div>
              <div>
                <span className="w-28 inline-block font-medium text-slate-600">Pola Baju/Potongan</span>: <span className="bg-yellow-50 text-slate-900 border border-dashed border-amber-300 px-1.5 py-0.5 rounded font-black uppercase">{o.pola_baju || 'Standar (Set-In)'}</span>
              </div>
            </div>
          </div>

          {/* CONDITIONAL EMERGENCY REVISION NOTICES */}
          {o.catatan_darurat && (
            <div className="bg-amber-50 border-2 border-amber-500 text-amber-955 p-3 rounded-lg font-mono text-xs">
              <span className="font-black flex items-center gap-1 text-amber-900 mb-1">
                <AlertTriangle size={14} className="text-amber-600" /> CATATAN TAMBAHAN DARURAT / REVISI:
              </span>
              <p className="whitespace-pre-line leading-relaxed">{o.catatan_darurat}</p>
            </div>
          )}

          {/* DANGEROUS CHECKS ALERTS PANEL */}
          {alertUruts.length > 0 && (
            <div className="bg-red-100 text-red-900 border-2 border-red-400 p-2.5 rounded-lg text-xs font-black tracking-wide uppercase flex items-center gap-1.5 leading-snug">
              <AlertTriangle size={15} className="text-red-600 shrink-0" />
              <span>WAJIB CEK! Ada Catatan Khusen Pada Nomor Urut: {alertUruts.map(n => `[ No. Urut ${n} ]`).join(', ')}</span>
            </div>
          )}

          {/* REKAPITULASI SIZE TABLE GRAPH */}
          <div className="space-y-2">
            <h3 className="font-black uppercase text-[10px] tracking-wide flex items-center gap-1 text-slate-800">
              <Layers size={13} /> Rekapitulasi Jumlah Order Per Ukuran
            </h3>
            <table className="w-full text-center border-collapse border border-black text-[9px] font-bold">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-black p-1">SIZE</th>
                  {Object.keys(sizeTotals).map((sz) => (
                    <th key={sz} className="border border-black p-1 text-[8px] leading-tight">
                      {sz.includes('ANAK') ? (
                        <>
                          {sz.replace(' ANAK', '')}
                          <br />
                          <span className="text-[7.2px] text-blue-600 font-black uppercase">Anak</span>
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
                  <td className="border border-black bg-slate-50 font-black p-1 uppercase text-slate-500">JML</td>
                  {Object.entries(sizeTotals).map(([sz, val], idx) => (
                    <td 
                      key={idx} 
                      className={`border border-black p-1 font-mono font-black ${val > 0 ? 'bg-yellow-50 text-slate-905 font-black text-xs' : 'text-slate-300'}`}
                    >
                      {val}
                    </td>
                  ))}
                  <td className="border border-black bg-slate-100 font-extrabold text-[10px] p-1 font-mono">{totalPcsComputed} Pcs</td>
                </tr>
              </tbody>
            </table>

            {/* SLEEVE TYPE SUMMARIES BADGES */}
            <div className="flex gap-4 text-[10px] font-black uppercase mt-2">
              <div className="bg-slate-50 border border-black px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm">
                <span>Total Lengan Pendek:</span>
                <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">{shortSleeve} Pcs</span>
              </div>
              <div className="bg-slate-50 border border-black px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm">
                <span>Total Lengan Panjang:</span>
                <span className="text-xs font-black text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-mono">{longSleeve} Pcs</span>
              </div>
            </div>
          </div>

          {/* DETAILED PLAYER ATTRIBUTE TABLE FOR JAHIT-POTONG OPERATORS */}
          <div className="space-y-2">
            <h3 className="font-black uppercase text-[10px] tracking-wide text-slate-800">
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
                    const isLongSleeve = item.lengan.toUpperCase() === 'PANJANG';
                    const hasNotes = item.keterangan && item.keterangan.trim() !== '' && item.keterangan.trim() !== '-';
                    
                    return (
                      <tr 
                        key={item.id}
                        className={`hover:bg-slate-50 ${isLongSleeve ? 'bg-amber-100/30' : ''}`}
                      >
                        <td className={`border border-black p-1 font-mono font-black ${hasNotes ? 'bg-red-500 text-white font-black' : ''}`}>
                          {index + 1}
                        </td>
                        <td className="border border-black p-1 text-left px-1.5 uppercase font-black text-slate-800">{item.nama_player}</td>
                        <td className="border border-black p-1 font-mono text-center font-black text-[10px] bg-slate-50">{item.no_player || '-'}</td>
                        <td className="border border-black p-1 text-left px-1.5 uppercase font-black text-blue-900">{item.nama_punggung || '-'}</td>
                        <td className="border border-black p-1 text-center font-black uppercase bg-yellow-50 text-black">{item.size}</td>
                        <td className="border border-black p-1 text-center font-extrabold uppercase">{item.lengan}</td>
                        
                        {/* Operator Physical Pencil mark checklists */}
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>

                        <td className={`border border-black p-1 text-left px-1.5 ${hasNotes ? 'font-black text-red-900 bg-red-50' : 'text-slate-400 font-medium'}`}>
                          {item.keterangan || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="border border-dashed border-slate-300 p-6 text-center text-slate-400 font-bold italic rounded">
                Daftar rincian sizing detail belum diinput di tab Produksi. SPK secara umum tetap dapat dicetak berdasarkan info jumlah pcs ({o.jumlah_pcs} Pcs) di atas.
              </div>
            )}
          </div>

          {/* SPK DESIGN VISUAL MOCKUP SECTION AT THE BOTTOM FOR QUALITY ASSISTANCE */}
          {o.foto_mockup && (
            <div className="space-y-2 page-break-inside-avoid">
              <h3 className="font-black uppercase text-[10px] tracking-wide text-slate-805 border-b border-black pb-1">
                🎨 Lampiran Visual Mockup Desain
              </h3>
              <div className="flex flex-col gap-4">
                {o.foto_mockup.split(',').filter(f => f.trim() !== '').map((imgUrl, i) => (
                  <div key={i} className="border border-black p-2 bg-white rounded shadow-sm text-center">
                    <img 
                      src={imgUrl} 
                      alt={`Mockup ${i + 1}`} 
                      className="max-h-[320px] mx-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CORE PRODUCTION NOTES & THREE SIGNATURE COLUMNS */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-gray-300 text-[11px] page-break-inside-avoid">
            <div>
              <h4 className="font-extrabold uppercase mb-1 text-slate-500">Catatan Utama Produksi:</h4>
              <p className="text-slate-700 font-mono text-[9.5px] whitespace-pre-line leading-relaxed">
                {o.catatan_produksi_spk || "- Detail cetakan harus tajam\n- Pastikan obrasan jahit rapi"}
              </p>
            </div>
            <div className="grid grid-cols-3 text-center border-l pl-4 border-gray-300">
              <div className="flex flex-col justify-between h-20">
                <span className="font-extrabold text-slate-500">Operator</span>
                <span className="border-b border-black mx-2 pb-1">......................</span>
              </div>
              <div className="flex flex-col justify-between h-20">
                <span className="font-extrabold text-slate-500">QC</span>
                <span className="border-b border-black mx-2 pb-1">......................</span>
              </div>
              <div className="flex flex-col justify-between h-20">
                <span className="font-extrabold text-slate-500">Admin</span>
                <span className="font-black border-b border-black mx-2 pb-1 text-indigo-700 uppercase leading-tight">
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
