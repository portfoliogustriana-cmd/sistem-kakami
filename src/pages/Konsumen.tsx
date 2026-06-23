import React, { useState, useEffect } from 'react';
import { Users, Phone, ArrowUpRight, Award, Search, Calendar, ShoppingBag, X, MessageSquare, ExternalLink } from 'lucide-react';
import { getStoredData, Order, saveStoredData } from '../lib/storage';

interface CustomerSummary {
  nama: string;
  telepon: string;
  totalOrder: number;
  totalPcs: number;
  totalBelanja: number;
  tier: 'GOLD VIP' | 'SILVER' | 'REGULAR';
}

const Konsumen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCust, setSelectedCust] = useState<CustomerSummary | null>(null);

  useEffect(() => {
    const data = getStoredData();
    setOrders(data.orders);
  }, []);

  // Compute unique customer aggregates
  const customerMap: { [key: string]: { nama: string; telepon: string; totalOrder: number; totalPcs: number; totalBelanja: number } } = {};
  orders.forEach((o) => {
    const name = o.nama_konsumen.trim();
    if (!customerMap[name]) {
      customerMap[name] = {
        nama: name,
        telepon: o.no_telepon || '',
        totalOrder: 0,
        totalPcs: 0,
        totalBelanja: 0,
      };
    }
    customerMap[name].totalOrder += 1;
    customerMap[name].totalPcs += o.jumlah_pcs;
    customerMap[name].totalBelanja += o.total_harga;

    // Persist latest phone if missing
    if (!customerMap[name].telepon && o.no_telepon) {
      customerMap[name].telepon = o.no_telepon;
    }
  });

  const customerList: CustomerSummary[] = Object.values(customerMap).map((c) => {
    let tier: 'GOLD VIP' | 'SILVER' | 'REGULAR' = 'REGULAR';
    if (c.totalPcs >= 500) {
      tier = 'GOLD VIP';
    } else if (c.totalPcs >= 100) {
      tier = 'SILVER';
    }
    return {
      ...c,
      tier,
    };
  });

  // Sort customer list by loyalty / total pieces ordered descending (just like PHP's default loyalty ordering model)
  const sortedCustomers = customerList.sort((a, b) => b.totalPcs - a.totalPcs);

  // Filter based on search input
  const filteredCustomers = sortedCustomers.filter(
    (c) => c.nama.toLowerCase().includes(search.toLowerCase()) || c.telepon.includes(search)
  );

  // Filter orders of selected customer
  const custOrders = selectedCust ? orders.filter((o) => o.nama_konsumen.trim() === selectedCust.nama) : [];

  const formatWAUrl = (tel: string) => {
    let raw = tel.trim();
    if (raw.startsWith('0')) {
      raw = '62' + raw.substring(1);
    }
    return `https://wa.me/${raw}`;
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex-grow flex flex-col gap-6 relative">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 w-full">
        <div>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-650 dark:text-indigo-400" /> Database Klien & CRM
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Kelola data profil pelanggan, volume kontribusi order, dan status keanggotaan.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 text-[10px] bg-slate-900 dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-black/10">
          <Award className="w-3.5 h-3.5 text-amber-400" /> Urutan Tingkat Loyalitas (Volume Termutakhir)
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-3.5 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 pl-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cek cepat nama konsumen atau nomor handphone..."
          className="w-full bg-transparent border-none text-xs outline-none focus:ring-0 font-bold placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-200"
        />
      </div>

      {/* Database Table layout */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 dark:bg-slate-900 text-white text-xs uppercase tracking-widest text-center border-b border-transparent">
                <th className="p-4 w-16 font-semibold rounded-tl-lg">No</th>
                <th className="p-4 text-left font-semibold">Nama Konsumen</th>
                <th className="p-4 w-48 font-semibold">No. Telepon WA</th>
                <th className="p-4 w-40 font-semibold">Status / Tier</th>
                <th className="p-4 w-36 font-semibold">Kerap Kunjungan</th>
                <th className="p-4 w-40 font-semibold animate-pulse-slow">Total Volume</th>
                <th className="p-4 w-28 font-semibold rounded-tr-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-705">
              {filteredCustomers.map((cust, i) => (
                <tr key={cust.nama} className="hover:bg-slate-50 dark:hover:bg-slate-80/50 transition-colors duration-200 text-center group">
                  <td className="p-4 font-mono text-xs text-slate-400 dark:text-slate-500">{i + 1}</td>
                  <td className="p-4 text-left font-black text-slate-900 dark:text-white uppercase text-xs">
                    <button
                      onClick={() => setSelectedCust(cust)}
                      className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                    >
                      {cust.nama}
                    </button>
                  </td>
                  <td className="p-4 font-mono text-xs">
                    {cust.telepon ? (
                      <div className="flex justify-center items-center gap-2">
                        <span className="text-slate-650 dark:text-slate-300 font-bold">{cust.telepon}</span>
                        <a
                          href={formatWAUrl(cust.telepon)}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800 px-2 py-0.5 rounded-md hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all font-sans font-black tracking-wider text-[8.5px]"
                        >
                          WA
                        </a>
                      </div>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 italic font-semibold">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {cust.tier === 'GOLD VIP' && (
                      <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase inline-flex items-center gap-1 shadow-sm">
                        <Award size={12} className="text-amber-500" /> GOLD VIP
                      </span>
                    )}
                    {cust.tier === 'SILVER' && (
                      <span className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase inline-flex items-center gap-1 shadow-sm">
                        <Award size={12} className="text-slate-400" /> SILVER
                      </span>
                    )}
                    {cust.tier === 'REGULAR' && (
                      <span className="text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase">
                        REGULAR
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center font-extrabold text-slate-700 dark:text-slate-300 text-xs">{cust.totalOrder}x Order</td>
                  <td className="p-4 text-center">
                    <div className="bg-slate-50 dark:bg-slate-755 border border-slate-200/50 dark:border-slate-700 rounded-xl px-3 py-1 inline-block min-w-[90px] shadow-sm font-black text-slate-850 dark:text-white">
                      {cust.totalPcs.toLocaleString('id-ID')} <span className="text-[10px] font-bold text-slate-400">Pcs</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedCust(cust)}
                      className="bg-slate-950 dark:bg-slate-750 hover:bg-slate-850 dark:hover:bg-slate-650 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:-translate-y-0.5 shadow-md shadow-black/10"
                    >
                      Riwayat
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-450 dark:text-slate-500 font-medium italic">
                    Belum ada data konsumen terekam atau tidak ada hasil pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer Modal (React SPA Luxury View!) */}
      {selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full p-6 sm:p-8 shadow-2xl flex flex-col gap-6 overflow-y-auto duration-300 animate-in slide-in-from-right-16">
            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-505 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/20">
                  {selectedCust.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedCust.nama}</h3>
                  <p className="text-xs text-slate-400 font-medium tracking-wide">Analitik Detail Sejarah Pembelian</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCust(null)}
                className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Loyalty Summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Total Belanja (Gross)</span>
                <span className="text-lg font-mono font-black text-slate-900 dark:text-white">Rp {selectedCust.totalBelanja.toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Frekuensi Order</span>
                <span className="text-lg font-mono font-black text-slate-900 dark:text-white">{selectedCust.totalOrder} <span className="text-xs font-semibold text-slate-400">Kali</span></span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Kumulatif Volume</span>
                <span className="text-lg font-mono font-black text-indigo-600 dark:text-indigo-400">{selectedCust.totalPcs} <span className="text-xs font-semibold text-slate-400">Pcs</span></span>
              </div>
            </div>

            {/* Actions Panel */}
            {selectedCust.telepon && (
              <div className="bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/60 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-450 uppercase mb-0.5 flex items-center gap-1.5">
                    <MessageSquare size={14} /> Hubungi Lewat WhatsApp
                  </h4>
                  <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">Terhubung langsung ke Chat WA resmi pelanggan.</p>
                </div>
                <a
                  href={formatWAUrl(selectedCust.telepon)}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1 shadow-md shadow-emerald-605/20 transition-all active:scale-95"
                >
                  Buka Chat <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* List of Orders History */}
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 border-b pb-1.5 border-slate-100 dark:border-slate-800">
                Laporan Antrean Order ({custOrders.length} Nota)
              </h4>
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {custOrders.map((o) => (
                  <div key={o.id} className="p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase font-mono">{o.invoice_no}</div>
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase mt-0.5">{o.nama_order}</h5>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase ${o.status_bayar === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {o.status_bayar}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-150/40 dark:border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-semibold">Tgl Order:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-350">{o.tanggal_order}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Volume Pcs:</span>
                        <span className="font-extrabold text-slate-750 dark:text-slate-300">{o.jumlah_pcs} Pcs</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Status Tahap:</span>
                        <span className="font-black text-blue-600 dark:text-blue-450 uppercase">{o.status_tracking || 'DP'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Total Invoice:</span>
                        <span className="font-black text-slate-800 dark:text-slate-200 font-mono">Rp {o.total_harga.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Konsumen;
