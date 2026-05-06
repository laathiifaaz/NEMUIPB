from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import Base

from app.routers import auth, barang, laporan, admin, notifikasi, klaim

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(barang.router)
app.include_router(laporan.router)
app.include_router(admin.router)
app.include_router(notifikasi.router)
app.include_router(klaim.router)


@app.get("/")
def read_root():
    return {"message": "Database connected!"}