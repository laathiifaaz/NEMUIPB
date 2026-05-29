# Frontend NEMU IPB

Frontend NEMU IPB menggunakan React dan berkomunikasi dengan backend FastAPI melalui service di `src/services/`.

## Setup

```powershell
cd frontend
npm install
```

## Menjalankan Frontend

```powershell
npm start
```

Default URL backend dibaca dari `REACT_APP_API_BASE_URL`. Jika tidak diisi, frontend memakai `http://127.0.0.1:8000`.

Untuk konfigurasi lokal:

```powershell
Copy-Item .env.example .env
```

Lalu sesuaikan:

```text
REACT_APP_API_BASE_URL=http://127.0.0.1:8000
```

## Build

```powershell
npm run build
```
