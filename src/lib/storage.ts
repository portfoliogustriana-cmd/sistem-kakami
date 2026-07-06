import React from "react";
export interface OrderItem {
  id: number;
  order_id: number;
  no_player: string;
  nama_player: string;
  nama_punggung: string;
  size: string;
  lengan: "PENDEK" | "PANJANG" | string;
  gender: "PRIA" | "WANITA" | string;
  keterangan: string;
}
export interface HppItem {
  id: number;
  nama: string;
  nominal: number;
}
export interface Order {
  id: number;
  invoice_no: string;
  tanggal_order: string;
  nama_konsumen: string;
  no_telepon: string;
  nama_order: string;
  jenis_produk: string;
  harga_satuan: number;
  jumlah_pcs: number;
  diskon: number;
  total_harga: number;
  dp: number;
  detail_pesanan: string;
  status_bayar: "DP" | "Lunas";
  status_tracking: "DP" | "Produksi" | "Jait" | "Checking" | "Selesai";
  kendala_produksi?: string;
  last_updated_status?: string;
  hpp_items?: HppItem[];
  bahan_utama?: string;
  bentuk_kerah?: string;
  jenis_orderan?: string;
  bahan_celana?: string;
  bahan_kerah?: string;
  bahan_manset?: string;
  pola_baju?: string;
  catatan_darurat?: string;
  catatan_produksi_spk?: string;
  dibuat_oleh?: string;
  deadline_kerja?: string;
  foto_mockup?: string; // Comma separated image urls
}
export interface Transaction {
  id: number;
  jenis: "Pemasukan" | "Pengeluaran";
  kategori: string;
  nominal: number;
  tanggal: string;
  keterangan: string;
} // Pre-populate with realistic, beautiful KAKAMI business data
export interface User {
  id: number;
  username: string;
  nama_lengkap: string;
  role: "Owner" | "Admin" | "Operator" | string;
  no_wa: string;
  password?: string;
  pin_keamanan?: string;
  otp_code?: string;
  otp_expires_at?: string;
} // Pre-populate with realistic, beautiful KAKAMI business data
const DEFAULT_USERS: User[] = [
  {
    id: 1,
    username: "admin",
    nama_lengkap: "Admin Kakami",
    role: "Admin",
    no_wa: "08123456789",
    password: "admin",
    pin_keamanan: "123456",
  },
  {
    id: 2,
    username: "owner",
    nama_lengkap: "Owner Kakami",
    role: "Owner",
    no_wa: "08571234567",
    password: "owner",
    pin_keamanan: "777777",
  },
  {
    id: 3,
    username: "operator",
    nama_lengkap: "Jojo Operator",
    role: "Operator",
    no_wa: "08198765432",
    password: "operator",
    pin_keamanan: "111222",
  },
];
const DEFAULT_ORDERS: Order[] = [
  {
    id: 1,
    invoice_no: "INV/20260621001",
    tanggal_order: "2026-06-21",
    nama_konsumen: "Sandi Mulya",
    no_telepon: "081234567890",
    nama_order: "Jersey Futsal Antigravity FC",
    jenis_produk: "Jersey",
    harga_satuan: 150000,
    jumlah_pcs: 12,
    diskon: 0,
    total_harga: 1800000,
    dp: 1800000,
    detail_pesanan:
      "Warna dasar biru langit, pola custom print, kerah V-neck tumpuk.",
    status_bayar: "Lunas",
    status_tracking: "Checking",
    bahan_utama: "Drifit Milenial",
    bentuk_kerah: "V-Neck Tumpuk",
    jenis_orderan: "Full Set",
    bahan_celana: "Drifit Jarum",
    bahan_kerah: "Rib Premium",
    bahan_manset: "Rib Premium",
    pola_baju: "Reguler Fit",
    catatan_darurat: "Logo dada harus presisi di tengah.",
    catatan_produksi_spk: "Gunakan benang nilon hitam agar jaitan kuat.",
    deadline_kerja: "2026-06-28",
    dibuat_oleh: "Admin Kakami",
    foto_mockup:
      "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: 2,
    invoice_no: "INV/20260620002",
    tanggal_order: "2026-06-20",
    nama_konsumen: "PT Lintas Samudera (Budi)",
    no_telepon: "081987654321",
    nama_order: "Kemeja PDL Lapangan Keren",
    jenis_produk: "Kemeja",
    harga_satuan: 125000,
    jumlah_pcs: 40,
    diskon: 200000,
    total_harga: 4800000,
    dp: 2000000,
    detail_pesanan:
      "Kemeja PDL ripstop warna navy blue, bordir komputer 3 titik.",
    status_bayar: "DP",
    status_tracking: "Produksi",
    bahan_utama: "Ripstop Tornado",
    bentuk_kerah: "Kerah Kemeja Standar",
    jenis_orderan: "Atasan Saja",
    pola_baju: "PDL Long Sleeve",
    deadline_kerja: "2026-07-05",
    dibuat_oleh: "Admin Kakami",
    foto_mockup:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: 3,
    invoice_no: "INV/20260619003",
    tanggal_order: "2026-06-19",
    nama_konsumen: "Wildan Saputra",
    no_telepon: "085722233344",
    nama_order: "Hoodie Jacket Custom Wolv",
    jenis_produk: "Jaket",
    harga_satuan: 180000,
    jumlah_pcs: 5,
    diskon: 50000,
    total_harga: 850000,
    dp: 500000,
    detail_pesanan:
      "Warna hitam solid, bahan cotton fleece tebal, sablon plastisol.",
    status_bayar: "DP",
    status_tracking: "DP",
    bahan_utama: "Cotton Fleece 280gsm",
    bentuk_kerah: "Hoodie Bulat",
    jenis_orderan: "Lengan Panjang",
    pola_baju: "Oversize Fit",
    deadline_kerja: "2026-06-26",
    dibuat_oleh: "Admin Kakami",
    foto_mockup:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=60",
  },
];
const DEFAULT_ORDER_ITEMS: OrderItem[] = [
  // INV/20260621001 (Order ID 1) - 12 pcs. Let's pre-populate sizes
  { id: 1, order_id: 1, no_player: '10', nama_player: 'Sandi', nama_punggung: 'SANDI', size: 'L', lengan: 'PENDEK', gender: 'PRIA', keterangan: 'Celana tali panjang' },
  { id: 2, order_id: 1, no_player: '7', nama_player: 'Andi', nama_punggung: 'ANDI', size: 'M', lengan: 'PENDEK', gender: 'PRIA', keterangan: '' },
  { id: 3, order_id: 1, no_player: '9', nama_player: 'Rudi', nama_punggung: 'RUDI', size: 'XL', lengan: 'PENDEK', gender: 'PRIA', keterangan: 'Size XL custom panjang +3cm' },
  { id: 4, order_id: 1, no_player: '1', nama_player: 'Hendra', nama_punggung: 'HENDRA', size: 'L', lengan: 'PANJANG', gender: 'PRIA', keterangan: 'Lengan panjang rib ketat, kiper' },
  { id: 5, order_id: 1, no_player: '8', nama_player: 'Geri', nama_punggung: 'GERI', size: 'M', lengan: 'PENDEK', gender: 'PRIA', keterangan: '' },
  { id: 6, order_id: 1, no_player: '14', nama_player: 'Tomi', nama_punggung: 'TOMI', size: 'S', lengan: 'PENDEK', gender: 'PRIA', keterangan: '' },
];
const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    jenis: "Pemasukan",
    kategori: "Pelunasan",
    nominal: 1800000,
    tanggal: "2026-06-21",
    keterangan: "Pelunasan INV/20260621001 - Sandi Mulya",
  },
  {
    id: 2,
    jenis: "Pengeluaran",
    kategori: "Bahan Baku",
    nominal: 800000,
    tanggal: "2026-06-20",
    keterangan: "Beli Kain Ripstop Navy PT Textile Indah",
  },
  {
    id: 3,
    jenis: "Pemasukan",
    kategori: "DP Order",
    nominal: 2000000,
    tanggal: "2026-06-20",
    keterangan: "DP INV/20260620002 - PT Lintas Samudera",
  },
  {
    id: 4,
    jenis: "Pemasukan",
    kategori: "DP Order",
    nominal: 500000,
    tanggal: "2026-06-19",
    keterangan: "DP INV/20260619003 - Wildan Saputra",
  },
  {
    id: 5,
    jenis: "Pengeluaran",
    kategori: "Operasional",
    nominal: 120000,
    tanggal: "2026-06-18",
    keterangan: "Beli lakban, benang jahit, dan oli mesin jahit",
  },
];
export interface AttendanceLog {
  tanggal: string;
  jam_masuk: string;
  jam_keluar: string;
  jam_kerja: number;
  jam_telat: number;
}
export interface BoronganItem {
  nama_produk: string;
  qty: number;
  harga_per_qty: number;
}
export interface Payroll {
  id: number;
  tipe?: "Borongan" | "Karyawan";
  nama_pegawai: string;
  peran: string; // Penjahit, Sablon, dll.
  status_bayar: 'Belum Dibayar' | 'Sudah Dibayar'; jumlah: number; tanggal: string; keterangan: string; kehadiran?: number; gaji_per_hari?: number; uang_makan?: number; uang_lembur?: number; jam_kerja?: number; uang_makan_per_jam?: number; uang_makan_per_hari?: number; jam_telat?: number; potongan_per_jam?: number; attendance_logs?: AttendanceLog[]; borongan_items?: BoronganItem[];
}
export interface Hutang {
  id: number;
  nama_supplier: string;
  nominal: number;
  jatuh_tempo: string;
  status: "Belum Lunas" | "Lunas";
  keterangan: string;
}
const DEFAULT_PAYROLL: Payroll[] = [
  {
    id: 1,
    nama_pegawai: "Kang Jajang",
    peran: "Penjahit",
    status_bayar: "Belum Dibayar",
    jumlah: 850000,
    tanggal: "2026-06-21",
    keterangan: "Borong jahit 40 kemeja PT Lintas Samudera",
  },
];
const DEFAULT_HUTANG: Hutang[] = [
  {
    id: 1,
    nama_supplier: "Toko Kain Makmur",
    nominal: 2500000,
    jatuh_tempo: "2026-06-30",
    status: "Belum Lunas",
    keterangan: "Bahan drill kemeja",
  },
];
export interface KontrakKaryawan {
  id: number;
  nama_karyawan: string;
  posisi: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  gaji_pokok: number;
  status: "Aktif" | "Habis" | "Akan Habis";
  keterangan: string;
}
const DEFAULT_KONTRAK: KontrakKaryawan[] = [
  {
    id: 1,
    nama_karyawan: "Kang Jajang",
    posisi: "Penjahit",
    tanggal_mulai: "2025-06-01",
    tanggal_selesai: "2026-06-01",
    gaji_pokok: 3000000,
    status: "Aktif",
    keterangan: "Kontrak 1 Tahun",
  },
]; export const getStoredMonth = () => {
  return localStorage.getItem("kakami_selected_month") || "2026-06";
};

export const setStoredMonth = (month: string) => {
  localStorage.setItem("kakami_selected_month", month);
};

// LocalStorage helpers with fallback to mock data
export const getStoredData = () => {
  const o = localStorage.getItem("kakami_orders");
  const i = localStorage.getItem("kakami_order_items");
  const t = localStorage.getItem("kakami_transactions");
  const p = localStorage.getItem("kakami_payroll");
  const h = localStorage.getItem("kakami_hutang");
  const k = localStorage.getItem("kakami_kontrak");
  const safeParse = (str: string | null, fallback: any) => {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };
  const orders: Order[] = safeParse(o, DEFAULT_ORDERS);
  const orderItems: OrderItem[] = safeParse(i, DEFAULT_ORDER_ITEMS);
  const transactions: Transaction[] = safeParse(t, DEFAULT_TRANSACTIONS);
  const payroll: Payroll[] = safeParse(p, DEFAULT_PAYROLL);
  const hutang: Hutang[] = safeParse(h, DEFAULT_HUTANG);
  const kontrak: KontrakKaryawan[] = safeParse(k, DEFAULT_KONTRAK);
  // Sync back if not present
  if (!o) localStorage.setItem('kakami_orders', JSON.stringify(DEFAULT_ORDERS));
  if (!i) localStorage.setItem('kakami_order_items', JSON.stringify(DEFAULT_ORDER_ITEMS));
  if (!t) localStorage.setItem('kakami_transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
  if (!p) localStorage.setItem('kakami_payroll', JSON.stringify(DEFAULT_PAYROLL));
  if (!h) localStorage.setItem('kakami_hutang', JSON.stringify(DEFAULT_HUTANG));
  if (!k) localStorage.setItem('kakami_kontrak', JSON.stringify(DEFAULT_KONTRAK));
  return { orders, orderItems, transactions, payroll, hutang, kontrak };
};
export const saveStoredData = (
  orders: Order[],
  orderItems: OrderItem[],
  transactions: Transaction[],
  payroll?: Payroll[],
  hutang?: Hutang[],
  kontrak?: KontrakKaryawan[],
) => {
  localStorage.setItem("kakami_orders", JSON.stringify(orders));
  localStorage.setItem("kakami_order_items", JSON.stringify(orderItems));
  localStorage.setItem("kakami_transactions", JSON.stringify(transactions));
  if (payroll) localStorage.setItem("kakami_payroll", JSON.stringify(payroll));
  if (hutang) localStorage.setItem("kakami_hutang", JSON.stringify(hutang));
  if (kontrak) localStorage.setItem("kakami_kontrak", JSON.stringify(kontrak));
};
export const getStoredUsers = (): User[] => {
  const u = localStorage.getItem("kakami_users");
  let users: User[] = [];
  if (u) {
    try {
      users = JSON.parse(u);
    } catch (e) {
      console.error("Failed to parse users", e);
      users = DEFAULT_USERS;
    }
  } else {
    users = DEFAULT_USERS;
  }
  // Ensure Owner exists
  if (!users.find(u => u.role === 'Owner')) {
    const owner = DEFAULT_USERS.find(u => u.role === 'Owner');
    if (owner) users.push(owner);
  }
  localStorage.setItem('kakami_users', JSON.stringify(users));
  return users;
};
export const saveStoredUsers = (users: User[]) => {
  localStorage.setItem("kakami_users", JSON.stringify(users));
};
export const getCurrentUser = (): User | null => {
  const u = localStorage.getItem("kakami_current_user");
  return u ? JSON.parse(u) : null;
};
export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem("kakami_current_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("kakami_current_user");
  }
};
