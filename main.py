from fastapi import FastAPI
from database import engine, SessionLocal
from models import Base, User, Barang, Laporan
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.get("/")
def read_root():
    return {"message": "Database connected!"}


@app.get("/users")
def get_users():
    db = SessionLocal()
    users = db.query(User).all()
    db.close()
    return users


@app.get("/barang")
def get_barang():
    db = SessionLocal()
    barang = db.query(Barang).all()
    db.close()
    return barang


@app.get("/laporan")
def get_laporan():
    db = SessionLocal()
    laporan = db.query(Laporan).all()
    db.close()
    return laporan