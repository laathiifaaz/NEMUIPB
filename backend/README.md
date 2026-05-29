# Backend NEMU IPB

Backend NEMU IPB menggunakan FastAPI, SQLAlchemy, JWT authentication, dan service layer untuk fitur laporan, barang, klaim, notifikasi, analytics, dan serah terima.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Salin `.env.example` menjadi `.env`, lalu isi konfigurasi database dan secret:

```powershell
Copy-Item .env.example .env
```

## Menjalankan API

Dari folder `backend/`:

```powershell
uvicorn app.main:app --reload
```

Dari root repository:

```powershell
uvicorn backend.app.main:app --reload
```

## Test dan Script

Tes koneksi database:

```powershell
python tests/test_db.py
```

Generate hash password:

```powershell
python scripts/hash_password.py
```
