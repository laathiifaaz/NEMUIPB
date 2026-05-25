from datetime import datetime, timedelta

from app.models import Barang, KlaimBarang, Laporan, Notifikasi
from app.services.encryption.EncryptionService import encryption_service
from app.services.serah_terima_service import create_serah_terima


class KlaimServiceError(Exception):
    def __init__(self, status_code, detail):
        self.status_code = status_code
        self.detail = detail


class KlaimDomain:
    PENDING = "diproses"
    ACCEPTED = "diterima"
    REJECTED = "ditolak"
    CANCELED = "dibatalkan"
    CANCELLATION_WINDOW = timedelta(hours=24)

    def __init__(self, claim):
        self.claim = claim

    @classmethod
    def verified_statuses(cls):
        return [cls.ACCEPTED, cls.REJECTED]

    @classmethod
    def active_statuses(cls):
        return [cls.PENDING, cls.ACCEPTED]

    def cancel(self, now):
        if self.claim.status_klaim != self.PENDING:
            raise KlaimServiceError(
                400,
                "Klaim tidak bisa dibatalkan karena sudah diverifikasi"
            )

        created_time = self.claim.created_time or now
        if now - created_time > self.CANCELLATION_WINDOW:
            raise KlaimServiceError(
                400,
                "Klaim hanya bisa dibatalkan dalam 24 jam setelah diajukan"
            )

        self.claim.status_klaim = self.CANCELED
        self.claim.updated_time = now

    def verify(self, status_klaim, catatan_admin):
        if status_klaim not in self.verified_statuses():
            raise KlaimServiceError(400, "Status tidak valid")

        self.claim.status_klaim = status_klaim
        self.claim.catatan_admin = encryption_service.encrypt_if_exists(
            catatan_admin
        )

    def is_accepted(self):
        return self.claim.status_klaim == self.ACCEPTED


class KlaimService:
    def __init__(self, db):
        self.db = db

    def create_claim(self, barang_id, laporan_kehilangan_id, user):
        laporan = self.db.query(Laporan).filter(
            Laporan.laporan_id == laporan_kehilangan_id,
            Laporan.user_id == user.user_id,
            Laporan.jenis_laporan == "kehilangan"
        ).first()

        if not laporan:
            raise KlaimServiceError(
                400,
                "User harus memilih laporan kehilangan miliknya"
            )

        barang = self.db.query(Barang).filter(
            Barang.barang_id == barang_id
        ).first()

        if not barang:
            raise KlaimServiceError(404, "Barang tidak ditemukan")

        duplicate_claim = self.db.query(KlaimBarang).filter(
            KlaimBarang.user_id == user.user_id,
            KlaimBarang.barang_id == barang_id
        ).first()

        if duplicate_claim:
            raise KlaimServiceError(
                400,
                "Anda sudah pernah mengklaim barang ini"
            )

        used_report = self.db.query(KlaimBarang).filter(
            KlaimBarang.user_id == user.user_id,
            KlaimBarang.laporan_kehilangan_id == laporan_kehilangan_id,
            KlaimBarang.status_klaim.in_(KlaimDomain.active_statuses())
        ).first()

        if used_report:
            raise KlaimServiceError(
                400,
                "Laporan kehilangan ini sedang dipakai atau sudah diterima untuk klaim lain"
            )

        claim = KlaimBarang(
            user_id=user.user_id,
            barang_id=barang_id,
            laporan_kehilangan_id=laporan_kehilangan_id,
            status_klaim=KlaimDomain.PENDING
        )

        self.db.add(claim)
        self.db.commit()
        self.db.refresh(claim)

        return {
            "message": "Klaim barang berhasil diajukan",
            "klaim_id": claim.klaim_id,
            "status_klaim": KlaimDomain.PENDING
        }

    def cancel_claim(self, klaim_id, user):
        claim = self.db.query(KlaimBarang).filter(
            KlaimBarang.klaim_id == klaim_id,
            KlaimBarang.user_id == user.user_id
        ).first()

        if not claim:
            raise KlaimServiceError(404, "Klaim tidak ditemukan")

        KlaimDomain(claim).cancel(datetime.now())

        self.db.commit()

        return {
            "message": "Klaim barang berhasil dibatalkan",
            "klaim_id": klaim_id,
            "status_klaim": KlaimDomain.CANCELED
        }

    def verify_claim(self, klaim_id, status_klaim, catatan_admin, admin):
        if admin.role != "admin":
            raise KlaimServiceError(403, "Bukan admin")

        claim = self.db.query(KlaimBarang).filter(
            KlaimBarang.klaim_id == klaim_id
        ).first()

        if not claim:
            raise KlaimServiceError(404, "Klaim tidak ditemukan")

        claim_domain = KlaimDomain(claim)
        claim_domain.verify(status_klaim, catatan_admin)

        if claim_domain.is_accepted():
            pickup_message = self._accept_claim(claim, admin)
        else:
            pickup_message = "Klaim barang Anda ditolak oleh admin."

        self.db.add(Notifikasi(
            user_id=claim.user_id,
            laporan_id=claim.laporan_kehilangan_id,
            pesan=pickup_message,
            tanggal_kirim=datetime.now(),
            status_baca=False
        ))

        self.db.commit()

        return {
            "message": f"Klaim {status_klaim}",
            "klaim_id": klaim_id
        }

    def _accept_claim(self, claim, admin):
        barang = self.db.query(Barang).filter(
            Barang.barang_id == claim.barang_id
        ).first()

        if barang:
            barang.status_barang = "selesai"
            create_serah_terima(
                db=self.db,
                klaim=claim,
                barang=barang,
                admin=admin
            )

        return (
            "Klaim barang Anda diterima. Ambil barang di Pos Keamanan "
            "Asrama IPB, Senin-Jumat 08.00-17.00 WIB."
        )
