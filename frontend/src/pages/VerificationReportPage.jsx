import React, { Component } from "react";
import AuthService from "../services/AuthService";
import ReportService from "../services/ReportService";
import NotifikasiService from "../services/NotifikasiService";
import BarangService from "../services/BarangService";
import UserPageLayout from "../components/UserPageLayout";
import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

const getCodeFromNotification = (notification) => {
  const message = notification?.pesan || "";
  const match = message.match(/kode\s+(pickup|dropoff)(?:\s+anda)?\s*:\s*([A-Z0-9@#$%]{6,8})/i);

  return match ? match[2].toUpperCase() : "";
};

class VerificationReportPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      reports: [],
      pickupNotifications: {},
      cancelClaimLoading: false,
      showCancelClaimModal: false,
      claimActionMessage: "",
      selectedReport: null,
      loading: true,
      searchQuery: "",
      isSidebarExpanded: getStoredSidebarExpanded(),
    };
  }

  getCurrentUserId() {
    const currentUser = AuthService.getCurrentUser();
    return currentUser?.user_id || currentUser?.id || null;
  }

    handleSearch = (e) => {
    this.setState({
      searchQuery: e.target.value,
    });
  };

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

  componentDidMount() {
    window.addEventListener("focus", this.loadReportData);
    this.loadReportData();
}

  componentWillUnmount() {
    window.removeEventListener("focus", this.loadReportData);
  }

  loadReportData = async () => {
    this.setState({ loading: true });

    try {
      const [reportsResult, notificationsResult] = await Promise.allSettled([
        ReportService.getMyReports(),
        NotifikasiService.getNotifikasi(),
      ]);
      const reports =
        reportsResult.status === "fulfilled" && Array.isArray(reportsResult.value)
          ? reportsResult.value
          : [];
      const notifications =
        notificationsResult.status === "fulfilled" &&
        Array.isArray(notificationsResult.value)
          ? notificationsResult.value
          : [];

      const orderedReports = this.orderReports(reports);
      const params = new URLSearchParams(window.location.search);
      const targetLaporanId = params.get("laporan");
      const pickupNotifications = (Array.isArray(notifications) ? notifications : [])
        .filter((notification) =>
          /kode\s+(pickup|dropoff)(?:\s+anda)?\s*:/i.test(notification.pesan || "")
        )
        .reduce((acc, notification) => {
          if (notification.laporan_id) {
            acc[notification.laporan_id] = notification;
          }

          return acc;
        }, {});

      this.setState({
        reports: orderedReports,
        pickupNotifications,
        selectedReport:
          orderedReports.find(
            (report) => String(report.laporan_id) === String(targetLaporanId)
          ) ||
          (orderedReports.length > 0 ? orderedReports[0] : null),
        loading: false,
      });
    } catch (error) {
      console.error(error);
      this.setState({ loading: false });
    }
  };

  renderStatusColor(status) {
    if (!status) {
      return "bg-gray-100 text-gray-600";
    }

    switch (status.toLowerCase()) {
      case "terverifikasi":
        return "bg-green-100 text-green-700";

      case "under review":
        return "bg-yellow-100 text-yellow-700";

      case "verifying":
        return "bg-blue-100 text-blue-700";

      case "ditolak":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  renderReportNumberColor(status) {
    const normalizedStatus = (status || "").toLowerCase();

    if (
      ["menunggu", "diproses", "disetujui", "ditolak"].includes(
        normalizedStatus
      )
    ) {
      return "text-[#2563EB]";
    }

    return "text-[#0B2B5B]";
  }

  formatVerificationDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

    renderBadgeColor(status) {

    if (!status) {
      return "bg-gray-100 text-gray-500";
    }

    switch (status.toLowerCase()) {

      case "disetujui":
        return "bg-blue-100 text-[#0B2B5B]";

      case "diproses":
        return "bg-yellow-100 text-yellow-700";

      case "menunggu":
        return "bg-orange-100 text-orange-700";

      case "ditolak":
        return "bg-red-100 text-red-700";

      case "siap_diambil":
        return "bg-green-100 text-green-700";

      default:
        return "bg-gray-100 text-gray-500";
    }
  }

  renderStatusIcon(status) {

  if (!status) {
    return "⌛";
  }

  switch (status.toLowerCase()) {

    case "disetujui":
      return "✓";

    case "menunggu":
      return "⌛";

    case "diproses":
      return "⟳";

    case "ditolak":
      return "✕";

    default:
      return "•";
  }
}

  goToCollection = () => {
    if (this.props.navigate) {
      this.props.navigate("/koleksi");
      return;
    }

    window.location.href = "/koleksi";
  };

  getReportPriority(report) {
    const status = (report.status_laporan || "").toLowerCase();
    const verification = (report.status_verifikasi || "").toLowerCase();

    if (["menunggu", "diproses"].includes(status)) return 0;
    if (verification === "belum_diverifikasi") return 1;
    if (["disetujui", "siap_diambil", "siap_dropoff"].includes(status)) return 2;
    if (status === "ditolak") return 4;

    return 3;
  }

  orderReports(reports) {
    return [...reports].sort((a, b) => {
      const priorityDiff = this.getReportPriority(a) - this.getReportPriority(b);

      if (priorityDiff !== 0) return priorityDiff;

      return (
        Number(b.laporan_id || 0) -
        Number(a.laporan_id || 0)
      );
    });
  }

  getClaimStatusForReport(report) {
    if (!report) return null;
    if (report.jenis_laporan !== "kehilangan") return null;

    const pickupNotification = this.state.pickupNotifications[report.laporan_id];

    if (pickupNotification) {
      return {
        status: "diterima",
        label: "Klaim disetujui",
        notification: pickupNotification,
      };
    }

    const resolvedClaimStatus = (report.status_klaim || "").toLowerCase();

    if (["diproses", "diterima", "ditolak"].includes(resolvedClaimStatus)) {
      return {
        status: resolvedClaimStatus,
        label:
          resolvedClaimStatus === "ditolak"
            ? "Klaim ditolak"
            : resolvedClaimStatus === "diterima"
            ? "Klaim disetujui"
            : "Klaim sedang diverifikasi",
        claim: {
          klaim_id: report.klaim_id,
          laporan_id: report.laporan_id,
          updated_at: report.klaim_updated_time,
          status_klaim: resolvedClaimStatus,
        },
      };
    }

    return null;
  }

  isReportUsedForClaim(report) {
    if (report?.jenis_laporan !== "kehilangan") return false;

    const claimStatus = this.getClaimStatusForReport(report);

    return Boolean(
      claimStatus &&
      claimStatus.status !== "dibatalkan"
    );
  }

  canCancelClaim(claimStatus) {
    if (!claimStatus?.claim?.klaim_id) return false;
    if (!claimStatus?.claim?.updated_at) return false;
    if (claimStatus.status !== "diproses") return false;

    const submittedAt = new Date(claimStatus.claim.updated_at);
    if (Number.isNaN(submittedAt.getTime())) return false;

    return Date.now() - submittedAt.getTime() <= 24 * 60 * 60 * 1000;
  }

  getCancelDeadlineText(claimStatus) {
    if (!claimStatus?.claim?.updated_at) return "";

    const submittedAt = new Date(claimStatus.claim.updated_at);
    if (Number.isNaN(submittedAt.getTime())) return "";

    const deadline = new Date(submittedAt.getTime() + 24 * 60 * 60 * 1000);

    return deadline.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  openCancelClaimModal = () => {
    this.setState({
      showCancelClaimModal: true,
      claimActionMessage: "",
    });
  };

  closeCancelClaimModal = () => {
    this.setState({
      showCancelClaimModal: false,
    });
  };

  handleCancelClaim = async () => {
    const { selectedReport } = this.state;
    const selectedClaimStatus = this.getClaimStatusForReport(selectedReport);
    const klaimId = selectedClaimStatus?.claim?.klaim_id;

    if (!klaimId || !selectedReport) return;

    this.setState({
      cancelClaimLoading: true,
      claimActionMessage: "",
    });

    try {
      await BarangService.batalkanKlaim(klaimId);
      const refreshedReports = await ReportService.getMyReports();
      const orderedReports = this.orderReports(refreshedReports || []);
      const refreshedSelectedReport =
        orderedReports.find(
          (report) =>
            String(report.laporan_id) ===
            String(selectedReport.laporan_id)
        ) || selectedReport;

      this.setState({
        reports: refreshedReports || [],
        selectedReport: refreshedSelectedReport,
        cancelClaimLoading: false,
        showCancelClaimModal: false,
        claimActionMessage: "",
      });
    } catch (error) {
      this.setState({
        cancelClaimLoading: false,
        showCancelClaimModal: false,
        claimActionMessage:
          error.message === "Failed to fetch"
            ? "Gagal menghubungi server. Pastikan backend berjalan dan coba lagi."
            : error.message || "Gagal membatalkan klaim barang.",
      });
    }
  };

  render() {
    const user = AuthService.getCurrentUser();
    const {
      reports,
      pickupNotifications,
      selectedReport,
      cancelClaimLoading,
      showCancelClaimModal,
      loading,
    } = this.state;
    const selectedPickupNotification =
      selectedReport && pickupNotifications[selectedReport.laporan_id];
    const selectedPickupCode = getCodeFromNotification(
      selectedPickupNotification
    );
    const selectedIsFindingReport = selectedReport?.jenis_laporan === "penemuan";
    const selectedCodeLabel = selectedIsFindingReport ? "Kode Dropoff" : "Kode Pickup";
    const selectedVerificationDateText = this.formatVerificationDate(
      selectedReport?.tanggal_verifikasi
    );
    const selectedClaimStatus = selectedReport
      ? this.getClaimStatusForReport(selectedReport)
      : null;
    const canCancelSelectedClaim = this.canCancelClaim(selectedClaimStatus);
    const cancelDeadlineText = this.getCancelDeadlineText(selectedClaimStatus);

    const filteredReports = reports.filter((report) => {

    const query =
      this.state.searchQuery.toLowerCase();

    return (
      report.nama_barang
        ?.toLowerCase()
        .includes(query) ||

      report.kategori
        ?.toLowerCase()
        .includes(query) ||

      report.lokasi
        ?.toLowerCase()
        .includes(query)
    );
  });
    const orderedReports = this.orderReports(filteredReports);


    return (
      <UserPageLayout
        currentPath="/verifikasi"
        isSidebarExpanded={this.state.isSidebarExpanded}
        onToggleSidebar={this.toggleSidebar}
        onLogout={this.handleLogout}
        navigate={this.props.navigate}
        userRole={user?.role}
        userName={user?.nama || user?.username}
        backgroundClass="bg-[#F5F7FB]"
        mainClassName="px-8 py-7"
      >

          {/* HEADER */}
          <div className="mb-7">

            <h1 className="text-[40px] font-bold text-[#0B2B5B] mb-2">
              Verifikasi Laporan
            </h1>

            <p className="text-[14px] text-gray-500">
              Pengecekan status verifikasi laporan barang hilang & ditemukan yang telah anda laporkan
            </p>

          </div>

          {/* LOADING */}
          {loading ? (

            <div className="text-gray-500">
              Memuat...
            </div>

          ) : (

            <div className="grid grid-cols-12 gap-5">

              {/* LEFT SIDE */}
              <div className="col-span-3 sticky top-6 self-start space-y-4">

                {/* SEARCH */}
                <div className="relative mb-6">

                  <i
                    className="
                      fas fa-search
                      absolute
                      left-5
                      top-1/2
                      -translate-y-1/2
                      text-[#7A8699]
                      text-sm
                    "
                  ></i>

                  <input
                    type="text"
                    placeholder="Cari laporan barang..."
                    value={this.state.searchQuery}
                    onChange={this.handleSearch}
                    className="
                      w-full
                      bg-white
                      rounded-2xl
                      pl-12
                      pr-5
                      py-4
                      text-sm
                      text-[#102348]
                      shadow-[0_2px_12px_rgba(0,0,0,0.05)]
                      outline-none
                      transition-all
                      placeholder:text-gray-400

                      hover:shadow-[0_4px_18px_rgba(0,0,0,0.07)]

                      focus:shadow-[0_6px_24px_rgba(27,77,155,0.12)]
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />

                </div>

                {reports.length === 0 ? (

                  <div className="bg-white rounded-3xl p-5 text-gray-400 text-sm shadow-sm border border-gray-100">
                    Tidak ada laporan
                  </div>

                ) : (

                  

                  <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1 space-y-4">
                  {orderedReports.map((report) => {
                    const reportUsedForClaim = this.isReportUsedForClaim(report);

                    return (
                    <div
                      key={report.laporan_id}
                      onClick={() =>
                        this.setState({
                          selectedReport: report,
                        })
                      }

                      className={`
                        rounded-[28px]
                        p-4
                        cursor-pointer
                        transition-all
                        border
                        shadow-sm

                        ${
                          selectedReport?.laporan_id ===
                          report.laporan_id
                            ? "bg-[#0B2B5B] border-[#0B2B5B] text-white"
                            : "bg-white border-gray-100 hover:shadow-md"
                        }
                      `}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          this.setState({
                            selectedReport: report,
                          });
                        }
                      }}
                    >

                      {/* STATUS */}
                      <div
                        className={`
                          px-4
                          py-1
                          mb-2
                          rounded-full
                          text-[10px]
                          font-bold
                          inline-flex
                          items-center
                          justify-center

                          ${this.renderBadgeColor(
                            report.status_laporan
                          )}
                        `}
                      >
                        {report.status_laporan
                          .replace("_", " ")
                          .toUpperCase()}
                      </div>

                      {/* TITLE */}
                      <p
                        className={`text-[11px] font-extrabold mb-2 ${this.renderReportNumberColor(
                          report.status_laporan
                        )}`}
                      >
                        Laporan #{report.laporan_id}
                      </p>

                      <h2 className="text-[18px] font-bold mb-2 capitalize">
                        {report.nama_barang}
                        
                      </h2>
                      {/*Jenis Laporan*/}
                        <p
                          className={`
                            text-[11px]
                            uppercase
                            tracking-wide
                            font-bold
                            mt-1
                            ${
                              selectedReport?.laporan_id === report.laporan_id
                                ? "text-blue-200"
                                : "text-[#5B6B8B]"
                            }
                          `}
                        >
                          {report?.jenis_laporan || report?.jenisLaporan || "-"}
                        </p>

                      {reportUsedForClaim && (
                        <div
                          className={`
                            inline-flex
                            mt-2
                            px-3
                            py-1
                            rounded-full
                            text-[10px]
                            font-black
                            uppercase
                            tracking-widest
                            ${
                              selectedReport?.laporan_id === report.laporan_id
                                ? "bg-white/15 text-blue-100"
                                : "bg-blue-50 text-[#2563EB]"
                            }
                          `}
                        >
                          Klaim diajukan
                        </div>
                      )}

                      {/* DATE */}
                      <p
                        className={`
                          text-[11px]
                          mb-4

                          ${
                            selectedReport?.laporan_id ===
                            report.laporan_id
                              ? "text-gray-200"
                              : "text-gray-500"
                          }
                        `}
                      >
                        {report.tanggal_kejadian}
                      </p>

                      {/* BUTTON */}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          this.setState({
                            selectedReport: report,
                          });
                        }}
                        className={`
                          mt-5
                          w-full
                          py-3
                          rounded-2xl
                          text-[12px]
                          font-semibold
                          transition-all
                          duration-200
                          border

                          ${
                            selectedReport?.laporan_id ===
                            report.laporan_id
                              ? `
                                bg-white/60
                                backdrop-blur-sm
                                text-[#0B2B5B]
                                shadow-sm
                              `
                              : `
                                bg-[#0B2B5B]
                                text-white
                                border-[#0B2B5B]
                                hover:opacity-90
                              `
                          }
                        `}
                      >
                        <div className="flex items-center justify-center gap-2">

                          <i className="fas fa-eye text-[11px]"></i>

                          <span>
                            Lihat Detail
                          </span>

                        </div>
                      </button>

                    </div>
                  );
                })}
                  </div>

                )}

              </div>

              {/* CENTER */}
              <div className="col-span-5 bg-white rounded-[34px] p-7 shadow-sm border border-gray-100 sticky top-6 self-start max-h-[calc(100vh-48px)] overflow-y-auto">

                {selectedReport ? (

                  <>

                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-8">

                      <div className="min-w-0 pr-4">

                        <p className="text-[13px] text-gray-500">
                          Tracking status verifikasi laporan
                        </p>

                        <h2 className="text-2xl font-black text-[#0B2B5B] mt-1 truncate">
                          {selectedReport.nama_barang}
                        </h2>

                        <p className="text-[11px] text-gray-400 font-semibold mt-1 capitalize">
                          Laporan {selectedReport.jenis_laporan || "-"} #{selectedReport.laporan_id}
                        </p>

                      </div>

                      <div
                        className={`
                          px-4
                          py-2
                          rounded-full
                          text-[11px]
                          font-bold

                          ${this.renderStatusColor(
                            selectedReport.status_verifikasi
                          )}
                        `}
                      >
                        {selectedReport.status_verifikasi}
                      </div>

                    </div>
                    
            {/* TIMELINE */}
            <div className="space-y-8">

              {/* STEP 1 */}
              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div
                    className={`
                      w-11
                      h-11
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      text-sm
                      font-bold

                  ${
                    [
                      "menunggu",
                      "diproses",
                      "disetujui",
                      "siap_diambil",
                      "siap_dropoff",
                      "selesai",
                      "ditolak"
                    ].includes(selectedReport.status_laporan)
                      ? "bg-[#0B2B5B] text-white"
                      : "bg-gray-100 text-gray-400"
                  }
                    `}
                  >
                    <i className="fas fa-file-alt"></i>
                  </div>

                  <div className="w-[2px] h-14 bg-gray-200 mt-2"></div>

                </div>

                <div>

                  <h3 className="text-[17px] font-bold text-[#0B2B5B]">
                    Laporan Dibuat
                  </h3>

                  <p className="text-[12px] text-gray-500">
                    Jenis laporan:
                    <span className="font-semibold capitalize ml-1">
                      {selectedReport.jenis_laporan}
                    </span>
                  </p>

                  <p className="text-[12px] text-gray-400 mt-2">
                    Dibuat pada{" "}
                    {selectedReport.created_time
                      ? new Date(
                          selectedReport.created_time
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </p>

                </div>

              </div>

              {/* STEP 2 */}
              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div
                    className={`
                      w-11
                      h-11
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      text-sm
                      font-bold

                  ${
                    ["menunggu", "diproses"].includes(
                      selectedReport.status_laporan
                    )
                      ? "bg-[#DBEAFE] text-[#2563EB]"

                      : [
                          "disetujui",
                          "siap_diambil",
                          "siap_dropoff",
                          "selesai",
                          "ditolak"
                        ].includes(selectedReport.status_laporan)

                      ? "bg-[#0B2B5B] text-white"
                      : "bg-gray-100 text-gray-400"
                  }
                    `}
                  >
                    <i className="fas fa-search"></i>
                  </div>

                  <div className="w-[2px] h-14 bg-gray-200 mt-2"></div>

                </div>

                <div>

                  <h3 className="text-[17px] font-bold text-[#0B2B5B]">
                    Sedang Ditinjau
                  </h3>

                  <p className="text-[12px] text-gray-500">
                    Admin memeriksa laporan.
                  </p>

                </div>

              </div>

          {/* STEP 3 */}
            <div className="flex gap-4">

              <div className="flex flex-col items-center">

                <div
                  className={`
                    w-11
                    h-11
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    text-sm
                    font-bold

                  ${
                    selectedReport.status_laporan === "ditolak"
                      ? "bg-red-100 text-red-600"

                      : ["disetujui", "siap_diambil", "siap_dropoff", "selesai", "dikembalikan"].includes(
                          selectedReport.status_laporan
                        )
                      ? "bg-[#0B2B5B] text-white"

                      : "bg-gray-100 text-gray-400"
                  }
                  `}
                >
                  <i
                    className={
                      selectedReport.status_laporan === "ditolak"
                        ? "fas fa-times-circle"
                        : "fas fa-check-circle"
                    }
                  ></i>
                </div>

                <div className="w-[2px] h-14 bg-gray-200 mt-2"></div>

              </div>

              <div className="flex-1">

                <h3 className="text-[17px] font-bold text-[#0B2B5B]">
                  Verifikasi Final
                </h3>

                <p
                  className={`
                    text-[12px]
                    capitalize
                    ${
                      selectedReport.status_laporan === "ditolak"
                        ? "text-red-500"
                        : selectedReport.status_laporan === "disetujui"
                        ? "text-green-600"
                        : ["siap_diambil", "siap_dropoff", "selesai", "dikembalikan"].includes(
                            selectedReport.status_laporan
                          )
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  `}
                >
                  Status:
                  <span className="font-semibold ml-1">

                    {selectedReport.status_laporan === "ditolak"
                      ? "Verifikasi gagal"

                      : selectedReport.status_laporan === "disetujui"
                      ? "Sudah disetujui"

                      : selectedReport.status_laporan === "siap_diambil"
                      ? "Barang siap diambil"

                      : selectedReport.status_laporan === "siap_dropoff"
                      ? "Barang siap didropoff"

                      : ["selesai", "dikembalikan"].includes(selectedReport.status_laporan)
                      ? "Selesai"

                      : "Menunggu verifikasi"}

                  </span>
                </p>

                {selectedVerificationDateText && (
                  <p className="mt-2 text-[12px] text-gray-500">
                    Tanggal verifikasi:
                    <span className="font-semibold ml-1">
                      {selectedVerificationDateText}
                    </span>
                  </p>
                )}

                {/* JIKA DITOLAK */}
                {selectedReport.status_laporan === "ditolak" && (

                  <div className="
                    mt-3
                    bg-red-50
                    text-red-700
                    rounded-2xl
                    px-4
                    py-2.5
                    text-[12px]
                  ">

                    <p className="font-bold mb-1">
                      Catatan Verifikasi
                    </p>

                    <p>
                      {selectedReport.catatan_verifikasi ||
                        "Pengajuan gagal diverifikasi. Silakan ajukan ulang laporan."}
                    </p>

                  </div>
                )}

                {/* BUTTON AJUKAN ULANG */}
                {selectedReport.status_laporan === "ditolak" && (

                  <button
                    onClick={() =>
                      this.props.navigate("/laporan-ulang")
                    }
                    className="
                      mt-3
                      bg-[#0B2B5B]
                      hover:bg-[#081F42]
                      text-white
                      px-5
                      py-2.5
                      rounded-2xl
                      text-xs
                      font-semibold
                      transition-all
                    "
                  >
                    Ajukan Ulang
                  </button>
                )}

              </div>

            </div>

              {/* STEP 4 */}
              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div
                    className={`
                      w-11
                      h-11
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      text-sm
                      font-bold

                      ${
                        selectedIsFindingReport &&
                        selectedReport.status_laporan === "selesai"
                          ? "bg-[#0B2B5B] text-white"
                        : selectedIsFindingReport &&
                        selectedReport.status_verifikasi === "terverifikasi" &&
                        selectedReport.status_laporan !== "menunggu"
                          ? "bg-[#DBEAFE] text-[#2563EB]"
                        : selectedIsFindingReport
                          ? "bg-gray-100 text-gray-400"
                          : selectedClaimStatus?.status === "diterima"
                          ? "bg-[#0B2B5B] text-white"
                          : selectedClaimStatus
                          ? "bg-[#DBEAFE] text-[#2563EB]"
                          : selectedReport.status_verifikasi === "terverifikasi"
                          ? "bg-[#DBEAFE] text-[#2563EB]"
                          : "bg-gray-100 text-gray-400"
                      }
                    `}
                    >
                      <i className="fas fa-handshake"></i>
                    </div>

                  <div className="w-[2px] h-14 bg-gray-200 mt-2"></div>

                  </div>

                <div className="flex-1">

                  <h3 className="text-[17px] font-bold text-[#0B2B5B]">
                    {selectedIsFindingReport
                      ? "Dropoff Barang"
                      : selectedClaimStatus?.status === "diterima"
                      ? "Klaim Disetujui"
                      : selectedClaimStatus?.status === "ditolak"
                      ? "Klaim Ditolak"
                      : selectedClaimStatus
                      ? "Klaim Sedang Diajukan"
                      : "Klaim Barang"}
                  </h3>

                  <p className="text-[12px] text-gray-500">
                    {selectedIsFindingReport
                      ? "Serahkan barang di Pos Keamanan NEMU IPB dan tunjukkan kode dropoff."
                      : selectedClaimStatus?.status === "diterima"
                      ? "Klaim barang sudah disetujui admin."
                      : selectedClaimStatus?.status === "ditolak"
                      ? "Klaim barang ditolak admin. Kamu masih bisa ajukan klaim ulang."
                      : selectedClaimStatus
                      ? `Kamu sedang mengajukan klaim barang untuk laporan kehilangan ${selectedReport.nama_barang}. Tunggu verifikasi admin.`
                      : selectedReport.status_verifikasi === "terverifikasi"
                      ? "Laporan sudah diverifikasi. Kamu bisa mengajukan klaim barang yang sesuai."
                      : "Klaim bisa diajukan setelah laporan diverifikasi."}
                  </p>

                  {!selectedIsFindingReport && selectedClaimStatus && (
                    <div
                      className={`
                        inline-flex
                        mt-3
                        px-3
                        py-1.5
                        rounded-full
                        text-[10px]
                        font-black
                        uppercase
                        tracking-widest
                        ${
                          selectedClaimStatus.status === "diterima"
                            ? "bg-blue-50 text-[#2563EB]"
                            : selectedClaimStatus.status === "ditolak"
                            ? "bg-red-50 text-[#D92D20]"
                            : "bg-yellow-100 text-yellow-700"
                        }
                      `}
                    >
                      {selectedClaimStatus.status === "diterima"
                        ? "Klaim Disetujui"
                        : selectedClaimStatus.status === "ditolak"
                        ? "Klaim Ditolak"
                        : "Menunggu Verifikasi Admin"}
                    </div>
                  )}

                  {!selectedIsFindingReport &&
                    selectedClaimStatus &&
                    selectedClaimStatus.status === "diproses" &&
                    canCancelSelectedClaim && (
                    <div className="mt-3">
                      <p className="text-[11px] text-gray-500 font-semibold mb-3">
                        Klaim bisa dibatalkan dalam 24 jam setelah diajukan
                        {cancelDeadlineText ? `, sampai ${cancelDeadlineText}` : ""}.
                      </p>
                      <button
                        type="button"
                        onClick={this.openCancelClaimModal}
                        disabled={cancelClaimLoading}
                        className="
                          bg-red-50
                          hover:bg-red-100
                          text-red-600
                          px-5
                          py-3
                          rounded-2xl
                          text-sm
                          font-semibold
                          transition-all
                          disabled:bg-gray-100
                          disabled:text-gray-400
                        "
                      >
                        {cancelClaimLoading ? "Membatalkan..." : "Batalkan Klaim"}
                      </button>
                    </div>
                  )}

                  {!selectedIsFindingReport &&
                    selectedClaimStatus &&
                    selectedClaimStatus.status === "diproses" &&
                    !canCancelSelectedClaim && (
                    <p className="mt-3 text-[11px] text-gray-400 font-semibold">
                      Batas pembatalan 24 jam sudah lewat.
                    </p>
                  )}

                  {!selectedIsFindingReport &&
                    !selectedClaimStatus &&
                    selectedReport.status_verifikasi === "terverifikasi" && (
                    <button
                      type="button"
                      onClick={this.goToCollection}
                      className="
                        mt-4
                        bg-[#0B2B5B]
                        hover:bg-[#081F42]
                        text-white
                        px-5
                        py-3
                        rounded-2xl
                        text-sm
                        font-semibold
                        transition-all
                      "
                    >
                      Klaim Barang
                    </button>
                  )}

                  {!selectedIsFindingReport &&
                    selectedClaimStatus &&
                    selectedClaimStatus.status === "ditolak" &&
                    selectedReport.status_verifikasi === "terverifikasi" && (
                    <button
                      type="button"
                      onClick={this.goToCollection}
                      className="
                        mt-4
                        bg-[#0B2B5B]
                        hover:bg-[#081F42]
                        text-white
                        px-5
                        py-3
                        rounded-2xl
                        text-sm
                        font-semibold
                        transition-all
                      "
                    >
                      Klaim Barang
                    </button>
                  )}

                </div>

              </div>

              {/* STEP 5 */}
              {!selectedIsFindingReport && (
              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div
                    className={`
                      w-11
                      h-11
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      text-xs
                      font-bold

                      ${
                    selectedReport.status_laporan === "selesai"
                          ? "bg-[#0B2B5B] text-white"
                          : selectedPickupNotification
                          ? "bg-[#DBEAFE] text-[#2563EB]"
                          : "bg-gray-100 text-gray-400"
                      }
                    `}
                      >
                      <i className="fas fa-box"></i>
                    </div>

                  <div className="w-[2px] h-14 bg-gray-200 mt-2"></div>

                  </div>

                <div className="flex-1">

                  <h3 className="text-[17px] font-bold text-[#0B2B5B]">
                    Siap Diambil
                  </h3>

                  <p className="text-[12px] text-gray-500">
                    {selectedPickupNotification
                      ? "Datang ke lokasi pengambilan dan tunjukkan kode pickup kepada admin."
                      : "Informasi pengambilan akan tampil setelah klaim disetujui admin."}
                  </p>

                </div>

              </div>
              )}

              {/* STEP 6 */}
              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div
                    className={`
                      w-11
                      h-11
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      text-sm
                      font-bold
                      ${
                        selectedReport.status_laporan === "selesai"
                          ? "bg-[#0B2B5B] text-white"
                          : "bg-gray-100 text-gray-400"
                      }
                    `}
                  >
                    <i className="fas fa-check-double"></i>
                  </div>

                </div>

                <div className="flex-1">

                  <h3 className="text-[17px] font-bold text-[#0B2B5B]">
                    Selesai
                  </h3>

                  <p className="text-[12px] text-gray-500">
                    {selectedReport.status_laporan === "selesai"
                      ? selectedIsFindingReport
                        ? "Dropoff barang sudah diverifikasi admin."
                      : "Pengambilan barang sudah diverifikasi admin."
                      : selectedIsFindingReport
                      ? "Selesai setelah admin memverifikasi kode dropoff."
                      : "Selesai setelah admin memverifikasi kode pickup."}
                  </p>

                </div>

              </div>

              {/* DETAIL */}
              <div className="bg-[#F8FAFC] rounded-3xl p-4 mt-5">

                <h3 className="text-[16px] font-bold text-[#0B2B5B] mb-4">
                  Detail Barang & Laporan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>

                    <p className="text-[10px] text-gray-400 mb-1">
                      Nama Barang
                    </p>

                    <h4 className="text-[14px] font-bold text-[#0B2B5B]">
                      {selectedReport.nama_barang}
                    </h4>

                  </div>

                  <div>

                    <p className="text-[10px] text-gray-400 mb-1">
                      Kategori
                    </p>

                    <h4 className="text-[14px] font-bold text-[#0B2B5B]">
                      {selectedReport.kategori}
                    </h4>

                  </div>

                  <div>

                    <p className="text-[10px] text-gray-400 mb-1">
                      Lokasi Kejadian
                    </p>

                    <h4 className="text-[14px] font-bold text-[#0B2B5B]">
                      {selectedReport.lokasi}
                    </h4>

                  </div>

                  <div>

                    <p className="text-[10px] text-gray-400 mb-1">
                      {selectedReport.jenis_laporan === "penemuan"
                        ? "Tanggal Penemuan"
                        : "Tanggal Kehilangan"}
                    </p>

                    <h4 className="text-[14px] font-bold text-[#0B2B5B]">
                      {selectedReport.tanggal_kejadian}
                    </h4>

                  </div>

                  <div>

                    <p className="text-[10px] text-gray-400 mb-1">
                      Jenis Laporan
                    </p>

                    <h4 className="text-[14px] font-bold text-[#0B2B5B] capitalize">
                      {selectedReport.jenis_laporan || "-"}
                    </h4>

                  </div>

                  <div>

                    <p className="text-[10px] text-gray-400 mb-1">
                      Status Laporan
                    </p>

                    <h4 className="text-[14px] font-bold text-[#0B2B5B] capitalize">
                      {selectedReport.status_laporan || "-"}
                    </h4>

                  </div>

                </div>

                {selectedReport.deskripsi && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-[10px] text-gray-400 mb-1">
                      Deskripsi
                    </p>
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      {selectedReport.deskripsi}
                    </p>
                  </div>
                )}

              </div>

                    </div>

                  </>
                      ) : (

                        <div className="h-full flex flex-col items-center justify-center py-24">

                          <div className="w-24 h-24 rounded-3xl bg-[#F8FAFC] flex items-center justify-center mb-6">

                            <i className="fas fa-inbox text-3xl text-[#0B2B5B]"></i>

                          </div>

                          <h2 className="text-[24px] font-bold text-[#0B2B5B] mb-3">
                            Belum Ada Laporan
                          </h2>

                          <p className="text-gray-400 text-[14px] text-center max-w-[320px] leading-relaxed">
                            Kamu belum memiliki laporan yang
                            masuk ke sistem verifikasi.
                          </p>

                        </div>

                      )}

              </div>

              {/* RIGHT */}
              <div className="col-span-4 space-y-4">

                {/* PICKUP */}
                <div className="bg-[#0B2B5B] rounded-[30px] p-6 text-white">

                  <h2 className="text-[24px] font-bold mb-2">
                    {selectedPickupNotification
                      ? selectedCodeLabel
                      : selectedIsFindingReport
                      ? "Kode Dropoff"
                      : "Kode Pengambilan"}
                  </h2>

                  <p className="text-[12px] text-gray-300 mb-5">
                    {selectedPickupNotification
                      ? selectedIsFindingReport
                        ? "Tunjukkan kode ini kepada admin saat menyerahkan barang."
                        : "Tunjukkan kode ini kepada admin saat mengambil barang."
                      : selectedIsFindingReport
                      ? "Ditampilkan setelah laporan penemuan disetujui admin"
                      : "Ditampilkan setelah klaim barang diterima admin"}
                  </p>

                  <div className="bg-white rounded-3xl min-h-40 flex flex-col items-center justify-center text-[#0B2B5B] px-5 text-center relative overflow-hidden">
                    <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0B2B5B]"></span>
                    <span className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0B2B5B]"></span>
                    {selectedPickupNotification ? (
                      <>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                          {selectedCodeLabel}
                        </p>
                        <p className="text-4xl font-black tracking-[0.2em]">
                          {selectedPickupCode || "------"}
                        </p>
                        <div className="w-full border-t border-dashed border-gray-200 my-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                          {selectedIsFindingReport ? "Barang yang diserahkan" : "Barang yang diambil"}
                        </p>
                        <p className="text-sm font-black">
                          {selectedReport.nama_barang}
                        </p>
                        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                          {selectedIsFindingReport
                            ? "Tunjukkan kode dropoff dan identitas ke admin. Kode akan diverifikasi untuk menyelesaikan dropoff."
                            : "Tunjukkan kode pickup dan identitas ke admin. Kode akan diverifikasi untuk menyelesaikan pengambilan."}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-sm">
                        {selectedIsFindingReport
                          ? "Menunggu laporan penemuan disetujui"
                          : "Menunggu klaim diterima"}
                      </p>
                    )}
                  </div>

                </div>

                {/* DETAIL */}
                <div className="
                  bg-[#E5EAF0]
                  rounded-2xl
                  p-5
                  shadow-sm
                ">

                  <h3 className="text-[20px] font-bold text-[#0B2B5B] mb-5">
                    Lokasi Pengambilan Barang
                  </h3>

                  <div className="space-y-5">

                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <i className="fas fa-map-marker-alt text-[#0B2B5B]"></i>
                      </div>

                      <div>
                        <p className="text-[11px] text-gray-400 mb-1">
                          Lokasi Pengambilan
                        </p>
                        <h4 className="text-[15px] font-bold text-[#0B2B5B]">
                          Pos Keamanan Nemu IPB
                        </h4>
                        <a
                          href="https://www.google.com/maps/search/?api=1&query=Kampus%20IPB%20Dramaga%20Bogor"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-gray-500 mt-1 inline-block hover:text-[#0B2B5B] hover:underline"
                        >
                          Kampus IPB Dramaga, Bogor
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <i className="far fa-clock text-[#0B2B5B]"></i>
                      </div>

                      <div>
                        <p className="text-[11px] text-gray-400 mb-1">
                          Jam Operasional
                        </p>
                        <h4 className="text-[15px] font-bold text-[#0B2B5B]">
                          08.00 - 17.00 WIB
                        </h4>
                        <p className="text-[12px] text-gray-500 mt-1">
                          Senin - Jumat
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <i className="fas fa-phone-alt text-[#0B2B5B]"></i>
                      </div>

                      <div>
                        <p className="text-[11px] text-gray-400 mb-1">
                          Kontak Petugas
                        </p>
                        <a
                          href="https://wa.me/6281234567890"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[15px] font-bold text-[#0B2B5B] hover:text-gray-400 transition-all hover:underline"
                        >
                          +62 812-3456-7890
                        </a>
                        <p className="text-[12px] text-gray-500 mt-1">
                          Admin NEMU IPB
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {showCancelClaimModal && (
            <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">
              <div className="bg-white rounded-[28px] shadow-2xl shadow-slate-900/20 border border-gray-100 w-full max-w-md p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 mx-auto">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>

                <h3 className="text-xl font-extrabold text-[#0B2B5B] mb-2">
                  Batalkan klaim?
                </h3>

                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Yakin dibatalkan? Klaim ini tidak bisa diubah.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={this.closeCancelClaimModal}
                    disabled={cancelClaimLoading}
                    className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-60"
                  >
                    Tidak
                  </button>

                  <button
                    type="button"
                    onClick={this.handleCancelClaim}
                    disabled={cancelClaimLoading}
                    className="px-5 py-3 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:bg-gray-300"
                  >
                    {cancelClaimLoading ? "Membatalkan..." : "Ya, Batalkan"}
                  </button>
                </div>
              </div>
            </div>
          )}

      </UserPageLayout>
    );
  }
}

export default VerificationReportPage;
