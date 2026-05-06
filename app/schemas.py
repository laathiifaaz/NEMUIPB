from pydantic import BaseModel, field_validator
from datetime import date


class UserLogin(BaseModel):
    username: str
    password: str


class LaporanCreate(BaseModel):
    nama_barang: str
    kategori: str
    deskripsi: str
    tanggal_kejadian: date
    lokasi: str
    dokumentasi: str | None = None

    @field_validator("nama_barang", "kategori", "deskripsi", "lokasi")
    @classmethod
    def tidak_boleh_kosong(cls, value):
        if not value or not value.strip():
            raise ValueError("Kolom tidak boleh kosong")
        return value

    @field_validator("tanggal_kejadian")
    @classmethod
    def tanggal_tidak_boleh_masa_depan(cls, value):
        if value > date.today():
            raise ValueError("Tanggal kejadian tidak boleh melebihi hari ini")
        return value

    @field_validator("dokumentasi")
    @classmethod
    def validasi_dokumentasi(cls, value):
        if value is None or value.strip() == "":
            return value

        allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]

        if not any(value.lower().endswith(ext) for ext in allowed_extensions):
            raise ValueError("Format dokumentasi harus jpg, jpeg, png, atau webp")

        return value


class VerifikasiLaporan(BaseModel):
    catatan_verifikasi: str | None = None


class UpdateStatusBarang(BaseModel):
    status_barang: str

class KlaimCreate(BaseModel):
    barang_id: int
    laporan_kehilangan_id: int

class VerifikasiKlaim(BaseModel):
    status_klaim: str
    catatan_admin: str | None = None