import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ShoppingBag, Eye, CheckCircle2, ShieldAlert, AlertTriangle, Play, RefreshCw, X, Printer, Search, Settings, ArrowDownLeft, ArrowUpRight, Sparkles, MapPin, SearchCheck } from 'lucide-react';
import { getStoredData, saveStoredData, Order, OrderItem } from '../lib/storage';
import { SpkPrintDocument } from '../components/SpkPrintDocument';

const Tracking = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [bulan, setBulan] = useState('2026-06');
  const [statusAktif, setStatusAktif] = useState<string>(''); // For filtering

  // Editing States
  const [editingNotes, setEditingNotes] = useState<{ [key: number]: string }>({});
  const [editingStatuses, setEditingStatuses] = useState<{ [key: number]: Order['status_tracking'] }>({});

  // SPK Print modal integration
  const [spkPrintObj, setSpkPrintObj] = useState<Order | null>(null);

  const trackingStages: { id: Order['status_tracking']; name: string; percent: number; color: string; desc: string }[] = [
    { id: 'DP', name: 'DP / Masuk', percent: 20, color: 'from-slate-400 to-slate-550', desc: 'Down Payment diterima' },
    { id: 'Produksi', name: 'Produksi', percent: 40, color: 'from-blue-400 to-indigo-500', desc: 'Proses potong & sablon' },
    { id: 'Jait', name: 'Jait', percent: 60, color: 'from-purple-400 to-fuchsia-500', desc: 'Penjahitan kain & pemasangan rib' },
    { id: 'Checking', name: 'Checking', percent: 80, color: 'from-amber-400 to-orange-500', desc: 'Quality control & packing' },
    { id: 'Selesai', name: 'Selesai', percent: 100, color: 'from-emerald-400 to-teal-500', desc: 'Tuntas & siap kirim' }
  ];

  useEffect(() => {
    const data = getStoredData();
    setOrders(data.orders);
    setOrderItems(data.orderItems);

    // Initializing state maps
    const notesMap: { [key: number]: string } = {};
    const statusMap: { [key: number]: Order['status_tracking'] } = {};
    data.orders.forEach((o) => {
      notesMap[o.id] = o.kendala_produksi || '';
      statusMap[o.id] = o.status_tracking || 'DP';
    });
    setEditingNotes(notesMap);
    setEditingStatuses(statusMap);
  }, []);

  // Recalculate monthly aggregates for visual buttons
  const monthlyOrders = orders.filter((o) => o.tanggal_order.startsWith(bulan));

  const status_counts = {
    DP: 0,
    Produksi: 0,
    Jait: 0,
    Checking: 0,
    Selesai: 0,
  };

  monthlyOrders.forEach((o) => {
    const s = o.status_tracking || 'DP';
    if (s in status_counts) {
      status_counts[s as keyof typeof status_counts]++;
    }
  });

  // Action update handler (Saves status & obstacle description)
  const handleUpdateItem = (orderId: number) => {
    const targetStatus = editingStatuses[orderId] || 'DP';
    const targetNote = editingNotes[orderId] || '';

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status_tracking: targetStatus,
          kendala_produksi: targetNote,
          last_updated_status: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return o;
    });

    setOrders(updated);
    const stored = getStoredData();
    saveStoredData(updated, stored.orderItems, stored.transactions);
    alert('Informasi tahap tracking & kendala produksi berhasil disimpan!');
  };

  const handleFieldChange = (orderId: number, field: 'status' | 'note', val: string) => {
    if (field === 'status') {
      setEditingStatuses({
        ...editingStatuses,
        [orderId]: val as Order['status_tracking'],
      });
    } else {
      setEditingNotes({
        ...editingNotes,
        [orderId]: val,
      });
    }
  };

  // Filter current active table dataset
  let tableData = monthlyOrders;
  if (statusAktif) {
    tableData = tableData.filter((o) => (o.status_tracking || 'DP') === statusAktif);
  }
  tableData.sort((a, b) => b.id - a.id); // DESC like PHP Model

  // Helper calculation for SLA dates
  const calculateSLA = (o: Order) => {
    const deadline = o.deadline_kerja || o.tanggal_order;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      days: diffDays,
      dateFormatted: new Date(deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex-grow flex flex-col gap-6">

      {/* GLASSMORPHISM HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 w-full">
        <div>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-indigo-650 dark:text-indigo-400" /> Monitor Produksi (Tracking)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Pantau pergerakan pesanan jersey & sandang secara real-time berdasarkan SLA pekerjaan.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-705 shadow-inner">
          <label className="font-extrabold text-[10px] text-slate-400 pl-2 uppercase tracking-wider">Periode Bulan:</label>
          <input
            type="month"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-3 py-1.5 rounded-xl border-none outline-none text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
          />
        </div>
      </div>

      {/* FILTER STATUS VISUAL BLOCKS */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-widest flex items-center gap-1.5">
            <SearchCheck size={13} /> Filter Status Visual
          </h3>
          {statusAktif && (
            <button
              onClick={() => setStatusAktif('')}
              className="text-[9px] bg-rose-50 text-rose-600 border border-rose-200 px-3.5 py-1.5 rounded-full hover:bg-rose-650 hover:text-white transition-all font-black uppercase tracking-wider"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {trackingStages.map((stg) => {
            const isActive = statusAktif === stg.id;
            const count = status_counts[stg.id as keyof typeof status_counts] || 0;

            const boxBgs = {
              DP: 'bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100',
              Produksi: 'bg-blue-50/60 dark:bg-blue-955/10 hover:bg-blue-50',
              Jait: 'bg-purple-50/60 dark:bg-purple-955/10 hover:bg-purple-55',
              Checking: 'bg-amber-50/60 dark:bg-orange-955/10 hover:bg-amber-50',
              Selesai: 'bg-emerald-50/60 dark:bg-emerald-955/10 hover:bg-emerald-55'
            };

            const textColors = {
              DP: 'text-slate-700 dark:text-slate-300',
              Produksi: 'text-blue-700 dark:text-blue-355',
              Jait: 'text-purple-700 dark:text-purple-355',
              Checking: 'text-orange-700 dark:text-orange-355',
              Selesai: 'text-emerald-700 dark:text-emerald-355'
            };

            return (
              <button
                key={stg.id}
                onClick={() => setStatusAktif(isActive ? '' : stg.id)}
                className={`text-center p-5 rounded-3xl border transition-all duration-300 flex flex-col items-center justify-center relative cursor-pointer ${
                  boxBgs[stg.id as keyof typeof boxBgs]
                } ${
                  isActive
                    ? 'ring-2 ring-slate-900 dark:ring-slate-300 scale-105 shadow-md border-slate-400 dark:border-slate-500'
                    : 'border-slate-200 dark:border-slate-800 hover:-translate-y-1'
                }`}
              >
                <span className={`text-base mb-1 font-black ${textColors[stg.id as keyof typeof textColors]}`}>{stg.name}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wide uppercase leading-tight mb-2">
                  {stg.desc}
                </span>
                <span className={`text-3xl font-black ${textColors[stg.id as keyof typeof textColors]}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TRACKING PREMIUM WORK TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-805 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-805 flex justify-between items-center bg-slate-50/40 dark:bg-slate-900/40">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">📌 Logistik Order Terkini</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {statusAktif === '' ? (
                'Menampilkan seluruh antrean tuntas dan tertunda periode ini.'
              ) : (
                <span>
                  Memfilter orderan tahapan:{' '}
                  <strong className="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900 text-[10px] uppercase">
                    {statusAktif}
                  </strong>
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 dark:bg-slate-950 text-white text-[10px] uppercase tracking-widest text-center">
                <th className="p-4 text-left w-64 rounded-tl-lg font-semibold">Informasi Project</th>
                <th className="p-4 w-44 font-semibold">SLA Targets</th>
                <th className="p-4 w-60 font-semibold">Live Progress</th>
                <th className="p-4 rounded-tr-lg font-semibold">Aksi & Kendala Produksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-805">
              {tableData.map((row) => {
                const currentStatus = row.status_tracking || 'DP';
                const activeStg = trackingStages.find((s) => s.id === currentStatus) || trackingStages[0];

                const sla = calculateSLA(row);

                // Determine badge style
                let badgeNode = null;
                if (currentStatus === 'Selesai') {
                  badgeNode = (
                    <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-sm">
                      ✓ TUNTAS
                    </span>
                  );
                } else if (sla.days < 0) {
                  badgeNode = (
                    <span className="bg-rose-500 text-white border border-rose-650 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-md shadow-rose-500/10 animate-pulse block text-center">
                      ⚠ TELAT {Math.abs(sla.days)} HARI
                    </span>
                  );
                } else if (sla.days <= 3) {
                  badgeNode = (
                    <span className="bg-amber-500 text-white border border-orange-500 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-md shadow-amber-500/10 block text-center">
                      ⚡ MEPET ({sla.days} Hari)
                    </span>
                  );
                } else {
                  badgeNode = (
                    <span className="bg-slate-100 dark:bg-slate-805 text-slate-600 dark:text-slate-400 border border-slate-201 dark:border-slate-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider block text-center">
                      AMAN ({sla.days} Hari)
                    </span>
                  );
                }

                return (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 text-center transition-colors group align-top">
                    {/* INFO PROJECT */}
                    <td className="p-4 text-left border-r border-slate-100 dark:border-slate-805">
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mb-1 shadow-sm">
                        {row.invoice_no}
                      </span>
                      <span className="font-black text-slate-905 dark:text-white block text-xs uppercase group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {row.nama_order}
                      </span>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span> {row.nama_konsumen}
                      </div>

                      <div className="flex gap-2 mt-4.5">
                        <button
                          onClick={() => setSpkPrintObj(row)}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 font-black text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Eye size={12} /> Lihat SPK
                        </button>
                        <button
                          onClick={() => navigate(`/spk?orderId=${row.id}`)}
                          className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-extrabold text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider flex items-center"
                        >
                          Isi Sizing
                        </button>
                      </div>
                    </td>

                    {/* TARGETS & SLA */}
                    <td className="p-4 border-r border-slate-100 dark:border-slate-805">
                      <div className="bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-805 rounded-2xl p-3 inline-block w-full">
                        <div className="font-extrabold text-sm text-slate-800 dark:text-slate-300">
                          {row.jumlah_pcs} <span className="text-[10px] font-medium text-slate-450 uppercase">Pcs</span>
                        </div>
                        <div className="h-px bg-slate-200/60 dark:bg-slate-800 my-2"></div>
                        <div className="text-[8.5px] text-slate-400 font-black block uppercase mb-1 tracking-wider">Tenggat Target:</div>
                        <div className="text-[10px] font-extrabold text-slate-700 dark:text-slate-350 font-mono mb-2">
                          {sla.dateFormatted}
                        </div>
                        {badgeNode}
                      </div>
                    </td>

                    {/* LIVE PROGRESS */}
                    <td className="p-4 border-r border-slate-100 dark:border-slate-805 align-middle">
                      <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-250/20 shadow-inner">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-3.5 rounded-full overflow-hidden shadow-inner border border-slate-300/40 relative mb-2">
                          <div
                            className={`h-full bg-gradient-to-r ${activeStg.color} rounded-full transition-all duration-700 flex items-center justify-end pr-1.5`}
                            style={{ width: `${activeStg.percent}%` }}
                          >
                            {activeStg.percent > 20 && (
                              <span className="text-[8px] font-black text-white">{activeStg.percent}%</span>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-black">
                          <span className="uppercase text-indigo-650 dark:text-indigo-400 tracking-wider">
                            {currentStatus}
                          </span>
                          <span className="text-[8.5px] text-slate-400 font-semibold uppercase font-mono">
                            Update: {row.last_updated_status ? row.last_updated_status : '-'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* AKSI & KENDALA FORM */}
                    <td className="p-4">
                      <div className="flex flex-col gap-2 max-w-[340px] mx-auto">
                        <select
                          value={editingStatuses[row.id] || 'DP'}
                          onChange={(e) => handleFieldChange(row.id, 'status', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-2.5 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-sm"
                        >
                          <option value="DP">📊 TAHAP 1: DP MASUK</option>
                          <option value="Produksi">👕 TAHAP 2: PRODUKSI CUT/SABLON</option>
                          <option value="Jait">🧵 TAHAP 3: JAIT TAYLOR</option>
                          <option value="Checking">🔍 TAHAP 4: QC / CHECKING</option>
                          <option value="Selesai">📦 TAHAP 5: SELESAI TUNTAS</option>
                        </select>

                        <textarea
                          rows={2}
                          value={editingNotes[row.id] || ''}
                          onChange={(e) => handleFieldChange(row.id, 'note', e.target.value)}
                          placeholder="Log kendala produksi jika ada..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-705 p-2.5 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-800 text-slate-750 dark:text-slate-300 resize-none font-medium text-[11px]"
                        />

                        <button
                          onClick={() => handleUpdateItem(row.id)}
                          className="bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-black text-[9px] uppercase tracking-widest py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          Simpan Status
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
                    Hebat! Tidak ada invoice pemesanan tertimbun di filter tahapan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {spkPrintObj && (
        <SpkPrintDocument 
          order={spkPrintObj} 
          allItems={orderItems} 
          onClose={() => setSpkPrintObj(null)} 
        />
      )}
    </div>
  );
};

export default Tracking;
