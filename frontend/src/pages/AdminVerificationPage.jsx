import React, { Component } from "react";
import { API_BASE_URL } from "../config/api";
import AdminSidebar from "../components/admin/AdminSidebar";
import PageHeader from "../components/PageHeader";
import PageFooter from "../components/PageFooter";
import AuthService from "../services/AuthService";
import AdminService from "../services/AdminService";
import BarangService from "../services/BarangService";
import ReportService from "../services/ReportService";
import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

class AdminVerificationPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      reports: [],
      filteredReports: [],
      pendingClaims: [],
      claimHistory: [],
      loading: true,
      claimsLoading: true,
      claimHistoryLoading: true,
      search: "",
      currentPage: 1,
      reportsPerPage: 6,
      claimHistoryCurrentPage: 1,
      claimHistoryPerPage: 10,
      activeVerificationView: "laporan",

      selectedFilter: "semua",
      selectedReportType: "semua",
      showFilterMenu: false,
      showExportMenu: false,

      selectedReport: null,
      showDetailModal: false,
      showImagePreview: false,

      showRejectModal: false,
      selectedReportId: null,
      rejectNote: "",
      errorReject: "",

      showApproveModal: false,
      selectedApproveId: null,
      processingVerification: false,
      handoverDocument: null,
      handoverVerification: null,
      showHandoverModal: false,
      handoverLoading: false,
      showClaimVerificationModal: false,
      selectedClaim: null,
      selectedClaimAction: "",
      showClaimActionConfirmModal: false,
      selectedClaimLostReport: null,
      selectedClaimItemDetail: null,
      claimDetailLoading: false,
      claimDetailError: "",
      claimActionLoading: false,
      showClaimHistoryDetailModal: false,
      selectedClaimHistory: null,
      selectedClaimHistoryLostReport: null,
      selectedClaimHistoryItemDetail: null,
      claimHistoryDetailLoading: false,
      claimHistoryDetailError: "",

      popup: {
        show: false,
        type: "",
        message: "",
      },

      isSidebarExpanded: getStoredSidebarExpanded(),
    };
  }

  async componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user || user.role !== "admin") {
      window.location.href = "/dashboard";
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    const reportType = params.get("type");

    await new Promise((resolve) =>
      this.setState(
        {
          activeVerificationView: view === "klaim" ? "klaim" : "laporan",
          selectedReportType: ["kehilangan", "penemuan"].includes(reportType)
            ? reportType
            : "semua",
        },
        resolve
      )
    );

    await Promise.all([
      this.fetchReports(),
      this.fetchPendingClaims(),
      this.fetchClaimHistory(),
    ]);

    window.addEventListener("focus", this.handleVerificationFocus);
  }

  componentWillUnmount() {
    window.removeEventListener("focus", this.handleVerificationFocus);
  }

  handleVerificationFocus = () => {
    this.fetchReports();
    this.fetchPendingClaims();
    this.fetchClaimHistory();
  };

  toggleSidebar = () => {
    this.setState((prev) => {
      const expanded = !prev.isSidebarExpanded;
      setStoredSidebarExpanded(expanded);

      return {
        isSidebarExpanded: expanded,
      };
    });
  };

  goToUserMode = () => {
    if (this.props.navigate) {
      this.props.navigate("/dashboard");
    } else {
      window.location.href = "/dashboard";
    }
  };

  toggleFilterMenu = () => {
    this.setState({
        showFilterMenu: !this.state.showFilterMenu,
    });
    };

  getFilteredReports(reports, search, statusFilter, reportTypeFilter) {
    const query = (search || "").toLowerCase();

    let filtered = [...reports];

    if (statusFilter !== "semua") {
      filtered = filtered.filter(
        (item) => item.status_verifikasi === statusFilter
      );
    }

    if (reportTypeFilter !== "semua") {
      filtered = filtered.filter(
        (item) => item.jenis_laporan === reportTypeFilter
      );
    }

    if (query) {
      filtered = filtered.filter((item) =>
        item.nama_barang
            ?.toLowerCase()
            .includes(query) ||
        item.pelapor
            ?.toLowerCase()
            .includes(query) ||
        item.kategori
            ?.toLowerCase()
            .includes(query) ||
        item.lokasi
            ?.toLowerCase()
            .includes(query)
      );
    }

    return filtered;
  }

    handleFilterChange = (filter) => {
    const filtered = this.getFilteredReports(
      this.state.reports,
      this.state.search,
      filter,
      this.state.selectedReportType
    );

    this.setState({
        selectedFilter: filter,
        filteredReports: filtered,
        showFilterMenu: false,
        currentPage: 1,
    });
    };

  handleReportTypeChange = (reportType) => {
    const filtered = this.getFilteredReports(
      this.state.reports,
      this.state.search,
      this.state.selectedFilter,
      reportType
    );

    this.setState({
      selectedReportType: reportType,
      filteredReports: filtered,
      currentPage: 1,
    });
  };

  fetchReports = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/admin/laporan`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      const reports = Array.isArray(data) ? data : [];

      this.setState({
        reports,
        filteredReports: this.getFilteredReports(
          reports,
          this.state.search,
          this.state.selectedFilter,
          this.state.selectedReportType
        ),
        currentPage: 1,
        loading: false,
      });
    } catch (error) {
      console.log(error);

      this.setState({
        loading: false,
      });
    }
  };

    handleSearch = (e) => {
    const value = e.target.value;

    const filtered = this.getFilteredReports(
      this.state.reports,
      value,
      this.state.selectedFilter,
      this.state.selectedReportType
    );

    this.setState({
      search: value,
      filteredReports: filtered,
      currentPage: 1,
    });
    };

  showPopup = (type, message) => {
    this.setState({
      popup: {
        show: true,
        type,
        message,
      },
    });

    setTimeout(() => {
      this.setState({
        popup: {
          show: false,
          type: "",
          message: "",
        },
      });
    }, 3000);
  };

  fetchClaimHistory = async () => {
    this.setState({ claimHistoryLoading: true });

    try {
      const data = await AdminService.getClaimHistory();

      this.setState({
        claimHistory: Array.isArray(data) ? data : [],
        claimHistoryLoading: false,
      });
    } catch (error) {
      console.log(error);

      this.setState({
        claimHistory: [],
        claimHistoryLoading: false,
      });
    }
  }

  hasAcceptedClaimForBarang(barangId, currentKlaimId = null) {
    return this.state.claimHistory.some((item) => {
      return (
        String(item.barang_id) === String(barangId) &&
        String(item.klaim_id) !== String(currentKlaimId) &&
        (item.status_klaim || "").toLowerCase() === "diterima"
      );
    });
  }

  toggleExportMenu = () => {
    this.setState((prevState) => ({
      showExportMenu: !prevState.showExportMenu,
    }));
  };

  handleVerificationViewChange = (event) => {
    this.setState({
      activeVerificationView: event.target.value,
      showExportMenu: false,
    });
  };

  handleActiveViewExport = () => {
    if (this.state.activeVerificationView === "klaim") {
      this.handleDownloadClaimsCsv();
      return;
    }

    this.toggleExportMenu();
  };

  handleExportSelection = (exportType) => {
    this.setState({ showExportMenu: false }, () => {
      if (exportType.startsWith("laporan:")) {
        const [, reportType, status] = exportType.split(":");
        this.handleDownloadReportsCsv({ reportType, status });
      }

      if (exportType === "klaim") {
        this.handleDownloadClaimsCsv();
      }
    });
  };

  formatCsvValue = (value) => {
    if (value === null || value === undefined) return "";

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return String(value).replace(/\s+/g, " ").trim();
  };

  downloadCsv = (filename, columns, rows) => {
    if (!rows || rows.length === 0) {
      this.showPopup("error", "Tidak ada data untuk diunduh");
      return;
    }

    const delimiter = ";";
    const header = columns.map((column) => column.label).join(delimiter);
    const body = rows.map((row) =>
      columns
        .map((column) => {
          const rawValue =
            typeof column.value === "function"
              ? column.value(row)
              : row[column.value];
          const value = this.formatCsvValue(rawValue);

          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(delimiter)
    );
    const csv = ["\uFEFF" + header, ...body].join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  getReportExportLabel(reportType, status) {
    const reportLabels = {
      penemuan: "penemuan",
      kehilangan: "kehilangan",
    };

    return reportLabels[reportType] || "semua";
  }

  handleDownloadReportsCsv = ({ reportType = "semua", status = "semua" } = {}) => {
    const sourceReports = Array.isArray(this.state.reports)
      ? this.state.reports
      : [];
    const filteredReports = sourceReports.filter((report) => {
      const matchesType =
        reportType === "semua" || report.jenis_laporan === reportType;
      const matchesStatus =
        status === "semua" || report.status_verifikasi === status;

      return matchesType && matchesStatus;
    });
    const orderedReports = [
      ...filteredReports.filter(
        (report) => report.status_verifikasi === "belum_diverifikasi"
      ),
      ...filteredReports.filter(
        (report) => report.status_verifikasi !== "belum_diverifikasi"
      ),
    ];
    const fileLabel = this.getReportExportLabel(reportType, status);

    this.downloadCsv(
      `verifikasi-laporan-${fileLabel}-nemuipb.csv`,
      [
        { label: "ID Laporan", value: "laporan_id" },
        { label: "Nama Barang", value: "nama_barang" },
        { label: "Pelapor", value: "pelapor" },
        { label: "Email", value: "email" },
        { label: "Jenis Laporan", value: "jenis_laporan" },
        { label: "Status Verifikasi", value: "status_verifikasi" },
        { label: "Status Laporan", value: "status_laporan" },
        { label: "Kategori", value: "kategori" },
        { label: "Lokasi", value: "lokasi" },
        { label: "Tanggal Kejadian", value: "tanggal_kejadian" },
        { label: "Status Barang", value: "status_barang" },
        { label: "Catatan Admin", value: "catatan_verifikasi" },
        {
          label: "Tanggal Diverifikasi/Ditolak",
          value: (report) =>
            ["terverifikasi", "ditolak"].includes(report.status_verifikasi)
              ? report.tanggal_verifikasi
              : "",
        },
      ],
      orderedReports
    );
  };

  handleDownloadClaimsCsv = () => {
    const claimHistory = Array.isArray(this.state.claimHistory)
      ? [...this.state.claimHistory]
      : [];

    this.downloadCsv(
      "histori-klaim-barang-nemuipb.csv",
      [
        { label: "ID Klaim", value: "klaim_id" },
        { label: "Nama Barang", value: "nama_barang" },
        { label: "Pengklaim", value: "pengklaim" },
        { label: "Email", value: "email" },
        { label: "ID Barang", value: "barang_id" },
        { label: "ID Laporan Kehilangan", value: "laporan_kehilangan_id" },
        { label: "Kategori", value: "kategori" },
        { label: "Lokasi Barang", value: "lokasi" },
        { label: "Status Klaim", value: "status_klaim" },
        { label: "Tanggal Pengajuan", value: "created_time" },
        { label: "Tanggal Verifikasi", value: "claim_verified_at" },
        { label: "Catatan Admin", value: "catatan_admin" },
      ],
      claimHistory
    );
  };

  fetchPendingClaims = async () => {
    this.setState({ claimsLoading: true });

    try {
      const data = await AdminService.getPendingClaims();

      this.setState({
        pendingClaims: Array.isArray(data) ? data : [],
        claimsLoading: false,
      });
    } catch (error) {
      console.log(error);

      this.setState({
        pendingClaims: [],
        claimsLoading: false,
      });
    }
  };

  handleClaimVerification = async (claim, statusKlaim) => {
    const isAccepted = statusKlaim === "diterima";
    const catatanAdmin = isAccepted
      ? "Klaim diterima admin. Kode pickup dibuat otomatis oleh sistem."
      : "Klaim ditolak admin.";

    if (
      isAccepted &&
      this.hasAcceptedClaimForBarang(claim.barang_id, claim.klaim_id)
    ) {
      this.showPopup(
        "error",
        "Barang ini sudah pernah diverifikasi klaim barang ke orang lain."
      );
      return;
    }

    try {
      this.setState({ claimActionLoading: true });

      await AdminService.verifyClaim(
        claim.klaim_id,
        statusKlaim,
        catatanAdmin
      );
      await Promise.all([
        this.fetchPendingClaims(),
        this.fetchClaimHistory(),
      ]);

      this.setState({
        claimHistoryCurrentPage: 1,
        claimActionLoading: false,
      });

      this.showPopup(
        isAccepted ? "success" : "error",
        isAccepted
          ? "Klaim diterima. Kode pickup berhasil dibuat untuk user."
          : "Klaim berhasil ditolak"
      );
    } catch (error) {
      console.log(error);

      this.setState({ claimActionLoading: false });

      const message =
        error.message === "Failed to fetch"
          ? "Gagal menghubungi server. Pastikan koneksi backend tersedia, lalu coba lagi."
          : error.message || "Gagal memverifikasi klaim";

      this.showPopup(
        "error",
        message
      );
    }
  };

  openClaimVerificationModal = async (claim, action) => {
    this.setState({
      showClaimVerificationModal: true,
      selectedClaim: claim,
      selectedClaimAction: action || "",
      showClaimActionConfirmModal: false,
      selectedClaimLostReport: null,
      selectedClaimItemDetail: null,
      claimDetailLoading: true,
      claimDetailError: "",
      claimActionLoading: false,
    });

    try {
      const [lostReportResult, itemResult] = await Promise.allSettled([
        ReportService.getReportDetail(claim.laporan_kehilangan_id),
        BarangService.getDetailBarang(claim.barang_id),
      ]);

      this.setState({
        selectedClaimLostReport:
          lostReportResult.status === "fulfilled" ? lostReportResult.value : null,
        selectedClaimItemDetail:
          itemResult.status === "fulfilled" ? itemResult.value : null,
        claimDetailLoading: false,
        claimDetailError:
          lostReportResult.status === "rejected" ||
          itemResult.status === "rejected"
            ? "Sebagian detail gagal dimuat. Data dasar klaim tetap ditampilkan."
            : "",
      });
    } catch (error) {
      this.setState({
        claimDetailLoading: false,
        claimDetailError:
          error.message || "Detail klaim gagal dimuat. Data dasar klaim tetap ditampilkan.",
      });
    }
  };

  closeClaimVerificationModal = () => {
    this.setState({
      showClaimVerificationModal: false,
      selectedClaim: null,
      selectedClaimAction: "",
      showClaimActionConfirmModal: false,
      selectedClaimLostReport: null,
      selectedClaimItemDetail: null,
      claimDetailLoading: false,
      claimDetailError: "",
      claimActionLoading: false,
    });
  };

  confirmClaimVerification = async () => {
    const { selectedClaim, selectedClaimAction } = this.state;

    if (!selectedClaim || !selectedClaimAction) return;

    await this.handleClaimVerification(selectedClaim, selectedClaimAction);
    this.setState({ showClaimActionConfirmModal: false }, () => {
      this.closeClaimVerificationModal();
    });
  };

  openClaimActionConfirmModal = (action) => {
    if (
      action === "diterima" &&
      this.state.selectedClaim &&
      this.hasAcceptedClaimForBarang(
        this.state.selectedClaim.barang_id,
        this.state.selectedClaim.klaim_id
      )
    ) {
      this.showPopup(
        "error",
        "Barang ini sudah pernah diverifikasi klaim barang ke orang lain."
      );
      return;
    }

    this.setState({
      selectedClaimAction: action,
      showClaimActionConfirmModal: true,
    });
  };

  closeClaimActionConfirmModal = () => {
    this.setState({
      showClaimActionConfirmModal: false,
    });
  };

  openClaimHistoryDetailModal = async (report) => {
    const laporanId = report.laporan_kehilangan_id || report.laporan_id;

    this.setState({
      showClaimHistoryDetailModal: true,
      selectedClaimHistory: report,
      selectedClaimHistoryLostReport: null,
      selectedClaimHistoryItemDetail: null,
      claimHistoryDetailLoading: true,
      claimHistoryDetailError: "",
    });

    try {
      const [reportDetailResult, itemDetailResult] = await Promise.allSettled([
        ReportService.getReportDetail(laporanId),
        BarangService.getDetailBarang(report.barang_id),
      ]);

      this.setState({
        selectedClaimHistoryLostReport:
          reportDetailResult.status === "fulfilled"
            ? reportDetailResult.value
            : null,
        selectedClaimHistoryItemDetail:
          itemDetailResult.status === "fulfilled"
            ? itemDetailResult.value
            : null,
        claimHistoryDetailLoading: false,
        claimHistoryDetailError:
          reportDetailResult.status === "rejected" ||
          itemDetailResult.status === "rejected"
            ? "Sebagian detail gagal dimuat. Data dasar histori tetap ditampilkan."
            : "",
      });
    } catch (error) {
      this.setState({
        claimHistoryDetailLoading: false,
        claimHistoryDetailError:
          error.message || "Detail laporan kehilangan gagal dimuat.",
      });
    }
  };

  closeClaimHistoryDetailModal = () => {
    this.setState({
      showClaimHistoryDetailModal: false,
      selectedClaimHistory: null,
      selectedClaimHistoryLostReport: null,
      selectedClaimHistoryItemDetail: null,
      claimHistoryDetailLoading: false,
      claimHistoryDetailError: "",
    });
  };

  closeHandoverModal = () => {
    this.setState({
      handoverDocument: null,
      handoverVerification: null,
      showHandoverModal: false,
      handoverLoading: false,
    });
  };

  getReportTypeMeta(jenisLaporan) {
    const isFound = jenisLaporan === "penemuan";

    return {
      label: isFound ? "Ditemukan" : "Hilang",
      icon: isFound ? "fa-search-location" : "fa-exclamation-circle",
      badgeClass: isFound
        ? "bg-[#E8F7FA] text-[#006D8F] border-[#B9E7EF]"
        : "bg-[#EEF4FF] text-[#163A70] border-[#CFE0F7]",
      imageClass: isFound
        ? "bg-[#006D8F] text-white"
        : "bg-[#163A70] text-white",
      cardAccentClass: isFound
        ? "border-l-4 border-l-[#006D8F]"
        : "border-l-4 border-l-[#163A70]",
    };
  }

  getImageSrc(dokumentasi) {
    if (!dokumentasi) return "/images/no-image.png";
    if (dokumentasi.startsWith("data:image/")) return dokumentasi;
    if (dokumentasi.startsWith("http")) return dokumentasi;
    if (dokumentasi.startsWith("/")) return dokumentasi;

    return `/images/${dokumentasi}`;
  }

  setPage = (page) => {
    this.setState({
      currentPage: page,
    });
  };

  setClaimHistoryPage = (page) => {
    this.setState({
      claimHistoryCurrentPage: page,
    });
  };

  openDetailModal = (report) => {
    this.setState({
      selectedReport: report,
      showDetailModal: true,
      showImagePreview: false,
    });
  };

  closeDetailModal = () => {
    this.setState({
      selectedReport: null,
      showDetailModal: false,
      showImagePreview: false,
    });
  };

  openImagePreview = () => {
    this.setState({
      showImagePreview: true,
    });
  };

  closeImagePreview = () => {
    this.setState({
      showImagePreview: false,
    });
  };

  openRejectModal = (id) => {
    this.setState({
      showRejectModal: true,
      selectedReportId: id,
      rejectNote: "",
      errorReject: "",
    });
  };

  closeRejectModal = () => {
    this.setState({
      showRejectModal: false,
      selectedReportId: null,
      rejectNote: "",
      errorReject: "",
    });
  };

  openApproveModal = (id) => {
    this.setState({
      showApproveModal: true,
      selectedApproveId: id,
    });
  };

  closeApproveModal = () => {
    this.setState({
      showApproveModal: false,
      selectedApproveId: null,
    });
  };

  handleApprove = async (id) => {
    if (this.state.processingVerification) return;

    try {
      this.setState({ processingVerification: true });

      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/admin/laporan/${id}/setujui`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            catatan_verifikasi: "Laporan diverifikasi admin",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal memverifikasi laporan");
      }

      const updated = this.state.reports.map((item) => {
        if (item.laporan_id === id) {
          return {
            ...item,
            status_verifikasi: "terverifikasi",
          };
        }

        return item;
      });

      this.setState({
        reports: updated,
        filteredReports: updated,
      });

      this.closeApproveModal();
      this.closeDetailModal();

      this.showPopup(
        "success",
        "Laporan berhasil diverifikasi"
      );
    } catch (error) {
      console.log(error);

      this.showPopup(
        "error",
        "Gagal memverifikasi laporan"
      );
    } finally {
      this.setState({ processingVerification: false });
    }
  };

  handleReject = async () => {
    const {
      rejectNote,
      selectedReportId,
      processingVerification,
    } = this.state;

    if (processingVerification) return;

    if (!rejectNote.trim()) {
      this.setState({
        errorReject:
          "Catatan penolakan wajib diisi",
      });

      return;
    }

    try {
      this.setState({ processingVerification: true });

      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/admin/laporan/${selectedReportId}/tolak`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            catatan_verifikasi: rejectNote,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal menolak laporan");
      }

      const updated = this.state.reports.map((item) => {
        if (item.laporan_id === selectedReportId) {
          return {
            ...item,
            status_verifikasi: "ditolak",
            catatan_verifikasi: rejectNote,
          };
        }

        return item;
      });

      this.setState({
        reports: updated,
        filteredReports: updated,
      });

      this.closeRejectModal();
      this.closeDetailModal();

      this.showPopup(
        "error",
        "Laporan berhasil ditolak"
      );
    } catch (error) {
      console.log(error);

      this.showPopup(
        "error",
        "Gagal menolak laporan"
      );
    } finally {
      this.setState({ processingVerification: false });
    }
  };

  renderApproveModal() {
    const { showApproveModal, processingVerification } = this.state;

    if (!showApproveModal) return null;

    return (
      <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center px-4 py-6">
        <div className="bg-white rounded-[20px] w-full max-w-sm px-6 pt-9 pb-6 text-center shadow-2xl relative">
          <button
            type="button"
            onClick={this.closeApproveModal}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
          >
            <i className="fas fa-times text-sm"></i>
          </button>

          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-[#FFD75A] text-white flex items-center justify-center text-2xl font-black">
            ?
          </div>

          <h2 className="text-2xl font-extrabold text-black mb-3">
            Verifikasi Laporan?
          </h2>

          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Laporan yang disetujui tidak dapat diubah.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={this.closeApproveModal}
              className="py-3 rounded-xl bg-[#E8EEF5] text-[#002B5B] font-extrabold text-sm"
            >
              Tidak
            </button>

            <button
              onClick={() =>
                this.handleApprove(this.state.selectedApproveId)
              }
              disabled={processingVerification}
              className={`py-3 rounded-xl text-white font-extrabold text-sm ${
                processingVerification
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#002B5B]"
              }`}
            >
              {processingVerification ? "Memproses..." : "Ya"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderRejectModal() {
    const {
      showRejectModal,
      rejectNote,
      errorReject,
      processingVerification,
    } = this.state;

    if (!showRejectModal) return null;

    return (
      <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center px-4 py-6">
        <div className="bg-white rounded-[20px] w-full max-w-sm px-6 pt-9 pb-6 text-center shadow-2xl relative">
          <button
            type="button"
            onClick={this.closeRejectModal}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
          >
            <i className="fas fa-times text-sm"></i>
          </button>

          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-[#FFD75A] text-white flex items-center justify-center text-2xl font-black">
            ?
          </div>

          <h2 className="text-2xl font-extrabold text-black mb-3">
            Tolak Laporan?
          </h2>

          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            Laporan yang ditolak tidak dapat diubah.
          </p>

          <div className="mb-5 text-left">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Catatan Penolakan
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) =>
                this.setState({
                  rejectNote: e.target.value,
                  errorReject: "",
                })
              }
              rows={3}
              placeholder="Tulis alasan penolakan di sini"
              className={`w-full rounded-2xl border bg-[#F8FAFC] px-4 py-3 text-sm text-[#002B5B] outline-none resize-none focus:border-[#163A70] ${
                errorReject ? "border-red-400" : "border-[#E7ECF3]"
              }`}
            />

            {errorReject && (
              <p className="mt-2 text-xs font-bold text-red-500">
                {errorReject}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={this.closeRejectModal}
              className="py-3 rounded-xl bg-[#E8EEF5] text-[#002B5B] font-extrabold text-sm"
            >
              Tidak
            </button>

            <button
              onClick={this.handleReject}
              disabled={processingVerification}
              className={`py-3 rounded-xl text-white font-extrabold text-sm ${
                processingVerification
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#D92D20]"
              }`}
            >
              {processingVerification ? "Memproses..." : "Ya, Tolak"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderClaimVerificationModal() {
    const {
      showClaimVerificationModal,
      selectedClaim,
      selectedClaimLostReport,
      selectedClaimItemDetail,
      claimDetailLoading,
      claimDetailError,
      claimActionLoading,
    } = this.state;

    if (!showClaimVerificationModal || !selectedClaim) return null;

    const lostReportItem = selectedClaimLostReport?.barang || {};
    const claimedItem = selectedClaimItemDetail || selectedClaim;
    const claimedItemImage = this.getImageSrc(
      claimedItem.dokumentasi || selectedClaim.dokumentasi
    );
    const lostReportImage = this.getImageSrc(
      lostReportItem.dokumentasi ||
        selectedClaimLostReport?.dokumentasi ||
        selectedClaimLostReport?.barang?.dokumentasi
    );
    const submittedAt = selectedClaim.created_time
      ? new Date(selectedClaim.created_time).toLocaleString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 py-6">
        <div className="bg-white rounded-[28px] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Verifikasi Klaim #{selectedClaim.klaim_id}
              </p>
              <h2 className="text-2xl font-extrabold text-[#102348]">
                Detail Klaim Barang
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Periksa barang yang diklaim dan laporan kehilangan sebelum memutuskan tindakan.
              </p>
            </div>

            <button
              type="button"
              onClick={this.closeClaimVerificationModal}
              className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Tutup verifikasi klaim"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {claimDetailLoading && (
            <div className="bg-blue-50 text-[#2563EB] rounded-2xl px-4 py-3 text-sm font-semibold mb-4">
              Memuat detail klaim...
            </div>
          )}

          {claimDetailError && (
            <div className="bg-yellow-50 text-yellow-700 rounded-2xl px-4 py-3 text-sm font-semibold mb-4">
              {claimDetailError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="border border-[#E7ECF3] rounded-2xl p-5">
              <h3 className="text-lg font-extrabold text-[#163A70] mb-4">
                Detail Barang yang Diklaim
              </h3>

              <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  <img
                    src={claimedItemImage}
                    alt={claimedItem.nama_barang || "Barang yang diklaim"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Nama Barang
                  </p>
                  <p className="font-bold text-[#102348]">
                    {claimedItem.nama_barang || selectedClaim.nama_barang || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      ID Barang
                    </p>
                    <p className="font-semibold text-gray-600">
                      #IPB-{selectedClaim.barang_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Status
                    </p>
                    <p className="font-semibold text-gray-600">
                      {claimedItem.status_barang || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Kategori
                    </p>
                    <p className="font-semibold text-gray-600">
                      {claimedItem.kategori || selectedClaim.kategori || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Lokasi
                    </p>
                    <p className="font-semibold text-gray-600">
                      {claimedItem.lokasi || selectedClaim.lokasi || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Tanggal Penemuan
                    </p>
                    <p className="font-semibold text-gray-600">
                      {claimedItem.tanggal_kejadian ||
                        selectedClaim.tanggal_kejadian ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Deskripsi Barang Penemuan
                    </p>
                    <p className="font-semibold text-gray-600">
                      {claimedItem.deskripsi ||
                        selectedClaim.deskripsi ||
                        "Tidak ada deskripsi."}
                    </p>
                  </div>
                </div>

              </div>
            </section>

            <section className="border border-[#E7ECF3] rounded-2xl p-5">
              <h3 className="text-lg font-extrabold text-[#163A70] mb-4">
                Detail Laporan Kehilangan User
              </h3>

              <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  <img
                    src={lostReportImage}
                    alt={lostReportItem.nama_barang || "Laporan kehilangan"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Laporan Kehilangan
                  </p>
                  <p className="font-bold text-[#102348]">
                    #{selectedClaim.laporan_kehilangan_id} - {lostReportItem.nama_barang || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Pelapor
                    </p>
                    <p className="font-semibold text-gray-600">
                      {selectedClaimLostReport?.pelapor || selectedClaim.pengklaim || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Email
                    </p>
                    <p className="font-semibold text-gray-600 break-all">
                      {selectedClaimLostReport?.email || selectedClaim.email || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Kategori
                    </p>
                    <p className="font-semibold text-gray-600">
                      {lostReportItem.kategori || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Tanggal Kehilangan
                    </p>
                    <p className="font-semibold text-gray-600">
                      {lostReportItem.tanggal_kejadian || "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Lokasi Kehilangan
                  </p>
                  <p className="font-semibold text-gray-600">
                    {lostReportItem.lokasi || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Deskripsi Laporan
                  </p>
                  <p className="font-semibold text-gray-600">
                    {lostReportItem.deskripsi || "Tidak ada deskripsi."}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-4 bg-[#F8FAFC] rounded-2xl px-4 py-3 text-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
              Pengajuan Klaim
            </p>
            <p className="text-gray-600 font-semibold">
              {selectedClaim.pengklaim || "-"} mengajukan klaim pada {submittedAt}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={this.closeClaimVerificationModal}
              className="px-5 py-3 rounded-xl bg-[#EEF2F7] text-[#163A70] text-sm font-bold"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={() => this.openClaimActionConfirmModal("ditolak")}
              disabled={claimActionLoading}
              className="px-5 py-3 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
            >
              {claimActionLoading ? "Memproses..." : "Tolak Klaim"}
            </button>

            <button
              type="button"
              onClick={() => this.openClaimActionConfirmModal("diterima")}
              disabled={claimActionLoading}
              className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#163A70] hover:bg-[#102348] transition-all disabled:bg-gray-300 cursor-pointer disabled:cursor-not-allowed"
            >
              {claimActionLoading ? "Memproses..." : "Verifikasi Klaim"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderClaimActionConfirmModal() {
    const {
      showClaimActionConfirmModal,
      selectedClaimAction,
      selectedClaim,
      claimActionLoading,
    } = this.state;

    if (!showClaimActionConfirmModal || !selectedClaim) return null;

    const isAccepted = selectedClaimAction === "diterima";

    return (
      <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center px-4">
        <div className="bg-white rounded-[24px] w-full max-w-sm p-6 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#EEF4FF] flex items-center justify-center">
            <i
              className={`fas ${
                isAccepted ? "fa-check text-[#163A70]" : "fa-times text-red-600"
              } text-xl`}
            ></i>
          </div>

          <h2 className="text-xl font-extrabold text-[#102348] mb-2">
            {isAccepted ? "Verifikasi klaim ini?" : "Tolak klaim ini?"}
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {isAccepted
              ? "Klaim yang diverifikasi akan diterima dan diproses ke langkah berikutnya."
              : "Klaim yang ditolak akan dicatat sebagai histori penolakan admin."}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={this.closeClaimActionConfirmModal}
              className="py-3 rounded-xl bg-[#EEF2F7] text-[#163A70] text-sm font-bold"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={this.confirmClaimVerification}
              disabled={claimActionLoading}
              className={`py-3 rounded-xl text-white text-sm font-bold ${
                claimActionLoading
                  ? "bg-gray-300 cursor-not-allowed"
                  : isAccepted
                  ? "bg-[#163A70]"
                  : "bg-red-600"
              }`}
            >
              {claimActionLoading
                ? "Memproses..."
                : isAccepted
                ? "Ya, Verifikasi"
                : "Ya, Tolak"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderClaimHistoryDetailModal() {
    const {
      showClaimHistoryDetailModal,
      selectedClaimHistory,
      selectedClaimHistoryLostReport,
      selectedClaimHistoryItemDetail,
      claimHistoryDetailLoading,
      claimHistoryDetailError,
    } = this.state;

    if (!showClaimHistoryDetailModal || !selectedClaimHistory) return null;

    const lostReportItem =
      selectedClaimHistoryLostReport?.barang ||
      selectedClaimHistory.laporan_detail?.barang ||
      selectedClaimHistory;
    const claimedItem =
      selectedClaimHistoryItemDetail ||
      selectedClaimHistory.barang_detail ||
      selectedClaimHistory.item_detail ||
      selectedClaimHistory;
    const claimedItemImage = this.getImageSrc(
      claimedItem.dokumentasi ||
        selectedClaimHistoryItemDetail?.dokumentasi ||
        selectedClaimHistory.dokumentasi
    );
    const lostReportImage = this.getImageSrc(
      lostReportItem.dokumentasi ||
        selectedClaimHistoryLostReport?.dokumentasi ||
        selectedClaimHistoryLostReport?.barang?.dokumentasi
    );
    const isComplete = ["selesai", "dikembalikan"].includes(
      selectedClaimHistory.status_laporan
    ) || selectedClaimHistory.status_barang === "selesai";
    const claimStatusLabel =
      selectedClaimHistory.status_klaim === "ditolak"
        ? "Ditolak"
        : isComplete
        ? "Selesai"
        : "Diterima";
    const submittedAt = selectedClaimHistory.created_time
      ? new Date(selectedClaimHistory.created_time).toLocaleString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 py-6">
        <div className="bg-white rounded-[28px] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Histori Klaim
              </p>
              <h2 className="text-2xl font-extrabold text-[#102348]">
                {selectedClaimHistory.nama_barang || selectedClaimHistory.item_name || "-"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Periksa barang yang diklaim dan laporan kehilangan sebelum membuat keputusan.
              </p>
            </div>

            <button
              type="button"
              onClick={this.closeClaimHistoryDetailModal}
              className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Tutup detail histori klaim"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {claimHistoryDetailLoading && (
            <div className="bg-blue-50 text-[#2563EB] rounded-2xl px-4 py-3 text-sm font-semibold mb-4">
              Memuat detail klaim...
            </div>
          )}

          {claimHistoryDetailError && (
            <div className="bg-yellow-50 text-yellow-700 rounded-2xl px-4 py-3 text-sm font-semibold mb-4">
              {claimHistoryDetailError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="border border-[#E7ECF3] rounded-2xl p-5">
              <h3 className="text-lg font-extrabold text-[#163A70] mb-4">
                Detail Barang yang Diklaim
              </h3>

              <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  <img
                    src={claimedItemImage}
                    alt={claimedItem.nama_barang || "Barang yang diklaim"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Nama Barang
                  </p>
                  <p className="font-bold text-[#102348]">
                    {claimedItem.nama_barang || claimedItem.item_name || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      ID Barang
                    </p>
                    <p className="font-semibold text-gray-600">
                      #IPB-{claimedItem.barang_id || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Status
                    </p>
                    <p className="font-semibold text-gray-600">
                      {claimedItem.status_barang || claimStatusLabel || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Kategori
                    </p>
                    <p className="font-semibold text-gray-600">
                      {claimedItem.kategori || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Lokasi
                    </p>
                    <p className="font-semibold text-gray-600">
                      {claimedItem.lokasi || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Tanggal Penemuan
                    </p>
                    <p className="font-semibold text-gray-600">
                      {claimedItem.tanggal_kejadian || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Deskripsi Barang Penemuan
                    </p>
                    <p className="font-semibold text-gray-600">
                      {claimedItem.deskripsi || "Tidak ada deskripsi."}
                    </p>
                  </div>
                </div>

              </div>
            </section>

            <section className="border border-[#E7ECF3] rounded-2xl p-5">
              <h3 className="text-lg font-extrabold text-[#163A70] mb-4">
                Detail Laporan Kehilangan User
              </h3>

              <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  <img
                    src={lostReportImage}
                    alt={lostReportItem.nama_barang || "Laporan kehilangan"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Laporan Kehilangan
                  </p>
                  <p className="font-bold text-[#102348]">
                    #{selectedClaimHistory.laporan_kehilangan_id ||
                      selectedClaimHistory.laporan_id ||
                      "-"} - {lostReportItem.nama_barang || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Pelapor
                    </p>
                    <p className="font-semibold text-gray-600">
                      {selectedClaimHistoryLostReport?.pelapor ||
                        selectedClaimHistory.pengklaim ||
                        selectedClaimHistory.pelapor ||
                        selectedClaimHistory.reporter ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Email
                    </p>
                    <p className="font-semibold text-gray-600 break-all">
                      {selectedClaimHistoryLostReport?.email ||
                        selectedClaimHistory.email ||
                        "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Kategori
                    </p>
                    <p className="font-semibold text-gray-600">
                      {lostReportItem.kategori || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Tanggal Kehilangan
                    </p>
                    <p className="font-semibold text-gray-600">
                      {lostReportItem.tanggal_kejadian || "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Lokasi Kehilangan
                  </p>
                  <p className="font-semibold text-gray-600">
                    {lostReportItem.lokasi || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Deskripsi Laporan
                  </p>
                  <p className="font-semibold text-gray-600">
                    {lostReportItem.deskripsi || "Tidak ada deskripsi."}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-4 bg-[#F8FAFC] rounded-2xl px-4 py-3 text-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
              Pengajuan Klaim
            </p>
            <p className="text-gray-600 font-semibold">
              {selectedClaimHistory.pengklaim ||
                selectedClaimHistory.pelapor ||
                selectedClaimHistory.reporter ||
                "-"} mengajukan klaim pada {submittedAt}. Status klaim: {claimStatusLabel}.
            </p>
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
    } = this.state;

    if (!showHandoverModal && !handoverLoading) return null;

    const signatureValid = handoverVerification?.valid;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-6">
        <div className="bg-white rounded-[28px] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-[#EEF2F6] px-6 py-5 flex items-center justify-between rounded-t-[28px]">
            <div>
              <h2 className="text-2xl font-extrabold text-[#102348]">
                Serah Terima & Tanda Tangan Digital
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Dokumen dibuat otomatis setelah kode pickup diverifikasi admin.
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
              Membuat dan memverifikasi dokumen serah terima...
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

                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#102348] font-['Plus_Jakarta_Sans']">
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

                  <div className="bg-white rounded-2xl border border-[#E7ECF3] p-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Hash Dokumen
                    </p>
                    <p className="break-all text-xs font-bold text-[#2563EB] leading-relaxed">
                      {handoverDocument?.dokumen_hash || "-"}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E7ECF3] p-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Tanda Tangan Digital
                    </p>
                    <p className="break-all text-[10px] text-gray-500 leading-relaxed max-h-28 overflow-y-auto">
                      {handoverDocument?.digital_signature || "-"}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E7ECF3] p-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Kunci Publik
                    </p>
                    <pre className="whitespace-pre-wrap break-all text-[10px] text-gray-500 leading-relaxed max-h-32 overflow-y-auto">
                      {handoverDocument?.public_key || "-"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  renderDetailModal() {
    const {
      selectedReport,
      showDetailModal,
      processingVerification,
    } = this.state;

    if (!showDetailModal || !selectedReport)
      return null;

    const isDisabled =
      selectedReport.status_verifikasi !==
      "belum_diverifikasi";
    const actionDisabled = isDisabled || processingVerification;
    const reportType = this.getReportTypeMeta(selectedReport.jenis_laporan);
    const reportDateLabel =
      selectedReport.jenis_laporan === "penemuan"
        ? "Tanggal Penemuan"
        : "Tanggal Kehilangan";
    const submittedDate = selectedReport.created_time
      ? new Date(selectedReport.created_time).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "-";
    const imageSrc = this.getImageSrc(selectedReport.dokumentasi);

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 py-4">
        <div className="bg-white rounded-[24px] w-full max-w-[940px] relative max-h-[calc(100vh-32px)] overflow-hidden shadow-2xl">
          <button
            type="button"
            onClick={this.closeDetailModal}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/95 border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
            aria-label="Tutup detail laporan"
          >
            x
          </button>

          <div className="flex flex-col md:flex-row max-h-[calc(100vh-32px)] overflow-hidden">
            <div className="w-full md:w-[34%] bg-gray-50 flex items-center justify-center overflow-hidden h-52 md:h-auto">
              <button
                type="button"
                onClick={this.openImagePreview}
                className="relative w-full h-full cursor-zoom-in"
                aria-label="Perbesar foto barang"
              >
                <span className="absolute top-4 left-4 bg-[#006D8F] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase">
                  {selectedReport.status_barang || "status"}
                </span>

                <img
                  src={imageSrc}
                  alt={selectedReport.nama_barang}
                  className="w-full h-full object-cover"
                />
              </button>
            </div>

            <div className="flex-1 p-5 pr-14 md:p-7 md:pr-16 flex flex-col gap-3 min-w-0">
              <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start">
                <div>
                  <p className="text-[#9A7D0A] text-xs font-black uppercase tracking-widest">
                    {selectedReport.kategori || "Kategori"}
                  </p>

                  <h2 className="text-2xl font-extrabold text-[#002B5B] leading-tight">
                    {selectedReport.nama_barang}
                  </h2>
                </div>

                <div className="md:text-right">
                  <p className="text-gray-400 text-xs font-black uppercase">
                    {reportDateLabel}
                  </p>

                  <p className="text-[#002B5B] font-semibold">
                    {selectedReport.tanggal_kejadian || "-"}
                  </p>
                </div>
              </div>

              <p className="text-gray-500 text-sm leading-relaxed">
                {selectedReport.deskripsi || "Tidak ada deskripsi."}
              </p>

              <div className="flex flex-wrap gap-2">
                <div className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-700">
                  <i className="fas fa-map-marker-alt mr-2 text-[#002B5B]"></i>
                  {selectedReport.lokasi || "-"}
                </div>

                <div className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-700">
                  <i className="fas fa-user mr-2 text-[#002B5B]"></i>
                  {selectedReport.pelapor || "-"}
                </div>

                <div className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-700">
                  <i className="fas fa-envelope mr-2 text-[#002B5B]"></i>
                  {selectedReport.email || "-"}
                </div>

                <div className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 capitalize">
                  <i className="fas fa-clipboard-list mr-2 text-[#002B5B]"></i>
                  {selectedReport.jenis_laporan || "-"}
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
                      {selectedReport.tanggal_kejadian || "-"}
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

              {selectedReport.catatan_verifikasi && (
                <div
                  className={`border rounded-2xl p-3 ${
                    selectedReport.status_verifikasi === "terverifikasi"
                      ? "bg-[#EEFDF3] border-green-100"
                      : "bg-[#FFF7F7] border-red-100"
                  }`}
                >
                  <p
                    className={`text-xs font-bold mb-1 ${
                      selectedReport.status_verifikasi === "terverifikasi"
                        ? "text-[#0F9F4B]"
                        : "text-red-500"
                    }`}
                  >
                    Catatan Verifikasi
                  </p>

                  <p className="text-sm text-gray-600">
                    {selectedReport.catatan_verifikasi}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center border-t border-gray-50 pt-4 mt-auto">
                <p className="text-xs text-gray-400 font-bold">
                  ID: #IPB-{selectedReport.laporan_id}
                </p>

                <div className="flex gap-3">
                  <button
                    disabled={actionDisabled}
                    onClick={() =>
                      this.openApproveModal(
                        selectedReport.laporan_id
                      )
                    }
                    className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${
                      actionDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-[#163A70] text-white hover:bg-[#102348]"
                    }`}
                  >
                    Setujui
                  </button>

                  <button
                    disabled={actionDisabled}
                    onClick={() =>
                      this.openRejectModal(
                        selectedReport.laporan_id
                      )
                    }
                    className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${
                      actionDisabled
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
        {this.state.showImagePreview && (
          <div
            className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4"
            onClick={this.closeImagePreview}
          >
            <button
              type="button"
              onClick={this.closeImagePreview}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white text-[#002B5B] hover:bg-gray-100 transition-colors"
              aria-label="Tutup foto"
            >
              <i className="fas fa-times"></i>
            </button>

            <img
              src={imageSrc}
              alt={selectedReport.nama_barang}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  render() {
    const {
      loading,
      filteredReports,
      pendingClaims,
      claimsLoading,
      popup,
      currentPage,
      reportsPerPage,
    } = this.state;

    const totalPages = Math.max(
      1,
      Math.ceil(filteredReports.length / reportsPerPage)
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * reportsPerPage;
    const orderedReports = [
      ...filteredReports.filter((r) => r.status_verifikasi === "belum_diverifikasi"),
      ...filteredReports.filter((r) => r.status_verifikasi !== "belum_diverifikasi"),
    ];
    const paginatedReports = orderedReports.slice(
      startIndex,
      startIndex + reportsPerPage
    );

    const pendingCount = filteredReports.filter(
      (r) =>
        r.status_verifikasi ===
        "belum_diverifikasi"
    ).length;

    const verifiedCount = filteredReports.filter(
      (r) =>
        r.status_verifikasi ===
        "terverifikasi"
    ).length;

    const rejectedCount = filteredReports.filter(
      (r) => r.status_verifikasi === "ditolak"
    ).length;
    const claimedHistoryReports = Array.isArray(this.state.claimHistory)
      ? [...this.state.claimHistory]
      .sort((a, b) => {
        const left = new Date(b.claim_verified_at || b.updated_time || b.created_time || 0).getTime();
        const right = new Date(a.claim_verified_at || a.updated_time || a.created_time || 0).getTime();

        return left - right;
      })
      : [];
    const {
      claimHistoryCurrentPage,
      claimHistoryPerPage,
      claimHistoryLoading,
    } = this.state;
    const totalClaimHistoryPages = Math.max(
      1,
      Math.ceil(claimedHistoryReports.length / claimHistoryPerPage)
    );
    const safeClaimHistoryPage = Math.min(
      claimHistoryCurrentPage,
      totalClaimHistoryPages
    );
    const claimHistoryStartIndex =
      (safeClaimHistoryPage - 1) * claimHistoryPerPage;
    const paginatedClaimHistoryReports = claimedHistoryReports.slice(
      claimHistoryStartIndex,
      claimHistoryStartIndex + claimHistoryPerPage
    );

    return (
      <div className="min-h-screen bg-[#F6F7FB] font-['Plus_Jakarta_Sans'] text-[#002B5B]">
        <div className="flex min-h-screen">
          <AdminSidebar
            activeMenu="verification"
            expanded={this.state.isSidebarExpanded}
            navigate={this.props.navigate}
          />

          <main
            className={`
              flex-1
              p-6
              md:p-10
              overflow-y-auto
              transition-[margin] duration-300
              ${
                this.state.isSidebarExpanded
                  ? "ml-64"
                  : "ml-16"
              }
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

            <div className="mb-8">
              <h1 className="text-4xl font-extrabold text-[#163A70] mb-2">
                {this.state.activeVerificationView === "klaim"
                  ? "Verifikasi Klaim Barang"
                  : "Verifikasi Laporan"}
              </h1>

              <p className="text-gray-500 text-sm">
                {this.state.activeVerificationView === "klaim"
                  ? "Kelola pengajuan klaim barang, histori klaim, dan export klaim barang."
                  : "Kelola dan verifikasi laporan kehilangan dan penemuan civitas IPB."}
              </p>
            </div>

            {this.state.activeVerificationView === "laporan" && (
              <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-[24px] border border-[#E7ECF3] p-6">
                <p className="text-sm text-gray-400 font-bold mb-2">
                  Menunggu
                </p>

                <h2 className="text-3xl font-black text-[#163A70]">
                  {pendingCount}
                </h2>
              </div>

              <div className="bg-white rounded-[24px] border border-[#E7ECF3] p-6">
                <p className="text-sm text-gray-400 font-bold mb-2">
                  Terverifikasi
                </p>

                <h2 className="text-3xl font-black text-[#163A70]">
                  {verifiedCount}
                </h2>
              </div>

              <div className="bg-white rounded-[24px] border border-[#E7ECF3] p-6">
                <p className="text-sm text-gray-400 font-bold mb-2">
                  Ditolak
                </p>

                <h2 className="text-3xl font-black text-[#163A70]">
                  {rejectedCount}
                </h2>
              </div>
            </div>
              </>
            )}

            {this.state.activeVerificationView === "klaim" && (
              <>
            <section className="bg-white rounded-[28px] border border-[#E7ECF3] p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#163A70]">
                    Verifikasi Klaim Barang
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Saat klaim diterima, sistem membuat kode pickup untuk user. Dokumen serah terima dibuat setelah admin memverifikasi kode pickup di dashboard.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-blue-50 text-[#2563EB] px-4 py-2 rounded-xl text-xs font-black">
                    {pendingClaims.length} klaim menunggu
                  </div>
                </div>
              </div>

              {claimsLoading ? (
                <p className="text-gray-400 text-sm">Memuat klaim...</p>
              ) : pendingClaims.length === 0 ? (
                <div className="bg-[#F8FAFC] rounded-2xl px-5 py-6 text-sm text-gray-400 font-semibold">
                  Tidak ada klaim barang yang menunggu verifikasi.
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {pendingClaims.map((claim) => (
                    <div
                      key={claim.klaim_id}
                      className="border border-[#E7ECF3] rounded-2xl p-5 bg-[#FCFDFF]"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">
                            Klaim #{claim.klaim_id}
                          </p>
                          <h3 className="text-lg font-extrabold text-[#163A70]">
                            {claim.nama_barang}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Laporan kehilangan #{claim.laporan_kehilangan_id}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Diajukan: {claim.created_time || "-"}
                          </p>
                        </div>

                        <span className="bg-blue-100 text-[#2563EB] px-3 py-1 rounded-full text-[10px] font-black">
                          {claim.status_klaim}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                          <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                            Pengklaim
                          </p>
                          <p className="text-sm font-bold text-[#102348]">
                            {claim.pengklaim || "-"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {claim.email || "-"}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                          <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                            Barang Diklaim
                          </p>
                          <p className="text-sm font-bold text-[#102348]">
                            #IPB-{claim.barang_id}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {claim.kategori || "-"} - {claim.lokasi || "-"}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 sm:col-span-2">
                          <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                            Laporan Kehilangan User
                          </p>
                          <p className="text-sm font-bold text-[#102348]">
                            #IPB-{claim.laporan_kehilangan_id}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Detail lengkap akan ditampilkan sebelum klaim diterima atau ditolak.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => this.openClaimVerificationModal(claim, "")}
                          className="flex-1 bg-[#163A70] text-white rounded-xl px-4 py-3 text-xs font-bold hover:bg-[#102348] transition-all"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-[28px] border border-[#E7ECF3] p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#163A70]">
                    Histori Klaim Barang
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Semua pengajuan klaim yang sudah diproses admin.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-green-50 text-[#0F9F4B] px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap">
                    {claimedHistoryReports.length} histori
                  </div>

                  <button
                    type="button"
                    onClick={this.handleDownloadClaimsCsv}
                    className="bg-white border border-[#E7ECF3] text-[#163A70] px-4 py-2 rounded-xl text-xs font-black hover:bg-[#F8FAFD] transition-all shadow-sm whitespace-nowrap"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Ekspor CSV
                  </button>
                </div>
              </div>

              {claimHistoryLoading ? (
                <div className="bg-[#F8FAFC] rounded-2xl px-5 py-6 text-sm text-gray-400 font-semibold">
                  Memuat histori klaim...
                </div>
              ) : claimedHistoryReports.length === 0 ? (
                <div className="bg-[#F8FAFC] rounded-2xl px-5 py-6 text-sm text-gray-400 font-semibold">
                  Belum ada histori klaim barang.
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedClaimHistoryReports.map((report) => {
                    const isComplete = ["selesai", "dikembalikan"].includes(
                      report.status_laporan
                    ) || report.status_barang === "selesai";
                    const claimStatusLabel =
                      report.status_klaim === "ditolak"
                        ? "Ditolak"
                        : isComplete
                        ? "Selesai"
                        : "Diterima";

                    return (
                      <div
                        key={`${report.klaim_id || report.laporan_id}-${report.barang_id}`}
                        className="border border-[#E7ECF3] rounded-2xl px-4 py-3 bg-[#FCFDFF] flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">
                            Laporan #{report.laporan_kehilangan_id || report.laporan_id || "-"} - Barang #{report.barang_id}
                          </p>
                          <h3 className="text-base font-extrabold text-[#163A70] truncate">
                            {report.nama_barang || report.item_name || "-"}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {report.pengklaim || report.pelapor || report.reporter || "-"} - {report.lokasi || "-"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#EEF2F7] text-[#163A70]">
                            Status Klaim: {claimStatusLabel}
                          </span>

                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black ${
                              isComplete
                                ? "bg-green-100 text-[#0F9F4B]"
                                : "bg-blue-100 text-[#2563EB]"
                            }`}
                          >
                            {isComplete ? "Selesai" : "Diklaim"}
                          </span>

                          <button
                            type="button"
                            onClick={() => this.openClaimHistoryDetailModal(report)}
                            className="px-4 py-2 rounded-xl border border-[#D6E2F0] text-[#163A70] text-xs font-bold hover:bg-[#F5F7FB] transition-all"
                          >
                            Detail
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {claimedHistoryReports.length > claimHistoryPerPage && (
                <div className="flex items-center justify-between gap-4 mt-6 text-xs text-gray-500">
                  <p>
                    Menampilkan{" "}
                    {claimedHistoryReports.length === 0
                      ? 0
                      : claimHistoryStartIndex + 1}
                    -
                    {Math.min(
                      claimHistoryStartIndex + claimHistoryPerPage,
                      claimedHistoryReports.length
                    )}{" "}
                    dari {claimedHistoryReports.length} histori
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        this.setClaimHistoryPage(
                          Math.max(1, safeClaimHistoryPage - 1)
                        )
                      }
                      disabled={safeClaimHistoryPage === 1}
                      className="w-9 h-9 rounded-xl border border-[#E7ECF3] bg-white text-[#163A70] font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FB] transition-all"
                    >
                      ‹
                    </button>

                    <span className="text-[11px] font-bold text-[#163A70] px-2">
                      {safeClaimHistoryPage} / {totalClaimHistoryPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        this.setClaimHistoryPage(
                          Math.min(
                            totalClaimHistoryPages,
                            safeClaimHistoryPage + 1
                          )
                        )
                      }
                      disabled={safeClaimHistoryPage === totalClaimHistoryPages}
                      className="w-9 h-9 rounded-xl border border-[#E7ECF3] bg-white text-[#163A70] font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FB] transition-all"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </section>
            </>
            )}

            {this.state.activeVerificationView === "laporan" && (
              <>
            <div className="flex items-center gap-4 mb-8">
            
            <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>

                <input
                type="text"
                placeholder="Cari laporan..."
                value={this.state.search}
                onChange={this.handleSearch}
                className="
                    pl-11
                    pr-4
                    h-11
                    w-[260px]
                    rounded-2xl
                    border
                    border-[#E7ECF3]
                    bg-white
                    text-sm
                    outline-none
                    focus:border-[#163A70]
                "
                />
            </div>

            <div className="relative">
                <button
                onClick={this.toggleFilterMenu}
                className="
                    h-11
                    px-5
                    rounded-2xl
                    border
                    border-[#E7ECF3]
                    bg-white
                    text-sm
                    font-semibold
                    text-[#163A70]
                    flex
                    items-center
                    gap-2
                    hover:bg-[#F8FAFD]
                    transition-all
                "
                >
                <i className="fas fa-filter text-xs"></i>

                {
                    this.state.selectedFilter === "semua"
                    ? "Semua"
                    : this.state.selectedFilter === "belum_diverifikasi"
                    ? "Menunggu"
                    : this.state.selectedFilter === "terverifikasi"
                    ? "Diverifikasi"
                    : "Ditolak"
                }

                <i className="fas fa-chevron-down text-[10px]"></i>
                </button>

                {this.state.showFilterMenu && (
                <div
                    className="
                    absolute
                    right-0
                    mt-3
                    w-52
                    bg-white
                    rounded-2xl
                    border
                    border-[#E7ECF3]
                    shadow-xl
                    p-2
                    z-40
                    "
                >
                    <button
                    onClick={() =>
                        this.handleFilterChange("semua")
                    }
                    className={`
                        w-full
                        text-left
                        px-4
                        py-3
                        rounded-xl
                        text-sm
                        font-semibold
                        transition-all

                        ${
                        this.state.selectedFilter === "semua"
                            ? "bg-[#EEF4FF] text-[#163A70]"
                            : "text-gray-600 hover:bg-[#F8FAFD]"
                        }
                    `}
                    >
                    Semua
                    </button>

                    <button
                    onClick={() =>
                        this.handleFilterChange(
                        "belum_diverifikasi"
                        )
                    }
                    className={`
                        w-full
                        text-left
                        px-4
                        py-3
                        rounded-xl
                        text-sm
                        font-semibold
                        transition-all

                        ${
                        this.state.selectedFilter ===
                        "belum_diverifikasi"
                            ? "bg-[#FFF7E8] text-[#B7791F]"
                            : "text-gray-600 hover:bg-[#F8FAFD]"
                        }
                    `}
                    >
                    Menunggu
                    </button>

                    <button
                    onClick={() =>
                        this.handleFilterChange(
                        "terverifikasi"
                        )
                    }
                    className={`
                        w-full
                        text-left
                        px-4
                        py-3
                        rounded-xl
                        text-sm
                        font-semibold
                        transition-all

                        ${
                        this.state.selectedFilter ===
                        "terverifikasi"
                            ? "bg-[#EEFDF3] text-[#0F9F4B]"
                            : "text-gray-600 hover:bg-[#F8FAFD]"
                        }
                    `}
                    >
                    Diverifikasi
                    </button>

                    <button
                    onClick={() =>
                        this.handleFilterChange("ditolak")
                    }
                    className={`
                        w-full
                        text-left
                        px-4
                        py-3
                        rounded-xl
                        text-sm
                        font-semibold
                        transition-all

                        ${
                        this.state.selectedFilter ===
                        "ditolak"
                            ? "bg-[#FFF1F1] text-[#D92D20]"
                            : "text-gray-600 hover:bg-[#F8FAFD]"
                        }
                    `}
                    >
                    Ditolak
                    </button>
                </div>
                )}
            </div>
            <div className="inline-flex h-11 bg-white border border-[#E7ECF3] rounded-2xl p-1">
                {[
                    { value: "semua", label: "Semua Jenis" },
                    { value: "penemuan", label: "Penemuan" },
                    { value: "kehilangan", label: "Kehilangan" },
                ].map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => this.handleReportTypeChange(option.value)}
                        className={`px-4 rounded-xl text-xs font-black transition-all ${
                            this.state.selectedReportType === option.value
                                ? "bg-[#163A70] text-white"
                                : "text-[#163A70] hover:bg-[#F5F7FB]"
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div className="relative ml-auto">
                <button
                    type="button"
                    onClick={this.toggleExportMenu}
                    className="bg-white border border-[#E7ECF3] text-[#163A70] rounded-xl px-4 py-2.5 text-xs font-black hover:bg-[#F8FAFD] transition-all shadow-sm"
                >
                    <i className="fas fa-download mr-2"></i>
                    Ekspor Laporan CSV
                </button>

                {this.state.showExportMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#E7ECF3] shadow-xl p-2 z-40">
                        <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Laporan
                        </p>
                        {[
                            { value: "laporan:semua:semua", label: "Semua Laporan" },
                            { value: "laporan:penemuan:semua", label: "Penemuan" },
                            { value: "laporan:kehilangan:semua", label: "Kehilangan" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => this.handleExportSelection(option.value)}
                                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-[#F8FAFD] hover:text-[#163A70] transition-all"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            </div>

            {loading ? (
              <div className="text-center py-0 text-gray-400">
                Memuat laporan...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-white rounded-[28px] p-20 text-center border border-[#E7ECF3]">
                <i className="fas fa-inbox text-5xl text-gray-300 mb-4"></i>

                <p className="text-gray-400 font-semibold">
                  Belum ada laporan masuk
                </p>
              </div>
            ) : (
              <>
              <div className="space-y-5">
                {paginatedReports.map((report) => {
                  const reportType =
                    this.getReportTypeMeta(
                      report.jenis_laporan
                    );

                  return (
                  <div
                    key={report.laporan_id}
                    className={`
                      bg-white
                      border border-[#E7ECF3]
                      ${reportType.cardAccentClass}
                      rounded-[22px]
                      p-4
                      hover:shadow-sm
                      transition-all
                      min-h-[300px]
                    `}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5 h-full">
                      <div className="relative w-full h-56 lg:h-[268px] shrink-0 overflow-hidden rounded-[18px] bg-gray-100">
                        <img
                          src={this.getImageSrc(report.dokumentasi)}
                          alt={report.nama_barang}
                          className="w-full h-full object-cover"
                        />

                        <span
                          className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black ${reportType.imageClass}`}
                        >
                          #{report.laporan_id}
                        </span>

                        <span
                          className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-[10px] font-black border ${reportType.badgeClass}`}
                        >
                          <i className={`fas ${reportType.icon} mr-1`}></i>
                          {reportType.label}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col gap-4 min-h-[268px]">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-xl font-extrabold text-[#163A70] leading-tight truncate">
                              {report.nama_barang}
                            </h3>

                            <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-3xl line-clamp-2 min-h-[44px]">
                              {report.deskripsi || "Tidak ada deskripsi"}
                            </p>
                          </div>

                          <div className="lg:text-right shrink-0">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">
                              Pelapor
                            </p>

                            <h4 className="text-sm font-bold text-[#102348] truncate max-w-[180px] lg:ml-auto">
                              {report.pelapor}
                            </h4>

                            <p className="text-xs text-gray-500 mt-1 truncate max-w-[220px] lg:ml-auto">
                              {report.email}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                          <div className="min-h-[52px]">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">
                              Jenis Laporan
                            </p>

                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black ${reportType.badgeClass}`}
                            >
                              <i className={`fas ${reportType.icon}`}></i>
                              {reportType.label}
                            </span>
                          </div>

                          <div className="min-h-[52px]">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">
                              Kategori
                            </p>

                            <p className="text-sm font-semibold text-gray-600 truncate">
                              {report.kategori}
                            </p>
                          </div>

                          <div className="min-h-[52px]">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">
                              Lokasi
                            </p>

                            <p className="text-sm font-semibold text-gray-600 truncate">
                              {report.lokasi}
                            </p>
                          </div>

                          <div className="min-h-[52px]">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">
                              {report.jenis_laporan === "penemuan"
                                ? "Tanggal Penemuan"
                                : "Tanggal Kehilangan"}
                            </p>

                            <p className="text-sm font-semibold text-gray-600">
                              {report.tanggal_kejadian || "-"}
                            </p>
                          </div>

                          <div className="min-h-[52px]">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">
                              Status Verifikasi
                            </p>

                            {report.status_verifikasi === "belum_diverifikasi" && (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#FFF7E8] text-[#B7791F]">
                                Belum Diverifikasi
                              </span>
                            )}

                            {report.status_verifikasi === "terverifikasi" && (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#EEFDF3] text-[#0F9F4B]">
                                Terverifikasi
                              </span>
                            )}

                            {report.status_verifikasi === "ditolak" && (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#FFF1F1] text-[#D92D20]">
                                Ditolak
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-[#F1F4F8] mt-auto">
                          <p className="text-xs text-gray-400 font-bold">
                            ID: #IPB-{report.laporan_id}
                          </p>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            {report.status_verifikasi === "belum_diverifikasi" && (
                              <>
                                <button
                                  onClick={() =>
                                    this.openApproveModal(report.laporan_id)
                                  }
                                  className="
                                    px-4
                                    py-2
                                    rounded-xl
                                    bg-[#163A70]
                                    text-white
                                    text-xs
                                    font-bold
                                    hover:bg-[#102348]
                                    transition-all
                                  "
                                >
                                  Setujui
                                </button>

                                <button
                                  onClick={() =>
                                    this.openRejectModal(report.laporan_id)
                                  }
                                  className="
                                    px-4
                                    py-2
                                    rounded-xl
                                    bg-[#FFF1F1]
                                    text-[#D92D20]
                                    text-xs
                                    font-bold
                                    hover:bg-[#FFE5E5]
                                    transition-all
                                  "
                                >
                                  Tolak
                                </button>
                              </>
                            )}

                            {report.status_verifikasi === "terverifikasi" && (
                              <div className="
                                px-4
                                py-2
                                rounded-xl
                                bg-[#EEFDF3]
                                text-[#0F9F4B]
                                text-xs
                                font-black
                                text-center
                              ">
                                Sudah Diverifikasi
                              </div>
                            )}

                            {report.status_verifikasi === "ditolak" && (
                              <div className="
                                px-4
                                py-2
                                rounded-xl
                                bg-[#FFF1F1]
                                text-[#D92D20]
                                text-xs
                                font-black
                                text-center
                              ">
                                Ditolak
                              </div>
                            )}

                            {(report.status_verifikasi === "terverifikasi" ||
                              report.status_verifikasi === "ditolak") && (
                              <button
                                onClick={() => this.openDetailModal(report)}
                                className="
                                  px-4
                                  py-2
                                  rounded-xl
                                  border
                                  border-[#D6E2F0]
                                  text-[#163A70]
                                  text-xs
                                  font-bold
                                  hover:bg-[#F5F7FB]
                                  transition-all
                                "
                              >
                                Detail
                              </button>
                            )}

                            {report.status_verifikasi === "belum_diverifikasi" && (
                              <button
                                onClick={() => this.openDetailModal(report)}
                                className="
                                  px-4
                                  py-2
                                  rounded-xl
                                  border
                                  border-[#D6E2F0]
                                  text-[#163A70]
                                  text-xs
                                  font-bold
                                  hover:bg-[#F5F7FB]
                                  transition-all
                                "
                              >
                                Detail
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {filteredReports.length > reportsPerPage && (
                <div className="flex items-center justify-between gap-3 mt-8">
                  <p className="text-xs text-gray-400 font-semibold">
                    Menampilkan {startIndex + 1}-{Math.min(startIndex + reportsPerPage, filteredReports.length)} dari {filteredReports.length} laporan
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => this.setPage(Math.max(1, safeCurrentPage - 1))}
                      disabled={safeCurrentPage === 1}
                      className="w-9 h-9 rounded-xl border border-[#D6E2F0] text-xs font-bold text-[#163A70] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FB] flex items-center justify-center"
                      aria-label="Halaman sebelumnya"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>

                    <div className="px-4 py-2 rounded-xl bg-[#F5F7FB] text-xs font-bold text-[#102348]">
                      Halaman {safeCurrentPage} dari {totalPages}
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, index) => {
                        const pageNumber = index + 1;
                        const isActive = pageNumber === safeCurrentPage;

                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => this.setPage(pageNumber)}
                            className={`
                              w-9
                              h-9
                              rounded-xl
                              text-xs
                              font-bold
                              border
                              transition-colors
                              ${
                                isActive
                                  ? "bg-[#163A70] text-white border-[#163A70]"
                                  : "bg-white text-[#163A70] border-[#D6E2F0] hover:bg-[#F5F7FB]"
                              }
                            `}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => this.setPage(Math.min(totalPages, safeCurrentPage + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="w-9 h-9 rounded-xl border border-[#D6E2F0] text-xs font-bold text-[#163A70] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FB] flex items-center justify-center"
                      aria-label="Halaman berikutnya"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
              </>
            )}
              </>
            )}

            <PageFooter />
          </main>
        </div>

        {this.renderDetailModal()}
        {this.renderRejectModal()}
        {this.renderApproveModal()}
        {this.renderClaimVerificationModal()}
        {this.renderClaimActionConfirmModal()}
        {this.renderClaimHistoryDetailModal()}
        {this.renderHandoverModal()}

        {popup.show && (
          <div
            className={`
              fixed top-6 right-6 z-[100]
              px-5 py-4 rounded-2xl shadow-xl text-sm font-bold text-white
              ${
                popup.type === "success"
                  ? "bg-[#16A34A]"
                  : "bg-[#DC2626]"
              }
            `}
          >
            {popup.message}
          </div>
        )}
      </div>
    );
  }
}

export default AdminVerificationPage;
