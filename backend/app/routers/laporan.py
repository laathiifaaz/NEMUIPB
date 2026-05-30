from fastapi import APIRouter, HTTPException, Depends
from app.utils.security import get_current_user
from app.database import SessionLocal
from app.models import User, Barang, Laporan, KlaimBarang
from app.schemas import LaporanCreate
from app.services.encryption.EncryptionService import encryption_service

router = APIRouter(
    prefix="/laporan",
    tags=["Laporan"]
)


def _build_user_report_response(laporan, barang):
    return {
        "laporan_id": laporan.laporan_id,
        "nama_barang": barang.nama_barang,
        "kategori": barang.kategori,
        "deskripsi": barang.deskripsi,
        "lokasi": barang.lokasi,
        "tanggal_kejadian": barang.tanggal_kejadian,
        "created_time": barang.created_time,
        "status_laporan": laporan.status_laporan,
        "status_verifikasi": laporan.status_verifikasi,
        "jenis_laporan": laporan.jenis_laporan,
        "status_barang": barang.status_barang,
        "status_klaim": None,
        "klaim_id": None,
        "claim_barang_id": None,
        "klaim_updated_time": None,
        "catatan_verifikasi": encryption_service.decrypt_if_exists(
            laporan.catatan_verifikasi
        )
    }

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

    result = [_build_user_report_response(laporan, barang) for laporan, barang in data]

    db.close()

    return result


@router.get("/penemuan/me")
def get_laporan_penemuan_user(
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()

    data = (
        db.query(Laporan, Barang)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .filter(
            Laporan.user_id == current_user.user_id,
            Laporan.jenis_laporan == "penemuan"
        )
        .all()
    )

    result = [_build_user_report_response(laporan, barang) for laporan, barang in data]

    db.close()

    return result


@router.get("/me")
def get_laporan_user(
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()

    data = (
        db.query(Laporan, Barang)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .filter(Laporan.user_id == current_user.user_id)
        .all()
    )

    claim_rows = (
        db.query(KlaimBarang)
        .filter(KlaimBarang.user_id == current_user.user_id)
        .order_by(KlaimBarang.updated_time.desc().nullslast(), KlaimBarang.created_time.desc(), KlaimBarang.klaim_id.desc())
        .all()
    )
    claim_map = {}
    for claim in claim_rows:
        key = claim.laporan_kehilangan_id
        if key not in claim_map:
            claim_map[key] = claim

    result = []
    for laporan, barang in data:
        payload = _build_user_report_response(laporan, barang)
        claim = claim_map.get(laporan.laporan_id)
        if claim:
            payload["status_klaim"] = claim.status_klaim
            payload["klaim_id"] = claim.klaim_id
            payload["claim_barang_id"] = claim.barang_id
            payload["klaim_updated_time"] = claim.updated_time or claim.created_time
        result.append(payload)

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
        "catatan_verifikasi": encryption_service.decrypt_if_exists(laporan.catatan_verifikasi),
        "tanggal_verifikasi": laporan.tanggal_verifikasi,
        "barang": {
            "barang_id": barang.barang_id,
            "nama_barang": barang.nama_barang,
            "kategori": barang.kategori,
            "deskripsi": barang.deskripsi,
            "tanggal_kejadian": barang.tanggal_kejadian,
            "created_time": barang.created_time,
            "lokasi": barang.lokasi,
            "dokumentasi": barang.dokumentasi,
            "status_barang": barang.status_barang
        }
    }

    db.close()
    return result
