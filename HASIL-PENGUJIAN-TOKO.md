# Hasil pemeriksaan Toko

- JavaScript: pemeriksaan sintaks pada seluruh file baru dan file JS yang berubah berhasil.
- Browser desktop: menu Toko, katalog, pencarian, keranjang, perubahan jumlah, formulir pesanan, pesan sukses, dan tautan WhatsApp berhasil diuji dengan layanan CMS uji terpisah.
- Dashboard yang sama: tab produk, pengaturan, pesanan; penerbitan perubahan harga dan pembaruan status pesanan berhasil diuji. Tidak ada pesanan nyata atau pesan WhatsApp yang dikirim.
- Layar HP: pengukuran viewport dalam iframe sekitar 375 piksel memperlihatkan dua kolom, gambar persegi, dan tidak ada overflow horizontal pada halaman toko.
- Database lokal PostgreSQL melalui PGlite: migrasi dapat dijalankan ulang; total dihitung server; retry identik menghasilkan pesanan yang sama; kode produk palsu, draft, duplikat, dan jumlah tidak valid ditolak.
- Kontrol akses SQL: anonim tidak dapat membaca atau menulis langsung ke tabel pesanan; pengguna yang bukan admin tidak mendapat data pesanan; admin dapat membaca dan memperbarui status; snapshot total tidak dapat diubah melalui hak update admin yang diberikan.
- Toko nonaktif menolak pesanan baru. Produk dengan mode penawaran diterima tanpa dianggap memiliki harga tetap.

Verifikasi browser memakai katalog dan pesanan contoh di lingkungan uji yang terpisah. Data uji dan mock CMS tidak dimasukkan ke paket website. SQL belum dijalankan pada proyek Supabase produksi dan upload GitHub Pages belum dilakukan.
