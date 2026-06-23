import React, { useState, useEffect } from 'react';
import { ShoppingBag, Calendar, User, Phone, Ticket, Layers, Coins, Trash2, Edit2, CheckCircle, PlusSquare, Search, Plus, CreditCard, ChevronRight, X, AlertCircle } from 'lucide-react';
import { getStoredData, saveStoredData, Order, Transaction, OrderItem } from '../lib/storage';
import { SpkPrintDocument } from '../components/SpkPrintDocument';

const OrderPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Page States
  const [bulan, setBulan] = useState('2026-06');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [konsumen, setKonsumen] = useState('');
  const [telepon, setTelepon] = useState('');
  const [namaOrder, setNamaOrder] = useState('');
  const [jenisProduk, setJenisProduk] = useState('Jersey');
  const [hargaSatuan, setHargaSatuan] = useState('');
  const [jumlahPcs, setJumlahPcs] = useState('');
  const [diskon, setDiskon] = useState('0');
  const [dp, setDp] = useState('0');
  const [detail, setDetail] = useState('');

  // Dialog States
  const [showCicilObj, setShowCicilObj] = useState<Order | null>(null);
  const [cicilNominal, setCicilNominal] = useState('');

  // Print Overlays States
  const [showNotaPrintObj, setShowNotaPrintObj] = useState<Order | null>(null);
  const [showSpkPrintObj, setShowSpkPrintObj] = useState<Order | null>(null);

  // Calculator States
  const [showCalc, setShowCalc] = useState(false);
  const [calcBase, setCalcBase] = useState('100000');
  const [calcNego, setCalcNego] = useState('0');
  const [autoApplyLive, setAutoApplyLive] = useState(false);
  const [autoAppendNotes, setAutoAppendNotes] = useState(true);

  // Variations states
  const [vPanjangChecked, setVPanjangChecked] = useState(false);
  const [vPanjangQty, setVPanjangQty] = useState('0');
  const [vPanjangVal, setVPanjangVal] = useState('15000');

  const [vKaretChecked, setVKaretChecked] = useState(false);
  const [vKaretQty, setVKaretQty] = useState('0');
  const [vKaretVal, setVKaretVal] = useState('5000');

  const [v2xlChecked, setV2xlChecked] = useState(false);
  const [v2xlQty, setV2xlQty] = useState('0');
  const [v2xlVal, setV2xlVal] = useState('5000');

  const [v3xlChecked, setV3xlChecked] = useState(false);
  const [v3xlQty, setV3xlQty] = useState('0');
  const [v3xlVal, setV3xlVal] = useState('10000');

  const [v4xlChecked, setV4xlChecked] = useState(false);
  const [v4xlQty, setV4xlQty] = useState('0');
  const [v4xlVal, setV4xlVal] = useState('15000');

  const [v5xlChecked, setV5xlChecked] = useState(false);
  const [v5xlQty, setV5xlQty] = useState('0');
  const [v5xlVal, setV5xlVal] = useState('20000');

  const [vKerahChecked, setVKerahChecked] = useState(false);
  const [vKerahQty, setVKerahQty] = useState('0');
  const [vKerahVal, setVKerahVal] = useState('5000');

  const [vCustomChecked, setVCustomChecked] = useState(false);
  const [vCustomDesc, setVCustomDesc] = useState('Bordir Komputer');
  const [vCustomQty, setVCustomQty] = useState('0');
  const [vCustomVal, setVCustomVal] = useState('10000');

  const [vLainnyaChecked, setVLainnyaChecked] = useState(false);
  const [vLainnyaDesc, setVLainnyaDesc] = useState('Kerah Zipper / Custom Kain');
  const [vLainnyaQty, setVLainnyaQty] = useState('0');
  const [vLainnyaVal, setVLainnyaVal] = useState('15000');

  // Parser helper to reconstruct calculator from string details on edit
  const parseDetailPesananToCalculator = (text: string) => {
    // Reset calculator first
    setVPanjangChecked(false); setVPanjangQty('0');
    setVKaretChecked(false); setVKaretQty('0');
    setV2xlChecked(false); setV2xlQty('0');
    setV3xlChecked(false); setV3xlQty('0');
    setV4xlChecked(false); setV4xlQty('0');
    setV5xlChecked(false); setV5xlQty('0');
    setVKerahChecked(false); setVKerahQty('0');
    setVCustomChecked(false); setVCustomQty('0');
    setVLainnyaChecked(false); setVLainnyaQty('0');
    setCalcNego('0');

    if (!text) return;

    // Retrieve base price info
    const baseMatch = text.match(/Harga Dasar:\s*Rp\s*([\d\.]+)/i);
    if (baseMatch) {
      setCalcBase(baseMatch[1].replace(/\./g, ''));
    }

    // Retrieve nego info
    const negoMatch = text.match(/Nego\/Diskon:\s*-Rp\s*([\d\.]+)/i);
    if (negoMatch) {
      setCalcNego(negoMatch[1].replace(/\./g, ''));
    }

    const listMap = [
      { label: 'Lengan Panjang', check: setVPanjangChecked, setQty: setVPanjangQty, setVal: setVPanjangVal },
      { label: 'Rib Karet Manset', check: setVKaretChecked, setQty: setVKaretQty, setVal: setVKaretVal },
      { label: 'Size 2XL', check: setV2xlChecked, setQty: setV2xlQty, setVal: setV2xlVal },
      { label: 'Size 3XL', check: setV3xlChecked, setQty: setV3xlQty, setVal: setV3xlVal },
      { label: 'Size 4XL', check: setV4xlChecked, setQty: setV4xlQty, setVal: setV4xlVal },
      { label: 'Size 5XL', check: setV5xlChecked, setQty: setV5xlQty, setVal: setV5xlVal },
      { label: 'Kerah Polo/Custom', check: setVKerahChecked, setQty: setVKerahQty, setVal: setVKerahVal }
    ];

    const lines = text.split('\n');
    lines.forEach((line) => {
      const match = line.match(/^\-\s*(.*?):\s*(\d+)\s*pcs\s*x\s*Rp\s*([\d\.]+)\s*=\s*Rp\s*([\d\.]+)/i);
      if (match) {
        const name = match[1].trim();
        const qty = match[2];
        const price = match[3].replace(/\./g, '');

        let matched = false;
        listMap.forEach((item) => {
          if (item.label.toLowerCase() === name.toLowerCase()) {
            item.check(true);
            item.setQty(qty);
            item.setVal(price);
            matched = true;
          }
        });

        if (!matched) {
          if (name.toLowerCase().includes('custom') || name.toLowerCase().includes('bordir')) {
            setVCustomChecked(true);
            setVCustomDesc(name);
            setVCustomQty(qty);
            setVCustomVal(price);
          } else {
            setVLainnyaChecked(true);
            setVLainnyaDesc(name);
            setVLainnyaQty(qty);
            setVLainnyaVal(price);
          }
        }
      }
    });
  };

  const hitungKalkulatorLive = () => {
    const base = parseFloat(calcBase) || 0;
    const nego = parseFloat(calcNego) || 0;
    const mainQty = parseFloat(jumlahPcs) || 1;

    let totalSurcharge = 0;
    if (vPanjangChecked && parseFloat(vPanjangQty) > 0) totalSurcharge += parseFloat(vPanjangQty) * (parseFloat(vPanjangVal) || 0);
    if (vKaretChecked && parseFloat(vKaretQty) > 0) totalSurcharge += parseFloat(vKaretQty) * (parseFloat(vKaretVal) || 0);
    if (v2xlChecked && parseFloat(v2xlQty) > 0) totalSurcharge += parseFloat(v2xlQty) * (parseFloat(v2xlVal) || 0);
    if (v3xlChecked && parseFloat(v3xlQty) > 0) totalSurcharge += parseFloat(v3xlQty) * (parseFloat(v3xlVal) || 0);
    if (v4xlChecked && parseFloat(v4xlQty) > 0) totalSurcharge += parseFloat(v4xlQty) * (parseFloat(v4xlVal) || 0);
    if (v5xlChecked && parseFloat(v5xlQty) > 0) totalSurcharge += parseFloat(v5xlQty) * (parseFloat(v5xlVal) || 0);
    if (vKerahChecked && parseFloat(vKerahQty) > 0) totalSurcharge += parseFloat(vKerahQty) * (parseFloat(vKerahVal) || 0);
    if (vCustomChecked && parseFloat(vCustomQty) > 0) totalSurcharge += parseFloat(vCustomQty) * (parseFloat(vCustomVal) || 0);
    if (vLainnyaChecked && parseFloat(vLainnyaQty) > 0) totalSurcharge += parseFloat(vLainnyaQty) * (parseFloat(vLainnyaVal) || 0);

    const avgSurcharge = Math.round(totalSurcharge / mainQty);
    const finalUnit = Math.max(0, base + avgSurcharge - nego);

    return { totalSurcharge, avgSurcharge, finalUnit };
  };

  const terapkanHargaKeSatuan = () => {
    const { totalSurcharge, avgSurcharge, finalUnit } = hitungKalkulatorLive();
    setHargaSatuan(finalUnit.toString());

    const specsLine: string[] = [];
    const base = parseFloat(calcBase) || 0;
    const nego = parseFloat(calcNego) || 0;
    const mainQty = parseFloat(jumlahPcs) || 1;

    const addSpec = (checked: boolean, label: string, qtyStr: string, valStr: string) => {
      const q = parseFloat(qtyStr) || 0;
      const v = parseFloat(valStr) || 0;
      if (checked && q > 0) {
        specsLine.push(`- ${label}: ${q} pcs x Rp ${v.toLocaleString('id-ID')} = Rp ${(q * v).toLocaleString('id-ID')}`);
      }
    };

    addSpec(vPanjangChecked, 'Lengan Panjang', vPanjangQty, vPanjangVal);
    addSpec(vKaretChecked, 'Rib Karet Manset', vKaretQty, vKaretVal);
    addSpec(v2xlChecked, 'Size 2XL', v2xlQty, v2xlVal);
    addSpec(v3xlChecked, 'Size 3XL', v3xlQty, v3xlVal);
    addSpec(v4xlChecked, 'Size 4XL', v4xlQty, v4xlVal);
    addSpec(v5xlChecked, 'Size 5XL', v5xlQty, v5xlVal);
    addSpec(vKerahChecked, 'Kerah Polo/Custom', vKerahQty, vKerahVal);
    addSpec(vCustomChecked, vCustomDesc.trim() || 'Custom', vCustomQty, vCustomVal);
    addSpec(vLainnyaChecked, vLainnyaDesc.trim() || 'Lainnya', vLainnyaQty, vLainnyaVal);

    let cleanDetail = detail.trim();
    cleanDetail = cleanDetail.replace(/\*Rincian Variasi Harga:\*[\s\S]*?========================/g, '').trim();

    if (autoAppendNotes && specsLine.length > 0) {
      const specBlock = `*Rincian Variasi Harga:*
${specsLine.join('\n')}
----------------------------------------
Harga Dasar: Rp ${base.toLocaleString('id-ID')}/pcs
Variasi Tambahan: +Rp ${totalSurcharge.toLocaleString('id-ID')} (Rata-rata: +Rp ${avgSurcharge.toLocaleString('id-ID')}/pcs)
${nego > 0 ? `Nego/Diskon: -Rp ${nego.toLocaleString('id-ID')}/pcs\n` : ''}Harga Satuan Rata-rata: Rp ${finalUnit.toLocaleString('id-ID')}/pcs
========================`;

      setDetail(cleanDetail ? `${cleanDetail}\n\n${specBlock}` : specBlock);
    } else {
      setDetail(cleanDetail);
    }

    alert('Harga satuan dan rincian spesifikasi berhasil disinkronisasikan ke form!');
  };

  // Auto-suggest consumer list
  const [suggestedCustomers, setSuggestedCustomers] = useState<{ nama: string; telepon: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const data = getStoredData();
    setOrders(data.orders);
    setTransactions(data.transactions);
    setOrderItems(data.orderItems);

    // Prep customer suggestions
    const custs: { [key: string]: string } = {};
    data.orders.forEach((o) => {
      if (o.nama_konsumen) {
        custs[o.nama_konsumen.trim()] = o.no_telepon || '';
      }
    });
    setSuggestedCustomers(Object.entries(custs).map(([nama, telepon]) => ({ nama, telepon })));
  }, []);

  const syncData = (newOrders: Order[], newTx = transactions, newItems = orderItems) => {
    setOrders(newOrders);
    setTransactions(newTx);
    setOrderItems(newItems);
    saveStoredData(newOrders, newItems, newTx);
  };

  // Autocalculate totals
  const currentHargaSatuan = parseFloat(hargaSatuan) || 0;
  const currentJumlahPcs = parseFloat(jumlahPcs) || 0;
  const currentDiskon = parseFloat(diskon) || 0;
  const computedTotal = Math.max(0, currentHargaSatuan * currentJumlahPcs - currentDiskon);

  // Handle Order Add / Update
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !konsumen || !namaOrder || !hargaSatuan || !jumlahPcs) {
      alert('Mohon lengkapi kolom yang bertanda bintang (*)!');
      return;
    }

    const sat = parseFloat(hargaSatuan);
    const pcs = parseFloat(jumlahPcs);
    const disk = parseFloat(diskon) || 0;
    const dpVal = parseFloat(dp) || 0;

    const totalVal = Math.max(0, sat * pcs - disk);
    const status_bayar = dpVal >= totalVal ? 'Lunas' : 'DP';

    if (editingId) {
      // Edit existing order
      const updatedOrders = orders.map((o) => {
        if (o.id === editingId) {
          return {
            ...o,
            tanggal_order: tanggal,
            nama_konsumen: konsumen,
            no_telepon: telepon,
            nama_order: namaOrder,
            jenis_produk: jenisProduk,
            harga_satuan: sat,
            jumlah_pcs: pcs,
            diskon: disk,
            total_harga: totalVal,
            dp: dpVal,
            detail_pesanan: detail,
            status_bayar: status_bayar as any,
          };
        }
        return o;
      });

      syncData(updatedOrders);
      alert('Order berhasil diperbaharui!');
      setEditingId(null);
    } else {
      // Add new order
      const newId = Date.now();
      const invoice = `INV/${new Date().toISOString().replace(/T/, '').replace(/[-:]/g, '').substring(0, 8)}${Math.floor(100 + Math.random() * 900)}`;

      const newOrder: Order = {
        id: newId,
        invoice_no: invoice,
        tanggal_order: tanggal,
        nama_konsumen: konsumen,
        no_telepon: telepon,
        nama_order: namaOrder,
        jenis_produk: jenisProduk,
        harga_satuan: sat,
        jumlah_pcs: pcs,
        diskon: disk,
        total_harga: totalVal,
        dp: dpVal,
        detail_pesanan: detail,
        status_bayar: status_bayar as any,
        status_tracking: 'DP',
      };

      const updatedOrders = [newOrder, ...orders];

      // Add a financial transaction if down payment is specified
      let updatedTx = [...transactions];
      if (dpVal > 0) {
        const newTx: Transaction = {
          id: Date.now(),
          jenis: 'Pemasukan',
          kategori: 'DP Order',
          nominal: dpVal,
          tanggal: tanggal,
          keterangan: `DP Order ${invoice} - ${konsumen} (${namaOrder})`,
        };
        updatedTx = [...updatedTx, newTx];
      }

      syncData(updatedOrders, updatedTx);
      alert('Order baru berhasil diinput!');
    }

    // Reset Form
    handleResetForm();
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTanggal(new Date().toISOString().split('T')[0]);
    setKonsumen('');
    setTelepon('');
    setNamaOrder('');
    setJenisProduk('Jersey');
    setHargaSatuan('');
    setJumlahPcs('');
    setDiskon('0');
    setDp('0');
    setDetail('');
    // Reset calculator as well
    setVPanjangChecked(false); setVPanjangQty('0');
    setVKaretChecked(false); setVKaretQty('0');
    setV2xlChecked(false); setV2xlQty('0');
    setV3xlChecked(false); setV3xlQty('0');
    setV4xlChecked(false); setV4xlQty('0');
    setV5xlChecked(false); setV5xlQty('0');
    setVKerahChecked(false); setVKerahQty('0');
    setVCustomChecked(false); setVCustomQty('0');
    setVLainnyaChecked(false); setVLainnyaQty('0');
    setCalcBase('100000');
    setCalcNego('0');
  };

  // Load Order to Form for Editing
  const handleLoadEdit = (o: Order) => {
    setEditingId(o.id);
    setTanggal(o.tanggal_order);
    setKonsumen(o.nama_konsumen);
    setTelepon(o.no_telepon || '');
    setNamaOrder(o.nama_order);
    setJenisProduk(o.jenis_produk);
    setHargaSatuan(o.harga_satuan.toString());
    setJumlahPcs(o.jumlah_pcs.toString());
    setDiskon(o.diskon.toString());
    setDp(o.dp.toString());
    setDetail(o.detail_pesanan || '');
    // Parse order detail text to restore calculator state
    parseDetailPesananToCalculator(o.detail_pesanan || '');
  };

  // Delete Order
  const handleDeleteOrder = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus order ini secara permanen?')) {
      const updated = orders.filter((o) => o.id !== id);
      const updatedItems = orderItems.filter((item) => item.order_id !== id);
      syncData(updated, transactions, updatedItems);
    }
  };

  // Quick Installment Payment
  const handlePayInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCicilObj) return;

    const cicil = parseFloat(cicilNominal);
    const sisa = showCicilObj.total_harga - showCicilObj.dp;

    if (isNaN(cicil) || cicil <= 0) {
      alert('Mohon masukkan nominal cicilan valid!');
      return;
    }

    const bayarValid = Math.min(cicil, sisa);

    const updatedOrders = orders.map((o) => {
      if (o.id === showCicilObj.id) {
        const newDp = o.dp + bayarValid;
        const status_bayar = newDp >= o.total_harga ? 'Lunas' : 'DP';
        return {
          ...o,
          dp: newDp,
          status_bayar: status_bayar as any,
        };
      }
      return o;
    });

    // Write cash transaction of installment path
    const newTx: Transaction = {
      id: Date.now(),
      jenis: 'Pemasukan',
      kategori: 'Cicilan',
      nominal: bayarValid,
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: `Cicilan Pembayaran: ${showCicilObj.invoice_no} (${showCicilObj.nama_konsumen})`,
    };

    const updatedTransactions = [...transactions, newTx];
    syncData(updatedOrders, updatedTransactions);

    alert(`Pembayaran cicilan Rp ${bayarValid.toLocaleString('id-ID')} tersimpan!`);
    setShowCicilObj(null);
    setCicilNominal('');
  };

  // Filter List
  const filteredOrders = orders
    .filter((o) => o.tanggal_order.startsWith(bulan))
    .filter(
      (o) =>
        o.nama_konsumen.toLowerCase().includes(search.toLowerCase()) ||
        o.nama_order.toLowerCase().includes(search.toLowerCase()) ||
        o.invoice_no.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex-grow flex flex-col gap-6">
      {/* Month Filter Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 w-full gap-4 shadow-sm">
        <div>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-605 dark:text-indigo-400" /> Manajer Nota Orderan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Input nota baru, kelola piutang cicilan, dan rekam rincian pesanan pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-705">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 pl-2 uppercase tracking-wide">Filter Periode:</label>
          <input
            type="month"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 px-3 py-1.5 rounded-xl border-none outline-none text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Form column (width 1/3) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/30 dark:shadow-none space-y-4">
          <h3 className="text-base font-extrabold border-b pb-3 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <PlusSquare className="w-5 h-5 text-indigo-550" /> {editingId ? 'Edit Rincian Nota Order' : 'Input Nota Baru'}
          </h3>
          <form className="space-y-4 text-xs font-bold" onSubmit={handleSubmitOrder}>
            {/* Tanggal */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Tanggal Pesanan *</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-slate-900 text-slate-805 dark:text-slate-200"
                required
              />
            </div>

            {/* Konsumen */}
            <div className="relative">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Nama Konsumen *</label>
              <input
                type="text"
                placeholder="Nama pemesan..."
                value={konsumen}
                onChange={(e) => {
                  setKonsumen(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-slate-900 text-slate-805 dark:text-slate-200"
                required
              />
              {/* suggestions drawer */}
              {showSuggestions && suggestedCustomers.length > 0 && (
                <div className="absolute left-0 right-0 z-30 mt-1 bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-700 rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {suggestedCustomers
                    .filter((c) => c.nama.toLowerCase().includes(konsumen.toLowerCase()))
                    .map((item) => (
                      <button
                        key={item.nama}
                        type="button"
                        onClick={() => {
                          setKonsumen(item.nama);
                          setTelepon(item.telepon);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors uppercase text-[10px] font-black"
                      >
                        {item.nama} {item.telepon && `(${item.telepon})`}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="w-full text-center p-1 bg-slate-50 hover:bg-slate-100 text-[9px] text-slate-400 font-bold"
                  >
                    Tutup Saran
                  </button>
                </div>
              )}
            </div>

            {/* Telepon */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">No. Handphone WA</label>
              <input
                type="text"
                placeholder="Contoh: 081234xxx"
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-slate-900 text-slate-805 dark:text-slate-200 font-mono"
              />
            </div>

            {/* Nama Order */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Nama Order Pekerjaan *</label>
              <input
                type="text"
                placeholder="Contoh: Jersey Antigravity FC"
                value={namaOrder}
                onChange={(e) => setNamaOrder(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-slate-900 text-slate-805 dark:text-slate-200"
                required
              />
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Jenis Produk</label>
                <select
                  value={jenisProduk}
                  onChange={(e) => setJenisProduk(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900 text-slate-805 dark:text-slate-200"
                >
                  <option value="Jersey">Jersey</option>
                  <option value="Jaket">Jaket</option>
                  <option value="Kemeja">Kemeja</option>
                  <option value="Kaos">Kaos</option>
                  <option value="Celana">Celana</option>
                  <option value="Polo">Polo</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Jumlah Pcs *</label>
                <input
                  type="number"
                  placeholder="e.g. 12"
                  value={jumlahPcs}
                  onChange={(e) => setJumlahPcs(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Harga Satuan IDR *</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={hargaSatuan}
                  onChange={(e) => setHargaSatuan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Potongan Diskon</label>
                <input
                  type="number"
                  value={diskon}
                  onChange={(e) => setDiskon(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>

            {/* PRICING CALCULATOR ASSISTANT COLLAPSIBLE SECTOR */}
            <div className="border border-indigo-150/45 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setShowCalc(!showCalc)}
                className="w-full flex justify-between items-center px-4 py-3 bg-gradient-to-r from-indigo-50/60 to-indigo-100/30 dark:from-slate-800 dark:to-slate-700/60 hover:from-indigo-100/50 hover:to-indigo-150/30 text-left transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black tracking-wide text-indigo-700 dark:text-indigo-400">🎛️ ASISTEN HITUNG VARIASI HARGA & SPEK</span>
                </div>
                <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-850 border border-indigo-150 dark:border-slate-705 px-2 py-0.5 rounded-md shadow-sm">
                  {showCalc ? 'Tutup ✕' : 'Buka Asisten 🗃️'}
                </span>
              </button>

              {showCalc && (
                <div className="p-4 space-y-4 animate-in slide-in-from-top-3 duration-250 border-t border-slate-200/50 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
                    <div>
                      <label className="text-[9px] font-black text-indigo-505 uppercase block mb-1">Harga Dasar Pola Standar</label>
                      <input
                        type="number"
                        value={calcBase}
                        onChange={(e) => setCalcBase(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs font-mono text-indigo-605 dark:text-indigo-400 font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-indigo-505 uppercase block mb-1 font-sans">Nego/Diskon per pcs</label>
                      <input
                        type="number"
                        value={calcNego}
                        onChange={(e) => setCalcNego(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs font-mono text-rose-600 font-bold outline-none"
                      />
                    </div>
                  </div>

                  {/* Variation Lists */}
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block border-b pb-1">Surcharge Tambahan Variasi</span>

                    {/* Lengan Panjang */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold shadow-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={vPanjangChecked} onChange={(e) => setVPanjangChecked(e.target.checked)} className="rounded text-indigo-650" />
                        <span className="text-slate-800 dark:text-slate-350">Lengan Panjang</span>
                      </label>
                      {vPanjangChecked && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <input type="number" placeholder="Qty" value={vPanjangQty} onChange={(e) => setVPanjangQty(e.target.value)} className="w-14 p-1.5 text-center bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px]" />
                          <span className="text-[10px] text-slate-400">pcs x Rp</span>
                          <input type="number" value={vPanjangVal} onChange={(e) => setVPanjangVal(e.target.value)} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px] font-mono text-slate-650" />
                        </div>
                      )}
                    </div>

                    {/* Rib Manset */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold shadow-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={vKaretChecked} onChange={(e) => setVKaretChecked(e.target.checked)} className="rounded text-indigo-650" />
                        <span className="text-slate-800 dark:text-slate-350">Rib Karet Manset</span>
                      </label>
                      {vKaretChecked && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <input type="number" placeholder="Qty" value={vKaretQty} onChange={(e) => setVKaretQty(e.target.value)} className="w-14 p-1.5 text-center bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px]" />
                          <span className="text-[10px] text-slate-400">pcs x Rp</span>
                          <input type="number" value={vKaretVal} onChange={(e) => setVKaretVal(e.target.value)} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px] font-mono text-slate-650" />
                        </div>
                      )}
                    </div>

                    {/* Size 2XL */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold shadow-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={v2xlChecked} onChange={(e) => setV2xlChecked(e.target.checked)} className="rounded text-indigo-650" />
                        <span className="text-slate-800 dark:text-slate-350">Size 2XL</span>
                      </label>
                      {v2xlChecked && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <input type="number" placeholder="Qty" value={v2xlQty} onChange={(e) => setV2xlQty(e.target.value)} className="w-14 p-1.5 text-center bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px]" />
                          <span className="text-[10px] text-slate-400">pcs x Rp</span>
                          <input type="number" value={v2xlVal} onChange={(e) => setV2xlVal(e.target.value)} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px] font-mono text-slate-650" />
                        </div>
                      )}
                    </div>

                    {/* Size 3XL */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold shadow-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={v3xlChecked} onChange={(e) => setV3xlChecked(e.target.checked)} className="rounded text-indigo-650" />
                        <span className="text-slate-800 dark:text-slate-350">Size 3XL</span>
                      </label>
                      {v3xlChecked && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <input type="number" placeholder="Qty" value={v3xlQty} onChange={(e) => setV3xlQty(e.target.value)} className="w-14 p-1.5 text-center bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px]" />
                          <span className="text-[10px] text-slate-400">pcs x Rp</span>
                          <input type="number" value={v3xlVal} onChange={(e) => setV3xlVal(e.target.value)} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px] font-mono text-slate-650" />
                        </div>
                      )}
                    </div>

                    {/* Size 4XL */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold shadow-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={v4xlChecked} onChange={(e) => setV4xlChecked(e.target.checked)} className="rounded text-indigo-650" />
                        <span className="text-slate-800 dark:text-slate-350">Size 4XL</span>
                      </label>
                      {v4xlChecked && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <input type="number" placeholder="Qty" value={v4xlQty} onChange={(e) => setV4xlQty(e.target.value)} className="w-14 p-1.5 text-center bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px]" />
                          <span className="text-[10px] text-slate-400">pcs x Rp</span>
                          <input type="number" value={v4xlVal} onChange={(e) => setV4xlVal(e.target.value)} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px] font-mono text-slate-650" />
                        </div>
                      )}
                    </div>

                    {/* Size 5XL */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold shadow-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={v5xlChecked} onChange={(e) => setV5xlChecked(e.target.checked)} className="rounded text-indigo-650" />
                        <span className="text-slate-800 dark:text-slate-350">Size 5XL</span>
                      </label>
                      {v5xlChecked && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <input type="number" placeholder="Qty" value={v5xlQty} onChange={(e) => setV5xlQty(e.target.value)} className="w-14 p-1.5 text-center bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px]" />
                          <span className="text-[10px] text-slate-400">pcs x Rp</span>
                          <input type="number" value={v5xlVal} onChange={(e) => setV5xlVal(e.target.value)} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px] font-mono text-slate-650" />
                        </div>
                      )}
                    </div>

                    {/* Kerah Custom */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold shadow-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={vKerahChecked} onChange={(e) => setVKerahChecked(e.target.checked)} className="rounded text-indigo-650" />
                        <span className="text-slate-800 dark:text-slate-350">Kerah Polo/Custom</span>
                      </label>
                      {vKerahChecked && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <input type="number" placeholder="Qty" value={vKerahQty} onChange={(e) => setVKerahQty(e.target.value)} className="w-14 p-1.5 text-center bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px]" />
                          <span className="text-[10px] text-slate-400">pcs x Rp</span>
                          <input type="number" value={vKerahVal} onChange={(e) => setVKerahVal(e.target.value)} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px] font-mono text-slate-650" />
                        </div>
                      )}
                    </div>

                    {/* Custom Spec */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold shadow-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={vCustomChecked} onChange={(e) => setVCustomChecked(e.target.checked)} className="rounded text-indigo-650" />
                        <input type="text" value={vCustomDesc} onChange={(e) => setVCustomDesc(e.target.value)} className="bg-transparent border-b border-dashed border-slate-200 outline-none text-xs text-slate-850 dark:text-slate-300 font-extrabold w-36 px-1" />
                      </label>
                      {vCustomChecked && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <input type="number" placeholder="Qty" value={vCustomQty} onChange={(e) => setVCustomQty(e.target.value)} className="w-14 p-1.5 text-center bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px]" />
                          <span className="text-[10px] text-slate-400">pcs x Rp</span>
                          <input type="number" value={vCustomVal} onChange={(e) => setVCustomVal(e.target.value)} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px] font-mono text-slate-650" />
                        </div>
                      )}
                    </div>

                    {/* Lainnya */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold shadow-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={vLainnyaChecked} onChange={(e) => setVLainnyaChecked(e.target.checked)} className="rounded text-indigo-650" />
                        <input type="text" value={vLainnyaDesc} onChange={(e) => setVLainnyaDesc(e.target.value)} className="bg-transparent border-b border-dashed border-slate-200 outline-none text-xs text-slate-850 dark:text-slate-300 font-extrabold w-36 px-1" />
                      </label>
                      {vLainnyaChecked && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <input type="number" placeholder="Qty" value={vLainnyaQty} onChange={(e) => setVLainnyaQty(e.target.value)} className="w-14 p-1.5 text-center bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px]" />
                          <span className="text-[10px] text-slate-400">pcs x Rp</span>
                          <input type="number" value={vLainnyaVal} onChange={(e) => setVLainnyaVal(e.target.value)} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 text-[11px] font-mono text-slate-650" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculations breakdown live info */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-2xl border border-indigo-100/50 space-y-1.5 font-bold text-xs">
                    <div className="flex justify-between items-center text-[10px] text-indigo-600/80 dark:text-indigo-400/85">
                      <span>Harga Dasar Pola:</span>
                      <span className="font-mono text-slate-900 dark:text-white">Rp {(parseFloat(calcBase) || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-indigo-600/80 dark:text-indigo-400/85">
                      <span>Total Surcharge:</span>
                      <span className="font-mono text-emerald-605Dark text-emerald-600">+Rp {(hitungKalkulatorLive().totalSurcharge).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-indigo-600/80 dark:text-indigo-400/85">
                      <span>Rata-rata Surcharge per Pcs:</span>
                      <span className="font-mono text-emerald-600 font-black">+Rp {hitungKalkulatorLive().avgSurcharge.toLocaleString('id-ID')}</span>
                    </div>
                    {parseFloat(calcNego) > 0 && (
                      <div className="flex justify-between items-center text-[10px] text-rose-500">
                        <span>Potongan Nego per pcs:</span>
                        <span className="font-mono">-Rp {(parseFloat(calcNego) || 0).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-indigo-950 dark:text-indigo-450 border-t border-indigo-150/55 dark:border-indigo-900/60 pt-1.5 font-black">
                      <span>Rekomendasi Harga Satuan:</span>
                      <span className="font-mono text-indigo-705 dark:text-indigo-400">Rp {hitungKalkulatorLive().finalUnit.toLocaleString('id-ID')}/pcs</span>
                    </div>
                  </div>

                  {/* Apply Actions */}
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 cursor-pointer pl-1 leading-none">
                      <input type="checkbox" checked={autoAppendNotes} onChange={(e) => setAutoAppendNotes(e.target.checked)} className="rounded text-indigo-650" />
                      <span>Otomatis rincikan kalkulasi ke Catatan Detail Spek</span>
                    </label>
                    <button
                      type="button"
                      onClick={terapkanHargaKeSatuan}
                      className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[11px] py-2.5 rounded-xl uppercase tracking-wider transition-all transform active:scale-[0.98] shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1"
                    >
                      Terapkan & Tulis Variasi Ke Form ✓
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Calculations Indicator */}
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 font-bold">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Total Bruto:</span>
                <span className="font-mono">{(currentHargaSatuan * currentJumlahPcs).toLocaleString('id-ID')} IDR</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Potongan Diskon:</span>
                <span className="font-mono text-rose-500">-{currentDiskon.toLocaleString('id-ID')} IDR</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-800 dark:text-white font-extrabold pt-1 border-t border-slate-200/50 dark:border-slate-800/80">
                <span>Nilai Netto Akhir:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">Rp {computedTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* DP & Detail */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Pembayaran DP (Down Payment)</label>
                <input
                  type="number"
                  value={dp}
                  onChange={(e) => setDp(e.target.value)}
                  disabled={!!editingId} // Disable editing DP directly to avoid dual transaction entries, tell them to use cicilan!
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900 font-mono disabled:opacity-60"
                />
                {editingId && <p className="text-[9px] text-slate-400 mt-1 font-semibold">Gunakan fitur "Bayar Cicilan" di tabel untuk mencicil pelunasan.</p>}
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Catatan Detail Spek Pesanan</label>
                <textarea
                  placeholder="Keterangan spek kain, sablon, bordir, dsb..."
                  rows={2}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
                />
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 bg-slate-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-black/10"
              >
                {editingId ? 'Update Nota' : 'Simpan Order'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 p-3 rounded-xl font-bold hover:bg-slate-200 text-xs"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List columns (width 2/3) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/30 dark:shadow-none xl:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 border-slate-100 dark:border-slate-700">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" /> Log Transaksi Nota (Bulan {bulan})
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-700 shadow-inner w-full sm:w-60">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari invoice atau nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 w-full placeholder-slate-400 font-semibold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                  <th className="p-4 font-extrabold text-left rounded-tl-xl w-32">Invoice Info</th>
                  <th className="p-4 font-extrabold text-left">Nama Order / Spek</th>
                  <th className="p-4 font-extrabold text-right">Rincian Keuangan</th>
                  <th className="p-4 font-extrabold text-center">Status</th>
                  <th className="p-4 font-extrabold text-center rounded-tr-xl w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-705">
                {filteredOrders.map((o) => {
                  const sisaTagihan = o.total_harga - o.dp;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-xs text-center">
                      <td className="p-4 text-left">
                        <div className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">{o.invoice_no}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-0.5">{o.nama_konsumen}</div>
                        <div className="text-[9px] text-slate-400 mt-1 font-sans">{o.tanggal_order}</div>
                      </td>
                      <td className="p-4 text-left max-w-xs">
                        <div className="font-extrabold text-slate-800 dark:text-slate-200 uppercase">{o.nama_order}</div>
                        <div className="flex gap-1 flex-wrap mt-1">
                          <span className="bg-slate-100 dark:bg-slate-800 text-[8px] text-slate-500 dark:text-slate-450 px-1.5 py-0.2 rounded font-black tracking-wide uppercase">
                            {o.jenis_produk}
                          </span>
                          <span className="bg-indigo-50 dark:bg-indigo-950/20 text-[9px] text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded font-black tracking-wide">
                            {o.jumlah_pcs} Pcs
                          </span>
                        </div>
                        {o.detail_pesanan && <p className="text-[9.5px] italic text-slate-400 font-medium mt-1 truncate max-w-[200px]">{o.detail_pesanan}</p>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-black text-slate-900 dark:text-slate-100 font-mono text-xs">Total: Rp {o.total_harga.toLocaleString('id-ID')}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-450 mt-0.5">DP: Rp {o.dp.toLocaleString('id-ID')}</div>
                        {sisaTagihan > 0 ? (
                          <div className="text-[10px] text-rose-500 font-bold mt-0.5">Sisa: Rp {sisaTagihan.toLocaleString('id-ID')}</div>
                        ) : (
                          <div className="text-[9px] font-black tracking-widest text-emerald-600 dark:text-emerald-450 uppercase flex items-center gap-0.5 justify-end mt-0.5 animate-pulse-slow">
                            <CheckCircle size={10} /> LUNAS
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {o.status_bayar === 'Lunas' ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900 px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase">
                            LUNAS
                          </span>
                        ) : (
                          <span className="bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900 px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase animate-pulse">
                            DP
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* edit btn */}
                          <button
                            onClick={() => handleLoadEdit(o)}
                            title="Edit Data"
                            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700 transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>

                          {/* Cetak Nota */}
                          <button
                            onClick={() => setShowNotaPrintObj(o)}
                            title="Cetak Nota Kecil (Invoices)"
                            className="bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-600 hover:text-white p-2 rounded-xl transition-all"
                          >
                            <CreditCard size={12} />
                          </button>

                          {/* Cetak SPK */}
                          <button
                            onClick={() => setShowSpkPrintObj(o)}
                            title="Cetak SPK Kerja (SPK)"
                            className="bg-purple-50 text-purple-650 border border-purple-205 hover:bg-purple-650 hover:text-white p-2 rounded-xl transition-all"
                          >
                            <Layers size={11} />
                          </button>

                          {/* payment installment btn */}
                          {sisaTagihan > 0 && (
                            <button
                              onClick={() => {
                                setShowCicilObj(o);
                                setCicilNominal(sisaTagihan.toString());
                              }}
                              title="Bayar Cicilan"
                              className="bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950 hover:bg-emerald-600 hover:text-white p-2 rounded-xl transition-all"
                            >
                              <Plus size={11} />
                            </button>
                          )}

                          {/* delete btn */}
                          <button
                            onClick={() => handleDeleteOrder(o.id)}
                            title="Hapus Permanen"
                            className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 p-2 rounded-xl transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-430 dark:text-slate-500 font-semibold italic">
                      Tidak ada data orderan terekam di bulan {bulan}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pay installment dialog */}
      {showCicilObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl space-y-4 border border-slate-200/50 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                <Coins size={18} className="text-emerald-500" /> Penerimaan Cicilan
              </h3>
              <button
                onClick={() => setShowCicilObj(null)}
                className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-slate-850 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 font-bold text-xs text-slate-500 dark:text-slate-405">
              <div>
                <span>Nomor Invoice:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 ml-1.5 font-black">{showCicilObj.invoice_no}</span>
              </div>
              <div>
                <span>Nama Klien:</span>
                <span className="text-slate-800 dark:text-slate-200 ml-1.5 font-black uppercase">{showCicilObj.nama_konsumen}</span>
              </div>
              <div className="pt-2 border-t border-slate-250/20 flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>Total Project Belanja:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">Rp {showCicilObj.total_harga.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <span>Sudah Disetor (DP):</span>
                <span className="font-mono font-black">Rp {showCicilObj.dp.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-rose-500 font-extrabold">
                <span>Sisa Tunggakan Piutang:</span>
                <span className="font-mono font-black">Rp {(showCicilObj.total_harga - showCicilObj.dp).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <form onSubmit={handlePayInstallment} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Setoran Nominal Cicilan Baru *</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1000000"
                  value={cicilNominal}
                  onChange={(e) => setCicilNominal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900 font-black font-mono text-slate-850 dark:text-white"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCicilObj(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-805 dark:text-slate-350 px-4 py-2.5 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  Konfirmasi Setoran <ChevronRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETAIL NOTE / INVOICE PRINT PREVIEW OVERLAY */}
      {showNotaPrintObj && (() => {
        const o = showNotaPrintObj;
        const sisaTagihan = o.total_harga - o.dp;
        
        // Helper parsing for lines
        const getNotaLineItems = (order: Order) => {
          const lines: { name: string; qty: number; price: number; subtotal: number }[] = [];
          const detailText = order.detail_pesanan || '';
          const itemsRegex = /\-\s*(.*?):\s*(\d+)\s*pcs\s*x\s*Rp\s*([\d\.]+)/gi;
          
          let match;
          while ((match = itemsRegex.exec(detailText)) !== null) {
            const name = match[1].trim();
            const qty = parseInt(match[2]) || 0;
            const price = parseFloat(match[3].replace(/\./g, '')) || 0;
            lines.push({ name, qty, price, subtotal: qty * price });
          }

          let basePrice = order.harga_satuan;
          const baseMatch = detailText.match(/Harga Dasar:\s*Rp\s*([\d\.]+)/i);
          if (baseMatch) {
            basePrice = parseFloat(baseMatch[1].replace(/\./g, '')) || order.harga_satuan;
          }

          lines.unshift({
            name: `${order.nama_order} (Pola Standar)`,
            qty: order.jumlah_pcs,
            price: basePrice,
            subtotal: order.jumlah_pcs * basePrice
          });

          return lines;
        };

        const listItems = getNotaLineItems(o);
        
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-4 sm:p-6 no-print-overlay">
            <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 self-start my-8 border border-slate-200 flex flex-col space-y-6">
              
              {/* Overlay controller */}
              <div className="flex justify-between items-center border-b pb-4 border-slate-100 no-print">
                <div className="flex items-center gap-1 text-slate-500 font-extrabold text-xs uppercase">
                  <span>Nota & Invoice Pembayaran</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] px-4 py-2 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                  >
                    <PlusSquare size={13} /> Print Cetak
                  </button>
                  <button
                    onClick={() => setShowNotaPrintObj(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 bg-slate-50 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* PRINT AREA CONTAINER */}
              <div id="printable-invoice-container" className="space-y-6 p-4 border border-slate-150 rounded-2xl bg-white text-slate-905">
                
                {/* INVOICE LETTERHEAD */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                  <div>
                    <h2 className="text-xl font-black uppercase text-slate-900 flex items-center gap-1">
                      <span>👕 KAKAMI APPAREL</span>
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold max-w-xs leading-relaxed mt-1">
                      Jl. Terusan Buah Batu No.12, Buahbatu, Kota Bandung, Jawa Barat<br />
                      WA: 0812-3456-7890 | E: apparel.kakami@gmail.com
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded text-[9px] font-black tracking-widest uppercase">
                      Official Invoice
                    </span>
                    <div className="text-xs font-mono font-extrabold text-slate-800 mt-2">{o.invoice_no}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 mt-1">Tanggal: {o.tanggal_order}</div>
                  </div>
                </div>

                {/* BUYER / INFO */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">INFORMASI KELAYAKAN PEMESANAN:</span>
                    <div className="text-slate-900 font-black mt-1 uppercase text-sm">{o.nama_konsumen}</div>
                    <div className="text-slate-500 font-mono mt-0.5">{o.no_telepon || '-'}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">INFO PROJECT UTAMA:</span>
                    <div className="text-slate-900 font-black mt-1 uppercase text-sm">{o.nama_order}</div>
                    <div className="text-indigo-650 font-black mt-0.5 uppercase text-[10px]">{o.jenis_produk} - {o.jumlah_pcs} Pcs</div>
                  </div>
                </div>

                {/* TABLE OF ITEM DETAILS */}
                <table className="w-full text-xs text-left border-collapse border-b-2 border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase font-black border-b border-slate-300">
                      <th className="p-2.5">Deskripsi Spek / Pekerjaan</th>
                      <th className="p-2.5 text-center w-16">Qty</th>
                      <th className="p-2.5 text-right w-24">Harga Satuan</th>
                      <th className="p-2.5 text-right w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {listItems.map((item, idx) => (
                      <tr key={idx} className="font-bold">
                        <td className="p-2.5 font-extrabold text-slate-800 uppercase">{item.name}</td>
                        <td className="p-2.5 text-center font-mono">{item.qty} pcs</td>
                        <td className="p-2.5 text-right font-mono">Rp {item.price.toLocaleString('id-ID')}</td>
                        <td className="p-2.5 text-right font-mono">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* CALCULATION / SUMMARY */}
                <div className="flex justify-end">
                  <div className="w-72 space-y-1.5 text-xs font-bold font-mono">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Total Belanja:</span>
                      <span>Rp {o.total_harga.toLocaleString('id-ID')}</span>
                    </div>
                    {o.diskon > 0 && (
                      <div className="flex justify-between items-center text-rose-500">
                        <span>Potongan Diskon:</span>
                        <span>-Rp {o.diskon.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-900 font-black text-xs border-t pt-1.5">
                      <span>Grand Total / Tagihan:</span>
                      <span>Rp {o.total_harga.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-600 font-black">
                      <span>Setoran Terbayar (DP):</span>
                      <span>Rp {o.dp.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-600 font-black border-b pb-1.5">
                      <span>Sisa Piutang:</span>
                      <span>Rp {sisaTagihan.toLocaleString('id-ID')}</span>
                    </div>
                    
                    <div className="pt-2 text-right">
                      {sisaTagihan <= 0 ? (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 rounded px-3 py-1 font-sans text-[10px] font-black tracking-widest uppercase">
                          LUNAS SEPENUHNYA
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 rounded px-3 py-1 font-sans text-[10px] font-black tracking-widest uppercase">
                          BELUM LUNAS (PEMBAYARAN DP)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SIGNATURE / TERMS */}
                <div className="grid grid-cols-2 gap-4 text-center text-[10px] font-bold text-slate-500 pt-10">
                  <div>
                    <p>Klien Pemesan,</p>
                    <div className="h-16"></div>
                    <p className="underline uppercase text-slate-800 font-black">{o.nama_konsumen}</p>
                  </div>
                  <div>
                    <p>Hormat Kami,</p>
                    <div className="h-16"></div>
                    <p className="underline uppercase text-slate-800 font-black">KAKAMI APPAREL</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* SPK WORK ORDER PRINT PREVIEW OVERLAY */}
      {showSpkPrintObj && (
        <SpkPrintDocument 
          order={showSpkPrintObj} 
          allItems={orderItems} 
          onClose={() => setShowSpkPrintObj(null)} 
        />
      )}
      {false && (() => {
        const o = showSpkPrintObj!;
        const orderIdItems = orderItems;
        const sizeTotals: Record<string, number> = {};
        const shortSleeve = 0;
        const longSleeve = 0;
        const alertUruts: number[] = [];
        const totalPcsComputed = 0;
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-4 sm:p-6 no-print-overlay">
            <div className="bg-white text-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-8 self-start my-8 border border-slate-200 flex flex-col space-y-6">
              
              {/* Controller buttons */}
              <div className="flex justify-between items-center border-b pb-4 border-slate-100 no-print">
                <div className="flex items-center gap-1 text-slate-500 font-extrabold text-xs uppercase">
                  <span>Surat Perintah Kerja (SPK Produksi)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] px-4 py-2 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-purple-600/10"
                  >
                    <PlusSquare size={13} /> Print Cetak SPK
                  </button>
                  <button
                    onClick={() => setShowSpkPrintObj(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 bg-slate-50 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* PRINT AREA CONTAINER */}
              <div id="printable-spk-container" className="space-y-6 p-4 border border-black dark:border-black rounded-sm bg-white text-black font-sans text-xs">
                
                {/* BRAND HEADER */}
                <div className="flex justify-between items-center border-b-2 border-black pb-3">
                  <div>
                    <h1 className="text-base font-black tracking-widest">KAKAMI APPAREL</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">PRODUCTION WORK ORDER (SPK)</p>
                  </div>
                  <div className="text-right">
                    <span className="border border-black px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                      {o.invoice_no}
                    </span>
                  </div>
                </div>

                {/* FORM META DETAILS GRID */}
                <div className="grid grid-cols-2 gap-6 text-[11px]">
                  <div className="space-y-1 font-bold">
                    <div>
                      <span className="w-28 inline-block font-bold text-slate-500">Konsumen/Client</span>: <span className="uppercase text-slate-900 font-black">{o.nama_konsumen}</span>
                    </div>
                    <div>
                      <span className="w-28 inline-block font-bold text-slate-500">Nama Projek</span>: <span className="uppercase text-slate-900 font-black">{o.nama_order}</span>
                    </div>
                    <div>
                      <span className="w-28 inline-block font-bold text-slate-500">Tanggal Order</span>: <span className="font-mono">{o.tanggal_order}</span>
                    </div>
                    <div>
                      <span className="w-28 inline-block font-black text-rose-600">DEADLINE SELESAI</span>: <span className="font-mono font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-250 uppercase">{o.deadline_kerja || o.tanggal_order}</span>
                    </div>
                  </div>
                  <div className="space-y-1 font-bold">
                    <div>
                      <span className="w-28 inline-block font-bold text-slate-500">Bahan Utama</span>: <span className="uppercase text-slate-900 font-black">{o.bahan_utama || '-'}</span>
                    </div>
                    <div>
                      <span className="w-28 inline-block font-bold text-slate-500">Bahan Kerah</span>: <span className="uppercase text-slate-900 font-black">{o.bahan_kerah || '-'}</span>
                    </div>
                    <div>
                      <span className="w-28 inline-block font-bold text-slate-500">Bahan Celana</span>: <span className="uppercase text-slate-900 font-black">{o.bahan_celana || '-'}</span>
                    </div>
                    <div>
                      <span className="w-28 inline-block font-bold text-slate-500">Pola Potongan</span>: <span className="bg-yellow-100 text-yellow-900 uppercase text-slate-900 font-black px-1 rounded">{o.pola_baju || 'Standar (Set-In)'}</span>
                    </div>
                  </div>
                </div>

                {/* EMERGENCIES NOTICE */}
                {o.catatan_darurat && (
                  <div className="bg-rose-50 border-2 border-rose-400 text-rose-900 p-3 rounded font-bold font-mono text-[10px]">
                    <span className="font-black text-rose-800">⚠️ CATATAN TAMBAHAN DARURAT / REVISI WAJIB BACA:</span>
                    <p className="mt-1 leading-normal whitespace-pre-wrap">{o.catatan_darurat}</p>
                  </div>
                )}

                {/* IMPORTANT INDIVIDUALLY DETECTED NOTES */}
                {alertUruts.length > 0 && (
                  <div className="bg-red-650 text-white border-2 border-red-800 p-2.5 rounded font-sans text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <span>⚠️ PERINGATAN KERJA! CEK catatan individu pada pemain nomor urut: {alertUruts.map(num => `[No. Urut ${num}]`).join(', ')}</span>
                  </div>
                )}

                {/* SIZING RECAP TABLE */}
                <div className="space-y-2">
                  <h3 className="font-black uppercase text-[10px]">📊 Rekapitulasi Pembagian Sizing & Tipe Lengan</h3>
                  <table className="w-full text-center border border-black border-collapse text-[9px] font-bold">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1 text-[8px]">SIZE</th>
                        {Object.keys(sizeTotals).map((szName) => (
                          <th key={szName} className="border border-black p-1 text-[8px]">
                            {szName.includes('ANAK') ? (
                              <span>{szName.replace(' ANAK', '')}<br/><span className="text-[7.5px] text-blue-600 font-black">Kids</span></span>
                            ) : szName}
                          </th>
                        ))}
                        <th className="border border-black p-1 bg-slate-900 text-white w-14">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black bg-slate-50 font-extrabold p-1 uppercase">QTY</td>
                        {Object.values(sizeTotals).map((val, idx) => (
                          <td key={idx} className={`border border-black p-1 font-mono font-black ${val > 0 ? 'bg-yellow-100 text-slate-950 font-black text-[9.5px]' : 'text-slate-350'}`}>
                            {val}
                          </td>
                        ))}
                        <td className="border border-black bg-slate-100 font-black text-[10px] p-1 font-mono">{totalPcsComputed} Pcs</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Sleeve stats */}
                  <div className="flex gap-4 text-[10px] font-black uppercase mt-1">
                    <div className="bg-slate-50 border border-black px-2.5 py-1 flex items-center gap-1.5 rounded">
                      <span>Total Lengan Pendek:</span>
                      <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-mono font-black">{shortSleeve} Pcs</span>
                    </div>
                    <div className="bg-slate-50 border border-black px-2.5 py-1 flex items-center gap-1.5 rounded">
                      <span>Total Lengan Panjang:</span>
                      <span className="text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 font-mono font-black">{longSleeve} Pcs</span>
                    </div>
                  </div>
                </div>

                {/* INDIVIDUAL PLAYER ITEM PRODUCTION GRID / LIST */}
                {orderIdItems.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="font-black uppercase text-[10px]">📋 Daftar Rincian Pemain & Atribut</h3>
                    <table className="w-full text-center border-black text-[8px] font-bold border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white uppercase text-[8px]">
                          <th className="border border-black p-1 w-6">No</th>
                          <th className="border border-black p-1 text-left">Nama Depan</th>
                          <th className="border border-black p-1 w-10">No. Png</th>
                          <th className="border border-black p-1 text-left">Nama Punggung</th>
                          <th className="border border-black p-1 w-10">Size</th>
                          <th className="border border-black p-1 w-12">Lengan</th>
                          <th className="border border-black p-1 w-12">Gender</th>
                          <th className="border border-black p-1 text-left">Catatan Khusus / Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderIdItems.map((item, index) => {
                          const hasNotes = item.keterangan && item.keterangan.trim() !== '' && item.keterangan.trim() !== '-';
                          return (
                            <tr
                              key={item.id}
                              className={`border-b border-black hover:bg-slate-50 ${item.lengan.toUpperCase() === 'PANJANG' ? 'bg-amber-100/50' : ''}`}
                            >
                              <td className={`border-r border-l border-black p-1 font-mono font-black ${hasNotes ? 'bg-rose-600 text-white font-black' : ''}`}>
                                {index + 1}
                              </td>
                              <td className="border-r border-black p-1 text-left uppercase font-extrabold">{item.nama_player || '-'}</td>
                              <td className="border-r border-black p-1 font-mono text-center font-black text-[9px]">{item.no_player || '-'}</td>
                              <td className="border-r border-black p-1 text-left uppercase font-extrabold">{item.nama_punggung || '-'}</td>
                              <td className="border-r border-black p-1 text-center font-black uppercase text-[9px]">{item.size}</td>
                              <td className="border-r border-black p-1 text-center font-black uppercase">{item.lengan}</td>
                              <td className="border-r border-black p-1 text-center font-bold uppercase">{item.gender}</td>
                              <td className={`border-r border-black p-1 text-left italic ${hasNotes ? 'text-rose-600 font-extrabold bg-rose-50' : 'text-slate-400'}`}>
                                {item.keterangan || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 p-6 text-center text-slate-400 font-bold italic">
                    Daftar rincian sizing detail belum diinput di tab Produksi. SPK secara umum tetap dapat dicetak berdasarkan info jumlah pcs ({o.jumlah_pcs} Pcs) di atas.
                  </div>
                )}

                {/* PRODUCTION STEPS SIGN-OFF BOXES */}
                <div className="grid grid-cols-4 gap-2 text-center text-[8.5px] font-bold text-slate-700 pt-10">
                  <div className="border border-black p-2 rounded">
                    <p>Desain Mockup</p>
                    <div className="h-12"></div>
                    <p className="border-t border-black/30 pt-1 text-[8px] uppercase font-black">Spk Designer</p>
                  </div>
                  <div className="border border-black p-2 rounded">
                    <p>Bagian Potong</p>
                    <div className="h-12"></div>
                    <p className="border-t border-black/30 pt-1 text-[8px] uppercase font-black">Operator Cut</p>
                  </div>
                  <div className="border border-black p-2 rounded">
                    <p>Bagian Jahit / Rib</p>
                    <div className="h-12"></div>
                    <p className="border-t border-black/30 pt-1 text-[8px] uppercase font-black">Operator Taylor</p>
                  </div>
                  <div className="border border-black p-2 rounded">
                    <p>Finishing & QC</p>
                    <div className="h-12"></div>
                    <p className="border-t border-black/30 pt-1 text-[8px] uppercase font-black">Checker Kakami</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default OrderPage;
