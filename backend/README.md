# Backend NEMU IPB

Backend NEMU IPB menggunakan FastAPI, SQLAlchemy, PostgreSQL, Alembic, JWT authentication, dan service layer untuk fitur laporan, barang, klaim, notifikasi, analytics, activity log, dan serah terima.

## Struktur Backend

```text
backend/
|-- app/
|   |-- main.py
|   |-- database.py
|   |-- models.py
|   |-- schemas.py
|   |-- routers/
|   |-- services/
|   `-- utils/
|-- database/
|   `-- migrations/
|       |-- env.py
|       |-- script.py.mako
|       `-- versions/
|-- tests/
|-- scripts/
|-- alembic.ini
|-- requirements.txt
`-- .env.example
```

## Setup Virtual Environment

```bash
cd backend
python -m venv .venv
```

Windows:

```powershell
.\.venv\Scripts\activate
```

Mac/Linux:

```bash
source .venv/bin/activate
```

Install dependency:

```bash
pip install -r requirements.txt
```

## Setup `.env`

File `.env` tidak di-commit. Buat dari contoh:

Windows:

```powershell
copy .env.example .env
```

Mac/Linux:

```bash
cp .env.example .env
```

Variable yang digunakan backend:

```env
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/nama_database
SECRET_KEY=isi_secret_key_yang_panjang_dan_acak
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FERNET_KEY=isi_fernet_key_valid
```

## Database dan Alembic

Buat database PostgreSQL lokal, lalu sesuaikan `DATABASE_URL` di `.env`.

Jalankan migration:

```bash
alembic upgrade head
```

Command ini akan membuat/menyesuaikan schema database dan menjalankan seed awal users dari migration `001_seed_initial_users.py`.

Cek status migration:

```bash
alembic current
alembic history
```

Buat migration baru setelah perubahan model:

```bash
alembic revision --autogenerate -m "deskripsi perubahan"
alembic upgrade head
```

Catatan penting:

- Selalu review file migration sebelum dijalankan.
- Jangan biarkan Alembic melakukan drop table/drop column tanpa sengaja.
- Pastikan migration tidak menghapus data penting.
- Commit migration baru di `backend/database/migrations/versions/`.

## Menjalankan FastAPI

Dari folder `backend/`:

```bash
uvicorn app.main:app --reload
```

URL:

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

## Test dan Script

Tes koneksi database:

```bash
python tests/test_db.py
```

Generate hash password:

```bash
python scripts/hash_password.py
```

## Akun Seed Awal

Migration `001_seed_initial_users.py` menyediakan:

- Budi Santoso - `budisantoso@apps.ipb.ac.id` - role `civitas`
- Admin Sistem - `admin@apps.ipb.ac.id` - role `admin`
- Jamilah Husain - `jamilah@apps.ipb.ac.id` - role `civitas`

Password mengikuti hash yang disiapkan di seed migration atau hubungi maintainer project.
