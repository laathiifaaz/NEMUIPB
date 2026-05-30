# Frontend NEMU IPB

Frontend NEMU IPB menggunakan React. Aplikasi ini menyediakan halaman civitas dan admin untuk laporan barang hilang/temuan, klaim barang, verifikasi, notifikasi, dashboard, analytics, dan koleksi barang.

## Struktur Frontend

```text
frontend/
|-- public/
|-- src/
|   |-- App.js
|   |-- pages/
|   |-- components/
|   |-- services/
|   |-- config/
|   `-- utils/
|-- package.json
|-- package-lock.json
`-- .env.example
```

## Install Dependency

```bash
cd frontend
npm install
```

## Setup Environment

Frontend membaca base URL backend dari `REACT_APP_API_BASE_URL` di `frontend/src/config/api.js`.

Buat `.env` dari contoh jika perlu:

Windows:

```powershell
copy .env.example .env
```

Mac/Linux:

```bash
cp .env.example .env
```

Isi:

```env
REACT_APP_API_BASE_URL=http://localhost:8000
```

Jika `.env` tidak dibuat, frontend memakai default `http://127.0.0.1:8000`.

## Menjalankan React

```bash
npm start
```

URL frontend:

- `http://localhost:3000`

## Build

```bash
npm run build
```

## Hubungan ke Backend API

Request API dikelola melalui file di `src/services/`, misalnya:

- `AuthService.js`
- `BarangService.js`
- `ReportService.js`
- `AdminService.js`
- `NotifikasiService.js`

Pastikan backend FastAPI sudah berjalan di URL yang sama dengan `REACT_APP_API_BASE_URL`.

## Troubleshooting

- Jika muncul `Failed to fetch`, pastikan backend berjalan.
- Pastikan `REACT_APP_API_BASE_URL` mengarah ke backend, misalnya `http://localhost:8000`.
- Setelah mengubah `.env`, restart `npm start`.
- Jika dependency bermasalah, hapus `node_modules/` lalu jalankan ulang `npm install`.
