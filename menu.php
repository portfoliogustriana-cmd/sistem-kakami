<nav class="bg-black text-white w-full fixed top-0 left-0 z-50 px-8 py-4 flex justify-between items-center border-b border-gray-800">
    <div class="flex items-center">
        <!-- Client Logo -->
        <a href="index.php" class="flex items-center group">
            <img src="logo.png" alt="Client Logo" class="max-h-[40px] w-auto dark:invert transition-all duration-300" />
        </a>
    </div>
    
    <ul class="flex space-x-2 text-sm">
        <?php 
        // Mengambil nama file yang sedang aktif
        $current_page = basename($_SERVER['PHP_SELF']); 
        ?>
        <li>
            <a href="index.php" class="px-4 py-2 rounded transition font-medium <?php echo ($current_page == 'index.php') ? 'bg-white text-black font-bold' : 'hover:bg-gray-800'; ?>">
                <svg class="w-[1em] h-[1em] mb-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M9 9l3 3 5-5"></path></svg> Dashboard
            </a>
        </li>
        <li>
            <a href="keuangan.php" class="px-4 py-2 rounded transition font-medium <?php echo ($current_page == 'keuangan.php') ? 'bg-white text-black font-bold' : 'hover:bg-gray-800'; ?>">
                <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Keuangan & Kas
            </a>
        </li>
        <li>
            <a href="order.php" class="px-4 py-2 rounded transition font-medium <?php echo ($current_page == 'order.php') ? 'bg-white text-black font-bold' : 'hover:bg-gray-800'; ?>">
                <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> Manajemen Order
            </a>
        </li>
        <li>
            <a href="konsumen.php" class="px-4 py-2 rounded transition font-medium <?php echo ($current_page == 'konsumen.php') ? 'bg-white text-black font-bold' : 'hover:bg-gray-800'; ?>">
                <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> Daftar Konsumen
            </a>
        </li>
    </ul>
</nav>