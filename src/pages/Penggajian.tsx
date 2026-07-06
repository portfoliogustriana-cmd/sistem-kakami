import React, { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import {
  Users,
  Trash2,
  Clock,
  Calendar,
  Plus,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  Coins,
  HelpCircle,
  FileSpreadsheet,
  Upload,
  Search,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  getStoredData,
  saveStoredData,
  Payroll,
  getStoredMonth,
  setStoredMonth,
  Order,
  OrderItem,
  Transaction,
  Hutang,
  AttendanceLog,
} from "../lib/storage";
const Penggajian = () => {
  const [activeTab, setActiveTab] = useState<"Karyawan" | "Borongan">(
    "Karyawan",
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [hutangs, setHutangs] = useState<Hutang[]>([]);
  /* Modal & form states */
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payrollForm, setPayrollForm] = useState<Partial<Payroll>>({});
  const [expandedPayrollId, setExpandedPayrollId] = useState<number | null>(
    null,
  );
  const [boronganInputMode, setBoronganInputMode] = useState<
    "nominal" | "rincian"
  >("nominal");
  const [excelPressType, setExcelPressType] = useState<"Setelan" | "Atasan" | "Celana">("Setelan");
  /* Excel Import states */
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  /* Settings for auto-calculation during import */
  const [importGajiPerHari, setImportGajiPerHari] = useState(50000);
  const [importUangMakanPerHari, setImportUangMakanPerHari] = useState(15000);
  const [importPotonganPerJam, setImportPotonganPerJam] = useState(10000);
  const [importStdMasuk, setImportStdMasuk] = useState("08:00");
  const [importStdKeluar, setImportStdKeluar] = useState("17:00");
  const [importTanggalSlip, setImportTanggalSlip] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [importStatusBayar, setImportStatusBayar] = useState<
    "Belum Dibayar" | "Sudah Dibayar"
  >("Belum Dibayar");
  /* Quick attendance entry form states */
  const [newLogDate, setNewLogDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newLogMasuk, setNewLogMasuk] = useState("08:00");
  const [newLogKeluar, setNewLogKeluar] = useState("17:00");
  const [stdMasuk, setStdMasuk] = useState("08:00");
  const [stdKeluar, setStdKeluar] = useState("17:00");
  /* Month selection filter state & selected slip for JPEG */
  const [selectedMonth, setSelectedMonthState] = useState<string>(getStoredMonth());
  const setSelectedMonth = (val: string) => {
    setSelectedMonthState(val);
    setStoredMonth(val);
  };
  const [searchPenggajian, setSearchPenggajian] = useState("");
  const [selectedSlip, setSelectedSlip] = useState<Payroll | null>(null);
  const [exportImageUri, setExportImageUri] = useState<string | null>(null);
  const getIndonesianMonthName = (monthStr: string) => {
    const monthIndex = parseInt(monthStr.split("-")[1] || monthStr, 10) - 1;
    const names = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return names[monthIndex] || monthStr;
  };
  const formatMonthYear = (yearMonthStr: string) => {
    if (!yearMonthStr || yearMonthStr.length < 7) return yearMonthStr;
    const [year, month] = yearMonthStr.split("-");
    return `${getIndonesianMonthName(month)} ${year}`;
  };
  useEffect(() => {
    const data = getStoredData();
    setOrders(data.orders);
    setTransactions(data.transactions);
    setOrderItems(data.orderItems);
    setPayrolls(data.payroll || []);
    setHutangs(data.hutang || []);
  }, []);
  const syncData = (newPayrolls: Payroll[]) => {
    setPayrolls(newPayrolls);
    saveStoredData(orders, orderItems, transactions, newPayrolls, hutangs);
  };
  /* Time conversion & calculation utilities */
  const calculateTimes = (
    masuk: string,
    keluar: string,
    standardMasuk = "08:00",
    _standardPulang = "17:00",
  ) => {
    const [hIn, mIn] = masuk.split(":").map(Number);
    const [hOut, mOut] = keluar.split(":").map(Number);
    const [hStd, mStd] = standardMasuk.split(":").map(Number);
    const timeIn = hIn + (mIn || 0) / 60;
    const timeOut = hOut + (mOut || 0) / 60;
    const timeStd = hStd + (mStd || 0) / 60;
    const jamKerja = Math.max(0, timeOut - timeIn);
    const jamTelat = Math.max(0, timeIn - timeStd);
    return { jamKerja, jamTelat };
  };
  const addOneHour = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(":").map(Number);
      return `${String((h + 1) % 24).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
    } catch (e) {
      return "09:00";
    }
  };
  /* Excel Import Parsing Helpers */
  const parseExcelTime = (val: any): string => {
    if (!val) return "";
    if (typeof val === "number") {
      const totalSeconds = Math.round(val * 24 * 3600);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${pad(hours)}:${pad(minutes)}`;
    }
    const str = String(val).trim();
    const match = str.match(/(\d{1,2})[:.](\d{2})/);
    if (match) {
      return `${match[1].padStart(2, "0")}:${match[2]}`;
    }
    return str;
  };
  const parseExcelDate = (val: any): string => {
    if (!val) return "";
    if (typeof val === "number") {
      const utcDays = Math.floor(val - 25569);
      const dateObj = new Date(utcDays * 86400 * 1000);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    const str = String(val).trim();
    const matchDmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (matchDmy) {
      const d = matchDmy[1].padStart(2, "0");
      const m = matchDmy[2].padStart(2, "0");
      const y = matchDmy[3];
      return `${y}-${m}-${d}`;
    }
    const matchYmd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (matchYmd) {
      const y = matchYmd[1];
      const m = matchYmd[2].padStart(2, "0");
      const d = matchYmd[3].padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return str;
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error("Gagal membaca file");
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });
        if (rawRows.length < 2) {
          throw new Error("File Excel kosong atau tidak memiliki data.");
        }
        const headers = rawRows[0].map((h: any) =>
          String(h).trim().toLowerCase(),
        );
        const nameIdx = headers.findIndex(
          (h: string) =>
            h.includes("nama") ||
            h.includes("pekerja") ||
            h.includes("pegawai") ||
            h.includes("employee") ||
            h.includes("name"),
        );
        const dateIdx = headers.findIndex(
          (h: string) =>
            h.includes("tanggal") ||
            h.includes("date") ||
            h.includes("hari") ||
            h.includes("tgl"),
        );
        const inIdx = headers.findIndex(
          (h: string) =>
            h.includes("masuk") || h.includes("in") || h.includes("datang"),
        );
        const outIdx = headers.findIndex(
          (h: string) =>
            h.includes("keluar") ||
            h.includes("pulang") ||
            h.includes("out") ||
            h.includes("balik"),
        );
        const roleIdx = headers.findIndex(
          (h: string) =>
            h.includes("peran") ||
            h.includes("jabatan") ||
            h.includes("role") ||
            h.includes("posisi"),
        );
        if (nameIdx === -1 || dateIdx === -1 || inIdx === -1 || outIdx === -1) {
          throw new Error(
            "Format kolom Excel tidak sesuai! Pastikan memiliki judul kolom: Nama, Tanggal, Jam Masuk, Jam Keluar.",
          );
        }
        const parsedRows: any[] = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0 || !row[nameIdx]) continue;
          const name = String(row[nameIdx]).trim();
          const tanggal = parseExcelDate(row[dateIdx]);
          const jamMasuk = parseExcelTime(row[inIdx]);
          const jamKeluar = parseExcelTime(row[outIdx]);
          const peran =
            roleIdx !== -1 && row[roleIdx]
              ? String(row[roleIdx]).trim()
              : "Staf Administrasi";
          if (name && tanggal && jamMasuk && jamKeluar) {
            parsedRows.push({ name, tanggal, jamMasuk, jamKeluar, peran });
          }
        }
        if (parsedRows.length === 0) {
          throw new Error(
            "Tidak ditemukan baris data absensi valid. Periksa format tanggal (YYYY-MM-DD) dan jam (HH:MM).",
          );
        }
        setImportData(parsedRows);
      } catch (err: any) {
        setImportError(err.message || "Gagal memproses file.");
        setImportData([]);
      }
    };
    reader.readAsBinaryString(file);
  };
  const downloadTemplate = () => {
    const headers = [
      "Nama Pegawai",
      "Tanggal",
      "Jam Masuk",
      "Jam Keluar",
      "Peran",
    ];
    const sampleData = [
      ["Agus Setiawan", "2026-06-01", "08:00", "17:00", "Staf Administrasi"],
      ["Agus Setiawan", "2026-06-02", "08:15", "17:00", "Staf Administrasi"],
      ["Agus Setiawan", "2026-06-03", "08:00", "17:00", "Staf Administrasi"],
      ["Dewi Lestari", "2026-06-01", "07:55", "17:00", "Staf Packing"],
      ["Dewi Lestari", "2026-06-02", "08:45", "17:00", "Staf Packing"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Absensi");
    XLSX.writeFile(wb, "Template_Absensi_Karyawan.xlsx");
  };
  const handleConfirmImport = () => {
    if (importData.length === 0) return;
    const grouped: {
      [key: string]: { name: string; peran: string; logs: AttendanceLog[] };
    } = {};
    importData.forEach((row) => {
      if (!grouped[row.name]) {
        grouped[row.name] = { name: row.name, peran: row.peran, logs: [] };
      }
      const { jamKerja, jamTelat } = calculateTimes(
        row.jamMasuk,
        row.jamKeluar,
        importStdMasuk,
        importStdKeluar,
      );
      const logs = grouped[row.name].logs;
      if (!logs.some((l) => l.tanggal === row.tanggal)) {
        logs.push({
          tanggal: row.tanggal,
          jam_masuk: row.jamMasuk,
          jam_keluar: row.jamKeluar,
          jam_kerja: parseFloat(jamKerja.toFixed(2)),
          jam_telat: parseFloat(jamTelat.toFixed(2)),
        });
      }
    });
    const newSlips: Payroll[] = [...payrolls];
    Object.values(grouped).forEach((worker) => {
      worker.logs.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      const kehadiran = worker.logs.length;
      const totalJamKerja = worker.logs.reduce(
        (sum, l) => sum + l.jam_kerja,
        0,
      );
      const totalJamTelat = worker.logs.reduce(
        (sum, l) => sum + l.jam_telat,
        0,
      );
      const gajiPokok = kehadiran * importGajiPerHari;
      const totalUangMakan = kehadiran * importUangMakanPerHari;
      const totalPotongan = totalJamTelat * importPotonganPerJam;
      const totalGaji = Math.max(0, gajiPokok + totalUangMakan - totalPotongan);
      const newSlip: Payroll = {
        id: Date.now() + Math.floor(Math.random() * 100000),
        tipe: "Karyawan",
        nama_pegawai: worker.name,
        peran: worker.peran,
        jumlah: totalGaji,
        tanggal: importTanggalSlip,
        status_bayar: importStatusBayar,
        keterangan: `Import Absensi Otomatis (${kehadiran} hari kerja)`,
        kehadiran,
        gaji_per_hari: importGajiPerHari,
        jam_kerja: parseFloat(totalJamKerja.toFixed(2)),
        uang_makan_per_hari: importUangMakanPerHari,
        jam_telat: parseFloat(totalJamTelat.toFixed(2)),
        potongan_per_jam: importPotonganPerJam,
        uang_lembur: 0,
        attendance_logs: worker.logs,
      };
      const existingIdx = newSlips.findIndex(
        (s) =>
          s.nama_pegawai.toLowerCase() === worker.name.toLowerCase() &&
          s.tanggal === importTanggalSlip &&
          s.tipe === "Karyawan",
      );
      if (existingIdx !== -1) {
        newSlips[existingIdx] = newSlip;
      } else {
        newSlips.push(newSlip);
      }
    });
    syncData(newSlips);
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportData([]);
    alert(
      `Berhasil mengimpor data absensi dan membuat ${Object.keys(grouped).length} Slip Gaji Karyawan!`,
    );
  };
  const handleAddAttendanceLog = (
    date: string,
    masuk: string,
    keluar: string,
  ) => {
    const { jamKerja, jamTelat } = calculateTimes(
      masuk,
      keluar,
      stdMasuk,
      stdKeluar,
    );
    const existingLogs = payrollForm.attendance_logs || [];
    const updatedLogs = [
      ...existingLogs.filter((l) => l.tanggal !== date),
      {
        tanggal: date,
        jam_masuk: masuk,
        jam_keluar: keluar,
        jam_kerja: parseFloat(jamKerja.toFixed(2)),
        jam_telat: parseFloat(jamTelat.toFixed(2)),
      },
    ].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    setPayrollForm({ ...payrollForm, attendance_logs: updatedLogs });
    /* Auto-increment the input date to next day to make continuous entry fast & easy */
    try {
      const d = new Date(date);
      d.setDate(d.getDate() + 1);
      setNewLogDate(d.toISOString().split("T")[0]);
    } catch (e) {
      /* safe fallback */
    }
  };
  const handleRemoveAttendanceLog = (date: string) => {
    const existingLogs = payrollForm.attendance_logs || [];
    const updatedLogs = existingLogs.filter((l) => l.tanggal !== date);
    setPayrollForm({ ...payrollForm, attendance_logs: updatedLogs });
  };
  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollForm.nama_pegawai || !payrollForm.tanggal) return;
    let nominal = 0;
    let attendanceLogs: AttendanceLog[] = [];
    if (payrollForm.tipe === "Karyawan") {
      attendanceLogs = payrollForm.attendance_logs || [];
      const kehadiran = attendanceLogs.length;
      const totalJamKerja = attendanceLogs.reduce(
        (sum, l) => sum + l.jam_kerja,
        0,
      );
      const totalJamTelat = attendanceLogs.reduce(
        (sum, l) => sum + l.jam_telat,
        0,
      );
      const gajiPerHari =
        typeof payrollForm.gaji_per_hari === "string"
          ? parseFloat(payrollForm.gaji_per_hari) || 0
          : payrollForm.gaji_per_hari || 0;
      const uangMakanPerHari =
        typeof payrollForm.uang_makan_per_hari === "string"
          ? parseFloat(payrollForm.uang_makan_per_hari) || 0
          : payrollForm.uang_makan_per_hari || 0;
      const potonganPerJam =
        typeof payrollForm.potongan_per_jam === "string"
          ? parseFloat(payrollForm.potongan_per_jam) || 0
          : payrollForm.potongan_per_jam || 0;
      const uangLembur =
        typeof payrollForm.uang_lembur === "string"
          ? parseFloat(payrollForm.uang_lembur) || 0
          : payrollForm.uang_lembur || 0;
      const gajiPokok = kehadiran * gajiPerHari;
      const totalUangMakan = kehadiran * uangMakanPerHari;
      const totalPotongan = totalJamTelat * potonganPerJam;
      nominal = gajiPokok + totalUangMakan + uangLembur - totalPotongan;
      /* Mutate properties directly for persistence */
      payrollForm.kehadiran = kehadiran;
      payrollForm.jam_kerja = parseFloat(totalJamKerja.toFixed(2));
      payrollForm.jam_telat = parseFloat(totalJamTelat.toFixed(2));
    } else {
      if (boronganInputMode === "rincian") {
        if (payrollForm.borongan_items && payrollForm.borongan_items.length > 0) {
          nominal = payrollForm.borongan_items.reduce(
            (sum, item) => sum + item.qty * item.harga_per_qty,
            0,
          );
        } else {
          nominal = 0;
        }
      } else {
        const rawJumlah = payrollForm.jumlah || 0;
        nominal =
          typeof rawJumlah === "string"
            ? parseFloat(rawJumlah) || 0
            : rawJumlah;
        // Clear items if saving as flat nominal
        payrollForm.borongan_items = [];
      }
    }
    if (payrollForm.id) {
      const updated = payrolls.map((p) =>
        p.id === payrollForm.id
          ? ({ ...p, ...payrollForm, jumlah: nominal } as Payroll)
          : p,
      );
      syncData(updated);
    } else {
      const newPayroll: Payroll = {
        id: Date.now(),
        tipe: payrollForm.tipe || "Borongan",
        nama_pegawai: payrollForm.nama_pegawai,
        peran: payrollForm.peran || "Lainnya",
        jumlah: nominal,
        tanggal: payrollForm.tanggal || new Date().toISOString().split("T")[0],
        status_bayar: payrollForm.status_bayar || "Belum Dibayar",
        keterangan: payrollForm.keterangan || "",
        kehadiran: payrollForm.kehadiran,
        gaji_per_hari: payrollForm.gaji_per_hari,
        jam_kerja: payrollForm.jam_kerja,
        uang_makan_per_hari: payrollForm.uang_makan_per_hari,
        jam_telat: payrollForm.jam_telat,
        potongan_per_jam: payrollForm.potongan_per_jam,
        uang_lembur: payrollForm.uang_lembur,
        attendance_logs: attendanceLogs,
        borongan_items: payrollForm.borongan_items,
      };
      syncData([...payrolls, newPayroll]);
    }
    setIsPayrollModalOpen(false);
  };
  const handleDeletePayroll = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus slip upah ini?")) {
      const updated = payrolls.filter((p) => p.id !== id);
      syncData(updated);
    }
  };
  const handleExportJPEG = async () => {
    if (!selectedSlip) return;
    const element = document.getElementById("salary-slip-export-card");
    if (!element) {
      alert("Elemen slip gaji tidak ditemukan!");
      return;
    }
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imageUri = canvas.toDataURL("image/jpeg", 0.95);
      
      // Provide fallback for iframe environment
      setExportImageUri(imageUri);
      
      const link = document.createElement("a");
      link.href = imageUri;
      link.download = `Slip_Gaji_${selectedSlip.nama_pegawai.replace(/\s+/g, "_")}_${selectedSlip.tanggal}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert("Gagal mengekspor slip gaji ke JPEG: " + e?.message);
    }
  };
  /* Real-time calculations for the form/modal display */
  const currentLogs = payrollForm.attendance_logs || [];
  const computedKehadiran = currentLogs.length;
  const computedJamKerja = currentLogs.reduce((sum, l) => sum + l.jam_kerja, 0);
  const computedJamTelat = currentLogs.reduce((sum, l) => sum + l.jam_telat, 0);
  const currentGajiPerHari =
    typeof payrollForm.gaji_per_hari === "string"
      ? parseFloat(payrollForm.gaji_per_hari) || 0
      : payrollForm.gaji_per_hari || 0;
  const currentUangMakanPerHari =
    typeof payrollForm.uang_makan_per_hari === "string"
      ? parseFloat(payrollForm.uang_makan_per_hari) || 0
      : payrollForm.uang_makan_per_hari || 0;
  const currentPotonganPerJam =
    typeof payrollForm.potongan_per_jam === "string"
      ? parseFloat(payrollForm.potongan_per_jam) || 0
      : payrollForm.potongan_per_jam || 0;
  const currentUangLembur =
    typeof payrollForm.uang_lembur === "string"
      ? parseFloat(payrollForm.uang_lembur) || 0
      : payrollForm.uang_lembur || 0;
  const computedGajiPokok = computedKehadiran * currentGajiPerHari;
  const computedUangMakan = computedKehadiran * currentUangMakanPerHari;
  const computedPotongan = computedJamTelat * currentPotonganPerJam;
  const computedTotalGaji =
    computedGajiPokok +
    computedUangMakan +
    currentUangLembur -
    computedPotongan;

  const handleDownloadSampleExcelPress = () => {
    const wsData = [
      ["Nama Konsumen", "Nama Orderan", "Jenis", "qty"],
      ["Akasya", "KKGO", "Atasan dewasa", 12],
      ["Dede NF&S", "Engglish Class", "Atasan Dewasa", 2],
      ["Dede", "Angin Laut", "Stelan Dewasa", 9],
      ["Novy", "Unman", "stelan dewasa", 10],
      ["Novy", "Unman", "atasan dewasa", 14],
      ["Bosot", "jersey milano", "atasan anak", 1],
      ["rohmat", "amanindo", "stelan dewasa", 30],
      ["Bu ntin", "the legiun pink", "stelan bayi", 2]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Press");
    XLSX.writeFile(wb, "Template_Hitung_Press.xlsx");
  };

  const handleExcelPressUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);
      
      if (json.length === 0) {
        alert("File excel kosong atau format tidak sesuai.");
        return;
      }

      let qtySetelan = 0;
      let qtyAtasan = 0;
      let qtyCelana = 0;

      json.forEach((row: any) => {
        // Mendapatkan qty, default 1 jika tidak ada
        const qtyVal = row.qty ? parseInt(row.qty, 10) : 1;
        const finalQty = isNaN(qtyVal) ? 1 : qtyVal;
        
        // Mendapatkan jenis dari kolom Jenis
        const jenis = row.Jenis || "";
        const jenisStr = String(jenis).toLowerCase();
        
        if (jenisStr.includes("setelan") || jenisStr.includes("stelan") || jenisStr.includes("full set") || jenisStr.includes("fullset")) {
          qtySetelan += finalQty;
        } else if (jenisStr.includes("celana") || jenisStr.includes("bawahan") || jenisStr.includes("pants")) {
          qtyCelana += finalQty;
        } else if (jenisStr.includes("atasan") || jenisStr.includes("baju") || jenisStr.includes("jersey")) {
          qtyAtasan += finalQty;
        } else {
          // default jika tidak terdeteksi
          qtyAtasan += finalQty;
        }
      });

      const newItems = [];
      if (qtySetelan > 0) {
        newItems.push({
          nama_produk: `Press Setelan (Auto-Excel)`,
          qty: qtySetelan,
          harga_per_qty: 3500,
        });
      }
      if (qtyAtasan > 0) {
        newItems.push({
          nama_produk: `Press Atasan (Auto-Excel)`,
          qty: qtyAtasan,
          harga_per_qty: 2000,
        });
      }
      if (qtyCelana > 0) {
        newItems.push({
          nama_produk: `Press Celana (Auto-Excel)`,
          qty: qtyCelana,
          harga_per_qty: 1500,
        });
      }

      setPayrollForm((prev) => ({
        ...prev,
        borongan_items: [...(prev.borongan_items || []), ...newItems],
      }));
      setBoronganInputMode("rincian");
      alert(`Berhasil membaca file excel. Menambahkan rincian:\nSetelan: ${qtySetelan} pcs\nAtasan: ${qtyAtasan} pcs\nCelana: ${qtyCelana} pcs`);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  /* Get all unique available months in current activeTab */
  const availableMonths: string[] = (
    Array.from(
      new Set(
        payrolls
          .filter((p) => (p.tipe || "Borongan") === activeTab && p.tanggal)
          .map((p) => p.tanggal.substring(0, 7)),
      ),
    ) as string[]
  ).sort((a, b) => b.localeCompare(a));
  /* Descending order (newest first)  */

  /* Filter payrolls by selected month */
  const filteredPayrolls = payrolls.filter((p) => {
    const matchesTipe = (p.tipe || "Borongan") === activeTab;
    if (!matchesTipe) return false;
    /* Check search string */
    if (
      searchPenggajian &&
      !p.nama_pegawai.toLowerCase().includes(searchPenggajian.toLowerCase()) &&
      !(p.peran || "").toLowerCase().includes(searchPenggajian.toLowerCase())
    ) {
      return false;
    }
    if (selectedMonth === "all") return true;
    return p.tanggal && p.tanggal.startsWith(selectedMonth);
  });
  const computedMonthlyStats = () => {
    const list = filteredPayrolls;
    const totalPayout = list.reduce((sum, p) => sum + p.jumlah, 0);
    const paidList = list.filter((p) => p.status_bayar === "Sudah Dibayar");
    const unpaidList = list.filter((p) => p.status_bayar === "Belum Dibayar");
    const paidTotal = paidList.reduce((sum, p) => sum + p.jumlah, 0);
    const unpaidTotal = unpaidList.reduce((sum, p) => sum + p.jumlah, 0);
    const roleStats: Record<string, number> = {};
    list.forEach((p) => {
      const role = p.peran || "Lainnya";
      if (!roleStats[role]) roleStats[role] = 0;
      roleStats[role] += p.jumlah;
    });
    return {
      totalPayout,
      totalSlips: list.length,
      paidCount: paidList.length,
      unpaidCount: unpaidList.length,
      paidTotal,
      unpaidTotal,
      roleStats,
    };
  };
  const stats = computedMonthlyStats();
  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto min-h-screen">
      {" "}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        {" "}
        <div>
          {" "}
          <h1 className="text-3xl font-black text-black tracking-tight">
            Penggajian
          </h1>{" "}
          <p className="text-black font-medium mt-1">
            Manajemen upah bulanan karyawan tetap dan borongan produksi.
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="flex gap-2 mb-6 border-b border-black pb-px">
        {" "}
        <button
          onClick={() => {
            setActiveTab("Karyawan");
            setSelectedMonth("all");
          }}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === "Karyawan" ? "border-black text-black" : "border-transparent text-black hover:text-black"}`}
        >
          {" "}
          Staf / Karyawan Tetap{" "}
        </button>{" "}
        <button
          onClick={() => {
            setActiveTab("Borongan");
            setSelectedMonth("all");
          }}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === "Borongan" ? "border-black text-black" : "border-transparent text-black hover:text-black"}`}
        >
          {" "}
          CMT / Pekerja Borongan{" "}
        </button>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {" "}
        <div className="lg:col-span-1 space-y-4">
          {" "}
          <div className="border border-black rounded-2xl p-5 bg-white shadow-sm">
            {" "}
            <h4 className="text-[10px] font-black uppercase text-black mb-1">
              Total Kasbon / Pinjaman
            </h4>{" "}
            <p className="text-2xl font-mono font-black text-black">
              Rp 450.000
            </p>{" "}
            <p className="text-[10px] text-black mt-2">
              Daftar sisa utang kasbon pekerja aktif.
            </p>{" "}
          </div>{" "}
          <div className="border border-black rounded-2xl p-5 bg-white/50 space-y-3">
            {" "}
            <div className="flex gap-2 text-black">
              {" "}
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{" "}
              <div className="text-[10px] uppercase font-black tracking-wider">
                Metode Auto-Kalkulasi
              </div>{" "}
            </div>{" "}
            {activeTab === "Karyawan" ? (
              <p className="text-[11px] font-medium leading-relaxed text-black">
                {" "}
                Gaji dihitung otomatis dari kehadiran harian. Cukup log jam
                masuk dan pulang, sistem akan menghitung jam kerja, uang makan,
                dan denda keterlambatan secara otomatis.{" "}
              </p>
            ) : (
              <p className="text-[11px] font-medium leading-relaxed text-black">
                {" "}
                Pekerja borongan menerima upah berdasarkan unit pakaian yang
                diselesaikan (CMT / Per Piece). Nilai didapat dari rekap
                pengerjaan SPK.{" "}
              </p>
            )}{" "}
          </div>{" "}
          <button
            onClick={() => {
              setPayrollForm({
                tipe: activeTab,
                nama_pegawai: "",
                peran:
                  activeTab === "Karyawan" ? "Staf Administrasi" : "Penjahit",
                jumlah: "",
                tanggal: new Date().toISOString().split("T")[0],
                keterangan: "",
                status_bayar: "Belum Dibayar",
                kehadiran: activeTab === "Karyawan" ? 0 : undefined,
                gaji_per_hari: activeTab === "Karyawan" ? 50000 : undefined,
                jam_kerja: activeTab === "Karyawan" ? 0 : undefined,
                uang_makan_per_hari:
                  activeTab === "Karyawan" ? 15000 : undefined,
                jam_telat: activeTab === "Karyawan" ? 0 : undefined,
                potongan_per_jam: activeTab === "Karyawan" ? 5000 : undefined,
                uang_lembur: activeTab === "Karyawan" ? 0 : undefined,
                attendance_logs: [],
                borongan_items: activeTab === "Borongan" ? [] : undefined,
              });
              setStdMasuk("08:00");
              setStdKeluar("17:00");
              setBoronganInputMode("nominal");
              setIsPayrollModalOpen(true);
            }}
            className="w-full bg-black hover:bg-black/90 text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-widest transition-all shadow-sm flex justify-center items-center gap-2 mb-3"
          >
            {" "}
            <Plus className="w-4 h-4" /> Tambah {activeTab}{" "}
          </button>{" "}
          {activeTab === "Karyawan" && (
            <button
              onClick={() => {
                setIsImportModalOpen(true);
              }}
              className="w-full bg-black hover:bg-black text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-widest transition-all shadow-sm flex justify-center items-center gap-2"
            >
              {" "}
              <FileSpreadsheet className="w-4 h-4" /> Import Absensi Excel{" "}
            </button>
          )}{" "}
        </div>{" "}
        <div className="lg:col-span-3 border border-black rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
          {" "}
          <div className="p-4 border-b border-black bg-white/50 font-black text-xs uppercase tracking-wider flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-black">
            {" "}
            <span>Daftar Slip Upah {activeTab}</span>{" "}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {" "}
              <div className="bg-white p-2 rounded-xl flex items-center gap-1.5 border border-black shadow-inner w-full sm:w-60">
                {" "}
                <Search size={14} className="text-black" />{" "}
                <input
                  type="text"
                  placeholder="Cari nama atau peran..."
                  value={searchPenggajian}
                  onChange={(e) => setSearchPenggajian(e.target.value)}
                  className="bg-transparent border-none outline-none text-[11px] text-black w-full placeholder-slate-400 font-semibold"
                />{" "}
              </div>{" "}
              {/* Monthly Dropdown Filter */}{" "}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                {" "}
                <span className="text-[10px] text-black font-bold uppercase hidden sm:block">
                  Filter Bulan:
                </span>{" "}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white border border-black rounded-lg py-1.5 px-2.5 text-[11px] font-bold outline-none text-black"
                >
                  {" "}
                  <option value="all">Semua Bulan</option>{" "}
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthYear(m)}
                    </option>
                  ))}{" "}
                </select>{" "}
                <span className="font-mono text-[10px] text-black font-normal ml-1">
                  ({filteredPayrolls.length} Slip)
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Monthly Finance Summary Cards */}{" "}
          <div className="bg-white/60 p-4 border-b border-black grid grid-cols-1 sm:grid-cols-3 gap-3">
            {" "}
            <div className="bg-white p-3.5 rounded-xl border border-black shadow-sm flex flex-col">
              {" "}
              <span className="text-[9px] uppercase font-bold text-black tracking-wider">
                Total Upah (
                {selectedMonth === "all"
                  ? "Semua Bulan"
                  : formatMonthYear(selectedMonth)}
                )
              </span>{" "}
              <span className="text-sm font-mono font-black text-black mt-1">
                {" "}
                Rp {stats.totalPayout.toLocaleString("id-ID")}{" "}
              </span>{" "}
              <span className="text-[10px] text-black mt-1 font-semibold">
                {stats.totalSlips} Pekerja / Slip
              </span>{" "}
            </div>{" "}
            <div className="bg-white p-3.5 rounded-xl border border-black shadow-sm flex flex-col border-l-4 border-l-emerald-500">
              {" "}
              <span className="text-[9px] uppercase font-bold text-black tracking-wider">
                Lunas / Sudah Dibayar
              </span>{" "}
              <span className="text-sm font-mono font-black text-black mt-1">
                {" "}
                Rp {stats.paidTotal.toLocaleString("id-ID")}{" "}
              </span>{" "}
              <span className="text-[10px] text-black mt-1 font-semibold">
                {stats.paidCount} Pekerja Lunas
              </span>{" "}
            </div>{" "}
            <div className="bg-white p-3.5 rounded-xl border border-black shadow-sm flex flex-col border-l-4 border-l-amber-500">
              {" "}
              <span className="text-[9px] uppercase font-bold text-black tracking-wider">
                Sisa Belum Dibayar
              </span>{" "}
              <span className="text-sm font-mono font-black text-black mt-1">
                {" "}
                Rp {stats.unpaidTotal.toLocaleString("id-ID")}{" "}
              </span>{" "}
              <span className="text-[10px] text-black mt-1 font-semibold">
                {stats.unpaidCount} Pekerja Antri
              </span>{" "}
            </div>{" "}
          </div>{" "}
          {/* Borongan Role Breakdown */}{" "}
          {activeTab === "Borongan" &&
            Object.keys(stats.roleStats).length > 0 && (
              <div className="px-4 py-3 bg-white border-black flex gap-4 overflow-x-auto">
                {" "}
                {Object.entries(stats.roleStats).map(([role, total]) => (
                  <div key={role} className="flex flex-col min-w-max">
                    {" "}
                    <span className="text-[9px] uppercase font-bold text-black tracking-wider">
                      Total {role}
                    </span>{" "}
                    <span className="text-xs font-mono font-bold text-black">
                      Rp {total.toLocaleString("id-ID")}
                    </span>{" "}
                  </div>
                ))}{" "}
              </div>
            )}{" "}
          {filteredPayrolls.length === 0 ? (
            <div className="p-16 text-center text-black text-xs italic">
              {" "}
              Tidak ada data penggajian {activeTab.toLowerCase()} yang tercatat{" "}
              {selectedMonth !== "all"
                ? `pada bulan ${formatMonthYear(selectedMonth)}`
                : ""}
              .{" "}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {" "}
              {filteredPayrolls.map((p) => {
                const isExpanded = expandedPayrollId === p.id;
                return (
                  <div
                    key={p.id}
                    className="p-4 hover:bg-white/50 transition-colors"
                  >
                    {" "}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      {" "}
                      <div>
                        {" "}
                        <div className="flex items-center gap-2 flex-wrap">
                          {" "}
                          <p className="font-bold text-sm text-black uppercase">
                            {p.nama_pegawai}
                          </p>{" "}
                          <span className="text-[10px] font-bold bg-white text-black px-2 py-0.5 rounded-full">
                            {p.peran}
                          </span>{" "}
                        </div>{" "}
                        {p.tipe === "Karyawan" ? (
                          <div className="flex gap-x-3 gap-y-1 text-[11px] text-black mt-2 flex-wrap font-medium">
                            {" "}
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-black" />{" "}
                              {p.kehadiran} Hari Hadir
                            </span>{" "}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-black" />{" "}
                              {p.jam_kerja} Jam Kerja
                            </span>{" "}
                            {p.jam_telat ? (
                              <span className="flex items-center gap-1 text-black font-semibold bg-white py-0.2 rounded">
                                {" "}
                                Telat {p.jam_telat} Jam{" "}
                              </span>
                            ) : null}{" "}
                          </div>
                        ) : (
                          <p className="text-xs text-black mt-1">
                            {p.keterangan || "Upah CMT Borongan"}
                          </p>
                        )}{" "}
                        <p className="text-[10px] text-black font-mono mt-1 flex items-center gap-1">
                          {" "}
                          <Calendar className="w-3 h-3" /> Tanggal Slip:{" "}
                          {p.tanggal}{" "}
                        </p>{" "}
                      </div>{" "}
                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <p className="font-mono font-black text-sm text-black">
                            Rp {p.jumlah.toLocaleString("id-ID")}
                          </p>{" "}
                          {p.status_bayar === "Belum Dibayar" ? (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Konfirmasi pembayaran upah untuk ${p.nama_pegawai}?`,
                                  )
                                ) {
                                  const updated = payrolls.map((px) =>
                                    px.id === p.id
                                      ? {
                                          ...px,
                                          status_bayar:
                                            "Sudah Dibayar" as const,
                                        }
                                      : px,
                                  );
                                  syncData(updated);
                                }
                              }}
                              className="text-[9px] bg-white hover:bg-white text-black px-2.5 py-1 rounded font-bold uppercase tracking-wider transition-colors border border-black"
                            >
                              {" "}
                              Belum Dibayar{" "}
                            </button>
                          ) : (
                            <span className="text-[9px] bg-white text-black px-2.5 py-1 rounded font-bold uppercase tracking-wider border border-black">
                              {" "}
                              Sudah Dibayar{" "}
                            </span>
                          )}{" "}
                        </div>{" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          {p.tipe === "Karyawan" &&
                            (p.attendance_logs || []).length > 0 && (
                              <button
                                onClick={() =>
                                  setExpandedPayrollId(isExpanded ? null : p.id)
                                }
                                className="text-[10px] text-black hover:text-black px-2 py-1 rounded font-bold flex items-center gap-1 transition-colors bg-white/50"
                              >
                                {" "}
                                {isExpanded ? (
                                  <>
                                    Tutup Log <ChevronUp className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    Lihat Log ({p.attendance_logs?.length}){" "}
                                    <ChevronDown className="w-3 h-3" />
                                  </>
                                )}{" "}
                              </button>
                            )}{" "}
                          {p.tipe === "Borongan" &&
                            (p.borongan_items || []).length > 0 && (
                              <button
                                onClick={() =>
                                  setExpandedPayrollId(isExpanded ? null : p.id)
                                }
                                className="text-[10px] text-black hover:text-black px-2 py-1 rounded font-bold flex items-center gap-1 transition-colors bg-white/50"
                              >
                                {" "}
                                {isExpanded ? (
                                  <>
                                    Tutup Rincian{" "}
                                    <ChevronUp className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    Rincian ({p.borongan_items?.length} item){" "}
                                    <ChevronDown className="w-3 h-3" />
                                  </>
                                )}{" "}
                              </button>
                            )}{" "}
                          <button
                            onClick={() => setSelectedSlip(p)}
                            className="text-[10px] bg-white text-black hover:bg-white px-3 py-1 rounded font-bold uppercase transition-colors"
                          >
                            {" "}
                            Slip Gaji{" "}
                          </button>{" "}
                          <button
                            onClick={() => {
                              setPayrollForm(p);
                              setStdMasuk("08:00");
                              setStdKeluar("17:00");
                              setBoronganInputMode(
                                p.borongan_items && p.borongan_items.length > 0
                                  ? "rincian"
                                  : "nominal"
                              );
                              setIsPayrollModalOpen(true);
                            }}
                            className="text-[10px] bg-white text-black hover:bg-black/10 px-3 py-1 rounded font-bold uppercase transition-colors"
                          >
                            {" "}
                            Edit{" "}
                          </button>{" "}
                          <button
                            onClick={() => handleDeletePayroll(p.id)}
                            className="text-[10px] bg-white text-black hover:bg-white px-3 py-1 rounded font-bold uppercase flex items-center transition-colors"
                          >
                            {" "}
                            <Trash2 className="w-3 h-3 mr-1" /> Hapus{" "}
                          </button>{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                    {/* Expandable Attendance Daily Logs */}{" "}
                    {isExpanded && p.tipe === "Karyawan" && (
                      <div className="mt-4 p-4 rounded-xl bg-white border-black font-medium">
                        {" "}
                        <div className="flex items-center gap-2 text-black mb-3">
                          {" "}
                          <FileSpreadsheet className="w-4 h-4" />{" "}
                          <h5 className="text-[10px] uppercase font-black tracking-wider">
                            Histori Absensi Harian
                          </h5>{" "}
                        </div>{" "}
                        <div className="overflow-x-auto">
                          {" "}
                          <table className="w-full text-left border-collapse text-[11px]">
                            {" "}
                            <thead>
                              {" "}
                              <tr className="border-b border-black text-black font-bold uppercase">
                                {" "}
                                <th className="py-1.5 px-2">Tanggal</th>{" "}
                                <th className="py-1.5 px-2">Jam Masuk</th>{" "}
                                <th className="py-1.5 px-2">Jam Keluar</th>{" "}
                                <th className="py-1.5 px-2">Total Jam</th>{" "}
                                <th className="py-1.5 px-2 text-right">
                                  Potongan Telat
                                </th>{" "}
                              </tr>{" "}
                            </thead>{" "}
                            <tbody className="divide-y divide-slate-100">
                              {" "}
                              {(p.attendance_logs || []).map((log, idx) => (
                                <tr key={idx} className="hover:bg-white/50">
                                  {" "}
                                  <td className="py-1.5 px-2 font-mono">
                                    {log.tanggal}
                                  </td>{" "}
                                  <td className="py-1.5 px-2 font-mono">
                                    {log.jam_masuk}
                                  </td>{" "}
                                  <td className="py-1.5 px-2 font-mono">
                                    {log.jam_keluar}
                                  </td>{" "}
                                  <td className="py-1.5 px-2 font-mono">
                                    {log.jam_kerja} jam
                                  </td>{" "}
                                  <td className="py-1.5 px-2 font-mono text-right text-black">
                                    {" "}
                                    {log.jam_telat > 0 ? (
                                      <span>{log.jam_telat} jam telat</span>
                                    ) : (
                                      <span className="text-black">-</span>
                                    )}{" "}
                                  </td>{" "}
                                </tr>
                              ))}{" "}
                            </tbody>{" "}
                          </table>{" "}
                        </div>{" "}
                      </div>
                    )}{" "}
                    {/* Expandable Borongan Items Details */}{" "}
                    {isExpanded && p.tipe === "Borongan" && (
                      <div className="mt-4 p-4 rounded-xl bg-white border-black font-medium">
                        {" "}
                        <div className="flex items-center gap-2 text-black mb-3">
                          {" "}
                          <FileSpreadsheet className="w-4 h-4" />{" "}
                          <h5 className="text-[10px] uppercase font-black tracking-wider">
                            Rincian Borongan
                          </h5>{" "}
                        </div>{" "}
                        <div className="overflow-x-auto">
                          {" "}
                          <table className="w-full text-left border-collapse text-[11px]">
                            {" "}
                            <thead>
                              {" "}
                              <tr className="border-b border-black text-black font-bold uppercase">
                                {" "}
                                <th className="py-1.5 px-2">
                                  Nama Produk
                                </th>{" "}
                                <th className="py-1.5 px-2">Qty</th>{" "}
                                <th className="py-1.5 px-2 text-right">
                                  Harga Satuan
                                </th>{" "}
                                <th className="py-1.5 px-2 text-right">
                                  Subtotal
                                </th>{" "}
                              </tr>{" "}
                            </thead>{" "}
                            <tbody className="divide-y divide-slate-100">
                              {" "}
                              {(p.borongan_items || []).map((item, idx) => (
                                <tr key={idx} className="hover:bg-white/50">
                                  {" "}
                                  <td className="py-1.5 px-2 font-bold">
                                    {item.nama_produk}
                                  </td>{" "}
                                  <td className="py-1.5 px-2 font-mono">
                                    {item.qty} pcs
                                  </td>{" "}
                                  <td className="py-1.5 px-2 font-mono text-right">
                                    Rp{" "}
                                    {item.harga_per_qty.toLocaleString("id-ID")}
                                  </td>{" "}
                                  <td className="py-1.5 px-2 font-mono text-right text-black font-bold">
                                    {" "}
                                    Rp{" "}
                                    {(
                                      item.qty * item.harga_per_qty
                                    ).toLocaleString("id-ID")}{" "}
                                  </td>{" "}
                                </tr>
                              ))}{" "}
                            </tbody>{" "}
                          </table>{" "}
                        </div>{" "}
                      </div>
                    )}{" "}
                  </div>
                );
              })}{" "}
            </div>
          )}{" "}
        </div>{" "}
      </div>{" "}
      {/* Main Form Modal for Payroll (Employee or Piece-rate) */}{" "}
      {isPayrollModalOpen && (
        <div className="fixed inset-0 bg-white backdrop-blur-sm z-[100] overflow-y-auto">
          {" "}
          <div className="flex min-h-full items-start sm:items-center justify-center p-4">
            {" "}
            <div className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
              {" "}
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-black">
                {" "}
                <h3 className="text-lg font-black text-black uppercase tracking-tight">
                  {" "}
                  {payrollForm.id ? "Edit" : "Tambah"} Slip Gaji (
                  {payrollForm.tipe}){" "}
                </h3>{" "}
                <button
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="p-1.5 text-black hover:text-black transition-colors"
                >
                  {" "}
                  <X className="w-5 h-5" />{" "}
                </button>{" "}
              </div>{" "}
              <form onSubmit={handleSavePayroll} className="space-y-6">
                {" "}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {" "}
                  <div>
                    {" "}
                    <label className="text-[10px] uppercase font-black tracking-wider text-black mb-1 block">
                      Nama Pekerja
                    </label>{" "}
                    <input
                      required
                      value={payrollForm.nama_pegawai || ""}
                      onChange={(e) =>
                        setPayrollForm({
                          ...payrollForm,
                          nama_pegawai: e.target.value,
                        })
                      }
                      className="w-full border border-black bg-white rounded-xl p-3 text-sm font-semibold outline-none focus:border-black focus:bg-white transition-all text-black"
                      placeholder="Misal: Agus Setiawan"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="text-[10px] uppercase font-black tracking-wider text-black mb-1 block">
                      Peran / Kategori
                    </label>{" "}
                    {payrollForm.tipe === "Borongan" ? (
                      <select
                        value={payrollForm.peran || "Penjahit"}
                        onChange={(e) =>
                          setPayrollForm({
                            ...payrollForm,
                            peran: e.target.value,
                          })
                        }
                        className="w-full border border-black bg-white rounded-xl p-3 text-sm font-semibold outline-none focus:border-black text-black"
                      >
                        {" "}
                        <option value="Penjahit">Penjahit</option>{" "}
                        <option value="Press">Press</option>{" "}
                        <option value="Freelance Lainnya">
                          Freelance Lainnya
                        </option>{" "}
                      </select>
                    ) : (
                      <input
                        value={payrollForm.peran || ""}
                        onChange={(e) =>
                          setPayrollForm({
                            ...payrollForm,
                            peran: e.target.value,
                          })
                        }
                        className="w-full border border-black bg-white rounded-xl p-3 text-sm font-semibold outline-none focus:border-black focus:bg-white transition-all text-black"
                        placeholder="Misal: Penjahit, Staf Packing, Administrasi"
                      />
                    )}{" "}
                  </div>{" "}
                </div>{" "}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {" "}
                  <div>
                    {" "}
                    <label className="text-[10px] uppercase font-black tracking-wider text-black mb-1 block">
                      Tanggal Pembayaran
                    </label>{" "}
                    <input
                      type="date"
                      required
                      value={payrollForm.tanggal || ""}
                      onChange={(e) =>
                        setPayrollForm({
                          ...payrollForm,
                          tanggal: e.target.value,
                        })
                      }
                      className="w-full border border-black bg-white rounded-xl p-3 text-sm font-semibold outline-none focus:border-black text-black"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="text-[10px] uppercase font-black tracking-wider text-black mb-1 block">
                      Status Slip
                    </label>{" "}
                    <select
                      value={payrollForm.status_bayar || "Belum Dibayar"}
                      onChange={(e) =>
                        setPayrollForm({
                          ...payrollForm,
                          status_bayar: e.target.value as
                            "Belum Dibayar" | "Sudah Dibayar",
                        })
                      }
                      className="w-full border border-black bg-white rounded-xl p-3 text-sm font-semibold outline-none focus:border-black text-black"
                    >
                      {" "}
                      <option value="Belum Dibayar">
                        Belum Dibayar (Utang AP)
                      </option>{" "}
                      <option value="Sudah Dibayar">
                        Sudah Dibayar (Lunas / Kas Keluar)
                      </option>{" "}
                    </select>{" "}
                  </div>{" "}
                </div>{" "}
                {/* Employee Payroll Interactive Auto-Attendance Section */}{" "}
                {payrollForm.tipe === "Karyawan" ? (
                  <div className="space-y-6 pt-4 border-t border-black">
                    {" "}
                    <div className="bg-white/50 rounded-2xl p-4 border border-black">
                      {" "}
                      <h4 className="text-xs font-black uppercase text-black mb-3 flex items-center gap-2">
                        {" "}
                        <Clock className="w-4 h-4" /> Aturan Gaji & Standard
                        Kerja{" "}
                      </h4>{" "}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {" "}
                        <div>
                          {" "}
                          <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                            Gaji Pokok / Hari
                          </label>{" "}
                          <input
                            type="number"
                            value={payrollForm.gaji_per_hari || ""}
                            onChange={(e) =>
                              setPayrollForm({
                                ...payrollForm,
                                gaji_per_hari: parseFloat(e.target.value),
                              })
                            }
                            className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black"
                            placeholder="50000"
                          />{" "}
                        </div>{" "}
                        <div>
                          {" "}
                          <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                            Uang Makan / Hari
                          </label>{" "}
                          <input
                            type="number"
                            value={payrollForm.uang_makan_per_hari || ""}
                            onChange={(e) =>
                              setPayrollForm({
                                ...payrollForm,
                                uang_makan_per_hari: parseFloat(e.target.value),
                              })
                            }
                            className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black"
                            placeholder="15000"
                          />{" "}
                        </div>{" "}
                        <div>
                          {" "}
                          <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                            Standard Masuk
                          </label>{" "}
                          <input
                            type="text"
                            value={stdMasuk}
                            onChange={(e) => setStdMasuk(e.target.value)}
                            className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black"
                            placeholder="08:00"
                          />{" "}
                        </div>{" "}
                        <div>
                          {" "}
                          <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                            Standard Pulang
                          </label>{" "}
                          <input
                            type="text"
                            value={stdKeluar}
                            onChange={(e) => setStdKeluar(e.target.value)}
                            className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black"
                            placeholder="17:00"
                          />{" "}
                        </div>{" "}
                        <div>
                          {" "}
                          <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                            Denda Telat / Jam
                          </label>{" "}
                          <input
                            type="number"
                            value={payrollForm.potongan_per_jam || ""}
                            onChange={(e) =>
                              setPayrollForm({
                                ...payrollForm,
                                potongan_per_jam: parseFloat(e.target.value),
                              })
                            }
                            className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black text-black"
                            placeholder="5000"
                          />{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                    {/* Attendance Logs Manager Widget */}{" "}
                    <div className="space-y-4">
                      {" "}
                      <div className="flex justify-between items-center">
                        {" "}
                        <h4 className="text-xs font-black uppercase text-black tracking-wider flex items-center gap-2">
                          {" "}
                          <Calendar className="w-4 h-4 text-black" /> Log
                          Absensi Harian{" "}
                        </h4>{" "}
                        <span className="text-[10px] font-bold text-black bg-white px-2 py-0.5 rounded">
                          {" "}
                          Kehadiran Ter-input: {computedKehadiran} Hari{" "}
                        </span>{" "}
                      </div>{" "}
                      {/* Fast Log Entry Panel */}{" "}
                      <div className="p-4 rounded-2xl bg-white border-black space-y-3">
                        {" "}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {" "}
                          <div>
                            {" "}
                            <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                              Pilih Tanggal Absen
                            </label>{" "}
                            <input
                              type="date"
                              value={newLogDate}
                              onChange={(e) => setNewLogDate(e.target.value)}
                              className="w-full border border-black bg-white rounded-lg p-2 text-xs font-bold outline-none text-black"
                            />{" "}
                          </div>{" "}
                          <div>
                            {" "}
                            <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                              Jam Masuk Kerja
                            </label>{" "}
                            <input
                              type="text"
                              value={newLogMasuk}
                              onChange={(e) => setNewLogMasuk(e.target.value)}
                              className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black"
                              placeholder="08:00"
                            />{" "}
                          </div>{" "}
                          <div>
                            {" "}
                            <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                              Jam Pulang Kerja
                            </label>{" "}
                            <input
                              type="text"
                              value={newLogKeluar}
                              onChange={(e) => setNewLogKeluar(e.target.value)}
                              className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black"
                              placeholder="17:00"
                            />{" "}
                          </div>{" "}
                        </div>{" "}
                        {/* Quick Presets for extremely fast logging */}{" "}
                        <div className="flex justify-between items-center flex-wrap gap-2 pt-2 border-t border-black">
                          {" "}
                          <div className="flex gap-1.5 flex-wrap">
                            {" "}
                            <button
                              type="button"
                              onClick={() =>
                                handleAddAttendanceLog(
                                  newLogDate,
                                  stdMasuk,
                                  stdKeluar,
                                )
                              }
                              className="text-[10px] font-bold bg-white text-black px-2.5 py-1.5 rounded-lg border border-black hover:bg-white hover:text-black transition-colors"
                            >
                              {" "}
                              ⚡ Tepat Waktu ({stdMasuk}-{stdKeluar}){" "}
                            </button>{" "}
                            <button
                              type="button"
                              onClick={() =>
                                handleAddAttendanceLog(
                                  newLogDate,
                                  addOneHour(stdMasuk),
                                  stdKeluar,
                                )
                              }
                              className="text-[10px] font-bold bg-white text-black px-2.5 py-1.5 rounded-lg border border-black hover:bg-white hover:text-black transition-colors"
                            >
                              {" "}
                              ⏳ Telat 1 Jam ({addOneHour(stdMasuk)}-{stdKeluar}
                              ){" "}
                            </button>{" "}
                            <button
                              type="button"
                              onClick={() =>
                                handleAddAttendanceLog(
                                  newLogDate,
                                  stdMasuk,
                                  "12:00",
                                )
                              }
                              className="text-[10px] font-bold bg-white text-black px-2.5 py-1.5 rounded-lg border border-black hover:bg-white transition-colors"
                            >
                              {" "}
                              🌙 Setengah Hari ({stdMasuk}-12:00){" "}
                            </button>{" "}
                          </div>{" "}
                          <button
                            type="button"
                            onClick={() =>
                              handleAddAttendanceLog(
                                newLogDate,
                                newLogMasuk,
                                newLogKeluar,
                              )
                            }
                            className="bg-black hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                          >
                            {" "}
                            <Plus className="w-3.5 h-3.5" /> Tambah Log{" "}
                          </button>{" "}
                        </div>{" "}
                      </div>{" "}
                      {/* Log List Table inside Modal */}{" "}
                      <div className="border border-black rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                        {" "}
                        <table className="w-full text-left border-collapse text-[11px]">
                          {" "}
                          <thead className="bg-white sticky top-0 border-b border-black z-10 text-black font-bold uppercase">
                            {" "}
                            <tr>
                              {" "}
                              <th className="py-2 px-3">Tanggal</th>{" "}
                              <th className="py-2 px-3">Masuk</th>{" "}
                              <th className="py-2 px-3">Keluar</th>{" "}
                              <th className="py-2 px-3">Kerja</th>{" "}
                              <th className="py-2 px-3">Denda</th>{" "}
                              <th className="py-2 px-3 text-center">
                                Hapus
                              </th>{" "}
                            </tr>{" "}
                          </thead>{" "}
                          <tbody className="divide-y divide-slate-100">
                            {" "}
                            {currentLogs.length === 0 ? (
                              <tr>
                                {" "}
                                <td
                                  colSpan={6}
                                  className="py-8 text-center text-black italic"
                                >
                                  {" "}
                                  Belum ada log absensi harian. Gunakan tombol
                                  preset di atas untuk input cepat!{" "}
                                </td>{" "}
                              </tr>
                            ) : (
                              currentLogs.map((log, idx) => (
                                <tr key={idx} className="hover:bg-white/50">
                                  {" "}
                                  <td className="py-2 px-3 font-mono font-bold text-black">
                                    {log.tanggal}
                                  </td>{" "}
                                  <td className="py-2 px-3 font-mono">
                                    {log.jam_masuk}
                                  </td>{" "}
                                  <td className="py-2 px-3 font-mono">
                                    {log.jam_keluar}
                                  </td>{" "}
                                  <td className="py-2 px-3 font-mono text-black font-bold">
                                    {log.jam_kerja} jam
                                  </td>{" "}
                                  <td className="py-2 px-3 font-mono text-black">
                                    {" "}
                                    {log.jam_telat > 0
                                      ? `${log.jam_telat} jam`
                                      : "-"}{" "}
                                  </td>{" "}
                                  <td className="py-2 px-3 text-center">
                                    {" "}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveAttendanceLog(log.tanggal)
                                      }
                                      className="p-1 text-black hover:text-black rounded-full transition-colors"
                                    >
                                      {" "}
                                      <X className="w-4 h-4" />{" "}
                                    </button>{" "}
                                  </td>{" "}
                                </tr>
                              ))
                            )}{" "}
                          </tbody>{" "}
                        </table>{" "}
                      </div>{" "}
                      {/* Additional Extra Earnings field */}{" "}
                      <div>
                        {" "}
                        <label className="text-[10px] uppercase font-black tracking-wider text-black mb-1 block">
                          Uang Lembur Tambahan (Total Rp)
                        </label>{" "}
                        <input
                          type="number"
                          value={payrollForm.uang_lembur || ""}
                          onChange={(e) =>
                            setPayrollForm({
                              ...payrollForm,
                              uang_lembur: parseFloat(e.target.value),
                            })
                          }
                          className="w-full border border-black bg-white rounded-xl p-3 text-sm font-mono font-bold outline-none focus:border-black text-black"
                          placeholder="0"
                        />{" "}
                      </div>{" "}
                      {/* Automatic Dynamic Salary Calculator Output box */}{" "}
                      <div className="bg-black text-white p-5 rounded-2xl space-y-3 font-medium">
                        {" "}
                        <div className="text-xs uppercase font-black text-black tracking-wider">
                          Metode Rincian Slip Gaji
                        </div>{" "}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-black">
                          {" "}
                          <div className="space-y-1">
                            {" "}
                            <div>
                              • Gaji Pokok ({computedKehadiran} hr):{" "}
                              <span className="text-white font-bold">
                                Rp {computedGajiPokok.toLocaleString("id-ID")}
                              </span>
                            </div>{" "}
                            <div>
                              • Uang Makan ({computedKehadiran} hr):{" "}
                              <span className="text-white font-bold">
                                Rp {computedUangMakan.toLocaleString("id-ID")}
                              </span>
                            </div>{" "}
                          </div>{" "}
                          <div className="space-y-1">
                            {" "}
                            <div>
                              • Potongan Telat ({computedJamTelat.toFixed(1)}{" "}
                              jam):{" "}
                              <span className="text-black font-bold">
                                - Rp {computedPotongan.toLocaleString("id-ID")}
                              </span>
                            </div>{" "}
                            <div>
                              • Tambahan Lembur:{" "}
                              <span className="text-black font-bold">
                                + Rp {currentUangLembur.toLocaleString("id-ID")}
                              </span>
                            </div>{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="border-t border-black pt-3 flex justify-between items-center">
                          {" "}
                          <span className="text-xs uppercase font-black text-black">
                            Total Akhir Upah
                          </span>{" "}
                          <span className="font-mono text-lg font-black text-black">
                            Rp {computedTotalGaji.toLocaleString("id-ID")}
                          </span>{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>
                ) : (
                  /* Dynamic Borongan Items Form */
                  <div className="space-y-4 pt-4 border-t border-black">
                    {payrollForm.peran === "Press" && (
                      <div className="bg-slate-50 border border-black p-3 rounded-xl">
                        <h5 className="text-[10px] font-black uppercase text-black mb-2 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Auto-Hitung dari Excel (Sizing Press Campuran)
                        </h5>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="relative overflow-hidden inline-block w-full sm:w-auto cursor-pointer">
                            <button type="button" className="bg-black hover:bg-gray-800 text-white text-[10px] font-bold px-4 py-2 rounded-lg uppercase tracking-wider w-full text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                              <Upload className="w-3.5 h-3.5" /> Unggah File Excel
                            </button>
                            <input 
                              type="file" 
                              accept=".xlsx, .xls" 
                              onChange={handleExcelPressUpload} 
                              className="absolute left-0 top-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={handleDownloadSampleExcelPress}
                            className="bg-white border border-black hover:bg-gray-100 text-black text-[10px] font-bold px-4 py-2 rounded-lg uppercase tracking-wider w-full sm:w-auto text-center flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> Contoh Format
                          </button>
                          <p className="text-[9px] text-gray-500 font-medium leading-relaxed">
                            Sistem akan otomatis mendeteksi kata kunci jenis orderan (Setelan, Atasan, Celana) 
                            dari setiap baris di file Excel dan menghitung total rincian produk.
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Method Toggle */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-black p-3 rounded-2xl bg-slate-50">
                      <div>
                        <h4 className="text-xs font-black uppercase text-black">
                          Metode Input Upah Borongan
                        </h4>
                        <p className="text-[10px] text-black font-semibold mt-0.5">
                          Pilih input nominal total langsung atau rincian per produk.
                        </p>
                      </div>
                      <div className="flex border border-black rounded-xl overflow-hidden bg-white shrink-0 self-stretch sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setBoronganInputMode("nominal")}
                          className={`flex-1 sm:flex-initial px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                            boronganInputMode === "nominal"
                              ? "bg-black text-white"
                              : "bg-white text-black hover:bg-slate-100"
                          }`}
                        >
                          Nominal Langsung
                        </button>
                        <button
                          type="button"
                          onClick={() => setBoronganInputMode("rincian")}
                          className={`flex-1 sm:flex-initial px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                            boronganInputMode === "rincian"
                              ? "bg-black text-white"
                              : "bg-white text-black hover:bg-slate-100"
                          }`}
                        >
                          Rincian Produk
                        </button>
                      </div>
                    </div>

                    {boronganInputMode === "nominal" ? (
                      /* Flat Nominal Input Mode */
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] uppercase font-black tracking-wider text-black mb-1 block">
                            Total Nominal Upah Borongan (Rp)
                          </label>
                          <input
                            type="number"
                            required
                            value={payrollForm.jumlah || ""}
                            onChange={(e) =>
                              setPayrollForm({
                                ...payrollForm,
                                jumlah: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full border border-black bg-white rounded-xl p-3 text-sm font-mono font-bold outline-none focus:border-black text-black"
                            placeholder="Misal: 150000"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-black tracking-wider text-black mb-1 block">
                            Catatan Pengerjaan / Keterangan Borongan
                          </label>
                          <textarea
                            value={payrollForm.keterangan || ""}
                            onChange={(e) =>
                              setPayrollForm({
                                ...payrollForm,
                                keterangan: e.target.value,
                              })
                            }
                            className="w-full border border-black bg-white rounded-xl p-3 text-sm font-medium outline-none focus:border-black text-black"
                            placeholder="Misal: Pengerjaan 50 pcs baju kemeja model A"
                            rows={3}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Rincian Produk Mode */
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase text-black">
                            Daftar Rincian Produk
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              setPayrollForm({
                                ...payrollForm,
                                borongan_items: [
                                  ...(payrollForm.borongan_items || []),
                                  { nama_produk: "", qty: 1, harga_per_qty: 0 },
                                ],
                              })
                            }
                            className="text-[10px] bg-white text-black hover:bg-slate-100 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1 transition-colors border border-black"
                          >
                            <Plus className="w-3 h-3" /> Tambah Produk
                          </button>
                        </div>

                        <div className="space-y-3">
                          {(payrollForm.borongan_items || []).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col sm:flex-row gap-3 p-3 bg-white rounded-xl border border-black"
                            >
                              <div className="flex-grow">
                                <label className="text-[9px] uppercase font-bold tracking-wider text-black mb-1 block">
                                  Nama Produk
                                </label>
                                <input
                                  required
                                  value={item.nama_produk}
                                  onChange={(e) => {
                                    const newItems = [
                                      ...(payrollForm.borongan_items || []),
                                    ];
                                    newItems[idx].nama_produk = e.target.value;
                                    setPayrollForm({
                                      ...payrollForm,
                                      borongan_items: newItems,
                                    });
                                  }}
                                  className="w-full border border-black bg-white rounded-lg p-2 text-xs font-semibold outline-none focus:border-black text-black"
                                  placeholder="Misal: Kemeja Flanel"
                                />
                              </div>
                              <div className="w-full sm:w-24">
                                <label className="text-[9px] uppercase font-bold tracking-wider text-black mb-1 block">
                                  Qty (Pcs)
                                </label>
                                <input
                                  type="number"
                                  required
                                  value={item.qty}
                                  onChange={(e) => {
                                    const newItems = [
                                      ...(payrollForm.borongan_items || []),
                                    ];
                                    newItems[idx].qty =
                                      parseInt(e.target.value) || 0;
                                    setPayrollForm({
                                      ...payrollForm,
                                      borongan_items: newItems,
                                    });
                                  }}
                                  className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none focus:border-black text-black"
                                />
                              </div>
                              <div className="w-full sm:w-32">
                                <label className="text-[9px] uppercase font-bold tracking-wider text-black mb-1 block">
                                  Harga per Qty (Rp)
                                </label>
                                <input
                                  type="number"
                                  required
                                  value={item.harga_per_qty}
                                  onChange={(e) => {
                                    const newItems = [
                                      ...(payrollForm.borongan_items || []),
                                    ];
                                    newItems[idx].harga_per_qty =
                                      parseFloat(e.target.value) || 0;
                                    setPayrollForm({
                                      ...payrollForm,
                                      borongan_items: newItems,
                                    });
                                  }}
                                  className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none focus:border-black text-black"
                                />
                              </div>
                              <div className="flex items-end pb-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItems = [
                                      ...(payrollForm.borongan_items || []),
                                    ];
                                    newItems.splice(idx, 1);
                                    setPayrollForm({
                                      ...payrollForm,
                                      borongan_items: newItems,
                                    });
                                  }}
                                  className="p-1.5 text-black hover:text-black bg-white rounded-lg border border-black transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {(payrollForm.borongan_items || []).length === 0 && (
                            <div className="text-center p-4 border border-dashed border-black rounded-xl text-black text-xs italic bg-slate-50">
                              Belum ada rincian produk borongan. Klik tombol "Tambah Produk" di atas.
                            </div>
                          )}
                        </div>

                        <div className="bg-black text-white p-4 rounded-xl flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black text-black tracking-wider">
                            Total Upah Borongan
                          </span>
                          <span className="font-mono text-base font-black text-black">
                            Rp{" "}
                            {(payrollForm.borongan_items || [])
                              .reduce(
                                (sum, item) =>
                                  sum + item.qty * item.harga_per_qty,
                                0,
                              )
                              .toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-black tracking-wider text-black mb-1 block">
                            Catatan Tambahan (Opsional)
                          </label>
                          <textarea
                            value={payrollForm.keterangan || ""}
                            onChange={(e) =>
                              setPayrollForm({
                                ...payrollForm,
                                keterangan: e.target.value,
                              })
                            }
                            className="w-full border border-black bg-white rounded-xl p-3 text-sm font-medium outline-none focus:border-black text-black"
                            placeholder="Catatan pengerjaan"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}{" "}
                <div className="mt-6 pt-4 border-t border-black flex justify-end gap-3">
                  {" "}
                  <button
                    type="button"
                    onClick={() => setIsPayrollModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-black hover:text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors"
                  >
                    {" "}
                    Batal{" "}
                  </button>{" "}
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors shadow-lg shadow-sm"
                  >
                    {" "}
                    Simpan Slip Gaji{" "}
                  </button>{" "}
                </div>{" "}
              </form>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Excel Import Modal */}{" "}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-white backdrop-blur-sm z-[100] overflow-y-auto">
          {" "}
          <div className="flex min-h-full items-start sm:items-center justify-center p-4">
            {" "}
            <div className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
              {" "}
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-black">
                {" "}
                <div>
                  {" "}
                  <h3 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-2">
                    {" "}
                    <FileSpreadsheet className="w-5 h-5 text-black" /> Import
                    Absensi dari Excel{" "}
                  </h3>{" "}
                  <p className="text-black text-[10px] uppercase font-bold mt-1">
                    {" "}
                    Hitung otomatis gaji karyawan tetap dengan rekap excel{" "}
                  </p>{" "}
                </div>{" "}
                <button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportFile(null);
                    setImportData([]);
                    setImportError(null);
                  }}
                  className="p-1.5 text-black hover:text-black transition-colors"
                >
                  {" "}
                  <X className="w-5 h-5" />{" "}
                </button>{" "}
              </div>{" "}
              <div className="space-y-6">
                {" "}
                {/* Rules & Standard Settings Box */}{" "}
                <div className="bg-white/50 rounded-2xl p-4 border border-black">
                  {" "}
                  <h4 className="text-xs font-black uppercase text-black mb-3 flex items-center gap-1.5 font-bold">
                    {" "}
                    <Clock className="w-4 h-4" /> Aturan Auto-Kalkulasi Gaji
                    (Untuk Data yang Diimport){" "}
                  </h4>{" "}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                    {" "}
                    <div>
                      {" "}
                      <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                        Gaji Pokok/Hari
                      </label>{" "}
                      <input
                        type="number"
                        value={importGajiPerHari}
                        onChange={(e) =>
                          setImportGajiPerHari(parseFloat(e.target.value) || 0)
                        }
                        className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black"
                      />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                        Uang Makan/Hari
                      </label>{" "}
                      <input
                        type="number"
                        value={importUangMakanPerHari}
                        onChange={(e) =>
                          setImportUangMakanPerHari(
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black"
                      />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                        Denda Telat/Jam
                      </label>{" "}
                      <input
                        type="number"
                        value={importPotonganPerJam}
                        onChange={(e) =>
                          setImportPotonganPerJam(
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black text-black"
                      />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                        Standard Masuk
                      </label>{" "}
                      <input
                        type="text"
                        value={importStdMasuk}
                        onChange={(e) => setImportStdMasuk(e.target.value)}
                        className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black"
                      />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                        Standard Pulang
                      </label>{" "}
                      <input
                        type="text"
                        value={importStdKeluar}
                        onChange={(e) => setImportStdKeluar(e.target.value)}
                        className="w-full border border-black bg-white rounded-lg p-2 text-xs font-mono font-bold outline-none text-black"
                      />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                        Tanggal Slip
                      </label>{" "}
                      <input
                        type="date"
                        value={importTanggalSlip}
                        onChange={(e) => setImportTanggalSlip(e.target.value)}
                        className="w-full border border-black bg-white rounded-lg p-2 text-xs font-bold outline-none text-black"
                      />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <label className="text-[9px] uppercase font-bold text-black mb-1 block">
                        Status Bayar
                      </label>{" "}
                      <select
                        value={importStatusBayar}
                        onChange={(e) =>
                          setImportStatusBayar(e.target.value as any)
                        }
                        className="w-full border border-black bg-white rounded-lg p-2 text-[10px] font-bold outline-none text-black"
                      >
                        {" "}
                        <option value="Belum Dibayar">
                          Belum Dibayar
                        </option>{" "}
                        <option value="Sudah Dibayar">
                          Sudah Dibayar
                        </option>{" "}
                      </select>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                {/* File Drop & Selection Area */}{" "}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {" "}
                  <div className="border-2 border-dashed border-black rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-black transition-colors relative bg-white/50">
                    {" "}
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />{" "}
                    <Upload className="w-8 h-8 text-black mb-2" />{" "}
                    <p className="text-xs font-bold text-black">
                      {" "}
                      {importFile
                        ? importFile.name
                        : "Pilih atau Seret File Excel"}{" "}
                    </p>{" "}
                    <p className="text-[10px] text-black mt-1 font-medium">
                      Supports .xlsx, .xls, .csv
                    </p>{" "}
                  </div>{" "}
                  <div className="border border-black rounded-2xl p-5 bg-white/50 flex flex-col justify-between">
                    {" "}
                    <div>
                      {" "}
                      <h5 className="text-[10px] uppercase font-black text-black tracking-wider mb-2 font-bold">
                        Butuh template Excel?
                      </h5>{" "}
                      <p className="text-xs leading-relaxed text-black font-medium">
                        {" "}
                        Unduh template absensi terformat agar sistem kami bisa
                        mengidentifikasi nama pegawai, tanggal kerja, jam masuk,
                        dan jam pulang secara otomatis.{" "}
                      </p>{" "}
                    </div>{" "}
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="mt-4 bg-black hover:bg-gray-800 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all self-start shadow-sm cursor-pointer"
                    >
                      {" "}
                      <FileSpreadsheet className="w-4 h-4" />{" "}
                      Download Template Excel{" "}
                    </button>{" "}
                  </div>{" "}
                </div>{" "}
                {/* Error handling */}{" "}
                {importError && (
                  <div className="p-4 rounded-xl bg-white text-black text-xs font-medium flex gap-2 items-start border border-black">
                    {" "}
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{" "}
                    <div>{importError}</div>{" "}
                  </div>
                )}{" "}
                {/* Parsed Data Preview */}{" "}
                {importData.length > 0 && (
                  <div className="space-y-3">
                    {" "}
                    <div className="flex justify-between items-center border-b border-black pb-2">
                      {" "}
                      <h4 className="text-xs font-black uppercase text-black tracking-wider flex items-center gap-1.5 font-bold">
                        {" "}
                        <Check className="w-4 h-4 text-black" /> Hasil
                        Penguraian Data ({importData.length} baris log){" "}
                      </h4>{" "}
                      <span className="text-[10px] font-bold text-black bg-white py-0.5 rounded">
                        {" "}
                        Siap Diimport{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="border border-black rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                      {" "}
                      <table className="w-full text-left border-collapse text-[11px]">
                        {" "}
                        <thead className="bg-white sticky top-0 border-b border-black z-10 text-black font-bold uppercase">
                          {" "}
                          <tr>
                            {" "}
                            <th className="py-2 px-3">Nama Pegawai</th>{" "}
                            <th className="py-2 px-3">Tanggal</th>{" "}
                            <th className="py-2 px-3">Jam Masuk</th>{" "}
                            <th className="py-2 px-3">Jam Keluar</th>{" "}
                            <th className="py-2 px-3">Peran</th>{" "}
                          </tr>{" "}
                        </thead>{" "}
                        <tbody className="divide-y divide-slate-100">
                          {" "}
                          {importData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/50">
                              {" "}
                              <td className="py-2 px-3 font-bold text-black">
                                {row.name}
                              </td>{" "}
                              <td className="py-2 px-3 font-mono">
                                {row.tanggal}
                              </td>{" "}
                              <td className="py-2 px-3 font-mono">
                                {row.jamMasuk}
                              </td>{" "}
                              <td className="py-2 px-3 font-mono">
                                {row.jamKeluar}
                              </td>{" "}
                              <td className="py-2 px-3 text-black font-medium">
                                {row.peran}
                              </td>{" "}
                            </tr>
                          ))}{" "}
                        </tbody>{" "}
                      </table>{" "}
                    </div>{" "}
                  </div>
                )}{" "}
              </div>{" "}
              <div className="mt-6 pt-4 border-t border-black flex justify-end gap-3">
                {" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportFile(null);
                    setImportData([]);
                    setImportError(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-black hover:text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors"
                >
                  {" "}
                  Batal{" "}
                </button>{" "}
                <button
                  type="button"
                  disabled={importData.length === 0}
                  onClick={handleConfirmImport}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${importData.length > 0 ? "bg-black text-white hover:bg-black shadow-lg shadow-sm cursor-pointer" : "bg-white text-black cursor-not-allowed"}`}
                >
                  {" "}
                  Simpan & Buat Slip Gaji{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Printable Slip Gaji Modal (JPEG Export) */}{" "}
      {selectedSlip && (
        <div className="fixed inset-0 bg-white backdrop-blur-sm z-[110] overflow-y-auto">
          {" "}
          <div className="flex min-h-full items-center justify-center p-4">
            {" "}
            <div className="bg-white p-6 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              {" "}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-black">
                {" "}
                <h3 className="text-sm font-black text-black uppercase tracking-wider">
                  {" "}
                  Pratinjau Slip Gaji{" "}
                </h3>{" "}
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="p-1 text-black hover:text-black transition-colors"
                >
                  {" "}
                  <X className="w-5 h-5" />{" "}
                </button>{" "}
              </div>{" "}
              {/* Printable Slip Card (forced light theme style for print aesthetics) */}{" "}
              <div className="border border-black rounded-2xl overflow-hidden shadow-inner bg-white p-4 mb-4 flex justify-center">
                {" "}
                <div
                  id="salary-slip-export-card"
                  className="bg-white text-black p-8 font-sans border border-black w-full max-w-sm rounded-lg shadow-sm relative text-left"
                  style={{ minWidth: "380px" }}
                >
                  {" "}
                  {/* Decorative Paid Stamp */}{" "}
                  {selectedSlip.status_bayar === "Sudah Dibayar" && (
                    <div className="absolute top-6 right-6 border-4 border-black text-black/80 uppercase font-black tracking-widest text-[9px] px-2.5 py-0.5 rounded rotate-12 select-none">
                      {" "}
                      ✓ LUNAS{" "}
                    </div>
                  )}{" "}
                  {/* Header */}{" "}
                  <div className="text-center mb-6 pb-4 border-b border-dashed border-black">
                    {" "}
                    <h4 className="text-sm font-black tracking-widest uppercase text-black">
                      SISTEM PRODUKSI KONVEKSI
                    </h4>{" "}
                    <p className="text-[9px] uppercase tracking-wider text-black font-bold mt-0.5">
                      Laporan Slip Upah Resmi
                    </p>{" "}
                    <div className="mt-3 inline-block bg-white px-3 py-1 rounded text-[10px] font-black tracking-wider uppercase text-black">
                      {" "}
                      SLIP GAJI{" "}
                      {selectedSlip.tipe === "Karyawan"
                        ? "KARYAWAN TETAP"
                        : "BORONGAN CMT"}{" "}
                    </div>{" "}
                  </div>{" "}
                  {/* Employee Info Grid */}{" "}
                  <div className="grid grid-cols-2 gap-y-3 text-[11px] mb-6 pb-4 border-b border-black">
                    {" "}
                    <div>
                      {" "}
                      <span className="text-black block text-[9px] uppercase font-bold">
                        Nama Karyawan
                      </span>{" "}
                      <span className="font-extrabold text-black uppercase">
                        {selectedSlip.nama_pegawai}
                      </span>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <span className="text-black block text-[9px] uppercase font-bold">
                        Jabatan / Peran
                      </span>{" "}
                      <span className="font-extrabold text-black uppercase">
                        {selectedSlip.peran}
                      </span>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <span className="text-black block text-[9px] uppercase font-bold">
                        Tanggal Slip
                      </span>{" "}
                      <span className="font-mono font-bold text-black">
                        {selectedSlip.tanggal}
                      </span>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <span className="text-black block text-[9px] uppercase font-bold">
                        Status Upah
                      </span>{" "}
                      <span
                        className={`font-extrabold uppercase ${selectedSlip.status_bayar === "Sudah Dibayar" ? "text-black" : "text-black"}`}
                      >
                        {" "}
                        {selectedSlip.status_bayar}{" "}
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                  {/* Calculations Details */}{" "}
                  <div className="mb-6">
                    {" "}
                    <span className="text-[10px] font-black uppercase text-black tracking-wider block mb-2">
                      Rincian Penerimaan Gaji
                    </span>{" "}
                    {selectedSlip.tipe === "Karyawan" ? (
                      <div className="space-y-2.5 text-[11px]">
                        {" "}
                        {/* Gaji Pokok row */}{" "}
                        <div className="flex justify-between items-center py-1 border-b border-black">
                          {" "}
                          <span className="text-black">
                            Gaji Pokok ({selectedSlip.kehadiran || 0} Hari)
                          </span>{" "}
                          <span className="font-mono font-extrabold text-black">
                            {" "}
                            Rp{" "}
                            {(
                              (selectedSlip.kehadiran || 0) *
                              (selectedSlip.gaji_per_hari || 50000)
                            ).toLocaleString("id-ID")}{" "}
                          </span>{" "}
                        </div>{" "}
                        {/* Uang Makan row */}{" "}
                        <div className="flex justify-between items-center py-1 border-b border-black">
                          {" "}
                          <span className="text-black">
                            Uang Makan ({selectedSlip.kehadiran || 0} Hari)
                          </span>{" "}
                          <span className="font-mono font-extrabold text-black">
                            {" "}
                            Rp{" "}
                            {(
                              (selectedSlip.kehadiran || 0) *
                              (selectedSlip.uang_makan_per_hari || 15000)
                            ).toLocaleString("id-ID")}{" "}
                          </span>{" "}
                        </div>{" "}
                        {/* Uang Lembur row */}{" "}
                        {selectedSlip.uang_lembur ? (
                          <div className="flex justify-between items-center py-1 border-b border-black">
                            {" "}
                            <span className="text-black">
                              Uang Lembur Tambahan
                            </span>{" "}
                            <span className="font-mono font-extrabold text-black">
                              {" "}
                              + Rp{" "}
                              {selectedSlip.uang_lembur.toLocaleString(
                                "id-ID",
                              )}{" "}
                            </span>{" "}
                          </div>
                        ) : null}{" "}
                        {/* Potongan Telat row */}{" "}
                        {selectedSlip.jam_telat ? (
                          <div className="flex justify-between items-center py-1 border-b border-black text-black font-medium">
                            {" "}
                            <span>
                              Denda Telat ({selectedSlip.jam_telat.toFixed(1)}{" "}
                              jam)
                            </span>{" "}
                            <span className="font-mono font-extrabold">
                              {" "}
                              - Rp{" "}
                              {(
                                (selectedSlip.jam_telat || 0) *
                                (selectedSlip.potongan_per_jam || 5000)
                              ).toLocaleString("id-ID")}{" "}
                            </span>{" "}
                          </div>
                        ) : null}{" "}
                      </div>
                    ) : (
                      /* Borongan Type layout */ <div className="space-y-3.5 text-[11px]">
                        {" "}
                        <div className="flex flex-col py-1 border-b border-black">
                          {" "}
                          <div className="flex justify-between items-center">
                            {" "}
                            <span className="font-semibold text-black">
                              Upah CMT Borongan
                            </span>{" "}
                            <span className="font-mono font-extrabold text-black">
                              {" "}
                              Rp{" "}
                              {selectedSlip.jumlah.toLocaleString("id-ID")}{" "}
                            </span>{" "}
                          </div>{" "}
                          {selectedSlip.keterangan && (
                            <p className="text-[10px] text-black mt-1 whitespace-pre-line leading-relaxed italic bg-white p-2 rounded border border-black">
                              {" "}
                              {selectedSlip.keterangan}{" "}
                            </p>
                          )}{" "}
                        </div>{" "}
                      </div>
                    )}{" "}
                  </div>{" "}
                  {/* Net Pay Amount */}{" "}
                  <div className="bg-white p-3.5 rounded-xl border border-black mb-6 flex justify-between items-center">
                    {" "}
                    <span className="text-[10px] font-black uppercase text-black tracking-wider">
                      Total Bersih Diterima
                    </span>{" "}
                    <span className="font-mono text-sm font-black text-black bg-white/50 px-2.5 py-1 rounded">
                      {" "}
                      Rp {selectedSlip.jumlah.toLocaleString("id-ID")}{" "}
                    </span>{" "}
                  </div>{" "}
                  {/* Bottom Signatures Area */}{" "}
                  <div className="grid grid-cols-2 gap-6 text-center text-[9px] mt-8 pt-4 border-t border-dashed border-black">
                    {" "}
                    <div>
                      {" "}
                      <span className="text-black block mb-10 font-medium">
                        Penerima Upah
                      </span>{" "}
                      <div className="border-b border-black w-20 mx-auto mb-1"></div>{" "}
                      <span className="font-extrabold text-black uppercase">
                        {selectedSlip.nama_pegawai}
                      </span>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <span className="text-black block mb-10 font-medium">
                        Staf Keuangan
                      </span>{" "}
                      <div className="border-b border-black w-20 mx-auto mb-1"></div>{" "}
                      <span className="font-extrabold text-black uppercase">
                        OFFICIAL
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              {/* Action Buttons */}{" "}
              <div className="flex gap-3 justify-end pt-2">
                {" "}
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="px-5 py-2.5 rounded-xl border border-black hover:bg-white font-bold text-xs uppercase tracking-wider text-black transition-colors"
                >
                  {" "}
                  Tutup{" "}
                </button>{" "}
                <button
                  onClick={handleExportJPEG}
                  className="px-5 py-2.5 rounded-xl bg-black hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-sm flex items-center gap-1.5"
                >
                  {" "}
                  Download JPEG{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
      
      {/* Export Image Fallback Modal (For Iframe limitations) */}
      {exportImageUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-black flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-black">
              <div>
                <h3 className="text-lg font-black text-black uppercase tracking-wider">Berhasil Dibuat</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Jika unduhan otomatis tidak berjalan, silakan simpan gambar di bawah ini secara manual.
                </p>
              </div>
              <button
                onClick={() => setExportImageUri(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50 flex justify-center border-b border-black">
              <img 
                src={exportImageUri} 
                alt="Slip Gaji Export" 
                className="max-w-full h-auto shadow-md rounded-md border border-gray-200"
              />
            </div>
            
            <div className="p-6 bg-white space-y-3 text-sm text-center">
              <p className="font-bold text-black flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Cara Menyimpan:
              </p>
              <ul className="text-xs text-gray-600 font-medium space-y-1 inline-block text-left">
                <li>• <b>HP / Mobile:</b> Tekan tahan gambar di atas, lalu pilih "Simpan Gambar / Save Image".</li>
                <li>• <b>Laptop / PC:</b> Klik kanan gambar di atas, lalu pilih "Save image as...".</li>
              </ul>
            </div>
            
            <div className="p-4 bg-slate-50 flex justify-end">
              <button
                onClick={() => setExportImageUri(null)}
                className="px-6 py-2 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Penggajian;
