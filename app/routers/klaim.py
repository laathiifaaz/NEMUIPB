from fastapi import APIRouter, HTTPException, Depends
from app.utils.security import get_current_user

from app.database import SessionLocal
from app.models import User, Barang, Laporan, KlaimBarang
from app.schemas import KlaimCreate, VerifikasiKlaim
from app.services.encryption.EncryptionService import encryption_service
from app.services.serah_terima_service import create_serah_terima

router = APIRouter(tags=["Klaim"])

@router.post("/barang/{barang_id}/klaim")
def klaim_barang(
    barang_id: int,
    data: KlaimCreate,
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()

    laporan = db.query(Laporan).filter(
        Laporan.laporan_id == data.laporan_kehilangan_id,
        Laporan.user_id == current_user.user_id,
        Laporan.jenis_laporan == "kehilangan"
    ).first()

    if not laporan:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="User harus memilih laporan kehilangan miliknya"
        )

    barang = db.query(Barang).filter(
        Barang.barang_id == barang_id
    ).first()

    if not barang:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Barang tidak ditemukan"
        )

    duplikat_barang = db.query(KlaimBarang).filter(
        KlaimBarang.user_id == current_user.user_id,
        KlaimBarang.barang_id == barang_id
    ).first()

    if duplikat_barang:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Anda sudah pernah mengklaim barang ini"
        )

    laporan_sedang_dipakai = db.query(KlaimBarang).filter(
        KlaimBarang.user_id == current_user.user_id,
        KlaimBarang.laporan_kehilangan_id == data.laporan_kehilangan_id,
        KlaimBarang.status_klaim.in_(["diproses", "diterima"])
    ).first()

    if laporan_sedang_dipakai:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Laporan kehilangan ini sedang dipakai atau sudah diterima untuk klaim lain"
        )

    klaim_baru = KlaimBarang(
        user_id=current_user.user_id,
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

@router.patch("/admin/klaim/{klaim_id}/verifikasi")
def verifikasi_klaim(
    klaim_id: int,
    data: VerifikasiKlaim,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Bukan admin"
        )

    db = SessionLocal()

    klaim = db.query(KlaimBarang).filter(
        KlaimBarang.klaim_id == klaim_id
    ).first()

    if not klaim:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Klaim tidak ditemukan"
        )

    if data.status_klaim not in ["diterima", "ditolak"]:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Status tidak valid"
        )

    klaim.status_klaim = data.status_klaim
    # Claim admin notes are sensitive and are encrypted before persistence.
    klaim.catatan_admin = encryption_service.encrypt_if_exists(data.catatan_admin)

    if data.status_klaim == "diterima":
        barang = db.query(Barang).filter(
            Barang.barang_id == klaim.barang_id
        ).first()

        if barang:
            barang.status_barang = "selesai"

            create_serah_terima(
            db=db,
            klaim=klaim,
            barang=barang,
            admin=current_user
            )

    db.commit()
    db.close()

    return {
        "message": f"Klaim {data.status_klaim}",
        "klaim_id": klaim_id
    }
