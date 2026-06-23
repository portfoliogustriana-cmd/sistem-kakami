import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownToLine, ShoppingCart, Factory, Users, BarChart3, PlusSquare, BookOpen, Trash2, Rocket, ArrowUpRight, ArrowDownLeft, Trash } from 'lucide-react';
import { getStoredData, saveStoredData, Transaction, Order } from '../lib/storage';

type Tab = 'kas' | 'piutang' | 'hutang' | 'laporan';

const Keuangan = () => {
  const [activeTab, setActiveTab] = useState<Tab>('kas');
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  // Form states
  const [jenis, setJenis] = useState<'Pemasukan' | 'Pengeluaran'>('Pemasukan');
  const [kategori, setKategori] = useState('');
  const [nominal, setNominal] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState('');

  const [bulan, setBulan] = useState('2026-06');

  useEffect(() => {
    const data = getStoredData();
    setOrders(data.orders);
    setTransactions(data.transactions);
    setOrderItems(data.orderItems);
  }, []);

  const syncData = (newTx: Transaction[], newOrders = orders, newItems = orderItems) => {
    setTransactions(newTx);
    setOrders(newOrders);
    saveStoredData(newOrders, newItems, newTx);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategori || !nominal || !tanggal) {
      alert('Mohon isi kategori, nominal, dan tanggal!');
      return;
    }

    const txNominal = parseFloat(nominal);
    if (isNaN(txNominal) || txNominal <= 0) {
      alert('Nominal harus angka positif!');
      return;
    }

    const newTxItem: Transaction = {
      id: Date.now(),
      jenis,
      kategori,
      nominal: txNominal,
      tanggal,
      keterangan: keterangan || `${jenis} manual - ${kategori}`,
    };

    const updated = [...transactions, newTxItem];
    syncData(updated);

    // Reset Form
    setKategori('');
    setNominal('');
    setKeterangan('');
  };

  const handleDeleteTransaction = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      const updated = transactions.filter((t) => t.id !== id);
      syncData(updated);
    }
  };

  // Filter transactions based on selected month
  const filteredTransactions = transactions.filter((t) => t.tanggal.startsWith(bulan));

  const masuk = filteredTransactions.filter((t) => t.jenis === 'Pemasukan').reduce((acc, curr) => acc + curr.nominal, 0);
  const keluar = filteredTransactions.filter((t) => t.jenis === 'Pengeluaran').reduce((acc, curr) => acc + curr.nominal, 0);
  const saldo = masuk - keluar;

  // Receivables calculated from orders of current month that are DP/Not paid in full
  const filteredOrders = orders.filter((o) => o.tanggal_order.startsWith(bulan));
  const piutangList = filteredOrders.filter((o) => o.total_harga > o.dp);
  const totalPiutang = piutangList.reduce((acc, curr) => acc + (curr.total_harga - curr.dp), 0);

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex-grow flex flex-col gap-6">
      {/* Tab bar */}
      <div className="w-full relative z-10 pb-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 flex-wrap gap-4">
        <nav className="flex overflow-x-auto gap-2 hide-scrollbar">
          <TabButton active={activeTab === 'kas'} onClick={() => setActiveTab('kas')} icon={<Wallet className="w-4 h-4 text-emerald-500" />} label="Kas & Jurnal" />
          <TabButton active={activeTab === 'piutang'} onClick={() => setActiveTab('piutang')} icon={<ArrowDownToLine className="w-4 h-4 text-blue-500" />} label="Pendapatan & Piutang Dagang" />
          <TabButton active={activeTab === 'laporan'} onClick={() => setActiveTab('laporan')} icon={<BarChart3 className="w-4 h-4 text-indigo-500" />} label="Laporan Laba-Rugi" />
        </nav>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 pl-2 uppercase tracking-wide">Periode:</label>
          <input
            type="month"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-3 py-1.5 rounded-xl border-none outline-none text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors"
          />
        </div>
      </div>

      <div className="flex-grow w-full max-w-full overflow-hidden">
        {activeTab === 'kas' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <HighlightCard title="Total Pemasukan" amount={masuk} color="border-l-emerald-500" />
              <HighlightCard title="Total Pengeluaran" amount={keluar} color="border-l-rose-400" />
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 p-5 rounded-3xl shadow-lg border-l-8 border-l-indigo-400 hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Net Cash / Saldo</h3>
                <p className="text-2xl font-black text-white mt-2 tracking-tight">Rp {saldo.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              {/* Form Input */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 space-y-4">
                <h2 className="text-base font-extrabold border-b pb-3 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <PlusSquare className="w-4 h-4 text-slate-500" /> Input Kas Manual
                </h2>
                <form className="flex flex-col gap-3.5" onSubmit={handleAddTransaction}>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Jenis Transaksi</label>
                    <select
                      value={jenis}
                      onChange={(e) => setJenis(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all text-slate-800 dark:text-slate-200"
                    >
                      <option value="Pemasukan">Pemasukan (IN)</option>
                      <option value="Pengeluaran">Pengeluaran (OUT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Kategori Biaya</label>
                    <input
                      placeholder="e.g. Bahan Baku, Gaji, ATK, Listrik"
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Nominal Rupiah</label>
                    <input
                      type="number"
                      placeholder="e.g. 500000"
                      value={nominal}
                      onChange={(e) => setNominal(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Keterangan Deskriptif</label>
                    <textarea
                      placeholder="Keterangan tambahan..."
                      rows={2}
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900 transition-all font-semibold"
                    />
                  </div>
                  <button className="w-full bg-slate-950 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all mt-2 flex items-center justify-center shadow-lg shadow-black/10">
                    Simpan Transaksi
                  </button>
                </form>
              </div>

              {/* Jurnal */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 xl:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-700">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-500" /> Jurnal Arus Kas (GL) - Periode {bulan}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                        <th className="p-4 font-extrabold text-left rounded-tl-xl w-32">Tanggal</th>
                        <th className="p-4 font-extrabold text-center w-20">Arus</th>
                        <th className="p-4 font-extrabold">Kategori / Deskripsi</th>
                        <th className="p-4 font-extrabold text-right">Nominal</th>
                        <th className="p-4 font-extrabold text-center rounded-tr-xl w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80">
                          <td className="p-4 font-mono text-xs text-slate-500 text-left">{t.tanggal}</td>
                          <td className="p-4 text-center">
                            {t.jenis === 'Pemasukan' ? (
                              <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest inline-flex items-center gap-0.5">
                                <ArrowDownLeft size={10} /> IN
                              </span>
                            ) : (
                              <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest inline-flex items-center gap-0.5">
                                <ArrowUpRight size={10} /> OUT
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">{t.kategori}</div>
                            {t.keterangan && <div className="text-[10px] text-slate-400 font-medium">{t.keterangan}</div>}
                          </td>
                          <td className="p-4 text-right font-black text-slate-900 dark:text-slate-200 font-mono text-xs">Rp {t.nominal.toLocaleString('id-ID')}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="text-[9px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 dark:border-rose-950/50 px-3 py-1.5 rounded-lg font-bold flex items-center justify-center w-max mx-auto transition-all"
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium italic">
                            Belum ada arus kas tercatat pada bulan ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Piutang */}
        {activeTab === 'piutang' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <HighlightCard title="Total Piutang Dagang Aktif" amount={totalPiutang} color="border-l-blue-500" />
              <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-md border border-slate-200/60 dark:border-slate-700/60 border-l-8 border-l-emerald-500 flex flex-col justify-center">
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status Kolektibilitas</h3>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-2">Semua Aman Terkendali</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 space-y-4">
              <h2 className="text-base font-extrabold border-b pb-3 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-blue-500" /> Daftar Piutang Invoice Belum Lunas (Bulan {bulan})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                      <th className="p-4 font-extrabold">Invoice / Pelanggan</th>
                      <th className="p-4 font-extrabold w-36">Nama Order</th>
                      <th className="p-4 font-extrabold text-right">Total Tagihan</th>
                      <th className="p-4 font-extrabold text-right">Sudah Dibayar (DP)</th>
                      <th className="p-4 font-extrabold text-right text-rose-500">Sisa Piutang</th>
                      <th className="p-4 font-extrabold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {piutangList.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80">
                        <td className="p-4 text-xs">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">{o.invoice_no}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{o.nama_konsumen}</div>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[150px] truncate">{o.nama_order}</td>
                        <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-200 font-mono text-xs">Rp {o.total_harga.toLocaleString('id-ID')}</td>
                        <td className="p-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-xs">Rp {o.dp.toLocaleString('id-ID')}</td>
                        <td className="p-4 text-right font-black text-rose-600 dark:text-rose-450 font-mono text-xs">Rp {(o.total_harga - o.dp).toLocaleString('id-ID')}</td>
                        <td className="p-4 text-center">
                          <span className="bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest">
                            DP PARTIAL
                          </span>
                        </td>
                      </tr>
                    ))}
                    {piutangList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium italic">
                          Hebat! Seluruh pesanan di bulan ini telah lunas terjual.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Laporan Laba Rugi */}
        {activeTab === 'laporan' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-4xl mx-auto space-y-8">
              <div className="text-center border-b pb-5 border-slate-150 dark:border-slate-700">
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">KAKAMI CONVECTION ERP</h2>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Lembat Laba Rugi (P/L Statement)</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Periode Bulan: {bulan}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b pb-1">1. Pendapatan Usaha (Revenue)</h4>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-400 pl-4">Penerimaan Pelunasan & DP Pelanggan</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">Rp {masuk.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-700 pt-2 font-black">
                      <span className="text-slate-900 dark:text-white pl-4">TOTAL PENDAPATAN</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono">Rp {masuk.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest border-b pb-1">2. Biaya & Pengeluaran (Expenses)</h4>
                  <div className="mt-3 space-y-2">
                    {/* Unique active categories of expenses */}
                    {Array.from(new Set(filteredTransactions.filter((t) => t.jenis === 'Pengeluaran').map((t) => t.kategori))).map((cat) => {
                      const amount = filteredTransactions.filter((t) => t.jenis === 'Pengeluaran' && t.kategori === cat).reduce((sum, current) => sum + current.nominal, 0);
                      return (
                        <div key={cat} className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 pl-4 uppercase">
                          <span>Biaya {cat}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">Rp {amount.toLocaleString('id-ID')}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-700 pt-2 font-black">
                      <span className="text-slate-900 dark:text-white pl-4">TOTAL BIAYA UTAMA</span>
                      <span className="text-rose-500 dark:text-rose-450 font-mono">Rp {keluar.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-double border-slate-200 dark:border-slate-700/60 pt-6">
                  <div className={`p-4 rounded-2xl flex justify-between items-center ${saldo >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-800/80 dark:text-rose-400'}`}>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider">{saldo >= 0 ? 'LABA BERSIH OPERASIONAL' : 'RUGI OPERASIONAL'}</h4>
                      <p className="text-[10px] opacity-80 mt-1">Laba Bersih dihitung dari Total IN dikurangi Total OUT terkini.</p>
                    </div>
                    <span className="text-xl font-black font-mono">Rp {saldo.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap flex items-center justify-center gap-2 px-5 py-3 text-xs rounded-full transition-all border ${
        active
          ? 'text-slate-900 dark:text-white bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700 font-bold'
          : 'text-slate-500 hover:bg-white border-transparent font-semibold dark:hover:bg-slate-800'
      }`}
    >
      {icon} {label}
    </button>
  );
};

const HighlightCard = ({ title, amount, color }: { title: string; amount: number; color: string }) => (
  <div className={`bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-md border border-slate-200/60 dark:border-slate-700/60 border-l-8 ${color} hover:-translate-y-1 transition-all duration-300`}>
    <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</h3>
    <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">Rp {amount.toLocaleString('id-ID')}</p>
  </div>
);

export default Keuangan;
