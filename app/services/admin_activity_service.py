from datetime import datetime

from app.models import ActivityLog, Barang, KlaimBarang, Laporan, User


def create_activity_log(
    db,
    action_type: str,
    note: str,
    admin_id: int = None,
    barang_id: int = None,
    laporan_id: int = None,
    klaim_id: int = None
):
    log = ActivityLog(
        action_type=action_type,
        note=note,
        admin_id=admin_id,
        barang_id=barang_id,
        laporan_id=laporan_id,
        klaim_id=klaim_id,
        created_at=datetime.now()
    )

    db.add(log)


def get_activity_logs(db, action_type: str = "semua", sort_by: str = "newest"):
    result = []

    query = (
        db.query(ActivityLog, Barang, User, Laporan)
        .outerjoin(Barang, ActivityLog.barang_id == Barang.barang_id)
        .outerjoin(User, ActivityLog.admin_id == User.user_id)
        .outerjoin(Laporan, ActivityLog.laporan_id == Laporan.laporan_id)
    )

    if action_type not in ["semua", "claim_pending", "returned"]:
        query = query.filter(ActivityLog.action_type == action_type)

    if sort_by == "oldest":
        query = query.order_by(ActivityLog.created_at.asc())
    else:
        query = query.order_by(ActivityLog.created_at.desc())

    if action_type not in ["claim_pending", "returned"]:
        for log, barang, admin, laporan in query.all():
            result.append(_build_activity_log_response(log, barang, admin, laporan))

    if action_type in ["semua", "claim_pending", "returned"]:
        result.extend(_get_claim_activity_logs(db, action_type))

    return _sort_activity_logs(result, sort_by)[:25]


def export_activity_logs(db):
    result = []

    log_data = (
        db.query(ActivityLog, Barang, User, Laporan)
        .outerjoin(Barang, ActivityLog.barang_id == Barang.barang_id)
        .outerjoin(User, ActivityLog.admin_id == User.user_id)
        .outerjoin(Laporan, ActivityLog.laporan_id == Laporan.laporan_id)
        .order_by(ActivityLog.created_at.desc())
        .all()
    )

    for log, barang, admin, laporan in log_data:
        result.append(_build_activity_log_response(log, barang, admin, laporan))

    result.extend(_get_claim_activity_logs(db, "semua"))

    return _sort_activity_logs(result, "newest")


def _get_claim_activity_logs(db, action_type: str):
    claim_query = (
        db.query(KlaimBarang, Barang, User)
        .join(Barang, KlaimBarang.barang_id == Barang.barang_id)
        .join(User, KlaimBarang.user_id == User.user_id)
    )

    if action_type == "claim_pending":
        claim_query = claim_query.filter(KlaimBarang.status_klaim == "diproses")
    elif action_type == "returned":
        claim_query = claim_query.filter(KlaimBarang.status_klaim == "diterima")
    else:
        claim_query = claim_query.filter(
            KlaimBarang.status_klaim.in_(["diproses", "diterima"])
        )

    result = []

    for klaim, barang, user in claim_query.all():
        claim_action_type = (
            "claim_pending"
            if klaim.status_klaim == "diproses"
            else "returned"
        )

        result.append(
            _build_claim_activity_response(
                klaim=klaim,
                barang=barang,
                user=user,
                action_type=claim_action_type
            )
        )

    return result


def _build_activity_log_response(log, barang, admin, laporan=None):
    return {
        "log_id": log.log_id,
        "timestamp": log.created_at or (laporan.tanggal_verifikasi if laporan else None),
        "item_id": f"#IPB-{barang.barang_id}" if barang else None,
        "item_name": barang.nama_barang if barang else None,
        "action_type": log.action_type,
        "administrator": admin.nama if admin else "System",
        "note": log.note
    }


def _build_claim_activity_response(klaim, barang, user, action_type):
    is_pending = action_type == "claim_pending"
    timestamp = klaim.created_time if is_pending else klaim.updated_time
    claimant_name = user.nama if user else "User"

    return {
        "log_id": f"klaim-{klaim.klaim_id}-{action_type}",
        "timestamp": timestamp or klaim.created_time,
        "item_id": f"#IPB-{barang.barang_id}" if barang else None,
        "item_name": barang.nama_barang if barang else None,
        "action_type": action_type,
        "administrator": "System" if is_pending else "Admin",
        "note": (
            f"Klaim #{klaim.klaim_id} dari {claimant_name} menunggu verifikasi oleh admin"
            if is_pending
            else f"Barang #{barang.barang_id} telah selesai dikembalikan"
        )
    }


def _sort_activity_logs(logs, sort_by: str):
    return sorted(
        logs,
        key=lambda item: item["timestamp"] or datetime.min,
        reverse=sort_by != "oldest"
    )
