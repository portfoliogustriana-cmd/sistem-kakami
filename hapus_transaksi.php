<?php
include 'koneksi_auth.php';
include 'koneksi.php';
$id = $_GET['id'];
mysqli_query($koneksi, "DELETE FROM transactions WHERE id='$id'");
header("Location: keuangan.php");
?>