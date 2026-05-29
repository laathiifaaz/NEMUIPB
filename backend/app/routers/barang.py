from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import date, timedelta
from sqlalchemy import or_

from app.database import SessionLocal
from app.models import Barang, Laporan

router = APIRouter(
    prefix="/barang",
    tags=["Barang"]
)

@router.get("/")
def get_all_barang():
    db = SessionLocal()

    data = (
        db.query(Barang, Laporan)
        .outerjoin(Laporan, Laporan.barang_id == Barang.barang_id)
        .order_by(Laporan.laporan_id.desc().nullslast(), Barang.barang_id.desc())
        .all()
    )

    barang = [
        {
            "barang_id": item.barang_id,
            "laporan_id": laporan.laporan_id if laporan else None,
            "pelapor_user_id": laporan.user_id if laporan else None,
            "jenis_laporan": laporan.jenis_laporan if laporan else None,
            "status_laporan": laporan.status_laporan if laporan else None,
            "status_verifikasi": laporan.status_verifikasi if laporan else None,
            "nama_barang": item.nama_barang,
            "kategori": item.kategori,
            "deskripsi": item.deskripsi,
            "tanggal_kejadian": item.tanggal_kejadian,
            "lokasi": item.lokasi,
            "dokumentasi": item.dokumentasi,
            "status_barang": item.status_barang,
        }
        for item, laporan in data
    ]

    db.close()
    return barang


@router.get("/search")
def search_barang(keyword: str):
    db = SessionLocal()

    barang = db.query(Barang).filter(
        or_(
            Barang.nama_barang.ilike(f"%{keyword}%"),
            Barang.deskripsi.ilike(f"%{keyword}%"),
            Barang.kategori.ilike(f"%{keyword}%")
        )
    ).all()

    db.close()
    return barang

@router.get("/status")
def get_barang_by_status(status: str):
    db = SessionLocal()

    barang = db.query(Barang).filter(Barang.status_barang == status).all()

    db.close()
    return barang

@router.get("/filter")
def filter_barang(
    kategori: Optional[str] = None,
    lokasi: Optional[str] = None,
    tanggal_awal: Optional[date] = None,
    tanggal_akhir: Optional[date] = None,
    status: Optional[str] = None
):
    db = SessionLocal()

    query = db.query(Barang)

    # default: 30 hari terakhir
    if tanggal_awal is None and tanggal_akhir is None:
        tanggal_akhir = date.today()
        tanggal_awal = tanggal_akhir - timedelta(days=30)

    if kategori and kategori.lower() != "semua":
        query = query.filter(Barang.kategori.ilike(f"%{kategori}%"))

    if lokasi and lokasi.lower() != "semua":
        query = query.filter(Barang.lokasi.ilike(f"%{lokasi}%"))

    if status and status.lower() != "semua":
        query = query.filter(Barang.status_barang == status.lower())

    if tanggal_awal:
        query = query.filter(Barang.tanggal_kejadian >= tanggal_awal)

    if tanggal_akhir:
        query = query.filter(Barang.tanggal_kejadian <= tanggal_akhir)

    barang = query.all()

    db.close()
    return barang

@router.get("/{barang_id}")
def get_detail_barang(barang_id: int):
    db = SessionLocal()

    barang = db.query(Barang).filter(Barang.barang_id == barang_id).first()

    if not barang:
        db.close()
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")

    result = {
        "barang_id": barang.barang_id,
        "nama_barang": barang.nama_barang,
        "kategori": barang.kategori,
        "deskripsi": barang.deskripsi,
        "tanggal_kejadian": barang.tanggal_kejadian,
        "lokasi": barang.lokasi,
        "dokumentasi": barang.dokumentasi,
        "status_barang": barang.status_barang
    }

    db.close()
    return result
