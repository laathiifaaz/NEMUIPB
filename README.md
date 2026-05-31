# NEMU IPB

NEMU IPB adalah aplikasi lost and found berbasis web untuk membantu civitas IPB melaporkan barang hilang, melaporkan barang temuan, melakukan klaim barang, dan memudahkan admin melakukan verifikasi, monitoring, notifikasi, analytics, serta serah terima barang.

## Tech Stack

- Backend: FastAPI
- ORM: SQLAlchemy
- Database: PostgreSQL
- Migration: Alembic
- Frontend: React
- Runtime frontend: Node.js / npm

## Struktur Folder

```text
NEMUIPB/
|-- backend/
|   |-- app/                         # API, models, routers, services, schemas, utils
|   |-- database/migrations/         # Alembic migration files
|   |-- tests/                       # Test dan utility pengecekan backend
|   |-- scripts/                     # Script backend pendukung
|   |-- alembic.ini                  # Konfigurasi Alembic
|   |-- requirements.txt             # Dependency backend
|   `-- .env.example                 # Contoh environment backend
|-- frontend/
|   |-- public/
|   |-- src/                         # React pages, components, services, config
|   |-- package.json
|   |-- package-lock.json
|   `-- .env.example                 # Contoh environment frontend
|-- .gitignore
`-- README.md
```

## Clone Repository

```bash
git clone <repo-url>
cd NEMUIPB
```

## Setup Backend

Masuk ke folder backend:

```bash
cd backend
python -m venv .venv
```

Aktifkan virtual environment di Windows:

```powershell
.\.venv\Scripts\activate
```

Aktifkan virtual environment di Mac/Linux:

```bash
source .venv/bin/activate
```

Install dependency:

```bash
pip install -r requirements.txt
```

## Setup Environment Backend

File `.env` asli tidak di-commit. Buat dari contoh:

Windows:

```powershell
copy .env.example .env
```

Mac/Linux:

```bash
cp .env.example .env
```

Isi minimal environment variable:

```env
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/nama_database
SECRET_KEY=isi_secret_key_yang_panjang_dan_acak
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FERNET_KEY=isi_fernet_key_valid
```

Catatan: `FERNET_KEY` harus berupa key Fernet yang valid. Jangan commit file `.env`.

## Setup Database PostgreSQL dan Alembic

1. Buat database PostgreSQL lokal.
2. Sesuaikan `DATABASE_URL` di `backend/.env`.
3. Jalankan migration dari folder `backend/`:

```bash
alembic upgrade head
```

Command tersebut akan membuat/menyesuaikan struktur database sesuai migration dan menjalankan seed awal users dari migration `001_seed_initial_users.py`.

Cek posisi migration saat ini:

```bash
alembic current
alembic history
```

Jika `models.py` berubah dan perlu migration baru:

```bash
alembic revision --autogenerate -m "deskripsi perubahan"
alembic upgrade head
```

Sebelum menjalankan migration baru:

- Selalu cek isi file migration yang dibuat Alembic.
- Jangan biarkan Alembic melakukan `drop table` atau `drop column` tanpa sengaja.
- Pastikan migration tidak menghapus data penting.
- Commit file migration di `backend/database/migrations/versions/`.

## Menjalankan Backend

Dari folder `backend/`:

```bash
uvicorn app.main:app --reload
```

URL backend:

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

## Setup Frontend

```bash
cd frontend
npm install
```

Buat environment frontend jika perlu:

Windows:

```powershell
copy .env.example .env
```

Mac/Linux:

```bash
cp .env.example .env
```

Konfigurasi base URL API frontend:

```env
REACT_APP_API_BASE_URL=http://localhost:8000
```

Nilai ini dibaca oleh `frontend/src/config/api.js`. Jika tidak diisi, frontend memakai default `http://127.0.0.1:8000`.

Jalankan frontend:

```bash
npm start
```

URL frontend:

- `http://localhost:3000`

## Akun Seed Awal

Migration Alembic `001_seed_initial_users.py` membuat user awal:

- Budi Santoso - [budisantoso@apps.ipb.ac.id](mailto:budisantoso@apps.ipb.ac.id) - role `civitas`
- Admin Sistem - [admin@apps.ipb.ac.id](mailto:admin@apps.ipb.ac.id) - role `admin`
- Jamilah Husain - [jamilah@apps.ipb.ac.id](mailto:jamilah@apps.ipb.ac.id) - role `civitas`

Password mengikuti hash yang disiapkan di seed migration atau hubungi maintainer project.

## Alur Penggunaan Aplikasi

1. User login atau register.
2. User membuat laporan barang hilang atau barang temuan.
3. Admin memverifikasi laporan.
4. User dapat melakukan klaim barang berdasarkan laporan kehilangan miliknya.
5. Admin melakukan verifikasi klaim dan kode pickup/dropoff.
6. Sistem memperbarui status barang dan laporan.
7. Notifikasi dan activity log tercatat.
8. Admin dapat melihat dashboard, analytics, activity log, dan data serah terima.

## Catatan untuk Anggota Tim

Setelah pull update terbaru:

```bash
git pull origin main

cd backend
pip install -r requirements.txt
alembic upgrade head

cd ../frontend
npm install
npm start
```

Sesuaikan branch jika sedang bekerja di branch selain `main`.

## Catatan Git

- Jangan commit `.env`.
- Jangan commit `.venv/`.
- Jangan commit `node_modules/`.
- Commit migration Alembic di `backend/database/migrations/versions/`.
- Setiap perubahan schema database harus dibuatkan migration baru.

## Troubleshooting

- Alembic error duplicate table: database sudah punya tabel yang sama atau migration mencoba membuat ulang tabel.
- Alembic error column does not exist: cek apakah migration dan `models.py` sudah sinkron.
- Backend tidak bisa konek database: cek `DATABASE_URL` di `backend/.env`.
- Frontend failed to fetch API: pastikan backend berjalan dan `REACT_APP_API_BASE_URL` benar.
- Swagger tidak terbuka: pastikan command `uvicorn app.main:app --reload` dijalankan dari folder `backend/`.
