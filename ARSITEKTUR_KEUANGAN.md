# Arsitektur Sistem Keuangan ERP Konveksi

Dokumen ini berisi rancangan arsitektur, skema database, alur data, dan struktur API untuk sistem ERP Konveksi (Pakaian) bagian Keuangan.

## 1. Skema Database (Relational SQL Schema)

Skema ini menghubungkan antara modul produksi (Job Order, Bahan Baku), SDM (Penjahit/Borongan), dan Akuntansi/Keuangan.

### A. Modul Master Data
```sql
-- Chart of Accounts (Bagan Akun Standard)
CREATE TABLE coa (
    id SERIAL PRIMARY KEY,
    kode_akun VARCHAR(20) UNIQUE NOT NULL,
    nama_akun VARCHAR(100) NOT NULL,
    kategori ENUM('Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'HPP', 'Beban') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Master Barang & Bahan
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    kode_item VARCHAR(50) UNIQUE NOT NULL,
    nama_item VARCHAR(100) NOT NULL,
    kategori ENUM('Bahan Baku', 'Aksesoris', 'WIP', 'Barang Jadi', 'Kain Majun') NOT NULL,
    satuan VARCHAR(20) NOT NULL,
    metode_valuasi ENUM('FIFO', 'AVERAGE') DEFAULT 'AVERAGE',
    stok_sekarang DECIMAL(10,2) DEFAULT 0,
    nilai_rata_rata DECIMAL(15,2) DEFAULT 0 -- Untuk Average Valuation
);

-- Master Pegawai / Penjahit
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    tipe_karyawan ENUM('Tetap', 'Borongan') NOT NULL,
    saldo_kasbon DECIMAL(15,2) DEFAULT 0
);
```

### B. Modul Produksi & Order (Job Order Costing)
```sql
-- Purchase Order dari Klien (Penjualan)
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    nomor_so VARCHAR(50) UNIQUE NOT NULL,
    klien_id INT NOT NULL,
    tanggal_order DATE NOT NULL,
    total_nilai DECIMAL(15,2) NOT NULL,
    status_pembayaran ENUM('Unpaid', 'Partial', 'Paid') DEFAULT 'Unpaid'
);

-- Surat Perintah Kerja (SPK) / Production Order
CREATE TABLE production_orders (
    id SERIAL PRIMARY KEY,
    sales_order_id INT REFERENCES sales_orders(id),
    nomor_spk VARCHAR(50) UNIQUE NOT NULL,
    nama_produk VARCHAR(255) NOT NULL,
    target_qty INT NOT NULL,
    status ENUM('Pending', 'In Progress', 'QC', 'Completed') DEFAULT 'Pending',
    total_biaya_bahan DECIMAL(15,2) DEFAULT 0,
    total_biaya_upah DECIMAL(15,2) DEFAULT 0,
    total_biaya_overhead DECIMAL(15,2) DEFAULT 0,
    hpp_per_pcs DECIMAL(15,2) DEFAULT 0
);

-- Penggunaan Bahan Baku per SPK
CREATE TABLE material_usage (
    id SERIAL PRIMARY KEY,
    production_order_id INT REFERENCES production_orders(id),
    item_id INT REFERENCES items(id),
    qty_digunakan DECIMAL(10,2) NOT NULL,
    harga_satuan DECIMAL(15,2) NOT NULL, -- Harga historis (FIFO/Average) saat diambil
    total_biaya DECIMAL(15,2) GENERATED ALWAYS AS (qty_digunakan * harga_satuan) STORED
);
```

### C. Modul Payroll & Borongan
```sql
-- Catatan Hasil Jahit Borongan
CREATE TABLE piece_rate_logs (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    production_order_id INT REFERENCES production_orders(id),
    tanggal DATE NOT NULL,
    proses ENUM('Potong', 'Jahit', 'Obras', 'Finishing', 'QC') NOT NULL,
    qty_selesai INT NOT NULL,
    qty_reject INT DEFAULT 0,
    tarif_per_pcs DECIMAL(15,2) NOT NULL,
    total_upah DECIMAL(15,2) GENERATED ALWAYS AS (max(0, qty_selesai - qty_reject) * tarif_per_pcs) STORED,
    status_pembayaran ENUM('Pending', 'Paid') DEFAULT 'Pending'
);
```

### D. Modul Jurnal & Keuangan (General Ledger)
```sql
-- Transaksi Keuangan (Header)
CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    nomor_referensi VARCHAR(50), -- No Invoice, No SPK, dll
    tanggal DATE NOT NULL,
    tipe_transaksi VARCHAR(50) NOT NULL, -- 'Pembayaran DP', 'Payroll', 'Material Issue'
    deskripsi TEXT,
    periode_bulan INT NOT NULL,
    periode_tahun INT NOT NULL
);

-- Detail Transaksi (Debit/Credit)
CREATE TABLE journal_lines (
    id SERIAL PRIMARY KEY,
    journal_entry_id INT REFERENCES journal_entries(id),
    coa_id INT REFERENCES coa(id),
    debit DECIMAL(15,2) DEFAULT 0,
    kredit DECIMAL(15,2) DEFAULT 0
);
```

---

## 2. Arsitektur Logika Alur Data (Data Flow: HPP Otomatis)

Sistem menghitung Harga Pokok Penjualan (HPP) / Cost of Goods Manufactured secara otomatis dan presisi (Job Order Costing).

### Alur 1: Pengambilan Bahan Baku (Material Issue) ke Produksi
1. **Trigger:** Bagian gudang merilis kain/bahan ke produksi berdasarkan `production_order_id` (SPK).
2. **Kalkulasi Nilai:** Sistem mengecek `items` untuk mengambil `nilai_rata_rata` (Average Valuation) atau nilai dari batch stok tertua (FIFO).
3. **Pencatatan:** 
   - Insert ke tabel `material_usage`.
   - Update `stok_sekarang` di tabel `items`.
   - Tambahkan nilai ini ke `total_biaya_bahan` di `production_orders`.
4. **Jurnal Akuntansi Otomatis:**
   - **Debit:** [Persediaan WIP - SPK XYZ]
   - **Kredit:** [Persediaan Bahan Baku]

### Alur 2: Pencatatan Hasil Borongan (Payroll Piece Rate)
1. **Trigger:** Mandor/QC mencatat bahwa Penjahit A telah menyelesaikan 100 pcs jahitan (2 reject) untuk SPK XYZ.
2. **Kalkulasi Upah:** Sistem menghitung `(100 - 2) * tarif = Total Upah`. Insert ke `piece_rate_logs`.
3. **Akumulasi Cost:** Sistem menambahkan `Total Upah` tersebut ke `total_biaya_upah` pada tabel `production_orders`.
4. **Jurnal Akuntansi Otomatis (Accrual Upah):**
   - **Debit:** [Persediaan WIP - SPK XYZ] (sebagai biaya tenaga kerja langsung)
   - **Kredit:** [Hutang Upah / Accrued Payroll]

### Alur 3: Penyelesaian SPK (Goods Receipt & HPP Final)
1. **Trigger:** SPK ditandai `Completed` karena barang sudah masuk gudang finish goods.
2. **Kalkulasi Final HPP:** 
   - `Overhead` dapat dibebankan berdasarkan % dari biaya direct labor, misal 20% dari `total_biaya_upah`. Update `total_biaya_overhead`.
   - `Total Biaya Produksi = Biaya Bahan + Biaya Upah + Biaya Overhead`.
   - `HPP_per_pcs = Total Biaya Produksi / target_qty`. (Disimpan statis di `production_orders`).
3. **Jurnal Akuntansi Otomatis:**
   - **Debit:** [Persediaan Barang Jadi] (Sebesar Total Biaya Produksi)
   - **Kredit:** [Persediaan WIP - SPK XYZ] (Mengosongkan WIP)

---

## 3. Struktur API Endpoint (RESTful API) Utama

Berbasis JSON, direkomendasikan mengimplementasikan transaksi berbasis ACID (Database Transaction) karena melibatkan jurnal akuntansi.

### A. Bayar DP (Down Payment) dari Klien
Menangani uang masuk dari klien, update status SO, dan mencatat jurnal penerimaan kas.
- **Endpoint:** `POST /api/finance/receivables/dp`
- **Request Body:**
  ```json
  {
    "sales_order_id": 1024,
    "akun_bank_id": 5, // ID COA Bank BCA
    "jumlah_bayar": 5000000.00,
    "tanggal_pembayaran": "2026-06-22",
    "catatan": "DP 50% untuk Produksi Kaos Event"
  }
  ```
- **Response Effect:** Insert ke `journal_entries` (Debit Kas/Bank, Kredit Pendapatan Diterima Dimuka/Utang DP). Update `status_pembayaran` di `sales_orders`.

### B. Selesai Jahit Borongan (Piece-Rate Submission)
Mencatat hasil kerja harian penjahit borongan, menambah utang upah, dan menambah nilai WIP produksi.
- **Endpoint:** `POST /api/production/piece-rate`
- **Request Body:**
  ```json
  {
    "production_order_id": 880,
    "employee_id": 15,
    "proses": "Jahit",
    "qty_selesai": 50,
    "qty_reject": 1,
    "tarif_per_pcs": 4500.00,
    "tanggal": "2026-06-22"
  }
  ```
- **Response Effect:** Insert ke `piece_rate_logs`. Update `total_biaya_upah` di `production_orders`. Update nilai akun WIP di General Ledger.

### C. Tutup Buku Bulanan (Month-End Close)
Mencegah transaksi di bulan lalu diubah, mengunci periode, dan menghitung penyusutan/overhead final.
- **Endpoint:** `POST /api/finance/closing/month-end`
- **Request Body:**
  ```json
  {
    "periode_bulan": 5,
    "periode_tahun": 2026,
    "user_id": 2
  }
  ```
- **Response Logical Flow:**
  1. Validasi pastikan tidak ada Jurnal dengan status "Draft" di bulan 5.
  2. Posting Depreciation (Penyusutan Aset Tetap, misal mesin jahit).
  3. Mengunci (Lock) semua transaksi `journal_entries` di periode tersebut (Update constraint/flag is_locked = true).
  4. Merekam Log Audit.
- **Response Success:** `{"status": "success", "message": "Periode Mei 2026 berhasil ditutup."}`
