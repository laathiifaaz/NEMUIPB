from fastapi import APIRouter, HTTPException, Depends
from app.utils.security import get_current_user
from datetime import datetime, timedelta
from sqlalchemy import case

from app.database import SessionLocal
from app.models import User, Barang, Laporan, Notifikasi, KlaimBarang
from app.schemas import VerifikasiLaporan, UpdateStatusBarang, VerifikasiKlaim
from app.services.admin_activity_service import (
    create_activity_log,
    export_activity_logs as export_activity_logs_service,
    get_activity_logs as get_activity_logs_service
)
from app.services.encryption.EncryptionService import encryption_service

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

@router.get("/laporan/recent")
def get_recent_laporan(
    status_verifikasi: str = "semua",
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    query = (
        db.query(Laporan, Barang, User)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .join(User, Laporan.user_id == User.user_id)
    )

    if status_verifikasi != "semua":
        query = query.filter(Laporan.status_verifikasi == status_verifikasi)

    verification_priority = case(
        (Laporan.status_verifikasi == "belum_diverifikasi", 0),
        else_=1
    )

    data = (
        query
        .order_by(verification_priority, Laporan.laporan_id.desc())
        .limit(10)
        .all()
    )

    result = []

    for laporan, barang, user in data:
        result.append({
            "laporan_id": laporan.laporan_id,
            "item_name": barang.nama_barang,
            "reporter": user.nama,
            "email": user.email,
            "jenis_laporan": laporan.jenis_laporan,
            "status_laporan": laporan.status_laporan,
            "status_verifikasi": laporan.status_verifikasi,
            "barang_id": barang.barang_id,
            "kategori": barang.kategori,
            "deskripsi": barang.deskripsi,
            "lokasi": barang.lokasi,
            "dokumentasi": barang.dokumentasi,
            "tanggal_kejadian": barang.tanggal_kejadian,
            "status_barang": barang.status_barang,
            "catatan_verifikasi": laporan.catatan_verifikasi,
            "tanggal_verifikasi": laporan.tanggal_verifikasi
        })

    db.close()
    return result

@router.get("/klaim/pending")
def get_pending_klaim(
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    data = (
        db.query(KlaimBarang, Barang, User, Laporan)
        .join(Barang, KlaimBarang.barang_id == Barang.barang_id)
        .join(User, KlaimBarang.user_id == User.user_id)
        .join(Laporan, KlaimBarang.laporan_kehilangan_id == Laporan.laporan_id)
        .filter(KlaimBarang.status_klaim == "diproses")
        .order_by(KlaimBarang.klaim_id.desc())
        .all()
    )

    result = []

    for klaim, barang, user, laporan in data:
        result.append({
            "klaim_id": klaim.klaim_id,
            "user_id": user.user_id,
            "pengklaim": user.nama,
            "email": user.email,
            "barang_id": barang.barang_id,
            "nama_barang": barang.nama_barang,
            "kategori": barang.kategori,
            "lokasi": barang.lokasi,
            "laporan_kehilangan_id": laporan.laporan_id,
            "status_klaim": klaim.status_klaim,
            "catatan_admin": klaim.catatan_admin,
            "created_time": klaim.created_time
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
    # Admin verification notes are sensitive and are encrypted before persistence.
    laporan.catatan_verifikasi = encryption_service.encrypt_if_exists(data.catatan_verifikasi)
    laporan.tanggal_verifikasi = datetime.now()

    db.commit()

    notifikasi = Notifikasi(
        user_id=laporan.user_id,
        laporan_id=laporan.laporan_id,
        pesan="Laporan Anda telah disetujui oleh admin",
        status_baca=False
    )

    db.add(notifikasi)

    create_activity_log(
    db=db,
    action_type="verified",
    note=f"Laporan #{laporan.laporan_id} disetujui oleh admin",
    admin_id=current_user.user_id,
    barang_id=laporan.barang_id,
    laporan_id=laporan.laporan_id
    )

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
    # Admin verification notes are sensitive and are encrypted before persistence.
    laporan.catatan_verifikasi = encryption_service.encrypt_if_exists(data.catatan_verifikasi)
    laporan.tanggal_verifikasi = datetime.now()

    db.commit()

    notifikasi = Notifikasi(
        user_id=laporan.user_id,
        laporan_id=laporan.laporan_id,
        pesan="Laporan Anda ditolak oleh admin",
        status_baca=False
    )

    db.add(notifikasi)
    create_activity_log(
    db=db,
    action_type="rejected",
    note=f"Laporan #{laporan.laporan_id} ditolak oleh admin",
    admin_id=current_user.user_id,
    barang_id=laporan.barang_id,
    laporan_id=laporan.laporan_id
    )  

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

    create_activity_log(
    db=db,
    action_type="status_updated",
    note=f"Status barang #{barang.barang_id} diubah menjadi {data.status_barang}",
    admin_id=current_user.user_id,
    barang_id=barang.barang_id
    )

    db.commit()
    db.close()

    return {
        "message": "Status barang berhasil diperbarui",
        "barang_id": barang_id,
        "status_barang": data.status_barang
    }

@router.get("/dashboard/summary")
def get_admin_dashboard_summary(
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    active_lost = db.query(Barang).filter(
        Barang.status_barang == "hilang"
    ).count()

    total_found = db.query(Barang).filter(
        Barang.status_barang.in_(["ditemukan", "diklaim", "selesai"])
    ).count()

    pending_verification = db.query(Laporan).filter(
        Laporan.status_verifikasi == "belum_diverifikasi"
    ).count()

    pending_claims = db.query(KlaimBarang).filter(
        KlaimBarang.status_klaim == "diproses"
    ).count()

    db.close()

    return {
        "active_lost": active_lost,
        "total_found": total_found,
        "pending_verification": pending_verification,
        "pending_claims": pending_claims
    }

@router.get("/dashboard/chart")
def get_admin_dashboard_chart(
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    today = datetime.today().date()
    result = []

    for i in range(4):
        end_date = today - timedelta(days=i * 7)
        start_date = end_date - timedelta(days=6)

        lost_count = db.query(Barang).filter(
            Barang.status_barang == "hilang",
            Barang.tanggal_kejadian >= start_date,
            Barang.tanggal_kejadian <= end_date
        ).count()

        found_count = db.query(Barang).filter(
            Barang.status_barang.in_(["ditemukan", "diklaim", "selesai"]),
            Barang.tanggal_kejadian >= start_date,
            Barang.tanggal_kejadian <= end_date
        ).count()

        result.append({
            "week": f"WK {4 - i}",
            "start_date": start_date,
            "end_date": end_date,
            "lost": lost_count,
            "found": found_count
        })

    db.close()

    return list(reversed(result))

@router.get("/laporan/export")
def export_laporan(
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    data = (
        db.query(Laporan, Barang, User)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .join(User, Laporan.user_id == User.user_id)
        .order_by(Laporan.laporan_id.desc())
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
            "catatan_verifikasi": laporan.catatan_verifikasi,
            "tanggal_verifikasi": laporan.tanggal_verifikasi,
            "barang_id": barang.barang_id,
            "nama_barang": barang.nama_barang,
            "kategori": barang.kategori,
            "lokasi": barang.lokasi,
            "tanggal_kejadian": barang.tanggal_kejadian,
            "status_barang": barang.status_barang
        })

    db.close()

    return result

@router.get("/logs")
def get_activity_logs(
    action_type: str = "semua",
    sort_by: str = "newest",
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    result = get_activity_logs_service(db, action_type, sort_by)

    db.close()

    return result

@router.get("/logs/export")
def export_activity_logs(
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    result = export_activity_logs_service(db)

    db.close()

    return result
