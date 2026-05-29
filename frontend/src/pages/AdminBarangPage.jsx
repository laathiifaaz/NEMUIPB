import React, { Component } from "react";
import AuthService from "../services/AuthService";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminBarangService from "../services/AdminBarangService";
import PageHeader from "../components/PageHeader";
import PageFooter from "../components/PageFooter";
import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

class AdminBarangPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      logs: [],
      actionType: "semua",
      sortBy: "newest",
      searchKeyword: "",
      exportType: "semua",
      showExportMenu: false,
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

    await this.loadLogs();
  }

  goToUserMode = () => {
    if (this.props.navigate) {
      this.props.navigate("/dashboard");
    } else {
      window.location.href = "/dashboard";
    }
  };

  toggleSidebar = () => {
    this.setState((prevState) => {
      const isSidebarExpanded = !prevState.isSidebarExpanded;
      setStoredSidebarExpanded(isSidebarExpanded);

      return { isSidebarExpanded };
    });
  };

  loadLogs = async () => {
    try {
      const data = await AdminBarangService.getLogs(
        this.state.actionType,
        this.state.sortBy
      );

      this.setState({
        logs: data,
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

  handleChange = (event) => {
    this.setState(
      {
        [event.target.name]: event.target.value,
        isLoading: true,
      },
      this.loadLogs
    );
  };

  handleSearchChange = (event) => {
    this.setState({
      searchKeyword: event.target.value,
    });
  };

  getVisibleLogs(logs) {
    const keyword = this.state.searchKeyword.trim().toLowerCase();

    if (!keyword) return logs;

    return logs.filter((log) =>
      [
        log.item_id,
        log.item_name,
        log.action_type,
        log.administrator,
        log.note,
        this.formatTimestamp(log.timestamp),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }

  handleExportTypeChange = (event) => {
    this.setState({
      exportType: event.target.value,
    });
  };

  toggleExportMenu = () => {
    this.setState((prevState) => ({
      showExportMenu: !prevState.showExportMenu,
    }));
  };

  handleExportSelection = (exportType) => {
    this.setState(
      {
        exportType,
        showExportMenu: false,
      },
      this.handleExport
    );
  };

  convertToCSV = (data) => {
    if (!data || data.length === 0) return "";

    const headers = [
      "log_id",
      "timestamp",
      "item_id",
      "item_name",
      "action_type",
      "administrator",
      "note",
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
      const data = await AdminBarangService.exportLogs();
      const exportData =
        this.state.exportType === "semua"
          ? data
          : data.filter((item) => item.action_type === this.state.exportType);
      const csv = this.convertToCSV(exportData);

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
      link.download =
        this.state.exportType === "semua"
          ? "activity-logs-nemuipb.csv"
          : `activity-logs-${this.state.exportType}-nemuipb.csv`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    }
  };

  getActionClass(actionType) {
    if (actionType === "verified") return "bg-green-100 text-green-700";
    if (actionType === "rejected") return "bg-red-100 text-red-700";
    if (actionType === "returned") return "bg-[#F4D35E] text-[#5C4A00]";
    if (actionType === "claim_pending") return "bg-purple-100 text-purple-700";

    return "bg-gray-100 text-gray-600";
  }

  getActionLabel(actionType) {
    const labels = {
      verified: "Terverifikasi",
      rejected: "Ditolak",
      claim_pending: "Klaim Menunggu",
      returned: "Dikembalikan",
    };

    return labels[actionType] || actionType || "-";
  }

  formatTimestamp(timestamp) {
    if (!timestamp) return "-";

    return new Date(timestamp).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  render() {
    const { logs, isLoading, error } = this.state;
    const visibleLogs = this.getVisibleLogs(logs);

    return (
      <div className="min-h-screen bg-[#F6F7FB] font-['Plus_Jakarta_Sans'] text-[#002B5B]">
        <div className="flex min-h-screen">
          <AdminSidebar
            activeMenu="barang"
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

            <section className="mb-8">
              <h2 className="text-4xl font-extrabold mb-2">Koleksi Barang</h2>
              <p className="text-gray-500 text-sm max-w-xl">
                Riwayat aktivitas barang, laporan, klaim, dan perubahan status
                pada sistem NEMU IPB.
              </p>
            </section>

            <section className="mb-4 flex justify-end">
              <div className="relative">
                <button
                  type="button"
                  onClick={this.toggleExportMenu}
                  className="bg-white border border-gray-100 text-[#002B5B] rounded-xl px-4 py-2.5 text-xs font-black hover:bg-gray-50 transition-all shadow-sm"
                >
                  <i className="fas fa-download mr-2"></i>
                  Ekspor CSV
                </button>

                {this.state.showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-gray-100 shadow-xl p-2 z-30">
                    {[
                      { value: "semua", label: "Semua Aktivitas" },
                      { value: "verified", label: "Terverifikasi" },
                      { value: "rejected", label: "Ditolak" },
                      { value: "claim_pending", label: "Klaim Menunggu" },
                      { value: "returned", label: "Dikembalikan" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => this.handleExportSelection(option.value)}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-[#F8FAFD] hover:text-[#002B5B] transition-all"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-[24px] p-6 mb-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase">
                    Cari Aktivitas
                  </label>

                  <div className="relative mt-2">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input
                      type="text"
                      value={this.state.searchKeyword}
                      onChange={this.handleSearchChange}
                      placeholder="Cari ID barang, nama, aktivitas, admin, atau catatan"
                      className="w-full bg-gray-100 rounded-xl py-3 pl-12 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#002B5B]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">
                    Jenis Aktivitas
                  </label>

                  <select
                    name="actionType"
                    value={this.state.actionType}
                    onChange={this.handleChange}
                    className="w-full mt-2 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="semua">Semua Aktivitas</option>
                    <option value="verified">Terverifikasi</option>
                    <option value="rejected">Ditolak</option>
                    <option value="claim_pending">Klaim Menunggu</option>
                    <option value="returned">Dikembalikan</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">
                    Urutan
                  </label>

                  <select
                    name="sortBy"
                    value={this.state.sortBy}
                    onChange={this.handleChange}
                    className="w-full mt-2 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                  </select>
                </div>

              </div>
            </section>

            <section className="bg-white rounded-[30px] p-8 shadow-sm">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold">
                  {error}
                </div>
              )}

              {isLoading ? (
                <p className="text-gray-400 text-sm">Memuat log...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="text-left py-4">ID Barang</th>
                        <th className="text-left py-4">Nama Barang</th>
                        <th className="text-left py-4">Aktivitas</th>
                        <th className="text-left py-4">Administrator</th>
                        <th className="text-left py-4">Catatan</th>
                        <th className="text-left py-4">Waktu</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleLogs.map((log) => (
                        <tr
                          key={log.log_id}
                          className="border-b border-gray-50 hover:bg-gray-50"
                        >
                          <td className="py-5 font-black text-xs text-[#002B5B]">
                            {log.item_id || "-"}
                          </td>

                          <td className="py-5 font-bold">
                            {log.item_name || "-"}
                          </td>

                          <td className="py-5">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black ${this.getActionClass(
                                log.action_type
                              )}`}
                            >
                              {this.getActionLabel(log.action_type)}
                            </span>
                          </td>

                          <td className="py-5 text-gray-500">
                            {log.administrator || "Sistem"}
                          </td>

                          <td className="py-5 text-gray-500 max-w-md">
                            {log.note || "-"}
                          </td>

                          <td className="py-5 text-gray-500">
                            {this.formatTimestamp(log.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {visibleLogs.length === 0 && (
                    <div className="py-10 text-center text-sm font-semibold text-gray-400">
                      Tidak ada aktivitas yang cocok dengan pencarian.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center mt-8 text-xs text-gray-500">
                <p>Menampilkan {visibleLogs.length} dari {logs.length} log</p>
              </div>
            </section>

            <PageFooter />
          </main>
        </div>
      </div>
    );
  }
}

export default AdminBarangPage;
