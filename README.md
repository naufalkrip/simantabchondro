Nama : Maulana Muhammad Naufal
Nim : 101230038
Kelas : TF23B

---

# SIMANTAB

**Si**stem **I**nformasi **M**anajemen **T**abungan dan **A**bsensi **B**erbasis Web

Aplikasi manajemen keuangan dan absensi untuk kelompok/komunitas, dibangun dengan React + TypeScript + Vite.

## Fitur

### Admin
- **Dashboard** — ringkasan data keuangan dan anggota
- **Anggota** — manajemen data anggota
- **Absensi** — pencatatan kehadiran, riwayat, dan rekap
- **Tabungan** — kelola setoran dan penarikan tabungan anggota
- **Keuangan Chondro** — manajemen keuangan kas
- **Distribusi Dana** — distribusi dana ke anggota
- **Transaksi Lainnya** — transaksi di luar tabungan rutin
- **Manajemen Media** — upload dan kelola media
- **Jadwal** — atur jadwal kegiatan
- **Pengaturan** — konfigurasi aplikasi
- **Laporan PDF** — cetak laporan kegiatan

### Member
- **Dashboard** — ringkasan pribadi
- **Absensi** — lihat riwayat kehadiran
- **Tabungan** — lihat saldo dan riwayat tabungan
- **Jadwal** — lihat jadwal kegiatan
- **Pengaturan** — ubah profil dan kata sandi

## Teknologi

| Stack | Keterangan |
|-------|-----------|
| **Frontend** | React 19, TypeScript 6, Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) |
| **State/Data** | TanStack React Query |
| **Routing** | React Router v7 |
| **Charts** | Recharts |
| **PDF** | jsPDF + jsPDF-AutoTable |
| **Animasi** | Framer Motion |
| **UI** | Lucide React (icons), Sonner (toast) |

## Panduan Memulai

### Prasyarat
- Node.js 20+
- npm

### Instalasi

```bash
# Clone repositori
git clone https://github.com/naufalkrip/simantabchondro.git
cd simantab

# Install dependencies
npm install

# Salin file environment
cp .env.example .env
# Isi .env dengan kredensial Supabase Anda

# Jalankan development server
npm run dev
```

### Build & Deploy

```bash
# Build production
npm run build

# Preview build
npm run preview
```

### Lint

```bash
npm run lint
```

## Environment Variables

Buat file `.env` di root proyek:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Struktur Proyek

```
src/
├── components/    # Komponen UI reusable
├── context/       # React context (Auth, Theme)
├── hooks/         # Custom hooks
├── layouts/       # Layout admin & member
├── lib/           # Konfigurasi library (queryClient)
├── pages/
│   ├── admin/     # Halaman portal admin
│   └── member/    # Halaman portal member
├── routes/        # Protected route wrapper
├── services/      # Supabase API service layer
├── store/         # Zustand store (jika ada)
├── styles/        # Global CSS
├── types/         # TypeScript type definitions
└── utils/         # Utility functions (PDF export, dll)
```
