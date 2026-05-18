from fastapi import APIRouter, HTTPException, Depends

from app.database import SessionLocal
from app.models import SerahTerima, User
from app.utils.security import get_current_user
from app.services.signature_service import hash_document, verify_signature

router = APIRouter(
    prefix="/serah-terima",
    tags=["Serah Terima"]
)


@router.get("/{klaim_id}")
def get_serah_terima(
    klaim_id: int,
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()

    data = db.query(SerahTerima).filter(
        SerahTerima.klaim_id == klaim_id
    ).first()

    db.close()

    if not data:
        raise HTTPException(
            status_code=404,
            detail="Data serah terima tidak ditemukan"
        )

    return {
        "serah_terima_id": data.serah_terima_id,
        "klaim_id": data.klaim_id,
        "barang_id": data.barang_id,
        "user_id": data.user_id,
        "admin_id": data.admin_id,
        "dokumen_text": data.dokumen_text,
        "dokumen_hash": data.dokumen_hash,
        "digital_signature": data.digital_signature,
        "public_key": data.public_key,
        "created_at": data.created_at
    }


@router.get("/{klaim_id}/verify")
def verify_serah_terima(
    klaim_id: int,
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()

    data = db.query(SerahTerima).filter(
        SerahTerima.klaim_id == klaim_id
    ).first()

    db.close()

    if not data:
        raise HTTPException(
            status_code=404,
            detail="Data serah terima tidak ditemukan"
        )
    
    if (
        current_user.role != "admin"
        and current_user.user_id != data.user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="Tidak memiliki akses"
        )  

    recalculated_hash = hash_document(data.dokumen_text)

    hash_valid = recalculated_hash == data.dokumen_hash

    signature_valid = verify_signature(
        document_hash=data.dokumen_hash,
        digital_signature=data.digital_signature,
        public_key_pem=data.public_key
    )

    is_valid = hash_valid and signature_valid

    return {
        "valid": is_valid,
        "hash_valid": hash_valid,
        "signature_valid": signature_valid,
        "message": (
            "Digital signature valid. Dokumen tidak dimodifikasi."
            if is_valid
            else "Digital signature tidak valid atau dokumen telah dimodifikasi."
        ),
        "klaim_id": data.klaim_id,
        "serah_terima_id": data.serah_terima_id
    }