from fastapi import APIRouter, HTTPException, Depends
from app.utils.security import get_current_user
from app.database import SessionLocal
from app.models import User, Barang, Laporan
from app.schemas import LaporanCreate

router = APIRouter(
    prefix="/laporan",
    tags=["Laporan"]
)

@router.get("/")
def get_laporan():
    db = SessionLocal()
    laporan = db.query(Laporan).all()
    db.close()
    return laporan

@router.post("/kehilangan")
def buat_laporan_kehilangan(
    data: LaporanCreate,
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()

    duplikat = (
        db.query(Laporan)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .filter(
            Laporan.user_id == current_user.user_id,
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
        user_id=current_user.user_id,
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

@router.post("/penemuan")
def buat_laporan_penemuan(data: LaporanCreate,
    current_user: User = Depends(get_current_user)):
    db = SessionLocal()

    user = db.query(User).filter(User.user_id == data.user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    duplikat = (
        db.query(Laporan)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .filter(
            Laporan.user_id == current_user.user_id,
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
        user_id=current_user.user_id,
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

@router.get("/kehilangan/me")
def get_laporan_kehilangan_user(
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()

    data = (
        db.query(Laporan, Barang)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .filter(
            Laporan.user_id == current_user.user_id,
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
            "status_laporan": laporan.status_laporan,
            "jenis_laporan": laporan.jenis_laporan,
            "catatan_verifikasi": laporan.catatan_verifikasi
        })

    db.close()

    return result


@router.get("/{laporan_id}")
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