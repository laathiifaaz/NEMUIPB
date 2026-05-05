from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Date, TIMESTAMP
from sqlalchemy.orm import relationship
from database import Base


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