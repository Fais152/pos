# PRD — Aplikasi Kasir & Analisis Penjualan Kafe (Web)

| | |
|---|---|
| **Versi** | 1.0 (draft) |
| **Tanggal** | 23 Oktober 2026 |
| **Pemilik produk** | Fais |
| **Platform** | Aplikasi web responsif (HP, tablet, laptop) |
| **Alat pembangunan** | opencode |
| **Bahasa antarmuka** | Bahasa Indonesia |

---

## 1. Ringkasan

Aplikasi web untuk satu kafe yang menggabungkan **kasir (POS)**, **manajemen stok bahan baku**, dan **rekap/analisis penjualan** harian dan bulanan yang bisa diunduh sebagai **PDF**.

**Masalah yang diselesaikan**
- Pencatatan penjualan manual sulit direkap dan rawan salah hitung.
- Pemilik tidak tahu menu mana yang paling laku dan jam berapa kafe paling ramai.
- Stok bahan baku sering habis atau berlebih karena tidak terpantau.

**Tujuan produk**
1. Kasir dapat mencatat transaksi dengan cepat (target ≤ 30 detik per transaksi sederhana).
2. Stok bahan baku berkurang otomatis berdasarkan resep menu yang terjual.
3. Pemilik mendapat rekap harian dan bulanan dalam PDF yang siap disimpan atau dibagikan.
4. Pemilik bisa melihat tren penjualan dalam satu dashboard.

**Bukan tujuan (di luar cakupan versi 1)**
- Integrasi GoFood, GrabFood, ShopeeFood.
- Payment gateway / verifikasi QRIS otomatis (QRIS hanya dicatat sebagai metode bayar).
- Multi-cabang.
- Mode offline penuh.
- Akuntansi lengkap (jurnal, neraca, pajak).

---

## 2. Pengguna & Peran

| Peran | Jumlah | Kebutuhan utama |
|---|---|---|
| **Owner** | 1 | Melihat laporan, mengelola menu, stok, dan akun kasir, membatalkan transaksi |
| **Kasir** | 1–2 | Membuat transaksi, melihat riwayat transaksi sendiri, melihat stok |

**Matriks hak akses**

| Fitur | Owner | Kasir |
|---|:---:|:---:|
| Login | ✅ | ✅ |
| Buat transaksi | ✅ | ✅ |
| Lihat riwayat transaksi | Semua | Milik sendiri (hari ini) |
| Batalkan (void) transaksi | ✅ | ❌ |
| Kelola menu & kategori | ✅ | ❌ |
| Kelola bahan baku, resep, restock | ✅ | Lihat saja |
| Catat stok opname / bahan terbuang | ✅ | ❌ |
| Dashboard & laporan | ✅ | ❌ |
| Unduh PDF rekap | ✅ | ❌ |
| Kelola akun kasir & pengaturan kafe | ✅ | ❌ |

---

## 3. Ruang Lingkup

### 3.1 MVP (wajib)
1. Autentikasi & peran
2. Manajemen menu & kategori
3. Kasir (POS): dine-in & takeaway, tunai / QRIS / transfer
4. Manajemen stok bahan baku + resep + pengurangan stok otomatis
5. Riwayat transaksi & pembatalan (void)
6. Dashboard penjualan
7. Rekap harian & bulanan dalam PDF
8. Pengaturan kafe

### 3.2 Fase 2 (opsional, setelah MVP stabil)
- Ringkasan naratif dengan AI (LLM) dari data penjualan
- Promo terjadwal, voucher
- Data pelanggan & poin loyalitas
- Buka/tutup shift kasir (modal awal & selisih kas)
- Cetak struk ke printer thermal (versi 1 cukup cetak via browser)
- Ekspor Excel/CSV
- Mode offline (PWA)

---

## 4. Kebutuhan Fungsional

Prioritas: **M** = Must, **S** = Should, **C** = Could.

### 4.1 Autentikasi & Pengguna
| ID | Kebutuhan | Prioritas |
|---|---|:---:|
| AUTH-1 | Login dengan username/email + password | M |
| AUTH-2 | Password disimpan ter-hash (bcrypt/argon2) | M |
| AUTH-3 | Pembatasan halaman berdasarkan peran (owner/kasir) | M |
| AUTH-4 | Owner dapat menambah, menonaktifkan, dan reset password kasir | M |
| AUTH-5 | Sesi otomatis berakhir setelah tidak aktif (default 12 jam) | S |

### 4.2 Menu & Kategori
| ID | Kebutuhan | Prioritas |
|---|---|:---:|
| MENU-1 | CRUD kategori (mis. Kopi, Non-Kopi, Makanan, Snack) | M |
| MENU-2 | CRUD menu: nama, kategori, harga jual, status aktif/nonaktif | M |
| MENU-3 | Menu nonaktif tidak muncul di kasir tetapi tetap ada di laporan lama | M |
| MENU-4 | Foto menu | C |
| MENU-5 | Varian/ukuran (S/M/L) dan tambahan (extra shot) | C |

### 4.3 Kasir (POS)
| ID | Kebutuhan | Prioritas |
|---|---|:---:|
| POS-1 | Grid menu per kategori + pencarian nama menu | M |
| POS-2 | Keranjang: tambah, kurangi, hapus item, catatan per item | M |
| POS-3 | Pilih tipe pesanan: **Dine-in** (dengan label meja, opsional) atau **Takeaway** | M |
| POS-4 | Diskon manual per transaksi (nominal atau persen) | S |
| POS-5 | Pajak/service charge sesuai pengaturan (default 0%) | S |
| POS-6 | Metode bayar: **Tunai**, **QRIS**, **Transfer** | M |
| POS-7 | Tunai: input uang diterima, hitung kembalian otomatis, tombol nominal cepat | M |
| POS-8 | Nomor transaksi otomatis, format `INV-YYYYMMDD-0001` (reset tiap hari) | M |
| POS-9 | Struk digital + cetak lewat browser (`window.print`) | M |
| POS-10 | Layout nyaman di tablet dan HP (tombol besar) | M |

### 4.4 Stok Bahan Baku
| ID | Kebutuhan | Prioritas |
|---|---|:---:|
| STK-1 | CRUD bahan baku: nama, satuan (gram, ml, pcs), stok saat ini, batas minimum, harga beli per satuan | M |
| STK-2 | **Resep per menu**: daftar bahan + jumlah per porsi | M |
| STK-3 | Saat transaksi berstatus lunas, stok bahan berkurang otomatis sesuai resep × qty | M |
| STK-4 | Restock/pembelian: tambah stok + catatan (supplier, harga) | M |
| STK-5 | Penyesuaian stok (stok opname) dan pencatatan bahan terbuang/rusak, wajib alasan | M |
| STK-6 | Riwayat pergerakan stok (kartu stok) per bahan | M |
| STK-7 | Peringatan bahan di bawah batas minimum (badge di dashboard dan halaman stok) | M |
| STK-8 | Void transaksi mengembalikan stok yang tadinya dikurangi | M |
| STK-9 | Estimasi HPP per menu dari resep × harga beli bahan | S |

### 4.5 Riwayat Transaksi & Void
| ID | Kebutuhan | Prioritas |
|---|---|:---:|
| TRX-1 | Daftar transaksi dengan filter tanggal, kasir, metode bayar, tipe pesanan | M |
| TRX-2 | Detail transaksi + cetak ulang struk | M |
| TRX-3 | Void hanya oleh owner, wajib alasan; transaksi tidak dihapus, hanya berstatus `void` | M |
| TRX-4 | Transaksi void tidak dihitung di omzet, tetapi tercatat di laporan sebagai jumlah void | M |

### 4.6 Dashboard
| ID | Kebutuhan | Prioritas |
|---|---|:---:|
| DSH-1 | Kartu ringkasan hari ini: omzet, jumlah transaksi, rata-rata per transaksi, item terjual | M |
| DSH-2 | Grafik penjualan per jam (hari ini) dan per hari (7 / 30 hari terakhir) | M |
| DSH-3 | Top 5 menu terlaris | M |
| DSH-4 | Komposisi metode bayar dan tipe pesanan | S |
| DSH-5 | Daftar bahan baku hampir habis | M |
| DSH-6 | Filter rentang tanggal | S |
| DSH-7 | **Insight otomatis berbasis aturan** (tanpa LLM), contoh di bagian 7 | S |

### 4.7 Laporan & Rekap PDF
| ID | Kebutuhan | Prioritas |
|---|---|:---:|
| RPT-1 | Pilih tanggal → unduh **Rekap Harian (PDF)** | M |
| RPT-2 | Pilih bulan → unduh **Rekap Bulanan (PDF)** | M |
| RPT-3 | Isi kedua rekap mengikuti spesifikasi bagian 6 | M |
| RPT-4 | Nama file otomatis: `rekap-harian-2026-10-23.pdf`, `rekap-bulanan-2026-10.pdf` | M |
| RPT-5 | PDF dibuat di sisi server agar konsisten di semua perangkat | M |
| RPT-6 | Rekap bulanan otomatis dibuat tiap akhir bulan dan disimpan | C |

### 4.8 Pengaturan
| ID | Kebutuhan | Prioritas |
|---|---|:---:|
| SET-1 | Nama kafe, alamat, nomor telepon, teks kaki struk | M |
| SET-2 | Persentase pajak dan service charge | S |
| SET-3 | Zona waktu default **Asia/Makassar (WITA)** | M |
| SET-4 | Jam pergantian hari laporan (default 00:00) | C |

---

## 5. Aturan Bisnis

1. **Omzet** = jumlah `total` semua transaksi berstatus `paid` (tidak termasuk `void`).
2. **Stok berkurang** hanya saat transaksi dibayar. Pembatalan mengembalikan stok lewat catatan pergerakan baru, bukan mengubah catatan lama.
3. Menu **tanpa resep** tetap bisa dijual; stok tidak berubah dan menu ditandai "resep belum diatur" di halaman menu.
4. Bila stok bahan tidak cukup, kasir mendapat **peringatan tetapi tetap bisa melanjutkan** (stok fisik kerap tidak sinkron). Stok boleh menjadi negatif dan tampil merah.
5. Harga dan nama menu pada transaksi disimpan sebagai **snapshot** agar laporan lama tidak berubah ketika harga menu diedit.
6. Estimasi **laba kotor** = omzet − HPP (resep × harga beli bahan saat transaksi terjadi). Berupa estimasi, bukan laporan keuangan resmi.
7. Semua waktu disimpan UTC di database dan ditampilkan dalam WITA.
8. Mata uang Rupiah, tanpa desimal, format `Rp 25.000`.

---

## 6. Spesifikasi PDF

### 6.1 Rekap Harian
Satu sampai dua halaman A4.

1. **Header**: nama kafe, judul "Rekap Penjualan Harian", tanggal, waktu dibuat.
2. **Ringkasan**: total omzet, jumlah transaksi, rata-rata per transaksi, total item terjual, jumlah transaksi void, estimasi laba kotor.
3. **Berdasarkan metode bayar**: tunai / QRIS / transfer (jumlah transaksi dan nominal).
4. **Berdasarkan tipe pesanan**: dine-in vs takeaway.
5. **Tabel menu terjual**: nama menu, qty, subtotal, urut dari yang terbanyak.
6. **Penjualan per jam**: tabel atau grafik batang.
7. **Per kasir**: jumlah transaksi dan omzet.
8. **Catatan stok**: bahan di bawah batas minimum dan bahan terbuang hari itu.
9. **Insight singkat** (rule-based).

### 6.2 Rekap Bulanan
Dua sampai tiga halaman A4.

1. **Header**: nama kafe, "Rekap Penjualan Bulanan", nama bulan dan tahun.
2. **Ringkasan**: total omzet, jumlah transaksi, rata-rata omzet per hari, rata-rata per transaksi, estimasi laba kotor, **perbandingan dengan bulan sebelumnya (%)**.
3. **Grafik tren omzet harian** sepanjang bulan.
4. **Tabel per hari**: tanggal, jumlah transaksi, omzet.
5. **Hari terbaik dan hari terendah**, serta pola per hari dalam minggu (Senin–Minggu).
6. **Top 10 menu** (qty dan omzet) dan **menu paling sepi**.
7. **Per kategori**: kontribusi omzet (%).
8. **Metode bayar** dan **tipe pesanan** (komposisi %).
9. **Per kasir**.
10. **Ringkasan stok**: total pembelian bahan, total bahan terbuang (nilai), 5 bahan dengan pemakaian terbesar.
11. **Insight bulanan** (rule-based).

---

## 7. Insight Otomatis (Rule-based, MVP)

Dihitung dengan kueri biasa, tanpa memanggil LLM. Contoh:

- "Omzet hari ini **naik/turun X%** dibanding rata-rata hari [nama hari] pada 4 minggu terakhir."
- "Menu terlaris hari ini: **[nama]** (N porsi)."
- "Jam paling ramai: **[jam]**."
- "**[Bahan]** tersisa [N satuan], di bawah batas minimum."
- "Menu **[nama]** tidak terjual dalam 14 hari terakhir."

**Fase 2 (opsional):** kirim data agregat (bukan data mentah) ke LLM untuk ringkasan naratif dan saran. Kunci API hanya di sisi server.

---

## 8. Alur Utama

**Transaksi**
1. Kasir login → halaman Kasir.
2. Pilih menu → keranjang → pilih Dine-in/Takeaway (→ label meja bila dine-in).
3. (Opsional) isi diskon.
4. Pilih metode bayar → untuk tunai isi uang diterima.
5. Konfirmasi → transaksi `paid` → stok bahan berkurang → struk tampil.

**Restock bahan**
Owner buka Stok → pilih bahan → Restock → isi jumlah, harga beli, catatan → stok bertambah dan tercatat di kartu stok.

**Rekap**
Owner buka Laporan → pilih Harian/Bulanan → pilih tanggal/bulan → Pratinjau → Unduh PDF.

---

## 9. Model Data

```
users            id, name, username, password_hash, role (owner|kasir), is_active, created_at
categories       id, name, sort_order
products         id, category_id, name, price, is_active, created_at
ingredients      id, name, unit (g|ml|pcs), current_stock, min_stock, cost_per_unit, is_active
recipes          id, product_id, ingredient_id, qty_per_portion
stock_movements  id, ingredient_id, type (purchase|sale|void_return|adjustment|waste),
                 qty_change (+/-), unit_cost, note, order_id (nullable), created_by, created_at
orders           id, order_no, order_type (dine_in|takeaway), table_label (nullable),
                 status (paid|void), subtotal, discount, tax, service_charge, total,
                 payment_method (cash|qris|transfer), cash_received, change_amount,
                 cashier_id, created_at, voided_at, void_reason, voided_by
order_items      id, order_id, product_id, product_name, unit_price, qty, line_total,
                 note, unit_cogs
settings         key, value   (cafe_name, address, phone, tax_percent, service_percent,
                               receipt_footer, timezone)
```

Catatan desain:
- `order_items.product_name`, `unit_price`, `unit_cogs` adalah snapshot saat transaksi.
- `stock_movements` bersifat **append-only**; `current_stock` di `ingredients` diperbarui di transaksi database yang sama.
- Pembuatan order, item, dan pengurangan stok harus dalam **satu transaksi database** (atomic).
- Tambahkan indeks pada `orders(created_at)`, `orders(status, created_at)`, `order_items(product_id)`, `stock_movements(ingredient_id, created_at)`.

---

## 10. Peta Halaman

| Rute | Halaman | Akses |
|---|---|---|
| `/login` | Login | Publik |
| `/kasir` | Layar kasir | Owner, Kasir |
| `/transaksi` | Riwayat transaksi | Owner (semua), Kasir (miliknya) |
| `/transaksi/[id]` | Detail & struk | Owner, Kasir |
| `/menu` | Kelola menu & kategori | Owner |
| `/stok` | Daftar bahan, restock, opname | Owner (kelola), Kasir (lihat) |
| `/stok/[id]` | Kartu stok bahan | Owner |
| `/dashboard` | Dashboard & insight | Owner |
| `/laporan` | Pilih & unduh rekap PDF | Owner |
| `/pengaturan` | Pengaturan kafe & akun kasir | Owner |

---

## 11. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| **Responsif** | Nyaman di layar 360 px (HP) sampai desktop; kasir dioptimalkan untuk tablet |
| **Performa** | Halaman kasir termuat < 2 detik di koneksi 4G; simpan transaksi < 1 detik |
| **Keamanan** | Password ter-hash, sesi aman (httpOnly cookie), validasi input di server, proteksi CSRF, seluruh rute dilindungi pengecekan peran di server |
| **Integritas data** | Transaksi atomic; tidak ada penghapusan permanen transaksi |
| **Backup** | Backup database otomatis harian (sesuai fitur penyedia database) |
| **Ketersediaan** | Cukup untuk satu kafe; tidak ada SLA ketat |
| **Bahasa** | Seluruh teks UI dan PDF dalam Bahasa Indonesia |
| **Aksesibilitas** | Kontras jelas, target sentuh ≥ 44 px |

---

## 12. Rekomendasi Teknologi

Rekomendasi agar mudah dibangun dengan opencode; boleh diganti.

| Lapisan | Pilihan |
|---|---|
| Framework | **Next.js** (App Router) + **TypeScript** |
| UI | **Tailwind CSS** + **shadcn/ui** |
| Database | **PostgreSQL** (mis. Supabase atau Neon) |
| ORM | **Drizzle** atau **Prisma** |
| Autentikasi | **Auth.js** atau Supabase Auth, dengan peran `owner`/`kasir` |
| Grafik | **Recharts** |
| PDF | **@react-pdf/renderer** atau **pdfmake** (dibuat di server) |
| Validasi | **Zod** |
| Hosting | **Vercel** (aplikasi) + penyedia database di atas |

Cek ketersediaan paket gratis dan batasannya langsung di situs masing-masing sebelum memutuskan.

---

## 13. Kriteria Penerimaan (MVP)

- [ ] Owner dapat login, membuat 2 akun kasir; kasir tidak bisa membuka `/dashboard`, `/laporan`, `/menu`.
- [ ] Kasir dapat membuat transaksi dine-in dan takeaway dengan ketiga metode bayar; kembalian tunai terhitung benar.
- [ ] Setelah transaksi, stok bahan berkurang sesuai resep; kartu stok mencatat pergerakannya.
- [ ] Void oleh owner mengembalikan stok dan mengeluarkan transaksi dari omzet.
- [ ] Mengubah harga menu tidak mengubah angka laporan transaksi lama.
- [ ] Peringatan muncul untuk bahan di bawah batas minimum.
- [ ] Dashboard menampilkan omzet, jumlah transaksi, top 5 menu, dan grafik per jam hari ini.
- [ ] PDF rekap harian dan bulanan terunduh, angkanya **sama** dengan dashboard untuk periode yang sama.
- [ ] Semua tampilan dapat dipakai di layar HP dan tablet.

---

## 14. Metrik Keberhasilan

- Seluruh transaksi harian tercatat di aplikasi (tidak ada lagi catatan manual) setelah 2 minggu pemakaian.
- Waktu menyusun rekap bulanan turun dari manual (jam) menjadi di bawah 1 menit.
- Selisih stok sistem vs stok fisik pada stok opname bulanan di bawah 10% (target awal, disesuaikan).
- Kasir menyelesaikan transaksi sederhana ≤ 30 detik.

---

## 15. Urutan Pengerjaan di opencode

Kerjakan bertahap, satu tahap per sesi/prompt, uji tiap tahap sebelum lanjut.

| Tahap | Isi | Hasil yang diuji |
|---|---|---|
| **0** | Inisialisasi proyek, skema database, migrasi, seed data contoh (menu, bahan, resep) | Aplikasi jalan, database terisi |
| **1** | Autentikasi, peran, proteksi rute, kelola akun kasir | Login & pembatasan akses |
| **2** | Kategori & menu | CRUD menu |
| **3** | Bahan baku, resep, restock, opname, kartu stok | Stok tercatat benar |
| **4** | Layar kasir + transaksi atomic + pengurangan stok + struk | Alur transaksi penuh |
| **5** | Riwayat transaksi + void | Stok kembali, omzet benar |
| **6** | Dashboard + insight rule-based | Angka cocok dengan data |
| **7** | PDF rekap harian & bulanan | PDF cocok dengan dashboard |
| **8** | Pengaturan, polesan UI mobile, deployment | Siap dipakai di kafe |

**Saran:** simpan ringkasan bagian 5 (Aturan Bisnis) dan bagian 9 (Model Data) di file `AGENTS.md` pada root proyek agar opencode selalu mengacu pada aturan yang sama.

**Contoh prompt tahap 0:**
> Baca `PRD-Aplikasi-Kasir-Kafe.md`. Inisialisasi proyek Next.js (App Router, TypeScript, Tailwind, shadcn/ui) dengan Drizzle + PostgreSQL. Buat skema sesuai bagian 9, migrasi, dan seed: 3 kategori, 10 menu, 12 bahan, resep untuk tiap menu. Belum ada UI selain halaman beranda placeholder.

---

## 16. Asumsi & Pertanyaan Terbuka

**Asumsi yang dipakai di dokumen ini**
1. Satu kafe, satu lokasi, zona waktu WITA.
2. Rekap dibuat **dua jenis**: harian dan bulanan (keduanya PDF).
3. QRIS dan transfer hanya dicatat manual oleh kasir, tanpa verifikasi otomatis.
4. Resep per menu diisi oleh owner; menu tanpa resep tetap bisa dijual.
5. Tidak ada varian ukuran/tambahan topping di MVP.
6. Hari laporan berganti pukul 00:00.

**Perlu dikonfirmasi owner**
1. Apakah kafe buka melewati tengah malam (perlu pergantian hari laporan yang berbeda)?
2. Apakah menu punya varian (ukuran, tambahan) yang harus ada sejak awal?
3. Apakah perlu pajak atau service charge pada struk?
4. Apakah sudah ada daftar menu, bahan, dan resep yang siap dimasukkan sebagai data awal?
5. Apakah akan dicetak ke printer thermal, atau cukup struk digital/cetak browser?
