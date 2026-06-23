#!/bin/bash
php -l koneksi.php
php -l koneksi_auth.php
php -l keuangan.php || echo "keuangan.php error"
echo "DONE"
