import React, { useState, useEffect } from "react";
import {
  Users,
  Award,
  Search,
  X,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { getStoredData, Order } from "../lib/storage";

interface CustomerSummary {
  nama: string;
  telepon: string;
  totalOrder: number;
  totalPcs: number;
  totalBelanja: number;
  tier: "GOLD VIP" | "SILVER" | "REGULAR";
}

const Konsumen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<string>("SEMUA");
  const [selectedCust, setSelectedCust] = useState<CustomerSummary | null>(null);

  useEffect(() => {
    const data = getStoredData();
    setOrders(data.orders);
  }, []);

  // Compute unique customer aggregates
  const customerMap: {
    [key: string]: {
      nama: string;
      telepon: string;
      totalOrder: number;
      totalPcs: number;
      totalBelanja: number;
    };
  } = {};

  orders.forEach((o) => {
    const name = o.nama_konsumen.trim();
    if (!customerMap[name]) {
      customerMap[name] = {
        nama: name,
        telepon: o.no_telepon || "",
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
    let tier: "GOLD VIP" | "SILVER" | "REGULAR" = "REGULAR";
    if (c.totalPcs >= 500) {
      tier = "GOLD VIP";
    } else if (c.totalPcs >= 100) {
      tier = "SILVER";
    }
    return {
      ...c,
      tier,
    };
  });

  // Sort customer list by loyalty / total pieces ordered descending
  const sortedCustomers = customerList.sort((a, b) => b.totalPcs - a.totalPcs);

  // Filter based on search input and tier
  const filteredCustomers = sortedCustomers.filter((c) => {
    const matchSearch =
      c.nama.toLowerCase().includes(search.toLowerCase()) ||
      c.telepon.includes(search);
    const matchTier = filterTier === "SEMUA" || c.tier === filterTier;
    return matchSearch && matchTier;
  });

  // Filter orders of selected customer
  const custOrders = selectedCust
    ? orders.filter((o) => o.nama_konsumen.trim() === selectedCust.nama)
    : [];

  const formatWAUrl = (tel: string) => {
    let raw = tel.trim();
    if (raw.startsWith("0")) {
      raw = "62" + raw.substring(1);
    }
    return `https://wa.me/${raw}`;
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex flex-col gap-6 relative">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-black w-full">
        <div>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-black to-black tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-black" /> Database Klien & CRM
          </h2>
          <p className="text-xs text-black font-medium mt-1">
            Kelola data profil pelanggan, volume kontribusi order, dan status keanggotaan.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 text-[10px] bg-black text-white px-4 py-2.5 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
          <Award className="w-3.5 h-3.5 text-white" /> Urutan Tingkat Loyalitas (Volume Termutakhir)
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 bg-white p-4 rounded-3xl border border-black flex items-center gap-3.5 shadow-sm">
          <Search className="w-5 h-5 text-black pl-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cek cepat nama konsumen atau nomor handphone..."
            className="w-full bg-transparent border-none text-xs outline-none focus:ring-0 font-bold placeholder-slate-400 text-black"
          />
        </div>
        <div className="sm:w-48 bg-white p-2 rounded-3xl border border-black flex items-center shadow-sm">
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="w-full bg-transparent border-none text-xs outline-none focus:ring-0 font-bold text-black px-2 cursor-pointer"
          >
            <option value="SEMUA">Semua Tier</option>
            <option value="GOLD VIP">GOLD VIP</option>
            <option value="SILVER">SILVER</option>
            <option value="REGULAR">REGULAR</option>
          </select>
        </div>
      </div>

      {/* Database Table layout */}
      <div className="bg-white rounded-3xl shadow-xl border border-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-black text-white text-xs uppercase tracking-widest text-center">
                <th className="p-4 w-16 font-semibold rounded-tl-lg">No</th>
                <th className="p-4 text-left font-semibold">Nama Konsumen</th>
                <th className="p-4 w-48 font-semibold">No. Telepon WA</th>
                <th className="p-4 w-40 font-semibold">Status / Tier</th>
                <th className="p-4 w-36 font-semibold">Kerap Kunjungan</th>
                <th className="p-4 w-40 font-semibold">Total Volume</th>
                <th className="p-4 w-28 font-semibold rounded-tr-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust, i) => (
                <tr
                  key={cust.nama}
                  className="hover:bg-black/5 transition-colors duration-200 text-center"
                >
                  <td className="p-4 font-mono text-xs text-black">{i + 1}</td>
                  <td className="p-4 text-left font-black text-black uppercase text-xs">
                    <button
                      onClick={() => setSelectedCust(cust)}
                      className="hover:underline hover:text-black transition-colors text-left"
                    >
                      {cust.nama}
                    </button>
                  </td>
                  <td className="p-4 font-mono text-xs">
                    {cust.telepon ? (
                      <div className="flex justify-center items-center gap-2">
                        <span className="text-black font-bold">{cust.telepon}</span>
                        <a
                          href={formatWAUrl(cust.telepon)}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white text-black border border-black px-2 py-0.5 rounded-md hover:bg-black hover:text-white transition-all font-sans font-black tracking-wider text-[8.5px]"
                        >
                          WA
                        </a>
                      </div>
                    ) : (
                      <span className="text-black italic font-semibold">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {cust.tier === "GOLD VIP" && (
                      <span className="text-black bg-white border border-black px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase inline-flex items-center gap-1 shadow-sm">
                        GOLD VIP
                      </span>
                    )}
                    {cust.tier === "SILVER" && (
                      <span className="text-black bg-white border border-black px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase inline-flex items-center gap-1 shadow-sm">
                        SILVER
                      </span>
                    )}
                    {cust.tier === "REGULAR" && (
                      <span className="text-black bg-white border border-black px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase">
                        REGULAR
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center font-extrabold text-black text-xs">
                    {cust.totalOrder}x Order
                  </td>
                  <td className="p-4 text-center">
                    <div className="bg-white border border-black rounded-xl px-3 py-1 inline-block min-w-[90px] shadow-sm font-black text-black">
                      {cust.totalPcs.toLocaleString("id-ID")}{" "}
                      <span className="text-[10px] font-black text-black">Pcs</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedCust(cust)}
                      className="bg-black text-white hover:bg-black/80 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:-translate-y-0.5 shadow-md shadow-black/10"
                    >
                      Riwayat
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-black font-medium italic">
                    Belum ada data konsumen terekam atau tidak ada hasil pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer Modal */}
      {selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white h-full p-6 sm:p-8 shadow-2xl flex flex-col gap-6 overflow-y-auto duration-300 animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b pb-4 border-black">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-black to-black flex items-center justify-center text-white text-xl font-black shadow-lg">
                  {selectedCust.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-black uppercase tracking-tight">
                    {selectedCust.nama}
                  </h3>
                  <p className="text-xs text-black font-medium tracking-wide">
                    Analitik Detail Sejarah Pembelian
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCust(null)}
                className="p-2 text-black hover:text-black bg-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Loyalty Summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-black">
                <span className="text-[10px] text-black font-extrabold uppercase tracking-wider block mb-1">
                  Total Belanja (Gross)
                </span>
                <span className="text-lg font-mono font-black text-black">
                  Rp {selectedCust.totalBelanja.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-black">
                <span className="text-[10px] text-black font-extrabold uppercase tracking-wider block mb-1">
                  Frekuensi Order
                </span>
                <span className="text-lg font-mono font-black text-black">
                  {selectedCust.totalOrder}{" "}
                  <span className="text-xs font-semibold text-black">Kali</span>
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-black">
                <span className="text-[10px] text-black font-extrabold uppercase tracking-wider block mb-1">
                  Kumulatif Volume
                </span>
                <span className="text-lg font-mono font-black text-black">
                  {selectedCust.totalPcs}{" "}
                  <span className="text-xs font-semibold text-black">Pcs</span>
                </span>
              </div>
            </div>

            {/* Actions Panel */}
            {selectedCust.telepon && (
              <div className="bg-white/30 border border-black p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-black uppercase mb-0.5 flex items-center gap-1.5">
                    <MessageSquare size={14} /> Hubungi Lewat WhatsApp
                  </h4>
                  <p className="text-[11px] text-black/80 font-medium">
                    Terhubung langsung ke Chat WA resmi pelanggan.
                  </p>
                </div>
                <a
                  href={formatWAUrl(selectedCust.telepon)}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-black hover:bg-black/90 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1 shadow-md transition-all active:scale-95"
                >
                  Buka Chat <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* List of Orders History */}
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <h4 className="text-xs font-black text-black uppercase tracking-widest mb-1 border-b pb-1.5 border-black">
                Laporan Antrean Order ({custOrders.length} Nota)
              </h4>
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {custOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 bg-white hover:bg-white border border-black rounded-2xl space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] font-black text-black uppercase font-mono">
                          {o.invoice_no}
                        </div>
                        <h5 className="text-xs font-black text-black uppercase mt-0.5">
                          {o.nama_order}
                        </h5>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase ${
                          o.status_bayar === "Lunas"
                            ? "bg-black text-white"
                            : "bg-white text-black border border-black"
                        }`}
                      >
                        {o.status_bayar}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-black text-[11px]">
                      <div>
                        <span className="text-black block font-semibold">Tgl Order:</span>
                        <span className="font-bold text-black">{o.tanggal_order}</span>
                      </div>
                      <div>
                        <span className="text-black block font-semibold">Volume Pcs:</span>
                        <span className="font-extrabold text-black">{o.jumlah_pcs} Pcs</span>
                      </div>
                      <div>
                        <span className="text-black block font-semibold">Status Tahap:</span>
                        <span className="font-black text-black uppercase">
                          {o.status_tracking || "DP"}
                        </span>
                      </div>
                      <div>
                        <span className="text-black block font-semibold">Total Invoice:</span>
                        <span className="font-black text-black font-mono">
                          Rp {o.total_harga.toLocaleString("id-ID")}
                        </span>
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
