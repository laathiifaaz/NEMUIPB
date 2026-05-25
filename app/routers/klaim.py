from fastapi import APIRouter, HTTPException, Depends
from app.utils.security import get_current_user

from app.database import SessionLocal
from app.models import User
from app.schemas import KlaimCreate, VerifikasiKlaim
from app.services.klaim_service import KlaimService, KlaimServiceError

router = APIRouter(tags=["Klaim"])


def _run_klaim_service(action):
    db = SessionLocal()
    try:
        result = action(KlaimService(db))
        return result
    except KlaimServiceError as error:
        db.rollback()
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

@router.post("/barang/{barang_id}/klaim")
def klaim_barang(
    barang_id: int,
    data: KlaimCreate,
    current_user: User = Depends(get_current_user)
):
    return _run_klaim_service(
        lambda service: service.create_claim(
            barang_id=barang_id,
            laporan_kehilangan_id=data.laporan_kehilangan_id,
            user=current_user
        )
    )

@router.patch("/klaim/{klaim_id}/batal")
def batalkan_klaim(
    klaim_id: int,
    current_user: User = Depends(get_current_user)
):
    return _run_klaim_service(
        lambda service: service.cancel_claim(
            klaim_id=klaim_id,
            user=current_user
        )
    )

@router.patch("/admin/klaim/{klaim_id}/verifikasi")
def verifikasi_klaim(
    klaim_id: int,
    data: VerifikasiKlaim,
    current_user: User = Depends(get_current_user)
):
    return _run_klaim_service(
        lambda service: service.verify_claim(
            klaim_id=klaim_id,
            status_klaim=data.status_klaim,
            catatan_admin=data.catatan_admin,
            admin=current_user
        )
    )
