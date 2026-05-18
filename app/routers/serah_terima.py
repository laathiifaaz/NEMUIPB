from fastapi import APIRouter, HTTPException, Depends

from app.database import SessionLocal
from app.models import SerahTerima, User
from app.utils.security import get_current_user
from app.services.encryption.EncryptionService import encryption_service
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

    if not data:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Data serah terima tidak ditemukan"
        )

    if (
        current_user.role != "admin"
        and current_user.user_id != data.user_id
    ):
        db.close()
        raise HTTPException(
            status_code=403,
            detail="Tidak memiliki akses"
        )

    dokumen_text = encryption_service.decrypt_if_exists(data.dokumen_text)
    digital_signature = encryption_service.decrypt_if_exists(data.digital_signature)

    db.close()

    return {
        "serah_terima_id": data.serah_terima_id,
        "klaim_id": data.klaim_id,
        "barang_id": data.barang_id,
        "user_id": data.user_id,
        "admin_id": data.admin_id,
        "dokumen_text": dokumen_text,
        "dokumen_hash": data.dokumen_hash,
        "digital_signature": digital_signature,
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

    if not data:
        db.close()
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

    dokumen_text = encryption_service.decrypt_if_exists(data.dokumen_text)
    digital_signature = encryption_service.decrypt_if_exists(data.digital_signature)

    if not dokumen_text or not digital_signature:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Data serah terima tidak dapat didekripsi"
        )

    db.close()

    recalculated_hash = hash_document(dokumen_text)

    hash_valid = recalculated_hash == data.dokumen_hash

    signature_valid = verify_signature(
        document_hash=data.dokumen_hash,
        digital_signature=digital_signature,
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
