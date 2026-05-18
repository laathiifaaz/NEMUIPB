from app.models import SerahTerima, User
from app.services.encryption.EncryptionService import encryption_service
from app.services.signature_service import (
    generate_key_pair,
    hash_document,
    sign_document
)


def create_serah_terima(db, klaim, barang, admin):
    user = db.query(User).filter(
        User.user_id == klaim.user_id
    ).first()

    catatan_admin = encryption_service.decrypt_if_exists(klaim.catatan_admin)

    document_text = f"""
BERITA ACARA SERAH TERIMA BARANG

Klaim ID: {klaim.klaim_id}
Barang ID: {barang.barang_id}
Nama Barang: {barang.nama_barang}
Kategori: {barang.kategori}
Lokasi: {barang.lokasi}

Penerima:
Nama: {user.nama if user else "-"}
User ID: {klaim.user_id}

Admin:
Nama: {admin.nama}
Admin ID: {admin.user_id}

Status Klaim: {klaim.status_klaim}
Catatan Admin: {catatan_admin}
"""

    private_key, public_key = generate_key_pair()
    document_hash = hash_document(document_text)
    digital_signature = sign_document(document_hash, private_key)

    serah_terima = SerahTerima(
        klaim_id=klaim.klaim_id,
        barang_id=barang.barang_id,
        user_id=klaim.user_id,
        admin_id=admin.user_id,
        # Sensitive handover document fields are encrypted before persistence.
        dokumen_text=encryption_service.encrypt(document_text),
        dokumen_hash=document_hash,
        digital_signature=encryption_service.encrypt(digital_signature),
        public_key=public_key
    )

    db.add(serah_terima)

    return serah_terima
