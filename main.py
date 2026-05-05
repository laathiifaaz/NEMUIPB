from fastapi import FastAPI
from database import engine, SessionLocal
from models import Base, User, Barang, Laporan, Notifikasi, KlaimBarang
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from schemas import UserLogin, LaporanCreate, VerifikasiLaporan, UpdateStatusBarang, KlaimCreate, VerifikasiKlaim
from sqlalchemy import or_
from typing import Optional
from datetime import date, timedelta, datetime

app = FastAPI()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

@app.post("/login")
def login(user: UserLogin):
    db = SessionLocal()

    email = f"{user.username}@apps.ipb.ac.id"

    db_user = db.query(User).filter(User.email == email).first()

    # kalau user belum ada → buat otomatis
    if not db_user:
        hashed_password = pwd_context.hash(user.password)

        new_user = User(
            nama=user.username,
            email=email,
            password_hash=hashed_password,
            role="civitas",
            status_akun=True
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        db.close()

        return {
            "message": "User baru dibuat & login berhasil",
            "user_id": new_user.user_id,
            "username": user.username
        }

    # kalau user sudah ada → cek password
    if not pwd_context.verify(user.password, db_user.password_hash):
        db.close()
        raise HTTPException(status_code=401, detail="Password salah")

    db.close()

    return {
        "message": "Login berhasil",
        "user_id": db_user.user_id,
        "username": user.username
    }

@app.get("/laporan/me")
def get_my_laporan(user_id: int):
    db = SessionLocal()

    laporan = db.query(Laporan).filter(Laporan.user_id == user_id).all()

    db.close()

    return laporan

@app.post("/laporan/kehilangan")
def buat_laporan_kehilangan(data: LaporanCreate):
    db = SessionLocal()

    user = db.query(User).filter(User.user_id == data.user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    duplikat = (
        db.query(Laporan)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .filter(
            Laporan.user_id == data.user_id,
            Laporan.jenis_laporan == "kehilangan",
            Barang.nama_barang.ilike(data.nama_barang),
            Barang.lokasi.ilike(data.lokasi),
            Barang.tanggal_kejadian == data.tanggal_kejadian
        )
        .first()
    )

    if duplikat:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Laporan kehilangan serupa sudah pernah dibuat"
        )

    barang_baru = Barang(
        nama_barang=data.nama_barang,
        kategori=data.kategori,
        deskripsi=data.deskripsi,
        tanggal_kejadian=data.tanggal_kejadian,
        lokasi=data.lokasi,
        dokumentasi=data.dokumentasi,
        status_barang="hilang"
    )

    db.add(barang_baru)
    db.commit()
    db.refresh(barang_baru)

    barang_id = barang_baru.barang_id

    laporan_baru = Laporan(
        user_id=data.user_id,
        barang_id=barang_id,
        jenis_laporan="kehilangan",
        status_laporan="menunggu",
        status_verifikasi="belum_diverifikasi"
    )

    db.add(laporan_baru)
    db.commit()
    db.refresh(laporan_baru)

    laporan_id = laporan_baru.laporan_id

    db.close()

    return {
        "message": "Laporan kehilangan berhasil dibuat",
        "laporan_id": laporan_id,
        "barang_id": barang_id
    }

@app.post("/laporan/penemuan")
def buat_laporan_penemuan(data: LaporanCreate):
    db = SessionLocal()

    user = db.query(User).filter(User.user_id == data.user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    duplikat = (
        db.query(Laporan)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .filter(
            Laporan.user_id == data.user_id,
            Laporan.jenis_laporan == "penemuan",
            Barang.nama_barang.ilike(data.nama_barang),
            Barang.lokasi.ilike(data.lokasi),
            Barang.tanggal_kejadian == data.tanggal_kejadian
        )
        .first()
    )

    if duplikat:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Laporan penemuan serupa sudah pernah dibuat"
        )

    barang_baru = Barang(
        nama_barang=data.nama_barang,
        kategori=data.kategori,
        deskripsi=data.deskripsi,
        tanggal_kejadian=data.tanggal_kejadian,
        lokasi=data.lokasi,
        dokumentasi=data.dokumentasi,
        status_barang="ditemukan"
    )

    db.add(barang_baru)
    db.commit()
    db.refresh(barang_baru)

    barang_id = barang_baru.barang_id

    laporan_baru = Laporan(
        user_id=data.user_id,
        barang_id=barang_id,
        jenis_laporan="penemuan",
        status_laporan="menunggu",
        status_verifikasi="belum_diverifikasi"
    )

    db.add(laporan_baru)
    db.commit()
    db.refresh(laporan_baru)

    laporan_id = laporan_baru.laporan_id

    db.close()

    return {
        "message": "Laporan penemuan berhasil dibuat",
        "laporan_id": laporan_id,
        "barang_id": barang_id
    }

@app.get("/laporan/me")
def get_my_laporan(user_id: int):
    db = SessionLocal()

    data = (
        db.query(Laporan, Barang)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .filter(Laporan.user_id == user_id)
        .all()
    )

    result = []
    for laporan, barang in data:
        result.append({
            "laporan_id": laporan.laporan_id,
            "jenis_laporan": laporan.jenis_laporan,
            "status_laporan": laporan.status_laporan,
            "status_verifikasi": laporan.status_verifikasi,
            "barang_id": barang.barang_id,
            "nama_barang": barang.nama_barang,
            "kategori": barang.kategori,
            "deskripsi": barang.deskripsi,
            "tanggal_kejadian": barang.tanggal_kejadian,
            "lokasi": barang.lokasi,
            "dokumentasi": barang.dokumentasi,
            "status_barang": barang.status_barang
        })

    db.close()
    return result

@app.get("/barang")
def get_all_barang():
    db = SessionLocal()

    barang = db.query(Barang).all()

    db.close()
    return barang

@app.get("/barang/search")
def search_barang(keyword: str):
    db = SessionLocal()

    barang = db.query(Barang).filter(
        or_(
            Barang.nama_barang.ilike(f"%{keyword}%"),
            Barang.deskripsi.ilike(f"%{keyword}%"),
            Barang.kategori.ilike(f"%{keyword}%")
        )
    ).all()

    db.close()
    return barang

@app.get("/barang/status")
def get_barang_by_status(status: str):
    db = SessionLocal()

    barang = db.query(Barang).filter(Barang.status_barang == status).all()

    db.close()
    return barang

@app.get("/barang/filter")
def filter_barang(
    kategori: Optional[str] = None,
    lokasi: Optional[str] = None,
    tanggal_awal: Optional[date] = None,
    tanggal_akhir: Optional[date] = None,
    status: Optional[str] = None
):
    db = SessionLocal()

    query = db.query(Barang)

    # default: 30 hari terakhir
    if tanggal_awal is None and tanggal_akhir is None:
        tanggal_akhir = date.today()
        tanggal_awal = tanggal_akhir - timedelta(days=30)

    if kategori and kategori.lower() != "semua":
        query = query.filter(Barang.kategori.ilike(f"%{kategori}%"))

    if lokasi and lokasi.lower() != "semua":
        query = query.filter(Barang.lokasi.ilike(f"%{lokasi}%"))

    if status and status.lower() != "semua":
        query = query.filter(Barang.status_barang == status.lower())

    if tanggal_awal:
        query = query.filter(Barang.tanggal_kejadian >= tanggal_awal)

    if tanggal_akhir:
        query = query.filter(Barang.tanggal_kejadian <= tanggal_akhir)

    barang = query.all()

    db.close()
    return barang

@app.get("/admin/laporan")
def get_all_laporan():
    db = SessionLocal()

    data = (
        db.query(Laporan, Barang, User)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .join(User, Laporan.user_id == User.user_id)
        .all()
    )

    result = []
    for laporan, barang, user in data:
        result.append({
            "laporan_id": laporan.laporan_id,
            "pelapor": user.nama,
            "email": user.email,
            "jenis_laporan": laporan.jenis_laporan,
            "status_laporan": laporan.status_laporan,
            "status_verifikasi": laporan.status_verifikasi,
            "nama_barang": barang.nama_barang,
            "kategori": barang.kategori,
            "lokasi": barang.lokasi,
            "status_barang": barang.status_barang
        })

    db.close()
    return result

@app.patch("/admin/laporan/{laporan_id}/setujui")
def setujui_laporan(laporan_id: int, data: VerifikasiLaporan):
    db = SessionLocal()

    admin = db.query(User).filter(
        User.user_id == data.admin_id,
        User.role == "admin"
    ).first()

    if not admin:
        db.close()
        raise HTTPException(status_code=403, detail="Akses ditolak. User bukan admin")

    laporan = db.query(Laporan).filter(Laporan.laporan_id == laporan_id).first()

    if not laporan:
        db.close()
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    laporan.verified_by = data.admin_id
    laporan.status_laporan = "disetujui"
    laporan.status_verifikasi = "terverifikasi"
    laporan.catatan_verifikasi = data.catatan_verifikasi
    laporan.tanggal_verifikasi = datetime.now()

    db.commit()

    notifikasi = Notifikasi(
        user_id=laporan.user_id,
        laporan_id=laporan.laporan_id,
        pesan="Laporan Anda telah disetujui oleh admin",
        status_baca=False
    )

    db.add(notifikasi)
    db.commit()

    db.close()

    return {
        "message": "Laporan berhasil disetujui",
        "laporan_id": laporan_id
    }

@app.patch("/admin/laporan/{laporan_id}/tolak")
def tolak_laporan(laporan_id: int, data: VerifikasiLaporan):
    db = SessionLocal()

    admin = db.query(User).filter(
        User.user_id == data.admin_id,
        User.role == "admin"
    ).first()

    if not admin:
        db.close()
        raise HTTPException(status_code=403, detail="Akses ditolak. User bukan admin")

    laporan = db.query(Laporan).filter(Laporan.laporan_id == laporan_id).first()

    if not laporan:
        db.close()
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    laporan.verified_by = data.admin_id
    laporan.status_laporan = "ditolak"
    laporan.status_verifikasi = "ditolak"
    laporan.catatan_verifikasi = data.catatan_verifikasi
    laporan.tanggal_verifikasi = datetime.now()

    db.commit()

    notifikasi = Notifikasi(
        user_id=laporan.user_id,
        laporan_id=laporan.laporan_id,
        pesan="Laporan Anda ditolak oleh admin",
        status_baca=False
    )

    db.add(notifikasi)
    db.commit()

    db.close()

    return {
        "message": "Laporan berhasil ditolak",
        "laporan_id": laporan_id
    }

@app.patch("/admin/barang/{barang_id}/status")
def update_status_barang(barang_id: int, data: UpdateStatusBarang):
    db = SessionLocal()

    admin = db.query(User).filter(
        User.user_id == data.admin_id,
        User.role == "admin"
    ).first()

    if not admin:
        db.close()
        raise HTTPException(status_code=403, detail="Akses ditolak. User bukan admin")

    barang = db.query(Barang).filter(Barang.barang_id == barang_id).first()

    if not barang:
        db.close()
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")

    allowed_status = ["hilang", "ditemukan", "diklaim", "selesai"]

    if data.status_barang not in allowed_status:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Status barang tidak valid"
        )

    barang.status_barang = data.status_barang

    db.commit()
    db.close()

    return {
        "message": "Status barang berhasil diperbarui",
        "barang_id": barang_id,
        "status_barang": data.status_barang
    }

@app.get("/notifikasi")
def get_notifikasi(user_id: int):
    db = SessionLocal()

    notifikasi = db.query(Notifikasi).filter(
        Notifikasi.user_id == user_id
    ).order_by(Notifikasi.tanggal_kirim.desc()).all()

    db.close()
    return notifikasi

@app.patch("/notifikasi/{id}/read")
def read_notifikasi(id: int):
    db = SessionLocal()

    notif = db.query(Notifikasi).filter(
        Notifikasi.notifikasi_id == id
    ).first()

    if not notif:
        db.close()
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")

    notif.status_baca = True
    db.commit()

    db.close()

    return {"message": "Notifikasi sudah dibaca"}

@app.get("/barang/{barang_id}")
def get_detail_barang(barang_id: int):
    db = SessionLocal()

    barang = db.query(Barang).filter(Barang.barang_id == barang_id).first()

    if not barang:
        db.close()
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")

    result = {
        "barang_id": barang.barang_id,
        "nama_barang": barang.nama_barang,
        "kategori": barang.kategori,
        "deskripsi": barang.deskripsi,
        "tanggal_kejadian": barang.tanggal_kejadian,
        "lokasi": barang.lokasi,
        "dokumentasi": barang.dokumentasi,
        "status_barang": barang.status_barang
    }

    db.close()
    return result

@app.get("/laporan/{laporan_id}")
def get_detail_laporan(laporan_id: int):
    db = SessionLocal()

    data = (
        db.query(Laporan, Barang, User)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .join(User, Laporan.user_id == User.user_id)
        .filter(Laporan.laporan_id == laporan_id)
        .first()
    )

    if not data:
        db.close()
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    laporan, barang, user = data

    result = {
        "laporan_id": laporan.laporan_id,
        "pelapor": user.nama,
        "email": user.email,
        "jenis_laporan": laporan.jenis_laporan,
        "status_laporan": laporan.status_laporan,
        "status_verifikasi": laporan.status_verifikasi,
        "catatan_verifikasi": laporan.catatan_verifikasi,
        "tanggal_verifikasi": laporan.tanggal_verifikasi,
        "barang": {
            "barang_id": barang.barang_id,
            "nama_barang": barang.nama_barang,
            "kategori": barang.kategori,
            "deskripsi": barang.deskripsi,
            "tanggal_kejadian": barang.tanggal_kejadian,
            "lokasi": barang.lokasi,
            "dokumentasi": barang.dokumentasi,
            "status_barang": barang.status_barang
        }
    }

    db.close()
    return result

@app.get("/laporan/kehilangan/user/{user_id}")
def get_laporan_kehilangan_user(user_id: int):
    db = SessionLocal()

    data = (
        db.query(Laporan, Barang)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .filter(
            Laporan.user_id == user_id,
            Laporan.jenis_laporan == "kehilangan"
        )
        .all()
    )

    result = []
    for laporan, barang in data:
        result.append({
            "laporan_id": laporan.laporan_id,
            "nama_barang": barang.nama_barang,
            "kategori": barang.kategori,
            "lokasi": barang.lokasi,
            "tanggal_kejadian": barang.tanggal_kejadian,
            "status_laporan": laporan.status_laporan
        })

    db.close()
    return result

@app.post("/barang/{barang_id}/klaim")
def klaim_barang(barang_id: int, data: KlaimCreate):
    db = SessionLocal()

    laporan = db.query(Laporan).filter(
        Laporan.laporan_id == data.laporan_kehilangan_id,
        Laporan.user_id == data.user_id,
        Laporan.jenis_laporan == "kehilangan"
    ).first()

    if not laporan:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="User harus memilih laporan kehilangan miliknya"
        )

    barang = db.query(Barang).filter(Barang.barang_id == barang_id).first()

    if not barang:
        db.close()
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    
    duplikat = db.query(KlaimBarang).filter(
        KlaimBarang.user_id == data.user_id,
        KlaimBarang.barang_id == barang_id
    ).first()

    if duplikat:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Anda sudah pernah mengklaim barang ini"
        )

    klaim_baru = KlaimBarang(
        user_id=data.user_id,
        barang_id=barang_id,
        laporan_kehilangan_id=data.laporan_kehilangan_id,
        status_klaim="diproses"
    )

    db.add(klaim_baru)
    db.commit()
    db.refresh(klaim_baru)

    klaim_id = klaim_baru.klaim_id
    db.close()

    return {
        "message": "Klaim barang berhasil diajukan",
        "klaim_id": klaim_id,
        "status_klaim": "diproses"
    }

@app.patch("/admin/klaim/{klaim_id}/verifikasi")
def verifikasi_klaim(klaim_id: int, data: VerifikasiKlaim):
    db = SessionLocal()

    admin = db.query(User).filter(
        User.user_id == data.admin_id,
        User.role == "admin"
    ).first()

    if not admin:
        db.close()
        raise HTTPException(status_code=403, detail="Bukan admin")

    klaim = db.query(KlaimBarang).filter(
        KlaimBarang.klaim_id == klaim_id
    ).first()

    if not klaim:
        db.close()
        raise HTTPException(status_code=404, detail="Klaim tidak ditemukan")

    if data.status_klaim not in ["diterima", "ditolak"]:
        db.close()
        raise HTTPException(status_code=400, detail="Status tidak valid")

    klaim.status_klaim = data.status_klaim
    klaim.catatan_admin = data.catatan_admin

    # 🔥 jika diterima → update barang
    if data.status_klaim == "diterima":
        barang = db.query(Barang).filter(
            Barang.barang_id == klaim.barang_id
        ).first()
        barang.status_barang = "selesai"

    db.commit()  # 🔥 ini trigger updated_time otomatis
    db.close()

    return {
        "message": f"Klaim {data.status_klaim}",
        "klaim_id": klaim_id
    }