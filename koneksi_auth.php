<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
// Jika tidak ada sesi login, lempar paksa ke halaman login
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}
?>