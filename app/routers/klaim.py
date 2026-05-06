from fastapi import APIRouter, HTTPException

from app.database import SessionLocal
from app.models import User, Barang, Laporan, KlaimBarang
from app.schemas import KlaimCreate, VerifikasiKlaim

router = APIRouter(tags=["Klaim"])

@router.post("/barang/{barang_id}/klaim")
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

@router.patch("/admin/klaim/{klaim_id}/verifikasi")
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