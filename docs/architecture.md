# Arsitektur NEMU IPB

NEMU IPB menggunakan struktur monorepo dengan pemisahan backend, frontend, dokumentasi, dan tools pendukung.

## Komponen Utama

- `backend/`: aplikasi FastAPI, model SQLAlchemy, router API, service layer, schema Pydantic, dan utility keamanan.
- `frontend/`: aplikasi React, halaman user/admin, komponen UI, dan service wrapper untuk memanggil API backend.
- `docs/`: dokumentasi teknis seperti threat modeling dan ringkasan arsitektur.
- `tools/`: script pendukung repository, misalnya generator PDF threat modeling.

## Backend

Backend berada di `backend/app/`. Entry point aplikasi adalah `backend/app/main.py`. Router API dikelompokkan di `backend/app/routers/`, sedangkan business logic berada di `backend/app/services/`.

Backend dapat dijalankan dari folder `backend/` dengan:

```powershell
uvicorn app.main:app --reload
```

## Frontend

Frontend berada di `frontend/` dan menggunakan React. Konfigurasi base URL API ada di `frontend/src/config/api.js`, dengan dukungan environment variable `REACT_APP_API_BASE_URL`.

## Komunikasi Frontend dan Backend

Frontend memanggil backend melalui endpoint HTTP API. Service client berada di `frontend/src/services/`, seperti `AuthService`, `BarangService`, `ReportService`, `AdminService`, dan `NotifikasiService`.

## Alur Fitur Besar

1. User membuat laporan kehilangan atau penemuan.
2. Admin memverifikasi laporan melalui halaman verifikasi.
3. Untuk laporan penemuan, sistem membuat kode dropoff. Setelah kode dropoff diverifikasi admin, barang muncul sebagai barang ditemukan yang dapat diklaim user lain.
4. User mengajukan klaim barang menggunakan laporan kehilangan miliknya.
5. Admin memverifikasi klaim. Jika diterima, sistem membuat kode pickup.
6. Setelah kode pickup diverifikasi admin, status barang/laporan terkait menjadi selesai.
7. Sistem mengirim notifikasi untuk perubahan penting seperti verifikasi laporan, klaim diterima/ditolak, dropoff, dan pickup.
8. Admin dapat melihat analytics, tren laporan, aktivitas, dan verifikasi serah terima.

## Dokumentasi Keamanan

Threat modeling tersedia di `docs/Threat_Modeling.pdf`. File tersebut dapat dibuat ulang dengan script:

```powershell
python tools/build_threat_model_pdf.py
```
