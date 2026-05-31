import React, { Component } from "react";
import AuthService from "../services/AuthService";
import AdminService from "../services/AdminService";
import ReportService from "../services/ReportService";
import BarangService from "../services/BarangService";
import AdminSidebar from "../components/admin/AdminSidebar";
import PageHeader from "../components/PageHeader";
import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

class AdminPickupHistoryPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pickupHistory: [],
      pickupHistoryCurrentPage: 1,
      pickupHistoryPerPage: 10,
      pickupHistoryLoading: true,
      isSidebarExpanded: getStoredSidebarExpanded(),
      showPickupHistoryDetailModal: false,
      selectedPickupHistory: null,
      selectedPickupHistoryReport: null,
      selectedPickupHistoryBarang: null,
      selectedPickupHistoryDocument: null,
      pickupHistoryDocumentLoading: false,
    };
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user || user.role !== "admin") {
      window.location.href = "/dashboard";
      return;
    }

    this.fetchPickupHistory();
    window.addEventListener("focus", this.handleFocusChange);
  }

  componentWillUnmount() {
    window.removeEventListener("focus", this.handleFocusChange);
  }

  handleFocusChange = () => {
    this.fetchPickupHistory();
  };

  toggleSidebar = () => {
    this.setState((prevState) => {
      const isSidebarExpanded = !prevState.isSidebarExpanded;
      setStoredSidebarExpanded(isSidebarExpanded);

      return { isSidebarExpanded };
    });
  };

  openPickupHistoryDetail = (item) => {
    this.setState({
      showPickupHistoryDetailModal: true,
      selectedPickupHistory: item,
      selectedPickupHistoryReport: null,
      selectedPickupHistoryBarang: null,
      selectedPickupHistoryDocument: null,
      pickupHistoryDocumentLoading: true,
    });

    const detailRequests = [];

    if (item?.laporan_id || item?.laporan_kehilangan_id) {
      detailRequests.push(
        ReportService.getReportDetail(
          item.laporan_id || item.laporan_kehilangan_id
        )
      );
    } else {
      detailRequests.push(Promise.resolve(null));
    }

    if (item?.barang_id) {
      detailRequests.push(BarangService.getDetailBarang(item.barang_id));
    } else {
      detailRequests.push(Promise.resolve(null));
    }

    if (item?.klaim_id) {
      detailRequests.push(AdminService.getSerahTerima(item.klaim_id));
    } else {
      detailRequests.push(Promise.resolve(null));
    }

    Promise.allSettled(detailRequests).then((results) => {
      const [reportResult, barangResult, documentResult] = results;

      this.setState({
        selectedPickupHistoryReport:
          reportResult?.status === "fulfilled" ? reportResult.value : null,
        selectedPickupHistoryBarang:
          barangResult?.status === "fulfilled" ? barangResult.value : null,
        selectedPickupHistoryDocument:
          documentResult?.status === "fulfilled" ? documentResult.value : null,
        pickupHistoryDocumentLoading: false,
      });
    });
  };

  closePickupHistoryDetail = () => {
    this.setState({
      showPickupHistoryDetailModal: false,
      selectedPickupHistory: null,
      selectedPickupHistoryDocument: null,
      pickupHistoryDocumentLoading: false,
    });
  };

  setPickupHistoryPage = (page) => {
    this.setState({
      pickupHistoryCurrentPage: page,
    });
  };

  goToDashboard = () => {
    if (this.props.navigate) {
      this.props.navigate("/admin");
      return;
    }

    window.location.href = "/admin";
  };

  fetchPickupHistory = async () => {
    this.setState({ pickupHistoryLoading: true });

    try {
      const data = await AdminService.getPickupHistory();

      this.setState({
        pickupHistory: Array.isArray(data) ? data : [],
        pickupHistoryCurrentPage: 1,
        pickupHistoryLoading: false,
      });
    } catch (error) {
      console.log(error);

      this.setState({
        pickupHistory: [],
        pickupHistoryLoading: false,
      });
    }
  };

  formatDateTime(value) {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return value;
    }
  }

  formatVerifiedDate(value) {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return value;
    }
  }

  getImageSrc(dokumentasi) {
    if (!dokumentasi) return "/images/no-image.png";
    if (dokumentasi.startsWith("data:image/")) return dokumentasi;
    if (dokumentasi.startsWith("http")) return dokumentasi;
    if (dokumentasi.startsWith("/")) return dokumentasi;

    return `/images/${dokumentasi}`;
  }

  render() {
    const {
      pickupHistory,
      pickupHistoryCurrentPage,
      pickupHistoryPerPage,
      pickupHistoryLoading,
      isSidebarExpanded,
      showPickupHistoryDetailModal,
      selectedPickupHistory,
      selectedPickupHistoryReport,
      selectedPickupHistoryBarang,
      selectedPickupHistoryDocument,
      pickupHistoryDocumentLoading,
    } = this.state;
    const sortedHistory = [...pickupHistory].sort((a, b) => {
      const left = new Date(b.verified_at || 0).getTime();
      const right = new Date(a.verified_at || 0).getTime();

      return left - right;
    });
    const totalPickupHistoryPages = Math.max(
      1,
      Math.ceil(sortedHistory.length / pickupHistoryPerPage)
    );
    const safePickupHistoryPage = Math.min(
      pickupHistoryCurrentPage,
      totalPickupHistoryPages
    );
    const pickupHistoryStartIndex =
      (safePickupHistoryPage - 1) * pickupHistoryPerPage;
    const paginatedPickupHistory = sortedHistory.slice(
      pickupHistoryStartIndex,
      pickupHistoryStartIndex + pickupHistoryPerPage
    );

    return (
      <div className="min-h-screen bg-[#F6F7FB] font-['Plus_Jakarta_Sans'] text-[#002B5B]">
        <div className="flex min-h-screen">
          <AdminSidebar
            activeMenu="dashboard"
            expanded={isSidebarExpanded}
            navigate={this.props.navigate}
          />

          <main
            className={`flex-1 p-6 md:p-10 overflow-y-auto transition-[margin] duration-300 ${
              isSidebarExpanded ? "ml-64" : "ml-16"
            }`}
          >
            <PageHeader
              onToggleSidebar={this.toggleSidebar}
              navigate={this.props.navigate}
              profileIcon="fa-user-shield"
              actions={
                <button
                  type="button"
                  onClick={() => {
                    if (this.props.navigate) {
                      this.props.navigate("/dashboard");
                    } else {
                      window.location.href = "/dashboard";
                    }
                  }}
                  className="bg-[#002B5B] hover:bg-[#001f42] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 transition-all"
                >
                  <i className="fas fa-user mr-2"></i>
                  Mode Pengguna
                </button>
              }
            />

            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-[#163A70] mb-2">
                  Riwayat Serah Terima
                </h1>
                <p className="text-gray-500 text-sm">
                  Daftar kode pickup yang sudah diverifikasi admin beserta detail klaimnya.
                </p>
              </div>

              <button
                type="button"
                onClick={this.goToDashboard}
                className="bg-[#002B5B] hover:bg-[#001f42] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 transition-all whitespace-nowrap self-start md:self-auto"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Kembali ke Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-[24px] border border-[#E7ECF3] p-6">
                <p className="text-sm text-gray-400 font-bold mb-2">
                  Total Riwayat
                </p>
                <h2 className="text-3xl font-black text-[#163A70]">
                  {sortedHistory.length}
                </h2>
              </div>

              <div className="bg-white rounded-[24px] border border-[#E7ECF3] p-6">
                <p className="text-sm text-gray-400 font-bold mb-2">
                  Pickup
                </p>
                <h2 className="text-3xl font-black text-[#163A70]">
                  {sortedHistory.filter((item) => item.code_type === "pickup").length}
                </h2>
              </div>

              <div className="bg-white rounded-[24px] border border-[#E7ECF3] p-6">
                <p className="text-sm text-gray-400 font-bold mb-2">
                  Terbaru
                </p>
                <h2 className="text-xl font-black text-[#163A70] truncate">
                  {sortedHistory[0]?.code || "-"}
                </h2>
              </div>
            </div>

            {pickupHistoryLoading ? (
              <div className="bg-white rounded-[28px] p-16 text-center border border-[#E7ECF3]">
                <i className="fas fa-spinner fa-spin text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-400 font-semibold">
                  Memuat riwayat serah terima...
                </p>
              </div>
            ) : sortedHistory.length === 0 ? (
              <div className="bg-white rounded-[28px] p-16 text-center border border-[#E7ECF3]">
                <i className="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-400 font-semibold">
                  Belum ada riwayat serah terima pickup.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedPickupHistory.map((item, index) => (
                  <div
                    key={`${item.code}-${item.verified_at || index}`}
                    className="bg-white border border-[#E7ECF3] rounded-[22px] p-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-lg font-extrabold text-[#163A70]">
                          {item.code || "-"}
                        </p>
                        <span className="text-[10px] font-black bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                          Pickup
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mt-1">
                        Klaim #{item.klaim_id || "-"} - Barang #{item.barang_id || "-"}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        Laporan #{item.laporan_id || "-"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end text-right gap-2 md:min-w-[180px]">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#0F9F4B] mb-1">
                          Diverifikasi
                        </p>
                        <p className="text-sm font-bold text-[#102348]">
                          {this.formatVerifiedDate(item.verified_at)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => this.openPickupHistoryDetail(item)}
                        className="inline-flex items-center justify-center rounded-xl bg-[#163A70] px-4 py-2 text-xs font-black text-white hover:bg-[#102348] transition-all"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sortedHistory.length > pickupHistoryPerPage && (
              <div className="flex items-center justify-between gap-4 mt-6 text-xs text-gray-500">
                <p>
                  Menampilkan{" "}
                  {sortedHistory.length === 0 ? 0 : pickupHistoryStartIndex + 1}
                  -
                  {Math.min(
                    pickupHistoryStartIndex + pickupHistoryPerPage,
                    sortedHistory.length
                  )}{" "}
                  dari {sortedHistory.length} riwayat
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      this.setPickupHistoryPage(
                        Math.max(1, safePickupHistoryPage - 1)
                      )
                    }
                    disabled={safePickupHistoryPage === 1}
                    className="w-9 h-9 rounded-xl border border-[#E7ECF3] bg-white text-[#163A70] font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FB] transition-all"
                  >
                    â€¹
                  </button>

                  <span className="text-[11px] font-bold text-[#163A70] px-2">
                    {safePickupHistoryPage} / {totalPickupHistoryPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      this.setPickupHistoryPage(
                        Math.min(
                          totalPickupHistoryPages,
                          safePickupHistoryPage + 1
                        )
                      )
                    }
                    disabled={safePickupHistoryPage === totalPickupHistoryPages}
                    className="w-9 h-9 rounded-xl border border-[#E7ECF3] bg-white text-[#163A70] font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7FB] transition-all"
                  >
                    â€º
                  </button>
                </div>
              </div>
            )}

            {showPickupHistoryDetailModal && selectedPickupHistory ? (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 py-6">
                <div className="bg-white rounded-[28px] w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
                  <div className="sticky top-0 z-10 bg-white border-b border-[#EEF2F6] px-6 py-5 flex items-center justify-between rounded-t-[28px]">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#102348]">
                        Detail Serah Terima
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Status verifikasi, dokumen serah terima, dan detail terkait.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={this.closePickupHistoryDetail}
                      className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      aria-label="Tutup detail serah terima"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="rounded-xl border border-green-100 bg-[#EEFDF3] px-4 py-3 text-[#0F9F4B]">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em]">
                            Status Verifikasi
                          </p>
                          <h3 className="text-[15px] font-extrabold leading-tight">
                            Sudah diverifikasi
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-start gap-2 text-[10px] font-black text-[#102348]">
                          <span className="rounded-lg bg-white/80 px-2.5 py-1.5">
                            Kode: {selectedPickupHistory.code || "-"}
                          </span>
                          <span className="rounded-lg bg-white/80 px-2.5 py-1.5">
                            Klaim #{selectedPickupHistory.klaim_id || "-"}
                          </span>
                          <div className="ml-auto flex flex-col items-end text-right">
                            <span className="text-[10px] uppercase tracking-widest text-[#0F9F4B]">
                              Diverifikasi
                            </span>
                            <span className="text-[11px] font-bold text-[#102348]">
                              {this.formatVerifiedDate(selectedPickupHistory.verified_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1.9fr_1fr] gap-4">
                      <div className="bg-[#F8FAFC] rounded-2xl border border-[#E7ECF3] p-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                          Dokumen Serah Terima
                        </p>
                        <pre className="whitespace-pre-wrap break-words text-[11px] font-semibold text-gray-700 leading-[1.45]">
                          {pickupHistoryDocumentLoading
                            ? "Memuat dokumen serah terima..."
                            : selectedPickupHistoryDocument?.dokumen_text ||
                              "-"}
                        </pre>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-[#E7ECF3] p-5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Pickup
                          </p>
                          <p className="text-[12px] font-bold text-[#102348]">
                            {selectedPickupHistory.code || "-"}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Klaim #{selectedPickupHistory.klaim_id || "-"}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Diverifikasi: {this.formatDateTime(selectedPickupHistory.verified_at)}
                          </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-[#E7ECF3] p-5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Detail Terkait
                          </p>
                          <div className="space-y-1.5 text-[11px]">
                            <p className="font-bold text-[#102348]">
                              Barang #{selectedPickupHistory.barang_id || "-"}
                            </p>
                            <p className="text-gray-500">
                              Laporan #{selectedPickupHistory.laporan_id || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <section className="border border-[#E7ECF3] rounded-2xl p-5 bg-white">
                        <h3 className="text-lg font-extrabold text-[#163A70] mb-4">
                          Detail Laporan Kehilangan User
                        </h3>

                        <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                          <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                            <img
                              src={this.getImageSrc(
                                selectedPickupHistoryReport?.dokumentasi ||
                                  selectedPickupHistoryReport?.barang?.dokumentasi ||
                                  selectedPickupHistoryReport?.barang?.foto ||
                                  selectedPickupHistoryReport?.gambar ||
                                  selectedPickupHistory?.dokumentasi
                              )}
                              alt={
                                selectedPickupHistoryReport?.nama_barang ||
                                "Laporan kehilangan"
                              }
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Laporan Kehilangan
                            </p>
                            <p className="font-semibold text-[#102348]">
                            {selectedPickupHistoryReport?.nama_barang ||
                              selectedPickupHistoryReport?.item_name ||
                              selectedPickupHistoryReport?.barang?.nama_barang ||
                              selectedPickupHistoryReport?.barang?.item_name ||
                              "-"}
                          </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Pelapor
                              </p>
                              <p className="font-semibold text-gray-600">
                                {selectedPickupHistoryReport?.pelapor || selectedPickupHistoryReport?.reporter || selectedPickupHistory?.pelapor || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Lokasi
                              </p>
                              <p className="font-semibold text-gray-600">
                                {selectedPickupHistoryReport?.lokasi || selectedPickupHistoryReport?.barang?.lokasi || selectedPickupHistory?.lokasi || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Tanggal
                              </p>
                              <p className="font-semibold text-gray-600">
                                {selectedPickupHistoryReport?.tanggal_kejadian || selectedPickupHistoryReport?.tanggal_laporan || selectedPickupHistoryReport?.barang?.tanggal_kejadian || selectedPickupHistory?.tanggal_kejadian || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Jenis
                              </p>
                              <p className="font-semibold text-gray-600">
                                {selectedPickupHistoryReport?.jenis_laporan || selectedPickupHistoryReport?.jenis || selectedPickupHistory?.jenis_laporan || "-"}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Kategori
                              </p>
                              <p className="font-semibold text-gray-600">
                                {selectedPickupHistoryReport?.kategori || selectedPickupHistoryReport?.barang?.kategori || selectedPickupHistory?.kategori || "-"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Deskripsi
                            </p>
                            <p className="font-semibold text-gray-600 leading-relaxed">
                              {selectedPickupHistoryReport?.deskripsi || selectedPickupHistoryReport?.deskripsi_barang || selectedPickupHistoryReport?.barang?.deskripsi || selectedPickupHistory?.deskripsi || "-"}
                            </p>
                          </div>
                        </div>
                      </section>

                      <section className="border border-[#E7ECF3] rounded-2xl p-5 bg-white">
                        <h3 className="text-lg font-extrabold text-[#163A70] mb-4">
                          Detail Barang yang Diklaim
                        </h3>

                        <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                          <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                            <img
                              src={this.getImageSrc(
                                selectedPickupHistoryBarang?.dokumentasi ||
                                  selectedPickupHistoryBarang?.foto ||
                                  selectedPickupHistoryBarang?.image ||
                                  selectedPickupHistory?.dokumentasi
                              )}
                              alt={
                                selectedPickupHistoryBarang?.nama_barang ||
                                "Barang diklaim"
                              }
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Nama Barang
                            </p>
                            <p className="font-semibold text-[#102348]">
                            {selectedPickupHistoryBarang?.nama_barang ||
                              selectedPickupHistoryBarang?.item_name ||
                              selectedPickupHistory?.nama_barang ||
                              selectedPickupHistoryReport?.barang?.nama_barang ||
                              "-"}
                          </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                ID Barang
                              </p>
                              <p className="font-semibold text-gray-600">
                                #{selectedPickupHistory?.barang_id || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Status
                              </p>
                              <p className="font-semibold text-gray-600">
                                {selectedPickupHistoryBarang?.status_barang || selectedPickupHistory?.status_barang || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Kategori
                              </p>
                              <p className="font-semibold text-gray-600">
                                {selectedPickupHistoryBarang?.kategori || selectedPickupHistoryReport?.barang?.kategori || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Lokasi
                              </p>
                              <p className="font-semibold text-gray-600">
                                {selectedPickupHistoryBarang?.lokasi || selectedPickupHistoryReport?.barang?.lokasi || "-"}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Tanggal Penemuan
                              </p>
                              <p className="font-semibold text-gray-600">
                                {selectedPickupHistoryBarang?.tanggal_kejadian || selectedPickupHistoryBarang?.tanggal_laporan || selectedPickupHistory?.tanggal_kejadian || "-"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Deskripsi
                            </p>
                            <p className="font-semibold text-gray-600 leading-relaxed">
                              {selectedPickupHistoryBarang?.deskripsi || selectedPickupHistoryBarang?.deskripsi_barang || selectedPickupHistory?.deskripsi || "-"}
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    );
  }
}

export default AdminPickupHistoryPage;
