import React, { Component } from "react";
import AuthService from "../services/AuthService";
import AdminService from "../services/AdminService";
import AdminSidebar from "../components/admin/AdminSidebar";
import PageHeader from "../components/PageHeader";
import PageFooter from "../components/PageFooter";
import ReportTrendChart from "../components/admin/ReportTrendChart";
import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

class AdminDashboardPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      summary: {
        active_lost: 0,
        total_found: 0,
        pending_verification: 0,
        pending_claims: 0,
        returned_items: 0,
      },
      monthlyTrends: [],
      reports: [],
      selectedReport: null,
      showDetailModal: false,
      confirmModal: {
        show: false,
        type: null,
        laporanId: null,
        rejectNote: "",
        error: "",
      },
      selectedFilter: "semua",
      showFilterMenu: false,
      dashboardCurrentPage: 1,
      dashboardReportsPerPage: 10,
      pickupCode: "",
      pickupLoading: false,
      pickupMessage: "",
      pickupError: "",
      handoverDocument: null,
      handoverVerification: null,
      showHandoverModal: false,
      handoverLoading: false,
      handoverError: "",
      showHandoverTechnicalDetails: false,
      isLoading: true,
      error: null,
      isSidebarExpanded: getStoredSidebarExpanded(),
    };
  }

  async componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user || user.role !== "admin") {
      alert("Akses ditolak. Halaman ini hanya untuk admin.");
      this.goToUserMode();
      return;
    }

    await this.loadDashboardData();
  }

  toggleSidebar = () => {
    this.setState((prevState) => {
      const isSidebarExpanded = !prevState.isSidebarExpanded;
      setStoredSidebarExpanded(isSidebarExpanded);

      return { isSidebarExpanded };
    });
  };

  loadDashboardData = async () => {
    try {
      const summary = await AdminService.getSummary();
      const analytics = await AdminService.getAnalytics({
        range: "30_hari",
        filter: "tinggi",
      });
      const reports = await AdminService.getAllReports();

      this.setState({
        summary,
        monthlyTrends: analytics.monthlyTrends || [],
        reports: this.getDashboardReports(reports),
        dashboardCurrentPage: 1,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      this.setState({
        error: error.message,
        isLoading: false,
      });
    }
  };

  goToUserMode = () => {
    if (this.props.navigate) {
      this.props.navigate("/dashboard");
    } else {
      window.location.href = "/dashboard";
    }
  };

  handleLogout = () => {
    AuthService.logout();
    window.location.href = "/";
  };

  toggleFilterMenu = () => {
    this.setState({
      showFilterMenu: !this.state.showFilterMenu,
    });
  };

  handleFilterChange = async (filterValue) => {
    this.setState(
      {
        selectedFilter: filterValue,
        showFilterMenu: false,
        isLoading: true,
        dashboardCurrentPage: 1,
      },
      async () => {
        await this.loadDashboardData();
      }
    );
  };

  handleOpenDetail = (report) => {
    this.setState({
      selectedReport: report,
      showDetailModal: true,
    });
  };

  setDashboardPage = (page) => {
    this.setState({
      dashboardCurrentPage: page,
    });
  };

  handleCloseDetail = () => {
    this.setState({
      selectedReport: null,
      showDetailModal: false,
    });
  };

  isFinalStatus(report) {
    return report.status_verifikasi !== "belum_diverifikasi";
  }

  getDashboardReports(reports) {
    const normalizedReports = (Array.isArray(reports) ? reports : []).map((report) => ({
      ...report,
      item_name: report.item_name || report.nama_barang,
      reporter: report.reporter || report.pelapor,
    }));

    const filteredReports =
      this.state.selectedFilter === "semua"
        ? normalizedReports
        : normalizedReports.filter(
            (report) => report.status_verifikasi === this.state.selectedFilter
          );

    return [
      ...filteredReports.filter(
        (report) => report.status_verifikasi === "belum_diverifikasi"
      ),
      ...filteredReports.filter(
        (report) => report.status_verifikasi !== "belum_diverifikasi"
      ),
    ];
  }

  openVerifyConfirm = (laporanId) => {
    this.setState({
      confirmModal: {
        show: true,
        type: "verify",
        laporanId,
        rejectNote: "",
        error: "",
      },
    });
  };

  openDenyConfirm = (laporanId) => {
    this.setState({
      confirmModal: {
        show: true,
        type: "deny",
        laporanId,
        rejectNote: "",
        error: "",
      },
    });
  };

  closeConfirmModal = () => {
    this.setState({
      confirmModal: {
        show: false,
        type: null,
        laporanId: null,
        rejectNote: "",
        error: "",
      },
    });
  };

  handleRejectNoteChange = (event) => {
    const value = event.target.value;

    this.setState((prevState) => ({
      confirmModal: {
        ...prevState.confirmModal,
        rejectNote: value,
        error: "",
      },
    }));
  };

  handleConfirmAction = async () => {
    const { type, laporanId, rejectNote } = this.state.confirmModal;

    if (type === "deny" && !rejectNote.trim()) {
      this.setState((prevState) => ({
        confirmModal: {
          ...prevState.confirmModal,
          error: "Catatan penolakan wajib diisi.",
        },
      }));
      return;
    }

    try {
      if (type === "verify") {
        await AdminService.verifyReport(laporanId);
      }

      if (type === "deny") {
        await AdminService.denyReport(laporanId, rejectNote.trim());
      }

      this.closeConfirmModal();
      this.handleCloseDetail();

      await this.loadDashboardData();
    } catch (error) {
      alert(error.message);
    }
  };

  handlePickupCodeChange = (event) => {
    this.setState({
      pickupCode: event.target.value.toUpperCase().replace(/[^A-Z0-9@#$%]/g, "").slice(0, 8),
      pickupMessage: "",
      pickupError: "",
    });
  };

  closeHandoverModal = () => {
    this.setState({
      showHandoverModal: false,
      handoverDocument: null,
      handoverVerification: null,
      handoverLoading: false,
      handoverError: "",
      showHandoverTechnicalDetails: false,
    });
  };

  handleVerifyPickup = async () => {
    const pickupCode = this.state.pickupCode.trim();

    if (!pickupCode) {
      this.setState({
        pickupError: "Kode pickup wajib diisi.",
        pickupMessage: "",
      });
      return;
    }

      try {
        this.setState({
          pickupLoading: true,
          pickupError: "",
          pickupMessage: "",
        });

        const result = await AdminService.verifyPickupCode(pickupCode);

        this.setState({
          pickupCode: "",
          pickupLoading: false,
          pickupMessage: result.message || "Kode pickup berhasil diverifikasi.",
          pickupError: "",
        });

      if (result.code_type === "pickup" && result.klaim_id) {
        this.setState({
          handoverLoading: true,
          handoverError: "",
          showHandoverModal: true,
          handoverDocument: null,
          handoverVerification: null,
          showHandoverTechnicalDetails: false,
        });

        try {
          const [handoverDocument, handoverVerification] = await Promise.all([
            AdminService.getSerahTerima(result.klaim_id),
            AdminService.verifySerahTerima(result.klaim_id),
          ]);

          this.setState({
            handoverDocument,
            handoverVerification,
            handoverLoading: false,
          });
        } catch (error) {
          this.setState({
            handoverLoading: false,
            handoverError:
              error.message || "Dokumen serah terima gagal dimuat.",
          });
        }
      }

      await this.loadDashboardData();
    } catch (error) {
      const pickupError =
        error.message === "Failed to fetch"
          ? "Gagal menghubungi server. Pastikan koneksi backend tersedia, lalu coba lagi."
          : error.message || "Gagal memverifikasi kode pickup.";

      this.setState({
        pickupLoading: false,
        pickupError,
        pickupMessage: "",
      });
    }
  };

  convertToCSV = (data) => {
    if (!data || data.length === 0) {
      return "";
    }

    const headers = [
      "laporan_id",
      "item_name",
      "reporter",
      "email",
      "jenis_laporan",
      "status_laporan",
      "status_verifikasi",
      "kategori",
      "lokasi",
      "tanggal_kejadian",
      "status_barang",
    ];

    const rows = data.map((item) =>
      headers
        .map((header) => {
          const value = item[header] ?? "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    return [headers.join(","), ...rows].join("\n");
  };

  handleExport = async () => {
    try {
      const data = await AdminService.exportReports();
      const csv = this.convertToCSV(data);

      if (!csv) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "laporan-nemuipb.csv";
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    }
  };

  getStatusClass(status) {
    if (status === "belum_diverifikasi") return "bg-yellow-100 text-yellow-700";
    if (status === "terverifikasi") return "bg-green-100 text-green-700";
    if (status === "ditemukan") return "bg-[#006D8F] text-white";
    if (status === "hilang") return "bg-blue-100 text-[#002B5B]";
    if (status === "selesai" || status === "dikembalikan")
      return "bg-[#F4D35E] text-[#5C4A00]";
    if (status === "ditolak") return "bg-red-100 text-red-600";

    return "bg-gray-100 text-gray-500";
  }

  getReportTypeMeta(jenisLaporan) {
    const isFound = jenisLaporan === "penemuan";

    return {
      label: isFound ? "Ditemukan" : "Hilang",
      icon: isFound ? "fa-search-location" : "fa-exclamation-circle",
      badgeClass: isFound
        ? "bg-[#E8F7FA] text-[#006D8F] border-[#B9E7EF]"
        : "bg-[#EEF4FF] text-[#163A70] border-[#CFE0F7]",
    };
  }

  renderChart() {
    return <ReportTrendChart data={this.state.monthlyTrends} heightClass="h-72" />;
  }

  getImageSrc(dokumentasi) {
    if (!dokumentasi) return "/images/logo-ipb.png";
    if (dokumentasi.startsWith("data:image/")) return dokumentasi;
    if (dokumentasi.startsWith("http")) return dokumentasi;
    if (dokumentasi.startsWith("/")) return dokumentasi;

    return `/images/${dokumentasi}`;
  }

  renderDetailModal() {
    const report = this.state.selectedReport;

    if (!this.state.showDetailModal || !report) return null;

    const isDisabled = this.isFinalStatus(report);
    const reportType = this.getReportTypeMeta(report.jenis_laporan);
    const reportDateLabel =
      report.jenis_laporan === "penemuan"
        ? "Tanggal Penemuan"
        : "Tanggal Kehilangan";
    const submittedDate = report.created_time
      ? new Date(report.created_time).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "-";

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 py-4">
        <div className="bg-white rounded-[24px] w-full max-w-[940px] relative max-h-[calc(100vh-32px)] overflow-hidden shadow-2xl">
          <button
            type="button"
            onClick={this.handleCloseDetail}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/95 border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
            aria-label="Tutup detail laporan"
          >
            x
          </button>

          <div className="flex flex-col md:flex-row max-h-[calc(100vh-32px)] overflow-hidden">
            <div className="w-full md:w-[34%] bg-gray-50 flex items-center justify-center overflow-hidden h-52 md:h-auto">
              <div className="relative w-full h-full">
                <span className="absolute top-4 left-4 bg-[#006D8F] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase">
                  {report.status_barang || "status"}
                </span>

                <img
                  src={this.getImageSrc(report.dokumentasi)}
                  alt={report.item_name || report.nama_barang}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 p-5 pr-14 md:p-7 md:pr-16 flex flex-col gap-3 min-w-0 overflow-y-auto">
              <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start">
                <div>
                  <p className="text-[#9A7D0A] text-xs font-black uppercase tracking-widest">
                    {report.kategori || "Kategori"}
                  </p>

                  <h2 className="text-2xl font-extrabold text-[#002B5B] leading-tight">
                    {report.item_name || report.nama_barang}
                  </h2>
                </div>

                <div className="md:text-right">
                  <p className="text-gray-400 text-xs font-black uppercase">
                    {reportDateLabel}
                  </p>

                  <p className="text-[#002B5B] font-semibold">
                    {report.tanggal_kejadian || "-"}
                  </p>
                </div>
              </div>

              <p className="text-gray-500 text-sm leading-relaxed">
                {report.deskripsi || "Tidak ada deskripsi."}
              </p>

              <div className="flex flex-wrap gap-2">
                <div className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-700">
                  <i className="fas fa-map-marker-alt mr-2 text-[#002B5B]"></i>
                  {report.lokasi || "-"}
                </div>

                <div className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-700">
                  <i className="fas fa-user mr-2 text-[#002B5B]"></i>
                  {report.reporter || report.pelapor || "-"}
                </div>

                <div className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-700">
                  <i className="fas fa-envelope mr-2 text-[#002B5B]"></i>
                  {report.email || "-"}
                </div>

                <div className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 capitalize">
                  <i className="fas fa-clipboard-list mr-2 text-[#002B5B]"></i>
                  {report.jenis_laporan || "-"}
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E7ECF3] rounded-2xl p-3">
                <div className="flex flex-wrap gap-2">
                  <div className="bg-white border border-[#E7ECF3] px-3 py-2 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Jenis Laporan
                    </p>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black ${reportType.badgeClass}`}>
                      <i className={`fas ${reportType.icon}`}></i>
                      {reportType.label}
                    </span>
                  </div>

                  <div className="bg-white border border-[#E7ECF3] px-3 py-2 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      {reportDateLabel}
                    </p>
                    <p className="text-sm font-bold text-[#002B5B]">
                      {report.tanggal_kejadian || "-"}
                    </p>
                  </div>

                  <div className="bg-white border border-[#E7ECF3] px-3 py-2 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Tanggal Dilaporkan
                    </p>
                    <p className="text-sm font-bold text-[#002B5B]">
                      {submittedDate}
                    </p>
                  </div>
                </div>
              </div>

              {report.catatan_verifikasi && (
                <div
                  className={`border rounded-2xl p-3 ${
                    report.status_verifikasi === "terverifikasi"
                      ? "bg-[#EEFDF3] border-green-100"
                      : "bg-[#FFF7F7] border-red-100"
                  }`}
                >
                  <p
                    className={`text-xs font-bold mb-1 ${
                      report.status_verifikasi === "terverifikasi"
                        ? "text-[#0F9F4B]"
                        : "text-red-500"
                    }`}
                  >
                    Catatan Verifikasi
                  </p>

                  <p className="text-sm text-gray-600">
                    {report.catatan_verifikasi}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center border-t border-gray-50 pt-4 mt-auto">
                <p className="text-xs text-gray-400 font-bold">
                  ID: #IPB-{report.laporan_id}
                </p>

                <div className="flex gap-3">
                  <button
                    disabled={isDisabled}
                    onClick={() => this.openVerifyConfirm(report.laporan_id)}
                    className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${
                      isDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-[#163A70] text-white hover:bg-[#102348]"
                    }`}
                  >
                    Setujui
                  </button>

                  <button
                    disabled={isDisabled}
                    onClick={() => this.openDenyConfirm(report.laporan_id)}
                    className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${
                      isDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    Tolak
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderConfirmModal() {
  const { confirmModal } = this.state;

  if (!confirmModal.show) return null;

  const isDeny = confirmModal.type === "deny";

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center px-4 py-6">
      <div className="bg-white rounded-[20px] w-full max-w-sm px-6 pt-9 pb-6 text-center shadow-2xl relative">
        <button
          type="button"
          onClick={this.closeConfirmModal}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
        >
          <i className="fas fa-times text-sm"></i>
        </button>

        <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-[#FFD75A] text-white flex items-center justify-center text-2xl font-black">
          ?
        </div>

        <h2 className="text-2xl font-extrabold text-black mb-3">
          {isDeny ? "Tolak Laporan?" : "Verifikasi Laporan?"}
        </h2>

        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          {isDeny
            ? "Laporan yang ditolak tidak dapat diubah."
            : "Laporan yang disetujui tidak dapat diubah."}
        </p>

        {isDeny && (
          <div className="mb-5 text-left">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Catatan Penolakan
            </label>
            <textarea
              value={confirmModal.rejectNote}
              onChange={this.handleRejectNoteChange}
              rows={3}
              className="w-full rounded-2xl border border-[#E7ECF3] bg-[#F8FAFC] px-4 py-3 text-sm text-[#002B5B] outline-none focus:border-[#163A70] resize-none"
              placeholder="Tulis alasan penolakan di sini"
            />
            {confirmModal.error && (
              <p className="mt-2 text-xs font-bold text-red-500">
                {confirmModal.error}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={this.closeConfirmModal}
            className="py-3 rounded-xl bg-[#E8EEF5] text-[#002B5B] font-extrabold text-sm"
          >
            Tidak
          </button>

          <button
            type="button"
            onClick={this.handleConfirmAction}
            className={`py-3 rounded-xl text-white font-extrabold text-sm ${
              isDeny ? "bg-[#C9181F]" : "bg-[#002B5B]"
            }`}
          >
            Ya
          </button>
        </div>
      </div>
    </div>
  );
}

  renderHandoverModal() {
    const {
      showHandoverModal,
      handoverDocument,
      handoverVerification,
      handoverLoading,
      handoverError,
    } = this.state;

    if (!showHandoverModal) return null;

    const signatureValid = handoverVerification?.valid;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-6">
        <div className="bg-white rounded-[28px] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-[#EEF2F6] px-6 py-5 flex items-center justify-between rounded-t-[28px]">
            <div>
              <h2 className="text-2xl font-extrabold text-[#102348]">
                Dokumen Serah Terima
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Dokumen dibuat setelah kode pickup berhasil diverifikasi.
              </p>
            </div>

            <button
              type="button"
              onClick={this.closeHandoverModal}
              className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Tutup dokumen serah terima"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {handoverLoading ? (
            <div className="p-10 text-center text-gray-400 font-semibold">
              Memuat dan memverifikasi dokumen serah terima...
            </div>
          ) : handoverError ? (
            <div className="p-6">
              <div className="rounded-2xl bg-red-50 border border-red-100 text-red-600 px-5 py-4 text-sm font-bold">
                {handoverError}
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              <div
                className={`rounded-2xl px-5 py-4 border ${
                  signatureValid
                    ? "bg-[#EEFDF3] border-green-100 text-[#0F9F4B]"
                    : "bg-red-50 border-red-100 text-red-600"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest mb-1">
                      Status Tanda Tangan
                    </p>
                    <h3 className="text-lg font-extrabold">
                      {handoverVerification?.message || "Belum diverifikasi"}
                    </h3>
                  </div>

                  <div className="flex gap-2 text-xs font-black">
                    <span className="bg-white/80 px-3 py-2 rounded-xl">
                      Hash: {handoverVerification?.hash_valid ? "Valid" : "Tidak valid"}
                    </span>
                    <span className="bg-white/80 px-3 py-2 rounded-xl">
                      Tanda tangan: {handoverVerification?.signature_valid ? "Valid" : "Tidak valid"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-[#F8FAFC] rounded-2xl border border-[#E7ECF3] p-5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Dokumen Serah Terima
                  </p>
                  <pre className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed">
                    {handoverDocument?.dokumen_text || "-"}
                  </pre>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-[#E7ECF3] p-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Klaim
                    </p>
                    <p className="text-sm font-bold text-[#102348]">
                      Klaim #{handoverDocument?.klaim_id || "-"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Serah Terima #{handoverDocument?.serah_terima_id || "-"}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    const {
      reports,
      summary,
      error,
      isLoading,
      pickupCode,
      pickupLoading,
      pickupMessage,
      pickupError,
    } = this.state;
    const { dashboardCurrentPage, dashboardReportsPerPage } = this.state;
    const totalDashboardPages = Math.max(
      1,
      Math.ceil(reports.length / dashboardReportsPerPage)
    );
    const safeDashboardPage = Math.min(
      dashboardCurrentPage,
      totalDashboardPages
    );
    const dashboardStartIndex =
      (safeDashboardPage - 1) * dashboardReportsPerPage;
    const dashboardPaginatedReports = reports.slice(
      dashboardStartIndex,
      dashboardStartIndex + dashboardReportsPerPage
    );

    return (
      <div className="min-h-screen bg-[#F6F7FB] font-['Plus_Jakarta_Sans'] text-[#002B5B]">
        <div className="flex min-h-screen">
          <AdminSidebar 
            activeMenu="dashboard"
            expanded={this.state.isSidebarExpanded} 
            navigate={this.props.navigate}
          />

          <main
            className={`
              flex-1 p-6 md:p-10 overflow-y-auto
              transition-[margin] duration-300
              ${this.state.isSidebarExpanded ? "ml-64" : "ml-16"}
            `}
          >
            <PageHeader
              onToggleSidebar={this.toggleSidebar}
              navigate={this.props.navigate}
              profileIcon="fa-user-shield"
              actions={
                <button
                  type="button"
                  onClick={this.goToUserMode}
                  className="bg-[#002B5B] hover:bg-[#001f42] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 transition-all"
                >
                  <i className="fas fa-user mr-2"></i>
                  Mode Pengguna
                </button>
              }
            />

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold">
                {error}
              </div>
            )}

            <section className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
              <div>
                <h2 className="text-4xl font-extrabold text-[#002B5B] mb-2">
                  Selamat Datang Admin
                </h2>
                <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
                  Pantau laporan kehilangan, penemuan, dan klaim barang di lingkungan IPB.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="bg-gray-200 px-7 py-4 rounded-xl text-center">
                  <p className="text-[10px] font-black tracking-widest text-gray-500">
                    LAPORAN KEHILANGAN
                  </p>
                  <p className="text-2xl font-black text-[#002B5B]">
                    {summary.active_lost}
                  </p>
                </div>

                <div className="bg-white border border-gray-100 px-7 py-4 rounded-xl text-center shadow-sm">
                  <p className="text-[10px] font-black tracking-widest text-gray-500">
                    LAPORAN SELESAI
                  </p>
                  <p className="text-2xl font-black text-[#002B5B]">
                    {summary.returned_items ?? 0}
                  </p>
                </div>

                <div className="bg-[#002B5B] px-7 py-4 rounded-xl text-center">
                  <p className="text-[10px] font-black tracking-widest text-white/70">
                    LAPORAN PENEMUAN
                  </p>
                  <p className="text-2xl font-black text-white">
                    {summary.total_found}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-[30px] p-8 shadow-sm">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-extrabold">Tren Laporan</h3>
                    <p className="text-xs text-gray-400">
                      Perbandingan laporan masuk dan laporan selesai
                    </p>
                  </div>

                  <div className="flex gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-[#002B5B]">
                      <span className="w-3 h-3 rounded-sm bg-[#A2B4C7]"></span>
                      Dilaporkan
                    </span>
                    <span className="flex items-center gap-1.5 text-[#002B5B]">
                      <span className="w-3 h-3 rounded-sm bg-[#8E793E]"></span>
                      Laporan Selesai
                    </span>
                  </div>
                </div>

                {this.renderChart()}
              </div>

              <div className="bg-[#002B5B] text-white rounded-[30px] p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="w-12 h-12 bg-white text-[#002B5B] rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-certificate"></i>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        this.props.navigate
                          ? this.props.navigate("/admin/serah-terima")
                          : (window.location.href = "/admin/serah-terima")
                      }
                      className="shrink-0 border border-white/20 text-white/80 px-4 py-2 rounded-xl text-xs font-black tracking-widest hover:bg-white/10 transition-all"
                    >
                      RIWAYAT SERAH TERIMA
                    </button>
                  </div>

                  <h3 className="text-2xl font-medium leading-tight mb-3">
                    Verifikasi Kode Pickup/Dropoff
                  </h3>

                  <p className="text-sm text-white/60 leading-relaxed">
                    Masukkan kode pickup/dropoff yang ditunjukkan user untuk menyelesaikan pengambilan atau penyerahan barang.
                  </p>

                  <div className="mt-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/60">
                      Kode Pickup/Dropoff
                    </label>
                    <input
                      type="text"
                      value={pickupCode}
                      onChange={this.handlePickupCodeChange}
                      placeholder="ABCDEF"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-center text-xl font-black tracking-[0.35em] text-[#002B5B] outline-none placeholder:text-gray-300"
                    />
                    {pickupMessage && (
                      <p className="mt-3 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-100">
                        {pickupMessage}
                      </p>
                    )}
                    {pickupError && (
                      <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-xs font-bold text-red-100">
                        {pickupError}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={this.handleVerifyPickup}
                  disabled={pickupLoading}
                  className="mt-8 w-full bg-[#F4D35E] text-[#5C4A00] py-4 rounded-2xl text-xs font-black tracking-widest hover:scale-105 disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:scale-100 transition-all"
                >
                  {pickupLoading ? "MEMVERIFIKASI..." : "VERIFIKASI KODE"}
                </button>

              </div>
            </section>

            <section className="bg-white rounded-[30px] p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-extrabold">Laporan Terbaru</h3>

                <div className="flex gap-3">
                  <div className="relative">
                    <button
                        onClick={this.toggleFilterMenu}
                        className="w-10 h-10 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                    >
                        <i className="fas fa-filter"></i>
                    </button>

                    {this.state.showFilterMenu && (
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 p-2">
                        <button
                            onClick={() => this.handleFilterChange("semua")}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold ${
                            this.state.selectedFilter === "semua"
                                ? "bg-blue-50 text-[#002B5B]"
                                : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            Semua Laporan
                        </button>

                        <button
                            onClick={() => this.handleFilterChange("belum_diverifikasi")}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold ${
                            this.state.selectedFilter === "belum_diverifikasi"
                                ? "bg-blue-50 text-[#002B5B]"
                                : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            Belum Diverifikasi
                        </button>
                        </div>
                    )}
                    </div>
                  <button
                    onClick={this.handleExport}
                    className="w-10 h-10 bg-gray-100 rounded-xl"
                  >
                    <i className="fas fa-download"></i>
                  </button>
                </div>
              </div>

              {isLoading ? (
                <p className="text-gray-400 text-sm">Memuat laporan...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-gray-400 uppercase tracking-widest">
                        <th className="text-left py-4">ID</th>
                        <th className="text-left py-4">Nama Barang</th>
                        <th className="text-left py-4">Pelapor</th>
                        <th className="text-left py-4">Status</th>
                        <th className="text-left py-4">Tanggal</th>
                        <th className="text-left py-4">Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboardPaginatedReports.map((report) => {
                        const disabled = this.isFinalStatus(report);

                        return (
                          <tr
                            key={report.laporan_id}
                            className="border-t border-gray-50 hover:bg-gray-50 transition-all"
                          >
                            <td className="py-5 text-xs font-bold text-gray-400">
                              #IPB-{report.laporan_id}
                            </td>

                            <td className="py-5 font-bold text-[#002B5B]">
                              {report.item_name}
                            </td>

                            <td className="py-5 text-gray-500">
                              <span className="inline-block w-7 h-7 bg-gray-200 rounded-full mr-2 align-middle"></span>
                              {report.reporter}
                            </td>

                            <td className="py-5">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black ${this.getStatusClass(
                                  report.status_verifikasi
                                )}`}
                              >
                                {String(report.status_verifikasi || "-").replace("_", " ")}
                              </span>
                            </td>

                            <td className="py-5 text-gray-500">
                              {report.tanggal_kejadian}
                            </td>

                            <td className="py-5">
                              <button
                                disabled={disabled}
                                onClick={() =>
                                  this.openVerifyConfirm(report.laporan_id)
                                }
                                className={`px-4 py-2 rounded-lg text-xs font-bold mr-2 ${
                                  disabled
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-[#002B5B] text-white"
                                }`}
                              >
                                Setujui
                              </button>

                              <button
                                disabled={disabled}
                                onClick={() =>
                                  this.openDenyConfirm(report.laporan_id)
                                }
                                className={`px-4 py-2 rounded-lg text-xs font-bold mr-2 ${
                                  disabled
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-red-600 text-white"
                                }`}
                              >
                                Tolak
                              </button>

                              <button
                                onClick={() => this.handleOpenDetail(report)}
                                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {reports.length > dashboardReportsPerPage && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-8 text-xs text-gray-500">
                  <p>
                    Menampilkan{" "}
                    {reports.length === 0 ? 0 : dashboardStartIndex + 1}
                    -
                    {Math.min(
                      dashboardStartIndex + dashboardReportsPerPage,
                      reports.length
                    )}{" "}
                    dari {reports.length} laporan
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        this.setDashboardPage(
                          Math.max(1, safeDashboardPage - 1)
                        )
                      }
                      disabled={safeDashboardPage === 1}
                      className="w-9 h-9 rounded-xl border border-[#E7ECF3] bg-white text-[#163A70] font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FB] transition-all"
                    >
                      ‹
                    </button>

                    <span className="text-[11px] font-bold text-[#163A70] px-2">
                      {safeDashboardPage} / {totalDashboardPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        this.setDashboardPage(
                          Math.min(totalDashboardPages, safeDashboardPage + 1)
                        )
                      }
                      disabled={safeDashboardPage === totalDashboardPages}
                      className="w-9 h-9 rounded-xl border border-[#E7ECF3] bg-white text-[#163A70] font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FB] transition-all"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </section>

            <PageFooter />
          </main>
            {this.renderDetailModal()}
            {this.renderConfirmModal()}
            {this.renderHandoverModal()}
        </div>
      </div>
    );
  }
}

export default AdminDashboardPage;
