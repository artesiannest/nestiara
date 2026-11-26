# Aktivasi Toko Nestiara

Paket ini menambahkan toko produk digital dan jasa ke portfolio. Katalog berupa kartu kotak dengan area gambar persegi. Admin toko memakai login dashboard portfolio yang sudah ada.

## 1. Aktifkan database satu kali

1. Buka proyek Supabase yang sudah digunakan portfolio.
2. Masuk SQL Editor lalu buat query baru.
3. Buka file `supabase/SHOP_MIGRATION.sql` di paket ini.
4. Salin seluruh isinya ke SQL Editor dan klik Run.
5. Pastikan berhasil sebelum menerima pesanan.

SQL membutuhkan tabel `nest_content` dan `nest_admins` dari CMS portfolio yang lama. SQL menambahkan tabel `nest_shop_orders`, pembatasan akses admin, dan fungsi pemesanan. Data portfolio tidak dihapus atau diisi ulang. Query dapat dijalankan ulang.

Tidak perlu membuat akun admin baru. Admin yang terdaftar di `nest_admins` dapat mengelola toko dan pesanan.

## 2. Upload website

Ekstrak ZIP. File `index.html` langsung tersedia di folder hasil ekstrak, tanpa folder tambahan Nestiara-main. Paket berisi website lengkap. Untuk upload seluruh website, salin seluruh isi folder hasil ekstrak ke root repository. Jika hanya memperbarui fitur toko, file-file yang berubah adalah:

```text
index.html
css/shop.css
js/shop-model.js
js/shop.js
js/cms-api.js
js/cms-bootstrap.js
js/room.js
js/language.js
js/translations.js
admin/index.html
admin/admin.js
admin/admin.css
admin/shop-orders.js
```

File SQL dijalankan di Supabase, bukan dimasukkan ke halaman HTML. Jangan mengganti konfigurasi Supabase dengan secret key. Gunakan konfigurasi publik yang sudah ada di `js/cms-config.js`.

Paket juga berisi file portfolio lainnya. Untuk update situs yang sudah ada, cukup timpa 13 file di atas sehingga konten atau aset lain yang kamu ubah sendiri tetap dipertahankan. `index.html` berada di root repository, bukan dalam folder tambahan `Nestiara-main`.

Klik Commit changes. Tunggu GitHub Pages selesai deployment. Muat ulang website dengan Ctrl+Shift+R. Menu baru bernama Toko dan memakai hash `#toko`.

## 3. Isi pengaturan toko

1. Buka dashboard admin yang sama di `/admin/`.
2. Login dengan akun admin yang selama ini digunakan.
3. Pilih menu Pengaturan Toko.
4. Isi nama, judul singkat, deskripsi, nomor WhatsApp, email, informasi pembayaran, dan ketentuan pemesanan.
5. Set Toko aktif ke Aktif jika sudah siap menerima pesanan.
6. Klik Terbitkan untuk menyimpan pengaturan ke CMS.

Nomor WhatsApp menerima awalan 62 atau 0. Gunakan nomor yang memang akan menerima percakapan pelanggan. Jika nomor toko kosong, website menggunakan nomor WhatsApp profil portfolio.

## 4. Tambahkan produk atau jasa

1. Pilih Produk Toko lalu klik Tambah Produk Toko.
2. Kode produk terisi otomatis. Pertahankan kode ini setelah produk mulai dipesan.
3. Isi nama dan pilih Produk digital atau Jasa.
4. Isi kategori. Kategori terisi otomatis sebagai pilihan filter toko.
5. Isi deskripsi singkat serta deskripsi lengkap.
6. Upload gambar persegi, misalnya 1000 x 1000 piksel, dalam format PNG, JPG, atau WEBP. Gambar tampil memenuhi area persegi; bagian di luar rasio bisa terpotong.
7. Masukkan harga berupa angka Rupiah tanpa titik, misalnya 250000.
8. Pilih jenis harga: Harga tetap, Harga mulai, atau Minta penawaran.
9. Untuk Minta penawaran, isi harga 0. Harga 0 dalam mode ini berarti belum ada penawaran, bukan produk gratis.
10. Isi estimasi pengiriman atau pengerjaan. Lengkapi lisensi, isi paket, dan demo jika diperlukan.
11. Atur status Aktif di toko agar tampil dalam katalog.
12. Klik Terbitkan.

Tombol naik/turun mengatur urutan produk. Hapus menghapus item dari draft; klik Terbitkan untuk menerapkannya. Simpan draft hanya menyimpan di browser admin, belum mengubah website.

Status Draft / disembunyikan menyembunyikan produk dari tampilan toko. Sesudah Terbitkan, semua data katalog berada pada JSON CMS publik, termasuk item yang tidak ditampilkan. Gunakan Simpan draft untuk materi yang belum ingin dipublikasikan. Jangan masukkan data rahasia, file produk berbayar, atau tautan unduhan privat ke kolom publik. Tautan demo hanya untuk demo yang memang boleh dilihat umum.

Paket tidak menerbitkan produk dan harga contoh sebagai daganganmu. Produk uji hanya dipakai pada pengujian terpisah. Tambahkan produk asli melalui admin.

## 5. Alur pelanggan

1. Buka Toko lalu cari atau pilih kategori.
2. Klik Detail untuk membaca isi, lisensi, dan cara pengiriman.
3. Klik Tambah, lalu buka Keranjang.
4. Sesuaikan jumlah atau hapus item.
5. Isi nama, email, nomor WhatsApp, dan kebutuhan.
6. Setujui ketentuan lalu klik Kirim pesanan.
7. Sistem menyimpan pesanan dan menampilkan kode pesanan.
8. Klik Lanjutkan ke WhatsApp untuk membuka pesan konfirmasi yang sudah disiapkan. Pelanggan tetap menekan Kirim di WhatsApp sendiri.

Harga dihitung ulang dari katalog di database. Harga mulai dan penawaran merupakan estimasi yang perlu dikonfirmasi. Jika harga berubah sejak halaman dibuka, estimasi pada konfirmasi pesanan menggunakan harga terbaru dari server. Mengirim pesanan tidak menandai pembayaran sebagai lunas.

Maksimum 20 jenis produk dan 20 unit per jenis dalam satu pesanan. Sistem memakai identitas permintaan agar percobaan ulang yang sama tidak menggandakan pesanan. Ada pembatasan dasar lima pesanan per nomor dalam sepuluh menit; ini bukan pengganti proteksi spam khusus jika trafik membesar.

## 6. Kelola pesanan di admin

1. Pilih Pesanan Toko.
2. Gunakan pencarian kode, nama, atau email dan filter status.
3. Periksa item, jumlah, total estimasi, dan catatan pelanggan.
4. Hubungi pelanggan untuk memastikan detail dan pembayaran.
5. Pilih status Baru, Dikonfirmasi, Diproses, Selesai, atau Dibatalkan.
6. Isi Catatan internal admin bila diperlukan.
7. Klik Simpan status.

Perubahan status disimpan langsung, tanpa tombol Terbitkan. Catatan internal dan data pelanggan berada di tabel pesanan yang hanya dapat diakses admin. Daftar menampilkan 200 pesanan terbaru. Pesanan lama tetap tersimpan di Supabase dan dapat dikelola melalui Table Editor bila diperlukan.

Harga dan rincian di pesanan merupakan salinan saat pemesanan, sehingga perubahan harga katalog berikutnya tidak mengubah pesanan lama. Backup JSON portfolio mencakup katalog dan pengaturan toko; pesanan berada terpisah dan dapat diekspor dari Table Editor Supabase. Pemulihan versi portfolio sebelum fitur toko dapat mengembalikan katalog kosong, jadi periksa draft sebelum Terbitkan.

## Batas fitur yang sudah disiapkan

Pembayaran, verifikasi transfer, pengiriman file digital, dan pengerjaan jasa dikonfirmasi secara manual melalui email atau WhatsApp. Paket ini tidak menyertakan payment gateway, email otomatis, tautan unduhan berbayar otomatis, atau akun pelanggan.

Perubahan website dan SQL disiapkan dalam paket ini. Website GitHub Pages dan database produksi belum diperbarui langsung dari percakapan.
