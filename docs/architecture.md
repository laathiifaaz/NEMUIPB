# Arsitektur NEMU IPB

NEMU IPB menggunakan arsitektur monorepo dengan pemisahan backend, frontend, dokumentasi, dan tools pendukung.

## Ringkasan Komponen

- Frontend React berada di `frontend/`.
- Backend FastAPI berada di `backend/app/`.
- PostgreSQL digunakan sebagai database utama.
- SQLAlchemy digunakan sebagai ORM.
- Alembic digunakan untuk database migration.
- Dokumentasi teknis berada di `docs/`.
- Script pendukung berada di `tools/`.

## Alur Komunikasi

Frontend React berkomunikasi dengan Backend FastAPI melalui REST API. Base URL API dikonfigurasi di `frontend/src/config/api.js` melalui environment variable `REACT_APP_API_BASE_URL`.

```text
React Frontend -> Service Layer Frontend -> REST API FastAPI -> Service Layer Backend -> SQLAlchemy -> PostgreSQL
```

## Struktur Backend

- `backend/app/main.py`: entry point FastAPI.
- `backend/app/routers/`: endpoint API, seperti auth, barang, laporan, klaim, notifikasi, admin, dan serah terima.
- `backend/app/services/`: business logic untuk klaim, analytics, activity log, encryption, serah terima, dan logic pendukung lain.
- `backend/app/models.py`: definisi model SQLAlchemy.
- `backend/app/schemas.py`: schema request/response Pydantic.
- `backend/app/database.py`: konfigurasi koneksi database.
- `backend/database/migrations/`: konfigurasi dan versi migration Alembic.

## Struktur Frontend

- `frontend/src/pages/`: halaman aplikasi user dan admin.
- `frontend/src/components/`: komponen UI reusable.
- `frontend/src/services/`: wrapper pemanggilan API backend.
- `frontend/src/config/api.js`: konfigurasi base URL backend.
- `frontend/src/utils/`: utility frontend.

## Database Migration

Alembic dikonfigurasi di `backend/alembic.ini` dan migration berada di `backend/database/migrations/`.

Command utama dari folder `backend/`:

```bash
alembic upgrade head
alembic current
alembic history
alembic revision --autogenerate -m "deskripsi perubahan"
```

Migration awal membuat schema utama aplikasi. Migration `001_seed_initial_users.py` mengisi user awal untuk role civitas dan admin.

## Alur Fitur Utama

1. User login atau register.
2. User membuat laporan barang hilang atau barang temuan.
3. Admin memverifikasi laporan.
4. Untuk laporan penemuan, sistem membuat kode dropoff.
5. Setelah kode dropoff diverifikasi admin, barang muncul sebagai barang ditemukan dan dapat diklaim user lain.
6. User membuat klaim menggunakan laporan kehilangan miliknya.
7. Admin memverifikasi klaim. Jika klaim diterima, sistem membuat kode pickup.
8. Setelah kode pickup diverifikasi admin, status barang dan laporan terkait diperbarui menjadi selesai.
9. Sistem mengirim notifikasi kepada user terkait.
10. Activity log mencatat aktivitas penting admin dan sistem.
11. Admin dapat melihat dashboard dan analytics untuk monitoring laporan dan barang.
12. Serah terima digunakan sebagai bukti proses pengembalian barang.

## Catatan Keamanan dan Operasional

- File `.env` tidak boleh di-commit.
- Migration Alembic harus direview sebelum dijalankan.
- Perubahan schema database harus dibuatkan migration baru.
- Endpoint API tidak boleh diubah tanpa menyesuaikan service frontend yang memanggilnya.
- Dokumentasi threat modeling tersedia di `docs/Threat_Modeling.pdf`.
