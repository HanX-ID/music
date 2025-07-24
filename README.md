 # Music

script nodejs untuk mencari dan mengunduh audio mp3 dari video youtube berdasarkan judul lagu. audio akan disimpan otomatis ke folder `/storage/emulated/0/Music` dengan metadata lengkap dan cover lagu.

---

## Fitur

- cari video youtube berdasarkan judul (pakai `yt-search`)
- ambil audio mp3 langsung via API `savetube`
- simpan file ke `/storage/emulated/0/Music`
- otomatis add metadata ID3 (judul, artis, cover album)

---

## Requirement

- node.js v14+  
- koneksi internet stabil  
- akses ke folder `/storage/emulated/0/Music`  
  (disarankan dijalankan di **Termux** Android)

---

## Install

1. clone repository:

```bash
git clone https://github.com/HanX-ID/music
cd music
```

2. install semua dependensi:

```bash
npm install
```

---

## Cara pakai

jalankan script dengan perintah:

```bash
npm start
```
kemudian ikuti instruksi:

1. masukkan **judul lagu** (misal: `kamin`)    
2. audio mp3 akan diunduh dan disimpan otomatis ke:

```
/storage/emulated/0/Music
```

3. setelah selesai, maka akan ditanya apakah ingin download lagi

---

## Struktur folder

```
music/
├── index.js          ← file utama
├── package.json      ← konfigurasi npm
└── README.md         ← dokumentasi
```

---

## Credit

- dibuat oleh: [**HanX - ID**](https://github.com/HanX-ID)
- update: **24 juli 2025**

---
