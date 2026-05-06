from fastapi import APIRouter, HTTPException, Depends
from app.utils.security import get_current_user

from app.database import SessionLocal
from app.models import User, Barang, Laporan, KlaimBarang
from app.schemas import KlaimCreate, VerifikasiKlaim

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

    duplikat = db.query(KlaimBarang).filter(
        KlaimBarang.user_id == current_user.user_id,
        KlaimBarang.barang_id == barang_id
    ).first()

    if duplikat:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Anda sudah pernah mengklaim barang ini"
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
    klaim.catatan_admin = data.catatan_admin

    if data.status_klaim == "diterima":
        barang = db.query(Barang).filter(
            Barang.barang_id == klaim.barang_id
        ).first()

        if barang:
            barang.status_barang = "selesai"

    db.commit()
    db.close()

    return {
        "message": f"Klaim {data.status_klaim}",
        "klaim_id": klaim_id
    }