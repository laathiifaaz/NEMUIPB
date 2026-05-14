import React, { Component } from "react";
import AuthService from "../services/AuthService";
import AdminService from "../services/AdminService";
import AdminSidebar from "../components/admin/AdminSidebar";

class AdminDashboardPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      summary: {
        active_lost: 0,
        total_found: 0,
        pending_verification: 0,
        pending_claims: 0,
      },
      chart: [],
      reports: [],
      selectedReport: null,
      showDetailModal: false,
      confirmModal: {
        show: false,
        type: null,
        laporanId: null,
      },
      selectedFilter: "semua",
      showFilterMenu: false,
      isLoading: true,
      error: null,
      isSidebarExpanded: true,
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
    this.setState({
      isSidebarExpanded: !this.state.isSidebarExpanded,
    });
  };

  loadDashboardData = async () => {
    try {
      const summary = await AdminService.getSummary();
      const chart = await AdminService.getChart();
      const reports = await AdminService.getRecentReports(
        this.state.selectedFilter
      );

      this.setState({
        summary,
        chart,
        reports,
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

  handleCloseDetail = () => {
    this.setState({
      selectedReport: null,
      showDetailModal: false,
    });
  };

  isFinalStatus(report) {
    return (
      report.status_barang === "selesai" ||
      report.status_barang === "dikembalikan" ||
      report.status_laporan === "disetujui" ||
      report.status_laporan === "ditolak"
    );
  }

  openVerifyConfirm = (laporanId) => {
    this.setState({
      confirmModal: {
        show: true,
        type: "verify",
        laporanId,
      },
    });
  };

  openDenyConfirm = (laporanId) => {
    this.setState({
      confirmModal: {
        show: true,
        type: "deny",
        laporanId,
      },
    });
  };

  closeConfirmModal = () => {
    this.setState({
      confirmModal: {
        show: false,
        type: null,
        laporanId: null,
      },
    });
  };

  handleConfirmAction = async () => {
    const { type, laporanId } = this.state.confirmModal;

    try {
      if (type === "verify") {
        await AdminService.verifyReport(laporanId);
      }

      if (type === "deny") {
        await AdminService.denyReport(laporanId);
      }

      this.closeConfirmModal();
      this.handleCloseDetail();

      await this.loadDashboardData();
    } catch (error) {
      alert(error.message);
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
    if (status === "ditemukan") return "bg-[#006D8F] text-white";
    if (status === "hilang") return "bg-blue-100 text-[#002B5B]";
    if (status === "selesai" || status === "dikembalikan")
      return "bg-[#F4D35E] text-[#5C4A00]";
    if (status === "ditolak") return "bg-red-100 text-red-600";

    return "bg-gray-100 text-gray-500";
  }

  renderChart() {
    const { chart } = this.state;

    if (!chart || chart.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          Belum ada data chart.
        </div>
      );
    }

    const maxValue = Math.max(
      ...chart.map((item) => Math.max(item.lost || 0, item.found || 0)),
      1
    );

    return (
      <div className="h-64 flex items-end gap-8 px-6">
        {chart.map((item, index) => {
          const lostHeight = ((item.lost || 0) / maxValue) * 100;
          const foundHeight = ((item.found || 0) / maxValue) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full h-48 flex items-end gap-1">
                <div
                  className="w-full bg-[#002B5B] rounded-t-sm"
                  style={{ height: `${Math.max(lostHeight, 8)}%` }}
                ></div>
                <div
                  className="w-full bg-[#F7E7AA] rounded-t-sm"
                  style={{ height: `${Math.max(foundHeight, 8)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-4">{item.week}</p>
            </div>
          );
        })}
      </div>
    );
  }

  renderDetailModal() {
    const report = this.state.selectedReport;

    if (!this.state.showDetailModal || !report) return null;

    const isDisabled = this.isFinalStatus(report);

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-[30px] w-full max-w-5xl p-6 relative">
          <button
            onClick={this.handleCloseDetail}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600"
          >
            <i className="fas fa-times"></i>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div>
              <div className="relative rounded-[25px] overflow-hidden bg-gray-100">
                <span className="absolute top-4 left-4 bg-[#006D8F] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase">
                  {report.status_barang}
                </span>

                <img
                  src={
                    report.dokumentasi
                      ? `/assets/images/${report.dokumentasi}`
                      : "/assets/images/bag.jpg"
                  }
                  alt={report.item_name}
                  className="w-full h-72 object-cover"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[#9A7D0A] text-xs font-black uppercase tracking-widest">
                    {report.kategori || "Kategori"}
                  </p>

                  <h2 className="text-3xl font-extrabold text-[#002B5B]">
                    {report.item_name}
                  </h2>
                </div>

                <div className="text-right">
                  <p className="text-gray-400 text-xs font-black uppercase">
                    Dilaporkan
                  </p>
                  <p className="text-[#002B5B] font-semibold">
                    {report.tanggal_kejadian}
                  </p>
                </div>
              </div>

              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                {report.deskripsi || "Tidak ada deskripsi."}
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="bg-gray-100 px-5 py-3 rounded-xl text-sm font-bold text-gray-700">
                  <i className="fas fa-map-marker-alt mr-2 text-[#002B5B]"></i>
                  {report.lokasi}
                </div>

                <div className="bg-gray-100 px-5 py-3 rounded-xl text-sm font-bold text-gray-700">
                  <i className="fas fa-user mr-2 text-[#002B5B]"></i>
                  {report.reporter}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400 font-bold">
                  ID: #IPB-{report.laporan_id}
                </p>

                <div className="flex gap-3">
                  <button
                    disabled={isDisabled}
                    onClick={() => this.openVerifyConfirm(report.laporan_id)}
                    className={`px-6 py-3 rounded-lg text-xs font-bold ${
                      isDisabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#002B5B] text-white"
                    }`}
                  >
                    Verify
                  </button>

                  <button
                    disabled={isDisabled}
                    onClick={() => this.openDenyConfirm(report.laporan_id)}
                    className={`px-6 py-3 rounded-lg text-xs font-bold ${
                      isDisabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    Deny
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
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center px-6">
      <div className="bg-white rounded-[24px] w-full max-w-xl px-10 py-10 text-center shadow-2xl">
        <div className="mx-auto mb-5 w-0 h-0 border-l-[38px] border-l-transparent border-r-[38px] border-r-transparent border-b-[66px] border-b-[#FFD75A] relative">
          <span className="absolute -left-[9px] top-5 text-white text-4xl font-black">
            ?
          </span>
        </div>

        <h2 className="text-3xl font-extrabold text-black mb-4">
          {isDeny ? "Tolak Laporan?" : "Verifikasi Laporan?"}
        </h2>

        <p className="text-gray-500 text-lg mb-10">
          {isDeny
            ? "Laporan yang ditolak tidak dapat diubah."
            : "Laporan yang disetujui tidak dapat diubah."}
        </p>

        <div className="grid grid-cols-2 gap-5">
          <button
            onClick={this.closeConfirmModal}
            className="py-4 rounded-xl bg-[#E8EEF5] text-[#002B5B] font-extrabold text-lg"
          >
            Tidak
          </button>

          <button
            onClick={this.handleConfirmAction}
            className={`py-4 rounded-xl text-white font-extrabold text-lg ${
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

  render() {
    const { reports, summary, error, isLoading } = this.state;

    return (
      <div className="min-h-screen bg-[#F6F7FB] font-['Plus_Jakarta_Sans'] text-[#002B5B]">
        <div className="flex min-h-screen">
          <AdminSidebar 
            activeMenu="dashboard"
            expanded={this.state.isSidebarExpanded} 
            navigate={this.props.navigate}
          />

          <main className="flex-1 p-6 md:p-10 overflow-y-auto">
            <header className="bg-white rounded-2xl px-8 py-5 flex items-center justify-between mb-8 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                    onClick={this.toggleSidebar}
                    className="text-[#002B5B] hover:bg-gray-100 p-2 rounded-lg transition-colors"
                    >
                    <i className="fas fa-bars text-2xl"></i>
                    </button>

                    <h1 className="font-extrabold text-[#002B5B] text-xl">
                    NEMUIPB
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                    onClick={this.goToUserMode}
                    className="bg-[#002B5B] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#001f42] transition-all"
                    >
                    User Mode
                    </button>

                    <div className="w-11 h-11 bg-[#002B5B]/10 rounded-xl flex items-center justify-center">
                    <i className="fas fa-user-shield text-[#002B5B]"></i>
                    </div>
                </div>
                </header>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold">
                {error}
              </div>
            )}

            <section className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
              <div>
                <h2 className="text-4xl font-extrabold text-[#002B5B] mb-2">
                  Welcome Admin’s
                </h2>
                <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
                  A view of lost and found assets across IPB University campuses.
                  High-priority verifications are highlighted.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="bg-gray-200 px-7 py-4 rounded-xl text-center">
                  <p className="text-[10px] font-black tracking-widest text-gray-500">
                    ACTIVE LOST
                  </p>
                  <p className="text-2xl font-black text-[#002B5B]">
                    {summary.active_lost}
                  </p>
                </div>

                <div className="bg-[#002B5B] px-7 py-4 rounded-xl text-center">
                  <p className="text-[10px] font-black tracking-widest text-white/70">
                    TOTAL FOUND
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
                    <h3 className="text-xl font-extrabold">Trends & Metrics</h3>
                    <p className="text-xs text-gray-400">
                      Lost vs Found volume (Last 30 days)
                    </p>
                  </div>

                  <div className="flex gap-4 text-xs font-bold">
                    <span>
                      <i className="fas fa-circle text-[#002B5B] mr-1"></i>
                      Lost
                    </span>
                    <span>
                      <i className="fas fa-circle text-[#F4D35E] mr-1"></i>
                      Found
                    </span>
                  </div>
                </div>

                {this.renderChart()}
              </div>

              <div className="bg-[#002B5B] text-white rounded-[30px] p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-white text-[#002B5B] rounded-xl flex items-center justify-center mb-6">
                    <i className="fas fa-certificate"></i>
                  </div>

                  <h3 className="text-2xl font-medium leading-tight mb-3">
                    Identity Verification Pending
                  </h3>

                  <p className="text-sm text-white/60 leading-relaxed">
                    There are {summary.pending_claims} claimants waiting for
                    identity verification. Quick approval keeps the system fluid.
                  </p>
                </div>

                <button className="mt-8 w-full bg-[#F4D35E] text-[#5C4A00] py-4 rounded-2xl text-xs font-black tracking-widest hover:scale-105 transition-all">
                  VERIFY CLAIMANTS
                </button>
              </div>
            </section>

            <section className="bg-white rounded-[30px] p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-extrabold">Recent Reports</h3>

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
                <p className="text-gray-400 text-sm">Loading reports...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-gray-400 uppercase tracking-widest">
                        <th className="text-left py-4">ID</th>
                        <th className="text-left py-4">Item Name</th>
                        <th className="text-left py-4">Reporter</th>
                        <th className="text-left py-4">Status</th>
                        <th className="text-left py-4">Date</th>
                        <th className="text-left py-4">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {reports.map((report) => {
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
                                  report.status_barang
                                )}`}
                              >
                                {report.status_barang}
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
                                Verify
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
                                Deny
                              </button>

                              <button
                                onClick={() => this.handleOpenDetail(report)}
                                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
                {this.renderDetailModal()}
                {this.renderConfirmModal()}

              <div className="flex justify-between items-center mt-8 text-xs text-gray-500">
                <p>Showing {reports.length} reports</p>
              </div>
            </section>

            {this.renderDetailModal()}
          </main>
            {this.renderDetailModal()}
            {this.renderConfirmModal()}
        </div>
      </div>
    );
  }
}

export default AdminDashboardPage;