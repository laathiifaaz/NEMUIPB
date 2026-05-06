from fastapi import APIRouter, HTTPException, Depends
from app.utils.security import get_current_user
from datetime import datetime

from app.database import SessionLocal
from app.models import User, Barang, Laporan, Notifikasi, KlaimBarang
from app.schemas import VerifikasiLaporan, UpdateStatusBarang, VerifikasiKlaim

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

def ensure_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Akses ditolak. User bukan admin"
        )

@router.get("/laporan")
def get_all_laporan(
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

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

@router.patch("/laporan/{laporan_id}/setujui")
def setujui_laporan(
    laporan_id: int,
    data: VerifikasiLaporan,
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    laporan = db.query(Laporan).filter(Laporan.laporan_id == laporan_id).first()

    if not laporan:
        db.close()
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    laporan.verified_by = current_user.user_id
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

@router.patch("/laporan/{laporan_id}/tolak")
def tolak_laporan(
    laporan_id: int,
    data: VerifikasiLaporan,
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    laporan = db.query(Laporan).filter(Laporan.laporan_id == laporan_id).first()

    if not laporan:
        db.close()
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    laporan.verified_by = current_user.user_id
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

@router.patch("/barang/{barang_id}/status")
def update_status_barang(
    barang_id: int,
    data: UpdateStatusBarang,
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

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