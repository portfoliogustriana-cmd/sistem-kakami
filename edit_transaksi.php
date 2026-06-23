<?php 
include 'koneksi_auth.php'; 
include 'koneksi.php'; 
$id = $_GET['id'];
$data = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT * FROM transactions WHERE id='$id'"));

if(isset($_POST['update'])){
    $kategori = $_POST['kategori'];
    $nominal = $_POST['nominal'];
    $keterangan = $_POST['keterangan'];
    
    // Update ke database
    mysqli_query($koneksi, "UPDATE transactions SET kategori='$kategori', nominal='$nominal', keterangan='$keterangan' WHERE id='$id'");
    header("Location: keuangan.php");
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
    tailwind.config = {
        darkMode: 'class',
    }
    </script>
    <script>
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    </script>
    <style>
        .dark { color-scheme: dark; }
        input:autofill, input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #0f172a !important;
        }
        .dark input:autofill, .dark input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
            -webkit-text-fill-color: #f8fafc !important;
        }
    </style>
</head>
<body class="bg-gray-100 dark:bg-slate-900 p-10 transition-colors duration-300">
    <div class="max-w-md mx-auto bg-white dark:bg-slate-800 p-6 rounded shadow border dark:border-slate-700">
        <h2 class="text-xl font-bold mb-4 text-slate-900 dark:text-white">Edit Transaksi</h2>
        <form method="POST">
            <label class="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Kategori</label>
            <input name="kategori" value="<?php echo htmlspecialchars($data['kategori']); ?>" class="border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 w-full mb-4 rounded" required>
            
            <label class="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Nominal (Hanya Angka)</label>
            <input name="nominal" type="number" step="1000" value="<?php echo htmlspecialchars($data['nominal']); ?>" class="border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 w-full mb-4 rounded" required>
            
            <label class="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Keterangan</label>
            <input name="keterangan" value="<?php echo htmlspecialchars($data['keterangan']); ?>" class="border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 p-2 w-full mb-4 rounded">
            
            <div class="flex gap-2">
                <button name="update" class="bg-green-600 dark:bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 dark:hover:bg-emerald-500 transition-colors">Simpan Perubahan</button>
                <a href="keuangan.php" class="bg-gray-400 dark:bg-slate-600 text-white px-4 py-2 rounded hover:bg-gray-500 dark:hover:bg-slate-500 transition-colors">Batal</a>
            </div>
        </form>
    </div>
</body>
</html>