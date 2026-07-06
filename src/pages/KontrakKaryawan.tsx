import React, { useState, useEffect } from "react";
import { getStoredData, saveStoredData, KontrakKaryawan } from "../lib/storage";
import { FileSignature, PlusSquare, Search, Trash, Edit, X, Save, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function Kontrak() {
  const [kontraks, setKontraks] = useState<KontrakKaryawan[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("SEMUA");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [namaKaryawan, setNamaKaryawan] = useState('');
  const [posisi, setPosisi] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [gajiPokok, setGajiPokok] = useState<number>(0);
  const [keterangan, setKeterangan] = useState('');

  useEffect(() => {
    const data = getStoredData();
    const updateStatus = (k: KontrakKaryawan): KontrakKaryawan => {
      const today = new Date();
      const endDate = new Date(k?.tanggal_selesai || new Date());
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let newStatus: 'Aktif' | 'Habis' | 'Akan Habis' = 'Aktif';
      if (daysDiff < 0) {
        newStatus = 'Habis';
      } else if (daysDiff <= 30) {
        newStatus = 'Akan Habis';
      }
      return { ...k, status: newStatus };
    };

    const updatedKontraks = (data.kontrak || []).map(updateStatus);
    setKontraks(updatedKontraks);

    if (data.kontrak) {
      saveStoredData(data.orders, data.orderItems, data.transactions, data.payroll, data.hutang, updatedKontraks);
    }
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setNamaKaryawan('');
    setPosisi('');
    setTanggalMulai('');
    setTanggalSelesai('');
    setGajiPokok(0);
    setKeterangan('');
    setIsModalOpen(false);
  };

  const handleEdit = (k: KontrakKaryawan) => {
    setEditingId(k.id);
    setNamaKaryawan(k.nama_karyawan);
    setPosisi(k.posisi);
    setTanggalMulai(k.tanggal_mulai);
    setTanggalSelesai(k.tanggal_selesai);
    setGajiPokok(k.gaji_pokok);
    setKeterangan(k.keterangan || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Yakin ingin menghapus data kontrak ini?')) {
      const newData = kontraks.filter(k => k.id !== id);
      setKontraks(newData);
      const data = getStoredData();
      saveStoredData(data.orders, data.orderItems, data.transactions, data.payroll, data.hutang, newData);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKaryawan || !posisi || !tanggalMulai || !tanggalSelesai) {
      alert('Mohon lengkapi data wajib.');
      return;
    }

    const today = new Date();
    const endDate = new Date(tanggalSelesai);
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    let newStatus: 'Aktif' | 'Habis' | 'Akan Habis' = 'Aktif';
    if (daysDiff < 0) {
      newStatus = 'Habis';
    } else if (daysDiff <= 30) {
      newStatus = 'Akan Habis';
    }

    const newKontrak: KontrakKaryawan = {
      id: editingId || Date.now(),
      nama_karyawan: namaKaryawan,
      posisi,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      gaji_pokok: gajiPokok,
      status: newStatus,
      keterangan
    };

    let newData;
    if (editingId) {
      newData = kontraks.map(k => k.id === editingId ? newKontrak : k);
    } else {
      newData = [newKontrak, ...kontraks];
    }

    setKontraks(newData);
    const data = getStoredData();
    saveStoredData(data.orders, data.orderItems, data.transactions, data.payroll, data.hutang, newData);
    resetForm();
  };

  const safeKontraks = kontraks || [];
  const filteredKontraks = safeKontraks.filter((k) => 
    ((k?.nama_karyawan || '').toLowerCase().includes((search || '').toLowerCase()) || 
     (k?.posisi || '').toLowerCase().includes((search || '').toLowerCase()))
  ).filter((k) => 
    filterStatus === 'SEMUA' || k?.status === filterStatus
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Aktif': return <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white text-black text-[10px] font-bold"><CheckCircle size={12}/> Aktif</span>;
      case 'Akan Habis': return <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white text-black text-[10px] font-bold"><Clock size={12}/> Akan Habis</span>;
      case 'Habis': return <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white text-black text-[10px] font-bold"><AlertCircle size={12}/> Habis</span>;
      default: return null;
    }
  }

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-black">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-black" />
            Kontrak Karyawan
          </h1>
          <p className="text-sm text-black mt-2 font-medium">
            Kelola data kontrak dan masa berlaku karyawan.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-black hover:bg-black text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-sm text-sm">
          <PlusSquare size={18} />
          Tambah Kontrak
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl shadow-xl border border-black overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-black flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/40 gap-3">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="bg-white p-2 rounded-xl flex items-center gap-1.5 border border-black shadow-inner w-full sm:w-60">
              <Search size={14} className="text-black" />
              <input type="text" placeholder="Cari nama atau posisi..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-none outline-none text-xs text-black w-full placeholder-slate-400 font-semibold" />
            </div>
            <div className="bg-white p-2 rounded-xl border border-black shadow-inner w-full sm:w-auto">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent border-none outline-none text-xs text-black font-semibold cursor-pointer px-1">
                <option value="SEMUA" className="text-black">Semua Status</option>
                <option value="Aktif" className="text-black">Aktif</option>
                <option value="Akan Habis" className="text-black">Akan Habis (&lt;30 Hari)</option>
                <option value="Habis" className="text-black">Habis</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-black text-xs uppercase tracking-wider text-black">
                <th className="px-6 py-4 font-black">Nama Karyawan</th>
                <th className="px-6 py-4 font-black">Posisi</th>
                <th className="px-6 py-4 font-black">Masa Kontrak</th>
                <th className="px-6 py-4 font-black">Gaji Pokok</th>
                <th className="px-6 py-4 font-black text-center">Status</th>
                <th className="px-6 py-4 font-black text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKontraks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-black font-medium">
                    Belum ada data kontrak karyawan yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredKontraks.map((k) => (
                  <tr key={k.id} className="hover:bg-black/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-black">{k.nama_karyawan}</div>
                      {k.keterangan && <div className="text-[10px] text-black mt-1">{k.keterangan}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-black bg-white px-2 py-1 rounded-md text-xs">{k.posisi}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-black">
                        <span className="text-black font-bold">{k.tanggal_mulai}</span> sd <span className="text-black font-bold">{k.tanggal_selesai}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-black font-bold text-xs">
                        Rp {k.gaji_pokok.toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(k.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(k)} className="p-1.5 text-black hover:bg-white rounded-lg transition-colors" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(k.id)} className="p-1.5 text-black hover:bg-white rounded-lg transition-colors" title="Hapus">
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-black">
            <div className="flex justify-between items-center p-6 border-b border-black bg-white/50">
              <h3 className="font-black text-lg text-black flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-black" />
                {editingId ? 'Edit Kontrak Karyawan' : 'Tambah Kontrak Karyawan'}
              </h3>
              <button onClick={resetForm} className="text-black hover:text-black transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1.5">Nama Karyawan *</label>
                <input type="text" required value={namaKaryawan} onChange={(e) => setNamaKaryawan(e.target.value)} className="w-full bg-white border border-black rounded-xl px-4 py-2.5 text-sm outline-none focus:border-black font-semibold text-black" placeholder="Cth: Kang Jajang" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black uppercase mb-1.5">Posisi / Peran *</label>
                  <input type="text" required value={posisi} onChange={(e) => setPosisi(e.target.value)} className="w-full bg-white border border-black rounded-xl px-4 py-2.5 text-sm outline-none focus:border-black font-semibold text-black" placeholder="Cth: Penjahit" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black uppercase mb-1.5">Gaji Pokok</label>
                  <input type="number" value={gajiPokok} onChange={(e) => setGajiPokok(Number(e.target.value))} className="w-full bg-white border border-black rounded-xl px-4 py-2.5 text-sm outline-none focus:border-black font-mono font-semibold text-black" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black uppercase mb-1.5">Mulai *</label>
                  <input type="date" required value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="w-full bg-white border border-black rounded-xl px-4 py-2.5 text-sm outline-none focus:border-black font-semibold text-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black uppercase mb-1.5">Berakhir *</label>
                  <input type="date" required value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="w-full bg-white border border-black rounded-xl px-4 py-2.5 text-sm outline-none focus:border-black font-semibold text-black" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1.5">Keterangan</label>
                <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="w-full bg-white border border-black rounded-xl px-4 py-2.5 text-sm outline-none focus:border-black font-medium text-black resize-none" rows={2} placeholder="Catatan tambahan..." />
              </div>
              <div className="flex gap-3 pt-4 border-t border-black">
                <button type="button" onClick={resetForm} className="flex-1 py-3 bg-white hover:bg-black/10 text-black rounded-xl font-bold text-sm transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-3 bg-black hover:bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-sm">
                  <Save size={18} />
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
