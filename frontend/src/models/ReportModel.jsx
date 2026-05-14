class ReportModel {
  constructor(data) {
    this.laporan_id = data.laporan_id;
    this.user_id = data.user_id;
    this.verified_id = data.verified_id;
    this.barang_id = data.barang_id;

    this.jenis_laporan = data.jenis_laporan;

    this.status_laporan = data.status_laporan;

    this.status_verifikasi = data.status_verifikasi;

    this.catatan_verifikasi =
      data.catatan_verifikasi;

    this.tanggal_laporan =
      data.tanggal_laporan;

    this.tanggal_verifikasi =
      data.tanggal_verifikasi;
  }

  isVerified() {
    return this.status_verifikasi === "terverifikasi";
  }

  isPending() {
    return this.status_verifikasi === "menunggu";
  }
}

export default ReportModel;