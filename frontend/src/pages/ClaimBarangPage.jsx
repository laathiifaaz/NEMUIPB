import React, { Component } from "react";
import AuthService from "../services/AuthService";
import BarangService from "../services/BarangService";
import ReportService from "../services/ReportService";
import UserPageLayout from "../components/UserPageLayout";
import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

class ClaimBarangPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      user: AuthService.getCurrentUser(),
      isSidebarExpanded: getStoredSidebarExpanded(),
      barang: null,
      reports: [],
      selectedReportId: "",
      loading: true,
      submitting: false,
      error: null,
      successMessage: "",
    };
  }

  async componentDidMount() {
    await this.loadClaimData();
  }

  toggleSidebar = () => {
    this.setState((prevState) => {
      const isSidebarExpanded = !prevState.isSidebarExpanded;
      setStoredSidebarExpanded(isSidebarExpanded);

      return { isSidebarExpanded };
    });
  };

  handleLogout = () => {
    AuthService.logout();
    window.location.reload();
  };

  getBarangId() {
    return this.props.barangId;
  }

  getImageSrc(item) {
    const value = item?.foto_url || item?.dokumentasi || "";

    if (!value) return "/images/logo-ipb.png";
    if (value.startsWith("data:image/")) return value;
    if (value.startsWith("http")) return value;
    if (value.startsWith("/")) return value;

    return `/images/${value}`;
  }

  formatTanggal(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  loadClaimData = async () => {
    this.setState({
      loading: true,
      error: null,
      successMessage: "",
    });

    try {
      const barangId = this.getBarangId();
      const [allBarang, reports] = await Promise.all([
        BarangService.getAllBarang(),
        ReportService.getMyReports(),
      ]);

      const barang = (Array.isArray(allBarang) ? allBarang : []).find(
        (item) => String(item.barang_id) === String(barangId)
      );

      if (!barang) {
        throw new Error("Barang tidak ditemukan.");
      }

      const availableReports = (Array.isArray(reports) ? reports : []).filter(
        (report) =>
          report.jenis_laporan === "kehilangan" &&
          report.status_laporan === "disetujui" &&
          report.status_verifikasi === "terverifikasi"
      );

      this.setState({
        barang,
        reports: availableReports,
        selectedReportId:
          availableReports.length > 0
            ? String(availableReports[0].laporan_id)
            : "",
        loading: false,
      });
    } catch (error) {
      this.setState({
        barang: null,
        reports: [],
        selectedReportId: "",
        loading: false,
        error: error.message || "Gagal memuat data klaim.",
      });
    }
  };

  handleSubmitClaim = async () => {
    const { selectedReportId } = this.state;
    const barangId = this.getBarangId();

    if (!selectedReportId) {
      this.setState({
        error: "Pilih laporan kehilangan yang sesuai terlebih dahulu.",
        successMessage: "",
      });
      return;
    }

    this.setState({
      submitting: true,
      error: null,
      successMessage: "",
    });

    try {
      const result = await BarangService.klaimBarang(
        barangId,
        Number(selectedReportId)
      );
      const storedClaims = JSON.parse(
        localStorage.getItem("nemuipb_claim_status") || "{}"
      );
      storedClaims[selectedReportId] = {
        barang_id: barangId,
        klaim_id: result.klaim_id,
        status_klaim: result.status_klaim || "diproses",
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(
        "nemuipb_claim_status",
        JSON.stringify(storedClaims)
      );

      this.setState({
        submitting: false,
        successMessage:
          result.message ||
          "Klaim berhasil diajukan dan menunggu verifikasi admin.",
      });
    } catch (error) {
      this.setState({
        submitting: false,
        error: error.message || "Gagal mengajukan klaim barang.",
      });
    }
  };

  renderReportCard(report) {
    const selected = String(this.state.selectedReportId) === String(report.laporan_id);

    return (
      <button
        key={report.laporan_id}
        type="button"
        onClick={() =>
          this.setState({
            selectedReportId: String(report.laporan_id),
            error: null,
            successMessage: "",
          })
        }
        className={`text-left bg-white border rounded-2xl p-4 transition-all min-h-[138px] ${
          selected
            ? "border-[#002B5B] shadow-md shadow-blue-900/10"
            : "border-gray-100 hover:border-[#A2B4C7]"
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Laporan #{report.laporan_id}
            </p>
            <h3 className="text-base font-extrabold text-[#002B5B] mt-1 line-clamp-1">
              {report.nama_barang || "Barang hilang"}
            </h3>
          </div>

          <span
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              selected ? "border-[#002B5B]" : "border-gray-300"
            }`}
          >
            {selected && <span className="w-2.5 h-2.5 bg-[#002B5B] rounded-full"></span>}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-400 font-black uppercase text-[9px] mb-1">
              Lokasi
            </p>
            <p className="font-semibold text-gray-600 line-clamp-1">
              {report.lokasi || "-"}
            </p>
          </div>

          <div>
            <p className="text-gray-400 font-black uppercase text-[9px] mb-1">
              Tanggal
            </p>
            <p className="font-semibold text-gray-600">
              {this.formatTanggal(report.tanggal_kejadian)}
            </p>
          </div>
        </div>
      </button>
    );
  }

  render() {
    const {
      user,
      isSidebarExpanded,
      barang,
      reports,
      selectedReportId,
      loading,
      submitting,
      error,
      successMessage,
    } = this.state;

    return (
      <UserPageLayout
        currentPath="/koleksi"
        isSidebarExpanded={isSidebarExpanded}
        onToggleSidebar={this.toggleSidebar}
        onLogout={this.handleLogout}
        navigate={this.props.navigate}
        userRole={user.role}
        userName={user.username}
      >

          <section className="mb-8">
            <button
              type="button"
              onClick={() => this.props.navigate("/koleksi")}
              className="text-xs font-black text-[#9A7D0A] mb-4 hover:underline"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Kembali ke Koleksi
            </button>

            <h1 className="text-4xl font-extrabold text-[#002B5B] mb-2">
              Ajukan Klaim Barang
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
              Pilih laporan kehilangan milikmu yang paling sesuai dengan barang temuan. Klaim akan masuk ke antrean verifikasi admin.
            </p>
          </section>

          {loading ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center text-gray-400 font-bold">
              Memuat data klaim...
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <section className="xl:col-span-1 bg-white border border-gray-100 rounded-[28px] overflow-hidden shadow-sm">
                {barang && (
                  <>
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                      <img
                        src={this.getImageSrc(barang)}
                        alt={barang.nama_barang}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-6">
                      <p className="text-[10px] font-black text-[#9A7D0A] uppercase tracking-widest mb-1">
                        {barang.kategori || "Kategori"}
                      </p>
                      <h2 className="text-2xl font-extrabold text-[#002B5B] mb-3">
                        {barang.nama_barang}
                      </h2>
                      <p className="text-sm text-gray-500 leading-relaxed mb-5">
                        {barang.deskripsi || "Tidak ada deskripsi tambahan."}
                      </p>

                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="bg-[#F8FAFC] rounded-2xl px-4 py-3 border border-gray-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                            Lokasi Temuan
                          </p>
                          <p className="font-bold text-[#002B5B]">
                            {barang.lokasi || "-"}
                          </p>
                        </div>

                        <div className="bg-[#F8FAFC] rounded-2xl px-4 py-3 border border-gray-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                            Tanggal Penemuan
                          </p>
                          <p className="font-bold text-[#002B5B]">
                            {this.formatTanggal(barang.tanggal_kejadian)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </section>

              <section className="xl:col-span-2 bg-white border border-gray-100 rounded-[28px] p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[10px] font-black text-[#9A7D0A] uppercase tracking-widest mb-2">
                      Laporan Kehilangan
                    </p>
                    <h2 className="text-2xl font-extrabold text-[#002B5B]">
                      Pilih laporan yang sesuai
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => this.props.navigate("/lapor-kehilangan")}
                    className="bg-[#F8FAFC] border border-gray-100 text-[#002B5B] px-4 py-3 rounded-xl text-xs font-black hover:bg-gray-50"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Buat Laporan
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 rounded-2xl px-4 py-3 text-sm font-bold mb-5">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="bg-blue-50 text-[#1D4ED8] rounded-2xl px-4 py-3 text-sm font-bold mb-5">
                    {successMessage}
                  </div>
                )}

                {reports.length === 0 ? (
                  <div className="bg-[#F8FAFC] rounded-2xl p-6 text-sm text-gray-500 leading-relaxed">
                    Kamu belum punya laporan kehilangan terverifikasi yang bisa digunakan untuk klaim. Buat laporan kehilangan terlebih dahulu dan tunggu verifikasi admin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {reports.map((report) => this.renderReportCard(report))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-100 pt-6">
                  <p className="text-xs text-gray-400 font-bold">
                    Barang #{this.getBarangId()} akan diklaim memakai laporan #{selectedReportId || "-"}.
                  </p>

                  <button
                    type="button"
                    onClick={this.handleSubmitClaim}
                    disabled={submitting || !selectedReportId || reports.length === 0}
                    className="bg-[#002B5B] hover:bg-[#001F42] disabled:bg-gray-300 text-white px-7 py-3.5 rounded-xl text-sm font-black transition-colors"
                  >
                    {submitting ? "Mengajukan..." : "Kirim Klaim"}
                  </button>
                </div>
              </section>
            </div>
          )}

      </UserPageLayout>
    );
  }
}

export default ClaimBarangPage;
