import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, Layers, Image, Check, ListPlus, ShieldAlert, ArrowRight, Eye, RefreshCw, X, PlusSquare, Trash2, Printer, Search, Copy } from 'lucide-react';
import { getStoredData, saveStoredData, Order, OrderItem } from '../lib/storage';
import { SpkPrintDocument } from '../components/SpkPrintDocument';

const Spk = () => {
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [bulan, setBulan] = useState('2026-06');

  // SPK Editing States
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Form Fields
  const [bahanUtama, setBahanUtama] = useState('');
  const [bentukKerah, setBentukKerah] = useState('');
  const [jenisOrderan, setJenisOrderan] = useState('Full Set');
  const [bahanCelana, setBahanCelana] = useState('');
  const [bahanKerah, setBahanKerah] = useState('');
  const [bahanManset, setBahanManset] = useState('');
  const [polaBaju, setPolaBaju] = useState('');
  const [catatanDarurat, setCatatanDarurat] = useState('');
  const [catatanProduksi, setCatatanProduksi] = useState('');
  const [deadline, setDeadline] = useState('');
  const [fotoMockup, setFotoMockup] = useState('');

  // Live Jersey Sizing Rows
  const [sizingRows, setSizingRows] = useState<Omit<OrderItem, 'id' | 'order_id'>[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [hasDuplicateNumbers, setHasDuplicateNumbers] = useState(false);

  // Print Preview
  const [showSpkPrintObj, setShowSpkPrintObj] = useState<Order | null>(null);

  const sizeOptions = [
    'XXS ANAK', 'XS ANAK', 'S ANAK', 'M ANAK', 'L ANAK', 'XL ANAK', '2XL ANAK',
    'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'CUSTOM'
  ];

  useEffect(() => {
    const data = getStoredData();
    setOrders(data.orders);
    setOrderItems(data.orderItems);

    // Deep link detection
    const queryParams = new URLSearchParams(location.search);
    const orderIdParam = queryParams.get('orderId');

    if (orderIdParam) {
      const orderIdInt = parseInt(orderIdParam);
      if (!isNaN(orderIdInt)) {
        setSelectedOrderId(orderIdInt);
        const target = data.orders.find((o) => o.id === orderIdInt);
        if (target) {
          loadSPKFieldsOfOrder(target, data.orderItems.filter((i) => i.order_id === orderIdInt));
        }
      }
    } else if (data.orders.length > 0) {
      // Pre-select first order matching active month by default
      const filtered = data.orders.filter((o) => o.tanggal_order.startsWith(bulan));
      if (filtered.length > 0) {
        setSelectedOrderId(filtered[0].id);
        loadSPKFieldsOfOrder(filtered[0], data.orderItems.filter((i) => i.order_id === filtered[0].id));
      }
    }
  }, [location.search]);

  // Handle month selection shift
  const handleMonthChange = (val: string) => {
    setBulan(val);
    const data = getStoredData();
    const filtered = data.orders.filter((o) => o.tanggal_order.startsWith(val));
    if (filtered.length > 0) {
      setSelectedOrderId(filtered[0].id);
      loadSPKFieldsOfOrder(filtered[0], data.orderItems.filter((i) => i.order_id === filtered[0].id));
    } else {
      setSelectedOrderId(null);
      clearFields();
    }
  };

  const clearFields = () => {
    setBahanUtama('');
    setBentukKerah('');
    setJenisOrderan('Full Set');
    setBahanCelana('');
    setBahanKerah('');
    setBahanManset('');
    setPolaBaju('');
    setCatatanDarurat('');
    setCatatanProduksi('');
    setDeadline('');
    setFotoMockup('');
    setSizingRows([]);
  };

  const loadSPKFieldsOfOrder = (o: Order, items: OrderItem[]) => {
    setBahanUtama(o.bahan_utama || '');
    setBentukKerah(o.bentuk_kerah || '');
    setJenisOrderan(o.jenis_orderan || 'Full Set');
    setBahanCelana(o.bahan_celana || '');
    setBahanKerah(o.bahan_kerah || '');
    setBahanManset(o.bahan_manset || '');
    setPolaBaju(o.pola_baju || '');
    setCatatanDarurat(o.catatan_darurat || '');
    setCatatanProduksi(o.catatan_produksi_spk || '');
    setDeadline(o.deadline_kerja || o.tanggal_order || '');
    setFotoMockup(o.foto_mockup || '');

    const rows = items.map((i) => ({
      no_player: i.no_player,
      nama_player: i.nama_player,
      nama_punggung: i.nama_punggung,
      size: i.size,
      lengan: i.lengan,
      gender: i.gender,
      keterangan: i.keterangan,
    }));
    setSizingRows(rows);
    checkDuplicateNumbers(rows);
  };

  // Check if jersey / numbers are duplicate
  const checkDuplicateNumbers = (rows: Omit<OrderItem, 'id' | 'order_id'>[]) => {
    const numbers = rows.map(r => r.no_player.trim()).filter(n => n !== '' && n !== '-');
    const duplicates = numbers.filter((item, index) => numbers.indexOf(item) !== index);
    setHasDuplicateNumbers(duplicates.length > 0);
  };

  const handleSizingFieldChange = (idx: number, field: string, val: string) => {
    const updated = sizingRows.map((row, i) => {
      if (i === idx) {
        return { ...row, [field]: val };
      }
      return row;
    });
    setSizingRows(updated);
    checkDuplicateNumbers(updated);
  };

  const handleAddRow = () => {
    const updated = [
      ...sizingRows,
      {
        no_player: '',
        nama_player: '',
        nama_punggung: '',
        size: 'L',
        lengan: 'PENDEK',
        gender: 'PRIA',
        keterangan: '',
      },
    ];
    setSizingRows(updated);
    checkDuplicateNumbers(updated);
  };

  const handleRemoveRow = (idx: number) => {
    const updated = sizingRows.filter((_, i) => i !== idx);
    setSizingRows(updated);
    checkDuplicateNumbers(updated);
  };

  // Populate spec values from another previous project (Auto fill specs feature)
  const handleAutoFillCopy = (prevOrderJson: string) => {
    if (!prevOrderJson) return;
    try {
      const parsed: Order = JSON.parse(prevOrderJson);
      setBahanUtama(parsed.bahan_utama || '');
      setBentukKerah(parsed.bentuk_kerah || '');
      setJenisOrderan(parsed.jenis_orderan || 'Full Set');
      setBahanCelana(parsed.bahan_celana || '');
      setBahanKerah(parsed.bahan_kerah || '');
      setBahanManset(parsed.bahan_manset || '');
      setPolaBaju(parsed.pola_baju || '');
      setCatatanProduksi(parsed.catatan_produksi_spk || '');
      alert(`Berhasil menyalin spesifikasi dari order ${parsed.invoice_no}!`);
    } catch (e) {
      console.error(e);
    }
  };

  // Save changes with size weights sorting model
  const handleSaveSPK = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      alert('Pilih order terlebih dahulu!');
      return;
    }

    const data = getStoredData();

    // Map size weight scores for precise sorting
    const sizeWeights: { [key: string]: number } = {
      'XXS ANAK': 1, 'XS ANAK': 2, 'S ANAK': 3, 'M ANAK': 4, 'L ANAK': 5, 'XL ANAK': 6, '2XL ANAK': 7,
      'XS': 8, 'S': 9, 'M': 10, 'L': 11, 'XL': 12, 'XXL': 13, '3XL': 14, '4XL': 15, '5XL': 16, 'CUSTOM': 99
    };

    // Prepare sorted list items
    const preparedItems = sizingRows.map((it, idx) => {
      const szUpper = it.size.toUpperCase().trim();
      const weight = sizeWeights[szUpper] ?? 90;
      return {
        ...it,
        weight,
      };
    });

    // Sort items based on sizing weights
    preparedItems.sort((a, b) => a.weight - b.weight);

    // Save items to local database
    const mappedItems: OrderItem[] = preparedItems.map((it, index) => ({
      id: Date.now() + index,
      order_id: selectedOrderId,
      no_player: it.no_player,
      nama_player: it.nama_player,
      nama_punggung: it.nama_punggung,
      size: it.size,
      lengan: it.lengan,
      gender: it.gender,
      keterangan: it.keterangan,
    }));

    // Update order spec attributes
    const updatedOrders = data.orders.map((o) => {
      if (o.id === selectedOrderId) {
        return {
          ...o,
          bahan_utama: bahanUtama,
          bentuk_kerah: bentukKerah,
          jenis_orderan: jenisOrderan,
          bahan_celana: bahanCelana,
          bahan_kerah: bahanKerah,
          bahan_manset: bahanManset,
          pola_baju: polaBaju,
          catatan_darurat: catatanDarurat,
          catatan_produksi_spk: catatanProduksi,
          dibuat_oleh: 'Admin ERP',
          deadline_kerja: deadline,
          foto_mockup: fotoMockup,
        };
      }
      return o;
    });

    // Clean old items for this order and insert sorted items
    const remainingItems = data.orderItems.filter((i) => i.order_id !== selectedOrderId);
    const finalItems = [...remainingItems, ...mappedItems];

    setOrders(updatedOrders);
    setOrderItems(finalItems);
    saveStoredData(updatedOrders, finalItems, data.transactions);

    alert('Spesifikasi & list ukuran SPK berhasil disimpan dan diurutkan berdasarkan standard sizing!');
  };

  const handleOpenPrintObj = (order: Order) => {
    setShowSpkPrintObj(order);
  };

  // Filtering lists
  const filteredOrdersList = orders.filter((o) => o.tanggal_order.startsWith(bulan));
  const activeOrder = orders.find((o) => o.id === selectedOrderId);

  // Search filter inside sizing list rows
  const displayedSizingRows = sizingRows.filter(
    (row) =>
      row.nama_player.toLowerCase().includes(playerSearch.toLowerCase()) ||
      row.nama_punggung.toLowerCase().includes(playerSearch.toLowerCase()) ||
      row.no_player.includes(playerSearch)
  );

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex-grow flex flex-col gap-6">
      
      {/* HEADER PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60">
        <div>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-650 dark:text-indigo-400" /> SPK Produksi & Sizing
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Persiapkan Surat Perintah Kerja (SPK), isikan detail ukuran jersey pemain dengan pendeteksi nomor punggung ganda.
          </p>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="mt-3 sm:mt-0 flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-705 shadow-inner">
          <label className="font-extrabold text-[10px] text-slate-400 pl-2 uppercase tracking-wider">Pilih Bulan:</label>
          <input
            type="month"
            value={bulan}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-3 py-1.5 rounded-xl border-none outline-none text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
          />
        </form>
      </div>

      {activeOrder && (
        <div id="spk-form-box" className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-905 dark:text-white uppercase tracking-tight flex items-center gap-2">
                📂 Manajemen SPK: <span className="text-indigo-650 dark:text-indigo-400">{activeOrder.nama_order}</span>
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {activeOrder.invoice_no}
                </span>
                <span className="text-[10px] font-black text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {activeOrder.jenis_produk}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  Sizing Target: <strong className="text-slate-700 dark:text-slate-350">{activeOrder.jumlah_pcs} Pcs</strong>
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedOrderId(null)}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 px-4 py-2 rounded-xl font-black uppercase tracking-wider flex items-center gap-1 transition-all"
            >
              <X size={12} /> Tutup Form
            </button>
          </div>

          {/* COPY FROM PRIOR ORDERS DROPDOWN */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/60 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
            <span className="text-[10px] font-black text-indigo-805 dark:text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
              <Copy size={13} className="text-indigo-500" /> Salin Spesifikasi Dari Project Lama:
            </span>
            <select
              onChange={(e) => handleAutoFillCopy(e.target.value)}
              className="w-full sm:w-auto border border-indigo-200 dark:border-indigo-800 pr-8 pl-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="">-- Pilih Project Sebelumnya --</option>
              {orders
                .filter((o) => o.id !== activeOrder.id && (o.bahan_utama || o.bentuk_kerah))
                .slice(0, 20)
                .map((hq) => (
                  <option key={hq.id} value={JSON.stringify(hq)}>
                    {hq.invoice_no} - {hq.nama_order}
                  </option>
                ))}
            </select>
          </div>

          <form onSubmit={handleSaveSPK} className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-4">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-805 pb-2">
                📋 Spesifikasi Material & Waktu Pekerjaan
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">Bahan Utama Baju:</label>
                  <input
                    type="text"
                    value={bahanUtama}
                    onChange={(e) => setBahanUtama(e.target.value)}
                    placeholder="Jacquart / Drifit Milenial"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 p-2.5 rounded-xl outline-none font-bold text-xs text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">Bentuk Kerah:</label>
                  <input
                    type="text"
                    value={bentukKerah}
                    onChange={(e) => setBentukKerah(e.target.value)}
                    placeholder="V-Neck / O-Neck Tumpuk"
                    className="w-full bg-white dark:bg-slate-805 border border-slate-201 dark:border-slate-700 p-2.5 rounded-xl outline-none font-bold text-xs text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">Bahan Celana:</label>
                  <input
                    type="text"
                    value={bahanCelana}
                    onChange={(e) => setBahanCelana(e.target.value)}
                    placeholder="Lotto / Drifit Jarum"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none font-bold text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">Bahan Kerah (RIB):</label>
                  <input
                    type="text"
                    value={bahanKerah}
                    onChange={(e) => setBahanKerah(e.target.value)}
                    placeholder="Rib Premium"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-201 dark:border-slate-700 p-2.5 rounded-xl outline-none font-bold text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">Bahan Manset:</label>
                  <input
                    type="text"
                    value={bahanManset}
                    onChange={(e) => setBahanManset(e.target.value)}
                    placeholder="Spandek Premium"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-2.5 rounded-xl outline-none font-bold text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">Pola / Potongan Baju:</label>
                  <input
                    type="text"
                    value={polaBaju}
                    onChange={(e) => setPolaBaju(e.target.value)}
                    placeholder="Pola Standar / Raglan / Set-In"
                    className="w-full bg-white dark:bg-slate-808 border border-slate-202 dark:border-slate-700 p-2.5 rounded-xl outline-none font-bold text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">Jenis Orderan:</label>
                  <select
                    value={jenisOrderan}
                    onChange={(e) => setJenisOrderan(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none font-bold text-xs text-slate-800 dark:text-slate-100 cursor-pointer text-left"
                  >
                    <option value="Full Set">Full Set (Atasan + Celana)</option>
                    <option value="Atasan Saja">Atasan Saja</option>
                    <option value="Celana Saja">Celana Saja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-rose-600 dark:text-rose-400 mb-1 uppercase">Deadline Selesai SPK:</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-2.5 rounded-xl outline-none font-extrabold text-xs text-rose-700 dark:text-rose-300 cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">Simulasi File Mockup Desain (URL Gambar):</label>
                  <input
                    type="text"
                    value={fotoMockup}
                    onChange={(e) => setFotoMockup(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-707 p-2.5 rounded-xl outline-none font-semibold text-xs text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">Catatan Produksi:</label>
                  <textarea
                    rows={2}
                    value={catatanProduksi}
                    onChange={(e) => setCatatanProduksi(e.target.value)}
                    placeholder="- Detail cetakan tajam&#10;- Bebas noda tinta"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-2.5 rounded-xl outline-none font-medium text-xs text-slate-700 dark:text-slate-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-amber-600 dark:text-amber-400 mb-1 uppercase">Catatan Darurat / Revisi:</label>
                  <textarea
                    rows={2}
                    value={catatanDarurat}
                    onChange={(e) => setCatatanDarurat(e.target.value)}
                    placeholder="- REVISI kerah nomor 10 jadi V-neck tumpuk."
                    className="w-full bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-xl outline-none font-semibold text-xs text-amber-800 dark:text-amber-300 resize-none"
                  />
                </div>
              </div>

              {fotoMockup && (
                <div className="pt-2">
                  <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Gambar Mockup Yang Terintegrasi:</span>
                  <div className="flex gap-4 items-center">
                    <img
                      src={fotoMockup}
                      alt="mockup target"
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200 bg-white"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=100';
                      }}
                    />
                    <div className="text-[10px] text-slate-400 font-bold">Simulator Mockup berhasil dipasang. SPK akan mencetak dengan mockup ini.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-slate-205 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-803 dark:text-white flex items-center gap-2">
                    👕 Rincian Atribut Pemain & Standard Sizing Baju
                  </h3>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-grow md:flex-none">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      placeholder="Cari No / Nama..."
                      className="w-full md:w-48 pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md"
                  >
                    <ListPlus size={14} /> Tambah Baris
                  </button>
                </div>
              </div>

              {/* DUPLICATE WARNING */}
              {hasDuplicateNumbers && (
                <div className="bg-gradient-to-r from-rose-500/10 to-red-600/10 text-rose-600 dark:text-rose-400 text-xs p-3.5 rounded-2xl border border-rose-300 dark:border-rose-900 flex items-center gap-3.5 font-bold animate-pulse">
                  <ShieldAlert className="w-5 h-5 text-rose-500 animate-bounce" />
                  <div>
                    <span className="font-black text-rose-700 dark:text-rose-300 block">⚠️ PERINGATAN REPLIKASI GERAKAN!</span>
                    Ditemukan nomor punggung yang ganda di dalam antrean input di bawah. Mohon verifikasi kembali kesesuaian list baju!
                  </div>
                </div>
              )}

              {/* Sizing Rows Editor Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
                <table className="w-full text-sm text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-850 dark:bg-slate-950 text-white font-black text-[10px] uppercase tracking-wider text-center">
                      <th className="p-3 w-12">No</th>
                      <th className="p-3 w-24">No. Punggung</th>
                      <th className="p-3 text-left">Nama Punggung (Backname)</th>
                      <th className="p-3 text-left">Nama Dada (Depan)</th>
                      <th className="p-3 w-36">Size</th>
                      <th className="p-3 w-32">Lengan</th>
                      <th className="p-3 w-28">Gender</th>
                      <th className="p-3 text-left">Catatan Individu</th>
                      <th className="p-3 w-12 rounded-tr-lg">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedSizingRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-bold">
                        <td className="p-2.5 text-center text-xs font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.no_player}
                            onChange={(e) => handleSizingFieldChange(idx, 'no_player', e.target.value)}
                            placeholder="-"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2 rounded-lg text-center text-xs font-black text-slate-950 dark:text-white"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.nama_punggung}
                            onChange={(e) => handleSizingFieldChange(idx, 'nama_punggung', e.target.value.toUpperCase())}
                            placeholder="NAMA PUNGGUNG"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2 rounded-lg text-xs font-bold uppercase text-slate-950 dark:text-white"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.nama_player}
                            onChange={(e) => handleSizingFieldChange(idx, 'nama_player', e.target.value.toUpperCase())}
                            placeholder="NAMA DEPAN"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2 rounded-lg text-xs font-bold uppercase text-slate-950 dark:text-white"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={row.size}
                            onChange={(e) => handleSizingFieldChange(idx, 'size', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2 rounded-lg text-xs font-black text-slate-850 dark:text-white"
                          >
                            {sizeOptions.map((sz) => (
                              <option key={sz} value={sz}>
                                {sz}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5">
                          <select
                            value={row.lengan}
                            onChange={(e) => handleSizingFieldChange(idx, 'lengan', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2 rounded-lg text-xs font-bold"
                          >
                            <option value="PENDEK">PENDEK</option>
                            <option value="PANJANG">PANJANG</option>
                          </select>
                        </td>
                        <td className="p-2.5">
                          <select
                            value={row.gender}
                            onChange={(e) => handleSizingFieldChange(idx, 'gender', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2 rounded-lg text-xs font-bold"
                          >
                            <option value="PRIA">PRIA</option>
                            <option value="WANITA">WANITA</option>
                          </select>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.keterangan}
                            onChange={(e) => handleSizingFieldChange(idx, 'keterangan', e.target.value)}
                            placeholder="Keterangan tambahan..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300"
                          />
                        </td>
                        <td className="p-2.5">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="text-slate-400 hover:text-rose-600 font-extrabold text-base focus:outline-none"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sizingRows.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                          Daftar rincian sizing jersey belum ditambahkan. Tekan 'Tambah Baris' untuk memulai inputan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-slate-900 to-slate-700 hover:from-black hover:to-slate-900 dark:from-white dark:to-slate-100 dark:text-slate-900 text-white p-4 font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Check className="w-4 h-4" /> SIMPAN SELURUH SPESIFIKASI & UKURAN SPK PRODUKSI KAKAMI
            </button>
          </form>
        </div>
      )}

      {/* MONITORING LIST SPK REGISTERS */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-805 space-y-4">
        <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          📊 Monitoring Berkas SPK Produksi ({bulan})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 dark:bg-slate-950 text-white text-[10px] uppercase tracking-wider text-center">
                <th className="p-4 w-28 rounded-tl-lg font-semibold">Tgl Order</th>
                <th className="p-4 text-left font-semibold">Nama Project & Pelanggan</th>
                <th className="p-4 w-32 font-semibold">Target Qty</th>
                <th className="p-4 w-40 font-semibold">List Terinput</th>
                <th className="p-4 w-48 font-semibold">Status Berkas</th>
                <th className="p-4 w-36 rounded-tr-lg font-semibold">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-10s dark:divide-slate-806">
              {filteredOrdersList.map((r) => {
                const target = r.jumlah_pcs;
                const terinput = orderItems.filter((i) => i.order_id === r.id).length;
                const isComplete = terinput >= target;

                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 text-center transition-colors">
                    <td className="p-4 text-xs font-mono text-slate-500">{r.tanggal_order}</td>
                    <td className="p-4 text-left">
                      <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">{r.invoice_no}</span>
                      <span className="font-extrabold text-slate-900 dark:text-white block text-xs uppercase">{r.nama_order}</span>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{r.nama_konsumen} ({r.no_telepon || '-'})</div>
                    </td>
                    <td className="p-4 text-slate-800 dark:text-slate-250 font-black text-xs">{target} Pcs</td>
                    <td className="p-4 font-mono font-black text-xs rounded-xl">
                      <span className={`px-2.5 py-1.5 rounded-lg border inline-block min-w-[70px] ${isComplete ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-rose-50 text-rose-700 border-rose-250'}`}>
                        {terinput} / {target}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {isComplete ? (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 rounded px-2.5 py-1 text-[9px] font-black tracking-widest uppercase">
                          BERKAS LENGKAP
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 rounded px-2.5 py-1 text-[9px] font-black tracking-widest uppercase animate-pulse">
                          RINCIAN INDIVIDU KURANG
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrderId(r.id);
                            loadSPKFieldsOfOrder(r, orderItems.filter((i) => i.order_id === r.id));
                            // Scroll to form smoothly
                            document.getElementById('spk-form-box')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl uppercase tracking-wider"
                        >
                          Isi SPK
                        </button>
                        <button
                          onClick={() => handleOpenPrintObj(r)}
                          className="border border-slate-350 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] px-3 py-1.5 rounded-xl uppercase hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                        >
                          SPK
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrdersList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
                    Belum ada orderan masuk di periode {bulan}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RENDER DETAILED HIGH-FIDELITY PRINT PREVIEW SPK DIALOGUE OVERLAY */}
      {showSpkPrintObj && (
        <SpkPrintDocument 
          order={showSpkPrintObj} 
          allItems={orderItems} 
          onClose={() => setShowSpkPrintObj(null)} 
        />
      )}

    </div>
  );
};

export default Spk;
