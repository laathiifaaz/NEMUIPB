from fastapi import APIRouter, HTTPException, Depends
from app.utils.security import get_current_user

from app.database import SessionLocal
from app.models import Notifikasi, User

router = APIRouter(
    prefix="/notifikasi",
    tags=["Notifikasi"]
)

@router.get("/")
def get_notifikasi( current_user: User = Depends(get_current_user)):
    db = SessionLocal()

    notifikasi = db.query(Notifikasi).filter(
        Notifikasi.user_id == current_user.user_id
    ).order_by(Notifikasi.tanggal_kirim.desc()).all()

    db.close()
    return notifikasi

@router.patch("/{id}/read")
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
