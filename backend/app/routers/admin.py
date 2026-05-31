from fastapi import APIRouter, HTTPException, Depends
from app.utils.security import get_current_user
from datetime import datetime, timedelta
from sqlalchemy import case

from app.database import SessionLocal
from app.models import User, Barang, Laporan, Notifikasi, KlaimBarang, SerahTerima, ActivityLog
from app.schemas import VerifikasiLaporan, UpdateStatusBarang, VerifikasiKlaim, VerifikasiPickup
from app.services.admin_activity_service import (
    create_activity_log,
    export_activity_logs as export_activity_logs_service,
    get_activity_logs as get_activity_logs_service
)
from app.services.admin_analytics_service import get_admin_analytics
from app.services.encryption.EncryptionService import encryption_service
from app.services.klaim_service import KlaimService, KlaimServiceError

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


PICKUP_CODE_PREFIX = "PICKUP:"


def _extract_pickup_code(value):
    if not value or PICKUP_CODE_PREFIX not in value:
        return None

    raw_code = value.split(PICKUP_CODE_PREFIX, 1)[1].split("|", 1)[0]
    return raw_code.strip().upper()
    
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
            "nama_barang": barang.nama_barang,
            "kategori": barang.kategori,
            "deskripsi": barang.deskripsi,
            "lokasi": barang.lokasi,
            "dokumentasi": barang.dokumentasi,
            "tanggal_kejadian": barang.tanggal_kejadian,
            "status_barang": barang.status_barang,
            "created_time": barang.created_time,
            "catatan_verifikasi": encryption_service.decrypt_if_exists(
                laporan.catatan_verifikasi
            )
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
            "created_time": barang.created_time,
            "catatan_verifikasi": encryption_service.decrypt_if_exists(
                laporan.catatan_verifikasi
            ),
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


@router.get("/klaim/history")
def get_claim_history(
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    try:
        data = (
            db.query(KlaimBarang, Barang, User, Laporan)
            .join(Barang, KlaimBarang.barang_id == Barang.barang_id)
            .join(User, KlaimBarang.user_id == User.user_id)
            .join(Laporan, KlaimBarang.laporan_kehilangan_id == Laporan.laporan_id)
            .filter(KlaimBarang.status_klaim.in_(["diterima", "ditolak"]))
            .order_by(
                KlaimBarang.updated_time.desc().nullslast(),
                KlaimBarang.created_time.desc().nullslast(),
                KlaimBarang.klaim_id.desc(),
            )
            .all()
        )

        result = []

        for klaim, barang, user, laporan in data:
            verified_at = klaim.updated_time or klaim.created_time

            result.append({
                "klaim_id": klaim.klaim_id,
                "user_id": user.user_id,
                "pengklaim": user.nama,
                "email": user.email,
                "barang_id": barang.barang_id,
                "nama_barang": barang.nama_barang,
                "kategori": barang.kategori,
                "lokasi": barang.lokasi,
                "laporan_id": laporan.laporan_id,
                "laporan_kehilangan_id": laporan.laporan_id,
                "status_klaim": klaim.status_klaim,
                "status_laporan": laporan.status_laporan,
                "status_barang": barang.status_barang,
                "created_time": klaim.created_time,
                "updated_time": klaim.updated_time,
                "claim_verified_at": verified_at,
                "catatan_admin": encryption_service.decrypt_if_exists(
                    klaim.catatan_admin
                ),
            })

        return result
    finally:
        db.close()

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
    laporan.tanggal_verifikasi = datetime.now()

    dropoff_code = None
    catatan_verifikasi = data.catatan_verifikasi

    if laporan.jenis_laporan == "penemuan":
        dropoff_code = KlaimService(db).generate_unique_dropoff_code()
        catatan_verifikasi = KlaimService(db).build_dropoff_note(
            dropoff_code,
            data.catatan_verifikasi
        )

    # Admin verification notes are sensitive and are encrypted before persistence.
    laporan.catatan_verifikasi = encryption_service.encrypt_if_exists(catatan_verifikasi)

    db.commit()

    notifikasi = Notifikasi(
        user_id=laporan.user_id,
        laporan_id=laporan.laporan_id,
        pesan=(
            f"Laporan penemuan Anda telah disetujui. Kode dropoff Anda: {dropoff_code}. "
            "Tunjukkan kode ini ke admin saat menyerahkan barang."
            if dropoff_code
            else "Laporan Anda telah disetujui oleh admin"
        ),
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

    active_lost = db.query(Laporan).join(Barang, Laporan.barang_id == Barang.barang_id).filter(
        Laporan.jenis_laporan == "kehilangan",
        Laporan.status_verifikasi == "terverifikasi",
        Laporan.status_laporan != "selesai"
    ).count()

    total_found = db.query(Laporan.laporan_id).join(
        Barang,
        Laporan.barang_id == Barang.barang_id
    ).join(
        KlaimBarang,
        KlaimBarang.barang_id == Barang.barang_id
    ).filter(
        Laporan.jenis_laporan == "penemuan",
        Laporan.status_verifikasi == "terverifikasi",
        KlaimBarang.status_klaim == "diproses"
    ).distinct().count()

    pending_verification = db.query(Laporan).filter(
        Laporan.status_verifikasi == "belum_diverifikasi"
    ).count()

    pending_claims = db.query(KlaimBarang).filter(
        KlaimBarang.status_klaim == "diproses"
    ).count()

    returned_items = db.query(Laporan).filter(
        Laporan.status_verifikasi == "terverifikasi",
        Laporan.status_laporan == "selesai"
    ).count()

    db.close()

    return {
        "active_lost": active_lost,
        "total_found": total_found,
        "pending_verification": pending_verification,
        "pending_claims": pending_claims,
        "returned_items": returned_items
    }

@router.patch("/klaim/pickup/verify")
def verify_pickup(
    data: VerifikasiPickup,
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    try:
        result = KlaimService(db).verify_pickup_code(
            pickup_code=data.pickup_code,
            admin=current_user
        )

        create_activity_log(
            db=db,
            action_type="returned",
            note=f"Kode {result.get('code_type', 'pickup')} {result['pickup_code']} diverifikasi admin",
            admin_id=current_user.user_id,
            barang_id=result["barang_id"],
            laporan_id=result["laporan_id"],
            klaim_id=result["klaim_id"]
        )

        db.commit()
        return result
    except KlaimServiceError as error:
        db.rollback()
        raise HTTPException(status_code=error.status_code, detail=error.detail)
    finally:
        db.close()


@router.get("/serah-terima/history")
def get_serah_terima_history(
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    try:
        data = (
            db.query(ActivityLog, SerahTerima, KlaimBarang, Barang, User, Laporan)
            .join(SerahTerima, ActivityLog.klaim_id == SerahTerima.klaim_id)
            .join(KlaimBarang, ActivityLog.klaim_id == KlaimBarang.klaim_id)
            .join(Barang, ActivityLog.barang_id == Barang.barang_id)
            .join(User, KlaimBarang.user_id == User.user_id)
            .join(Laporan, KlaimBarang.laporan_kehilangan_id == Laporan.laporan_id)
            .filter(
                ActivityLog.action_type == "returned",
                KlaimBarang.status_klaim == "diterima",
                Barang.status_barang == "selesai",
            )
            .order_by(ActivityLog.created_at.desc())
            .all()
        )

        result = []

        for log, serah_terima, klaim, barang, user, laporan in data:
            pickup_code = _extract_pickup_code(
                encryption_service.decrypt_if_exists(klaim.catatan_admin)
            )

            result.append({
                "serah_terima_id": serah_terima.serah_terima_id,
                "code": pickup_code or "-",
                "code_type": "pickup",
                "message": log.note,
                "klaim_id": klaim.klaim_id,
                "barang_id": barang.barang_id,
                "laporan_id": laporan.laporan_id,
                "laporan_kehilangan_id": laporan.laporan_id,
                "status_barang": barang.status_barang,
                "pengklaim": user.nama,
                "email": user.email,
                "verified_at": log.created_at,
                "created_at": serah_terima.created_at,
            })

        return result
    finally:
        db.close()

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

@router.get("/analytics")
def get_analytics(
    range: str = "30_hari",
    filter: str = "tinggi",
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    db = SessionLocal()

    result = get_admin_analytics(
        db=db,
        time_range=range,
        location_filter=filter
    )

    db.close()

    return result

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
            "catatan_verifikasi": encryption_service.decrypt_if_exists(
                laporan.catatan_verifikasi
            ),
            "tanggal_verifikasi": laporan.tanggal_verifikasi,
            "barang_id": barang.barang_id,
            "nama_barang": barang.nama_barang,
            "kategori": barang.kategori,
            "lokasi": barang.lokasi,
            "tanggal_kejadian": barang.tanggal_kejadian,
            "created_time": barang.created_time,
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
