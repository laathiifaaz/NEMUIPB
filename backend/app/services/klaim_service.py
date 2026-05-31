from datetime import datetime, timedelta
import random
import string

from app.models import Barang, KlaimBarang, Laporan, Notifikasi
from app.services.encryption.EncryptionService import encryption_service
from app.services.serah_terima_service import create_serah_terima


PICKUP_CODE_PREFIX = "PICKUP:"
DROPOFF_CODE_PREFIX = "DROPOFF:"


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

        laporan_penemuan = self.db.query(Laporan).filter(
            Laporan.barang_id == barang_id,
            Laporan.jenis_laporan == "penemuan"
        ).first()

        if not laporan_penemuan:
            raise KlaimServiceError(400, "Barang ini tidak berasal dari laporan penemuan")

        if laporan_penemuan.user_id == user.user_id:
            raise KlaimServiceError(
                400,
                "Pelapor penemuan tidak bisa mengklaim barang yang ia laporkan"
            )

        if (
            laporan_penemuan.status_verifikasi != "terverifikasi" or
            laporan_penemuan.status_laporan != "selesai" or
            barang.status_barang != "ditemukan"
        ):
            raise KlaimServiceError(
                400,
                "Barang belum tersedia untuk diklaim"
            )

        existing_claim = self.db.query(KlaimBarang).filter(
            KlaimBarang.user_id == user.user_id,
            KlaimBarang.barang_id == barang_id
        ).order_by(
            KlaimBarang.updated_time.desc().nullslast(),
            KlaimBarang.created_time.desc(),
            KlaimBarang.klaim_id.desc()
        ).first()

        if existing_claim and existing_claim.status_klaim in KlaimDomain.active_statuses():
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

        if existing_claim:
            claim = existing_claim
            claim.laporan_kehilangan_id = laporan_kehilangan_id
            claim.status_klaim = KlaimDomain.PENDING
            claim.catatan_admin = None
            claim.updated_time = datetime.now()
        else:
            claim = KlaimBarang(
                user_id=user.user_id,
                barang_id=barang_id,
                laporan_kehilangan_id=laporan_kehilangan_id,
                status_klaim=KlaimDomain.PENDING,
                updated_time=datetime.now()
            )
            self.db.add(claim)

        self.db.commit()
        self.db.refresh(claim)

        return {
            "message": "Klaim barang berhasil diajukan",
            "klaim_id": claim.klaim_id,
            "status_klaim": KlaimDomain.PENDING,
            "updated_time": claim.updated_time
        }

    def cancel_claim(self, klaim_id, user):
        claim = self.db.query(KlaimBarang).filter(
            KlaimBarang.klaim_id == klaim_id,
            KlaimBarang.user_id == user.user_id
        ).first()

        if not claim:
            raise KlaimServiceError(404, "Klaim tidak ditemukan")

        barang_id = claim.barang_id
        laporan_id = claim.laporan_kehilangan_id

        KlaimDomain(claim).cancel(datetime.now())
        self.db.delete(claim)

        self.db.commit()

        return {
            "message": "Klaim barang berhasil dibatalkan",
            "klaim_id": klaim_id,
            "barang_id": barang_id,
            "laporan_id": laporan_id,
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
        pickup_code = self._generate_unique_pickup_code() if status_klaim == KlaimDomain.ACCEPTED else None
        claim_domain.verify(
            status_klaim,
            self._build_pickup_note(pickup_code, catatan_admin)
            if pickup_code
            else catatan_admin
        )

        if claim_domain.is_accepted():
            pickup_message = self._accept_claim(claim, admin, pickup_code)
            rejected_claims_count = self._reject_other_pending_claims_for_barang(
                accepted_claim=claim
            )
        else:
            pickup_message = "Klaim barang Anda ditolak oleh admin."
            rejected_claims_count = 0

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
            "klaim_id": klaim_id,
            "pickup_code": pickup_code,
            "rejected_other_claims": rejected_claims_count
        }

    def verify_pickup_code(self, pickup_code, admin):
        if admin.role != "admin":
            raise KlaimServiceError(403, "Bukan admin")

        normalized_code = (pickup_code or "").strip().upper()

        if not normalized_code:
            raise KlaimServiceError(400, "Kode pickup wajib diisi")

        matched_claim = self._find_claim_by_pickup_code(normalized_code)

        if not matched_claim:
            return self._verify_dropoff_code(normalized_code)

        barang = self.db.query(Barang).filter(
            Barang.barang_id == matched_claim.barang_id
        ).first()

        if not barang:
            raise KlaimServiceError(404, "Barang tidak ditemukan")

        if barang.status_barang == "selesai":
            raise KlaimServiceError(400, "Kode pickup sudah pernah diverifikasi")

        barang.status_barang = "selesai"
        matched_claim.updated_time = datetime.now()

        laporan_kehilangan = self.db.query(Laporan).filter(
            Laporan.laporan_id == matched_claim.laporan_kehilangan_id
        ).first()
        if laporan_kehilangan:
            laporan_kehilangan.status_laporan = "selesai"
            barang_kehilangan = self.db.query(Barang).filter(
                Barang.barang_id == laporan_kehilangan.barang_id
            ).first()
            if barang_kehilangan:
                barang_kehilangan.status_barang = "selesai"

            self._notify_report_completed(
                laporan_kehilangan,
                "Laporan kehilangan Anda telah selesai. Barang sudah berhasil diambil."
            )

        laporan_penemuan = self.db.query(Laporan).filter(
            Laporan.barang_id == matched_claim.barang_id,
            Laporan.jenis_laporan == "penemuan"
        ).first()
        if laporan_penemuan:
            laporan_penemuan.status_laporan = "selesai"
            self._notify_report_completed(
                laporan_penemuan,
                "Laporan penemuan Anda telah selesai. Barang sudah dikembalikan kepada pemilik."
            )

        self.db.commit()

        return {
            "message": "Kode pickup berhasil diverifikasi",
            "code_type": "pickup",
            "pickup_code": normalized_code,
            "klaim_id": matched_claim.klaim_id,
            "barang_id": matched_claim.barang_id,
            "laporan_id": matched_claim.laporan_kehilangan_id,
            "status_barang": barang.status_barang
        }

    def _accept_claim(self, claim, admin, pickup_code):
        barang = self.db.query(Barang).filter(
            Barang.barang_id == claim.barang_id
        ).first()

        if barang:
            barang.status_barang = "diklaim"
            create_serah_terima(
                db=self.db,
                klaim=claim,
                barang=barang,
                admin=admin
            )

        laporan_kehilangan = self.db.query(Laporan).filter(
            Laporan.laporan_id == claim.laporan_kehilangan_id
        ).first()
        if laporan_kehilangan:
            laporan_kehilangan.status_laporan = "siap_diambil"

        return (
            f"Klaim barang Anda diterima. Kode pickup Anda: {pickup_code}. "
            "Tunjukkan kode ini ke admin saat mengambil barang di Kantor Pusat "
            "NEMU IPB, Senin-Jumat 08.00-17.00 WIB."
        )

    def _reject_other_pending_claims_for_barang(self, accepted_claim):
        rejected_claims = self.db.query(KlaimBarang).filter(
            KlaimBarang.barang_id == accepted_claim.barang_id,
            KlaimBarang.klaim_id != accepted_claim.klaim_id,
            KlaimBarang.status_klaim == KlaimDomain.PENDING
        ).all()

        rejection_note = "Barang sudah diklaim oleh user lain"
        encrypted_note = encryption_service.encrypt_if_exists(rejection_note)
        now = datetime.now()

        for claim in rejected_claims:
            claim.status_klaim = KlaimDomain.REJECTED
            claim.catatan_admin = encrypted_note
            claim.updated_time = now

            self.db.add(Notifikasi(
                user_id=claim.user_id,
                laporan_id=claim.laporan_kehilangan_id,
                pesan=rejection_note,
                tanggal_kirim=now,
                status_baca=False
            ))

        return len(rejected_claims)

    def build_dropoff_note(self, dropoff_code, catatan_admin):
        note = (catatan_admin or "").strip()

        if note:
            return f"{DROPOFF_CODE_PREFIX}{dropoff_code}|{note}"

        return f"{DROPOFF_CODE_PREFIX}{dropoff_code}"

    def generate_unique_dropoff_code(self):
        return self._generate_unique_pickup_code()

    def _verify_dropoff_code(self, normalized_code):
        reports = self.db.query(Laporan).filter(
            Laporan.jenis_laporan == "penemuan",
            Laporan.status_verifikasi == "terverifikasi"
        ).all()

        matched_report = None

        for report in reports:
            stored_note = encryption_service.decrypt_if_exists(report.catatan_verifikasi)
            if self._extract_dropoff_code(stored_note) == normalized_code:
                matched_report = report
                break

        if not matched_report:
            raise KlaimServiceError(404, "Kode pickup/dropoff tidak ditemukan")

        if matched_report.status_laporan == "selesai":
            raise KlaimServiceError(400, "Kode dropoff sudah pernah diverifikasi")

        barang = self.db.query(Barang).filter(
            Barang.barang_id == matched_report.barang_id
        ).first()

        matched_report.status_laporan = "selesai"
        if barang and barang.status_barang != "selesai":
            barang.status_barang = "ditemukan"

        self._notify_report_completed(
            matched_report,
            "Laporan penemuan Anda telah selesai. Barang sudah masuk ke koleksi dan dapat diklaim pemilik."
        )

        self.db.commit()

        return {
            "message": "Kode dropoff berhasil diverifikasi",
            "code_type": "dropoff",
            "pickup_code": normalized_code,
            "klaim_id": None,
            "barang_id": matched_report.barang_id,
            "laporan_id": matched_report.laporan_id,
            "status_barang": barang.status_barang if barang else None
        }

    def _generate_unique_pickup_code(self):
        alphabet = string.ascii_uppercase + string.digits + "@#$%"

        for _ in range(20):
            code = "".join(random.choice(alphabet) for _ in range(6))
            if not self._pickup_code_exists(code):
                return code

        return "".join(random.choice(alphabet) for _ in range(8))

    def _find_claim_by_pickup_code(self, code):
        claims = self.db.query(KlaimBarang).filter(
            KlaimBarang.status_klaim == KlaimDomain.ACCEPTED
        ).all()

        for claim in claims:
            stored_note = encryption_service.decrypt_if_exists(claim.catatan_admin)
            if self._extract_pickup_code(stored_note) == code:
                return claim

        return None

    def _pickup_code_exists(self, code):
        if self._find_claim_by_pickup_code(code):
            return True

        reports = self.db.query(Laporan).filter(
            Laporan.jenis_laporan == "penemuan"
        ).all()

        for report in reports:
            stored_note = encryption_service.decrypt_if_exists(report.catatan_verifikasi)
            if self._extract_dropoff_code(stored_note) == code:
                return True

        return False

    def _build_pickup_note(self, pickup_code, catatan_admin):
        note = (catatan_admin or "").strip()

        if note:
            return f"{PICKUP_CODE_PREFIX}{pickup_code}|{note}"

        return f"{PICKUP_CODE_PREFIX}{pickup_code}"

    def _extract_pickup_code(self, value):
        if not value or PICKUP_CODE_PREFIX not in value:
            return None

        raw_code = value.split(PICKUP_CODE_PREFIX, 1)[1].split("|", 1)[0]

        return raw_code.strip().upper()

    def _extract_dropoff_code(self, value):
        if not value or DROPOFF_CODE_PREFIX not in value:
            return None

        raw_code = value.split(DROPOFF_CODE_PREFIX, 1)[1].split("|", 1)[0]

        return raw_code.strip().upper()

    def _notify_report_completed(self, report, message):
        self.db.add(Notifikasi(
            user_id=report.user_id,
            laporan_id=report.laporan_id,
            pesan=message,
            tanggal_kirim=datetime.now(),
            status_baca=False
        ))
