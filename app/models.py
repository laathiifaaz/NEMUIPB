from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Date, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    nama = Column(String)
    email = Column(String, unique=True)
    identitas = Column(String)
    no_hp = Column(String)
    password_hash = Column(Text)
    role = Column(String)
    status_akun = Column(Boolean)


class Barang(Base):
    __tablename__ = "barang"

    barang_id = Column(Integer, primary_key=True, index=True)
    nama_barang = Column(String)
    kategori = Column(String)
    deskripsi = Column(Text)
    tanggal_kejadian = Column(Date)
    lokasi = Column(String)
    dokumentasi = Column(Text)
    status_barang = Column(String)


class Laporan(Base):
    __tablename__ = "laporan"

    laporan_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    verified_by = Column(Integer, ForeignKey("users.user_id"))
    barang_id = Column(Integer, ForeignKey("barang.barang_id"))

    jenis_laporan = Column(String)
    status_laporan = Column(String)
    status_verifikasi = Column(String)
    catatan_verifikasi = Column(Text)
    tanggal_verifikasi = Column(TIMESTAMP)

class Notifikasi(Base):
    __tablename__ = "notifikasi"

    notifikasi_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    laporan_id = Column(Integer, ForeignKey("laporan.laporan_id"))
    pesan = Column(Text)
    tanggal_kirim = Column(TIMESTAMP)
    status_baca = Column(Boolean)

class KlaimBarang(Base):
    __tablename__ = "klaim_barang"

    klaim_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    barang_id = Column(Integer, ForeignKey("barang.barang_id"))
    laporan_kehilangan_id = Column(Integer, ForeignKey("laporan.laporan_id"))

    status_klaim = Column(String, default="diproses")
    catatan_admin = Column(Text)

    created_time = Column(TIMESTAMP, server_default=func.now())
    updated_time = Column(TIMESTAMP, onupdate=func.now())

class SerahTerima(Base):
    __tablename__ = "serah_terima"

    serah_terima_id = Column(Integer, primary_key=True, index=True)

    klaim_id = Column(Integer, ForeignKey("klaim_barang.klaim_id"))
    barang_id = Column(Integer, ForeignKey("barang.barang_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    admin_id = Column(Integer, ForeignKey("users.user_id"))

    dokumen_text = Column(Text)
    dokumen_hash = Column(Text)
    digital_signature = Column(Text)
    public_key = Column(Text)
    created_at = Column(TIMESTAMP)

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    log_id = Column(Integer, primary_key=True, index=True)

    barang_id = Column(Integer, ForeignKey("barang.barang_id"))
    laporan_id = Column(Integer, ForeignKey("laporan.laporan_id"))
    klaim_id = Column(Integer, ForeignKey("klaim_barang.klaim_id"))
    admin_id = Column(Integer, ForeignKey("users.user_id"))

    action_type = Column(String)
    note = Column(Text)
    created_at = Column(TIMESTAMP)