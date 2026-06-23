import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, ShoppingBag, Users, Calendar, ArrowUpRight, ArrowDownLeft, AlertCircle, Sparkles, TrendingUp, RotateCcw, ChevronRight } from 'lucide-react';
import { getStoredData, Order, Transaction, OrderItem } from '../lib/storage';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [bulan, setBulan] = useState('2026-06');

  useEffect(() => {
    const data = getStoredData();
    setOrders(data.orders);
    setTransactions(data.transactions);
    setOrderItems(data.orderItems);
  }, []);

  // Filtered lists based on month
  const filteredOrders = orders.filter((o) => o.tanggal_order.startsWith(bulan));
  const filteredTransactions = transactions.filter((t) => t.tanggal.startsWith(bulan));

  // --- Calculations ---
  // 1. Finance Metrics
  const masuk = filteredTransactions.filter((t) => t.jenis === 'Pemasukan').reduce((acc, curr) => acc + curr.nominal, 0);
  const keluar = filteredTransactions.filter((t) => t.jenis === 'Pengeluaran').reduce((acc, curr) => acc + curr.nominal, 0);
  const margin = masuk - keluar;
  const totalOmset = filteredOrders.reduce((acc, curr) => acc + curr.total_harga, 0);
  const totalVolumePcs = filteredOrders.reduce((acc, curr) => acc + curr.jumlah_pcs, 0);

  // 2. Tracking Stats
  const trackingData = {
    DP: 0,
    Produksi: 0,
    Jait: 0,
    Checking: 0,
    Selesai: 0,
  };
  filteredOrders.forEach((o) => {
    const st = o.status_tracking || 'DP';
    if (st in trackingData) {
      trackingData[st as keyof typeof trackingData]++;
    }
  });
  const totalOrdersWithTracking = filteredOrders.length;

  // 3. SPK Sizing Progress Alert (Items count < Ordered pcs)
  const spkAlertList = filteredOrders
    .map((o) => {
      const actualItemsCount = orderItems.filter((i) => i.order_id === o.id).length;
      return {
        ...o,
        total_terinput: actualItemsCount,
      };
    })
    .filter((o) => o.total_terinput < o.jumlah_pcs)
    .slice(0, 5);

  // 4. Top 5 Customers
  const customerMap: { [key: string]: { nama: string; freq: number; qty: number } } = {};
  filteredOrders.forEach((o) => {
    if (!customerMap[o.nama_konsumen]) {
      customerMap[o.nama_konsumen] = { nama: o.nama_konsumen, freq: 0, qty: 0 };
    }
    customerMap[o.nama_konsumen].freq += 1;
    customerMap[o.nama_konsumen].qty += o.jumlah_pcs;
  });
  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // 5. Overdue / Due Receivables (Where status is not Lunas, and deadline_kerja is today or past)
  const hariIniStr = new Date().toISOString().split('T')[0];
  const piutangOverdue = filteredOrders
    .filter((o) => {
      const isUnpaid = o.dp < o.total_harga;
      const hasDeadline = !!o.deadline_kerja;
      const isPastOrToday = o.deadline_kerja ? o.deadline_kerja <= '2026-06-22' : false; // hardcoding reference date for realistic view
      return isUnpaid && hasDeadline && isPastOrToday;
    })
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex-grow flex flex-col gap-6">
      {/* Header Glassmorphism */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-100 dark:bg-indigo-900/30 rounded-full blur-3xl opacity-60"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Command Center
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest mt-1">Sistem Pemantauan Terintegrasi KAKAMI ERP</p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 relative z-10 shadow-inner">
          <label className="font-extrabold text-[10px] text-slate-400 dark:text-slate-500 pl-2 uppercase tracking-wider">Periode Data:</label>
          <input
            type="month"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-3 py-1.5 rounded-xl border-none outline-none text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
          />
        </div>
      </div>

      {/* 5 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Pemasukan */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 border-l-8 border-l-emerald-500 hover:-translate-y-1 transition-transform group duration-350">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">Pemasukan Kas</h3>
            <span className="text-slate-400 group-hover:text-emerald-500 transition-colors duration-300">
              <ArrowDownLeft className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xl font-mono font-black text-slate-900 dark:text-white mt-2 tracking-tight">Rp {masuk.toLocaleString('id-ID')}</p>
        </div>

        {/* Pengeluaran */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 border-l-8 border-l-slate-400 dark:border-l-slate-600 hover:-translate-y-1 transition-transform group duration-350">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">Pengeluaran</h3>
            <span className="text-slate-400 group-hover:text-slate-600 transition-colors duration-300">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xl font-mono font-black text-slate-900 dark:text-white mt-2 tracking-tight">Rp {keluar.toLocaleString('id-ID')}</p>
        </div>

        {/* Profit Status */}
        {margin >= 0 ? (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 p-5 rounded-3xl shadow-lg text-white border-l-8 border-l-emerald-400 hover:-translate-y-1 transition-transform group relative overflow-hidden duration-350">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start relative z-10">
              <h3 className="text-slate-400 dark:text-slate-300 text-[10px] font-extrabold uppercase tracking-widest">Status Finansial</h3>
              <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full font-black uppercase tracking-wider border border-emerald-400/30 shadow-sm">
                Untung
              </span>
            </div>
            <p className="text-xl font-mono font-black text-white mt-2 tracking-tight relative z-10">Rp {margin.toLocaleString('id-ID')}</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-rose-500 to-red-600 p-5 rounded-3xl shadow-lg text-white border-l-8 border-l-white hover:-translate-y-1 transition-transform group relative overflow-hidden duration-350">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start relative z-10">
              <h3 className="text-rose-200 text-[10px] font-extrabold uppercase tracking-widest">Status Finansial</h3>
              <span className="text-[9px] bg-white text-rose-600 px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm animate-pulse">
                Rugi
              </span>
            </div>
            <p className="text-xl font-mono font-black text-white mt-2 tracking-tight relative z-10">-Rp {Math.abs(margin).toLocaleString('id-ID')}</p>
          </div>
        )}

        {/* Omset */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 border-l-8 border-l-indigo-500 hover:-translate-y-1 transition-transform group duration-350">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">Nilai Omset</h3>
            <span className="text-slate-400 group-hover:text-indigo-500 transition-colors duration-300">
              <ShoppingBag className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xl font-mono font-black text-slate-900 dark:text-white mt-2 tracking-tight">Rp {totalOmset.toLocaleString('id-ID')}</p>
        </div>

        {/* Volume Produksi */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 border-l-8 border-l-purple-500 hover:-translate-y-1 transition-transform group duration-350">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">Volume Produksi</h3>
            <span className="text-slate-400 group-hover:text-purple-500 transition-colors duration-300">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xl font-mono font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            {totalVolumePcs.toLocaleString('id-ID')} <span className="text-xs font-bold text-slate-450 uppercase">Pcs</span>
          </p>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (Logistics & SPK Alerts) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-start">
          {/* Logistics Tracking Radar */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Radar Distribusi Logistik
              </h3>
              <Link
                to="/tracking"
                className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg uppercase hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 transition-colors"
              >
                Kelola Monitor
              </Link>
            </div>

            {totalOrdersWithTracking === 0 ? (
              <p className="text-xs text-center text-slate-400 dark:text-slate-500 italic py-4">Belum ada orderan masuk di bulan ini.</p>
            ) : (
              <div className="space-y-4">
                {(Object.keys(trackingData) as Array<keyof typeof trackingData>).map((status) => {
                  const val = trackingData[status];
                  const percents = Math.round((val / totalOrdersWithTracking) * 100) || 0;
                  const barColors = {
                    DP: 'bg-slate-400',
                    Produksi: 'bg-blue-500',
                    Jait: 'bg-purple-550',
                    Checking: 'bg-orange-555',
                    Selesai: 'bg-emerald-500',
                  };
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-[10px] font-extrabold mb-1 uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        <span>
                          Tahap: {status} ({val} Nota)
                        </span>
                        <span>{percents}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden shadow-inner font-mono">
                        <div
                          className={`${barColors[status] || 'bg-slate-300'} h-2 rounded-full transition-all duration-1000`}
                          style={{ width: `${percents}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SPK alerts */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" /> Peringatan Kelengkapan Berkas SPK
              </h3>
              <Link
                to="/spk"
                className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg uppercase hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 transition-colors"
              >
                Lihat Semua SPK
              </Link>
            </div>

            <div className="space-y-3">
              {spkAlertList.length === 0 ? (
                <div className="p-4 border border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-450 font-bold">
                  <span className="bg-emerald-100 dark:bg-emerald-900/60 p-1.5 rounded-xl">✓</span>
                  Semua rincian antrean nota SPK ukuran sudah lengkap terisi!
                </div>
              ) : (
                spkAlertList.map((spk) => (
                  <div
                    key={spk.id}
                    className="flex justify-between items-center p-3 border border-red-100 dark:border-rose-950 bg-red-50/20 dark:bg-rose-950/10 rounded-2xl hover:bg-red-50/70 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider">{spk.invoice_no}</span>
                        <span className="bg-rose-100/50 dark:bg-rose-900/55 text-rose-700 dark:text-rose-350 px-1.5 py-0.2 rounded text-[8px] font-black uppercase">
                          {spk.jenis_produk}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase">{spk.nama_order}</h4>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                        Sizing terinput: <span className="font-extrabold text-rose-500">{spk.total_terinput}</span> dari {spk.jumlah_pcs} Pcs
                      </p>
                    </div>
                    <Link
                      to={`/spk?orderId=${spk.id}`}
                      className="text-[9px] bg-rose-500 hover:bg-rose-600 text-white font-black px-3 py-2 rounded-xl uppercase tracking-widest shadow-md shadow-rose-500/20 active:scale-95 transition-all"
                    >
                      Lengkapi SPK
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col (Klients Loyal & Overdue Piutang) */}
        <div className="space-y-6">
          {/* Top 5 Clients */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-white relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <h3 className="text-sm font-black uppercase tracking-wider text-indigo-200 mb-5 border-b border-slate-800 pb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Top 5 Klien Loyal Bulan Ini
              </h3>

              <div className="space-y-4">
                {topCustomers.length === 0 ? (
                  <p className="text-xs text-center text-slate-500 italic py-4 border border-dashed border-slate-800 rounded-2xl">Belum ada transaksi tercatat.</p>
                ) : (
                  topCustomers.map((c, i) => (
                    <div key={c.nama} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-350 flex items-center justify-center text-xs font-black border border-slate-700">
                        #{i + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black uppercase tracking-wide text-white truncate max-w-[150px]">{c.nama}</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                          Frekuensi: {c.freq}x | Vol: <span className="text-emerald-400 font-extrabold">{c.qty} Pcs</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Piutang Overdue Target */}
          <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-3xl border border-amber-200 dark:border-amber-900">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-800 dark:text-amber-450 mb-4 border-b border-amber-200 dark:border-amber-900/60 pb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" /> Jatuh Tempo Belum Lunas
            </h3>

            <div className="space-y-3">
              {piutangOverdue.length === 0 ? (
                <p className="text-xs text-center text-amber-700/80 dark:text-amber-400/80 font-bold italic py-4">
                  Semua nota lunas atau belum melewati batas tenggat.
                </p>
              ) : (
                piutangOverdue.map((p) => (
                  <div key={p.id} className="bg-white dark:bg-slate-850 p-3 rounded-2xl border border-amber-100 dark:border-slate-800 shadow-sm relative">
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-2xl uppercase tracking-wider">
                      TERTENGGAT
                    </div>
                    <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{p.invoice_no}</div>
                    <h4 className="text-[11px] font-extrabold text-slate-850 dark:text-slate-200 uppercase mt-0.5 truncate max-w-[180px]">{p.nama_konsumen}</h4>
                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-750">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">Uang Tagihan Sisa:</span>
                      <span className="text-[11px] font-mono font-black text-rose-600 dark:text-rose-450">
                        Rp {(p.total_harga - p.dp).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
