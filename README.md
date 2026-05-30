# NEMU IPB

NEMU IPB adalah sistem informasi pelaporan barang hilang dan ditemukan untuk lingkungan IPB. Project ini memakai FastAPI + SQLAlchemy untuk backend dan React untuk frontend.

## Struktur Repo

```text
NEMUIPB/
├─ backend/              # FastAPI, SQLAlchemy, database logic
│  ├─ app/
│  ├─ tests/
│  ├─ scripts/
│  ├─ requirements.txt
│  └─ .env.example
├─ frontend/             # React app
│  ├─ public/
│  ├─ src/
│  ├─ package.json
│  └─ .env.example             
├─ .gitignore
└─ README.md
```

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Opsi dari root repo:

```powershell
uvicorn backend.app.main:app --reload
```

Salin `backend/.env.example` menjadi `backend/.env`, lalu isi nilai environment sesuai database lokal. Jangan commit file `.env`.

## Frontend

```powershell
cd frontend
npm install
npm start
```

Jika perlu mengganti URL API backend, salin `frontend/.env.example` menjadi `frontend/.env` dan ubah `REACT_APP_API_BASE_URL`.

## Dokumentasi

Dokumentasi teknis ada di `docs/`, termasuk threat modeling dan ringkasan arsitektur.

## Utility

Tes koneksi database:

```powershell
cd backend
python tests/test_db.py
```

Generate hash password:

```powershell
cd backend
python scripts/hash_password.py
```
