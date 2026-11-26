# Hasil pemeriksaan

- Migrasi diuji dengan PostgreSQL kompatibel PGlite, termasuk dijalankan ulang. Akses sumber/cache dibatasi dan deskripsi draft, kontak privat serta data pelanggan tidak masuk sumber terjemahan.
- Handler Edge Function diuji dengan layanan simulasi: token tidak valid, nonadmin, origin tidak diizinkan, bahasa salah, pengiriman teks sembarang, key belum ada, kuota, keluaran dengan angka berubah, penulisan cache dan penggunaan ulang cache.
- Klien diuji dengan deskripsi baru di luar kamus: berubah ke English, Thai dan Chinese, lalu kembali ke Bahasa Indonesia. Input pelanggan tetap sama dan permintaan cache dideduplikasi.
- Dashboard diuji di browser dengan CMS simulasi: tombol membuat terjemahan menyelesaikan antrean, pilihan English mengubah label dan bagian bahasa konten. Posisi menu bahasa dashboard diperbaiki.
- Pencarian produk dan portfolio mencakup teks sumber serta teks terjemahan.
- Pengujian memakai data simulasi, tidak membuat pesanan atau menerbitkan perubahan di website produksi.

Batas pemeriksaan: panggilan Groq asli dan deployment Supabase produksi belum dijalankan karena API key dan akses deployment tidak tersedia. Konfigurasi satu kali di panduan masih harus dilakukan. Hasil terjemahan AI perlu ditinjau sebelum digunakan untuk istilah sensitif.
