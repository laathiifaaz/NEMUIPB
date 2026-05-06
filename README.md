# NEMUIPB
NEMU IPB merupakan sistem informasi berbasis aplikasi yang dirancang untuk mempermudah mahasiswa, dosen, dan tenaga kependidikan dalam melaporkan kehilangan barang secara online, terstruktur serta mudah diakses.

NEMUIPB/
├── _pycache_/
├── .venv/
├── frontend/
├── .env
├── schemas.py
├── README.md
├── __init__.py
├── .gitignore
├── database.py
├── hash_password.py
├── main.py
├── models.py
└── test_db.py

NEMUIPB/
│
├── app/
│   ├── __init__.py
│   │
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── barang.py
│   │   ├── laporan.py
│   │   ├── admin.py
│   │   ├── notifikasi.py
│   │   └── klaim.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── laporan_service.py
│   │   └── klaim_service.py
│   │
│   └── utils/
│       ├── security.py
│       └── validators.py
│
├── frontend/
├── .venv/
├── .env
├── .gitignore
├── README.md
├── requirements.txt
└── test_db.py