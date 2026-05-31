from collections import Counter
from datetime import date, datetime, time, timedelta

from app.models import Barang, KlaimBarang, Laporan


CATEGORY_COLORS = [
    "bg-[#002B5B]",
    "bg-[#9A7D0A]",
    "bg-[#006D8F]",
    "bg-[#0F9F4B]",
    "bg-[#D92D20]",
]

MONTH_LABELS = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
]


def get_admin_analytics(db, time_range="30_hari", location_filter="tinggi"):
    now = datetime.now()
    current_start = _get_range_start(now, time_range)
    previous_start, previous_end = _get_previous_range(now, current_start, time_range)

    report_rows = (
        db.query(Laporan, Barang)
        .join(Barang, Laporan.barang_id == Barang.barang_id)
        .all()
    )
    claims = db.query(KlaimBarang).all()

    current_reports = [
        (laporan, barang)
        for laporan, barang in report_rows
        if _is_in_range(_item_datetime(barang), current_start, now)
    ]
    previous_reports = [
        (laporan, barang)
        for laporan, barang in report_rows
        if _is_in_range(_item_datetime(barang), previous_start, previous_end)
    ]
    verified_reports = [
        (laporan, barang)
        for laporan, barang in report_rows
        if laporan.status_verifikasi == "terverifikasi"
    ]

    found_reports = [
        (laporan, barang)
        for laporan, barang in current_reports
        if laporan.jenis_laporan == "penemuan"
        and laporan.status_verifikasi == "terverifikasi"
    ]
    previous_found_reports = [
        (laporan, barang)
        for laporan, barang in previous_reports
        if laporan.jenis_laporan == "penemuan"
        and laporan.status_verifikasi == "terverifikasi"
    ]
    returned_reports = [
        (laporan, barang)
        for laporan, barang in current_reports
        if barang.status_barang == "selesai"
    ]

    total_found = len(found_reports)
    success_rate_value = round((len(returned_reports) / total_found) * 100, 1) if total_found else 0
    avg_return_hours = _average_return_hours(claims, current_start, now)
    previous_avg_return_hours = _average_return_hours(
        claims,
        previous_start,
        previous_end,
    )

    return {
        "stats": {
            "total_found": total_found,
            "found_trend": _format_count_trend(total_found, len(previous_found_reports)),
            "success_rate": f"{success_rate_value}%",
            "success_status": "Target Met" if success_rate_value >= 70 else "Needs Attention",
            "avg_return_time": _format_hours(avg_return_hours),
            "return_trend": _format_hour_trend(avg_return_hours, previous_avg_return_hours),
        },
        "monthlyTrends": _build_monthly_trends(verified_reports, now),
        "categories": _build_categories(current_reports),
        "hotspots": _build_hotspots(current_reports, location_filter),
    }


def _get_range_start(now, time_range):
    if time_range == "7_hari":
        return _start_of_day(now - timedelta(days=6))

    if time_range == "bulan_ini":
        return datetime(now.year, now.month, 1)

    if time_range == "tahun_ini":
        return datetime(now.year, 1, 1)

    return _start_of_day(now - timedelta(days=29))


def _get_previous_range(now, current_start, time_range):
    current_end = now

    if time_range == "bulan_ini":
        previous_end = current_start - timedelta(seconds=1)
        previous_start = datetime(previous_end.year, previous_end.month, 1)
        return previous_start, previous_end

    if time_range == "tahun_ini":
        previous_start = datetime(now.year - 1, 1, 1)
        previous_end = datetime(now.year - 1, 12, 31, 23, 59, 59)
        return previous_start, previous_end

    duration = current_end - current_start
    previous_end = current_start - timedelta(seconds=1)
    previous_start = previous_end - duration

    return previous_start, previous_end


def _start_of_day(value):
    return datetime.combine(value.date(), time.min)


def _item_datetime(barang):
    if barang.created_time:
        return barang.created_time

    if isinstance(barang.tanggal_kejadian, datetime):
        return barang.tanggal_kejadian

    if isinstance(barang.tanggal_kejadian, date):
        return datetime.combine(barang.tanggal_kejadian, time.min)

    return None


def _is_in_range(value, start, end):
    if not value:
        return True

    return start <= value <= end


def _format_count_trend(current, previous):
    if previous <= 0:
        return "+100%" if current > 0 else "0%"

    change = ((current - previous) / previous) * 100
    prefix = "+" if change >= 0 else ""

    return f"{prefix}{round(change)}%"


def _average_return_hours(claims, start, end):
    durations = []

    for claim in claims:
        if claim.status_klaim != "diterima":
            continue

        if not claim.created_time or not claim.updated_time:
            continue

        if not _is_in_range(claim.updated_time, start, end):
            continue

        durations.append(
            (claim.updated_time - claim.created_time).total_seconds() / 3600
        )

    if not durations:
        return 0

    return sum(durations) / len(durations)


def _format_hours(value):
    return f"{round(value, 1)} hrs"


def _format_hour_trend(current, previous):
    if previous <= 0:
        return "0h vs LW" if current <= 0 else f"+{round(current, 1)}h vs LW"

    delta = current - previous
    prefix = "+" if delta >= 0 else ""

    return f"{prefix}{round(delta, 1)}h vs LW"


def _build_monthly_trends(report_rows, now):
    buckets = []

    for offset in range(5, -1, -1):
        month_date = _subtract_months(now, offset)
        buckets.append({
            "year": month_date.year,
            "month_number": month_date.month,
            "month": MONTH_LABELS[month_date.month - 1],
            "reported": 0,
            "returned": 0,
        })

    for _, barang in report_rows:
        item_date = _item_datetime(barang)
        if not item_date:
            continue

        for bucket in buckets:
            if item_date.year == bucket["year"] and item_date.month == bucket["month_number"]:
                bucket["reported"] += 1

                if barang.status_barang == "selesai":
                    bucket["returned"] += 1

                break

    return [
        {
            "month": bucket["month"],
            "reported": bucket["reported"],
            "returned": bucket["returned"],
        }
        for bucket in buckets
    ]


def _subtract_months(value, months):
    month = value.month - months
    year = value.year

    while month <= 0:
        month += 12
        year -= 1

    return datetime(year, month, 1)


def _build_categories(report_rows):
    counts = Counter(barang.kategori or "Lainnya" for _, barang in report_rows)
    total = sum(counts.values()) or 1

    return [
        {
            "name": name,
            "percentage": round((count / total) * 100),
            "count": count,
            "color": CATEGORY_COLORS[index % len(CATEGORY_COLORS)],
        }
        for index, (name, count) in enumerate(counts.most_common(5))
    ]


def _build_hotspots(report_rows, location_filter):
    counts = Counter(barang.lokasi or "Lokasi tidak diketahui" for _, barang in report_rows)
    sorted_items = sorted(
        counts.items(),
        key=lambda item: item[1],
        reverse=location_filter != "rendah",
    )

    return [
        {
            "name": name,
            "count": count,
        }
        for name, count in sorted_items[:6]
    ]
