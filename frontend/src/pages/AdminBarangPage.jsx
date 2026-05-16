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
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  handleFilter = async () => {
    this.setState({ isLoading: true }, async () => {
      await this.loadLogs();
    });
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
      link.download = "activity-logs-nemuipb.csv";
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    }
  };

  getActionClass(actionType) {
    if (actionType === "verified") return "bg-green-100 text-green-700";
    if (actionType === "rejected") return "bg-red-100 text-red-700";
    if (actionType === "status_updated") return "bg-blue-100 text-[#002B5B]";
    if (actionType === "returned") return "bg-[#F4D35E] text-[#5C4A00]";
    if (actionType === "claim_pending") return "bg-purple-100 text-purple-700";

    return "bg-gray-100 text-gray-600";
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
              ${this.state.isSidebarExpanded ? "ml-64" : "ml-0"}
            `}
          >
            <PageHeader
              onToggleSidebar={this.toggleSidebar}
              profileIcon="fa-user-shield"
              actions={
                <>
                  <button
                    type="button"
                    onClick={this.goToUserMode}
                    className="bg-[#002B5B] hover:bg-[#001f42] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 transition-all"
                  >
                    <i className="fas fa-user mr-2"></i>
                    Mode User
                  </button>

                  <button
                    type="button"
                    onClick={this.handleExport}
                    className="bg-gray-100 text-[#002B5B] px-5 py-3 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Export CSV
                  </button>
                </>
              }
            />

            <section className="mb-8">
              <h2 className="text-4xl font-extrabold mb-2">Koleksi Barang</h2>
              <p className="text-gray-500 text-sm max-w-xl">
                Riwayat aktivitas barang, laporan, klaim, dan perubahan status
                pada sistem NEMU IPB.
              </p>
            </section>

            <section className="bg-white rounded-[24px] p-6 mb-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">
                    Action Type
                  </label>

                  <select
                    name="actionType"
                    value={this.state.actionType}
                    onChange={this.handleChange}
                    className="w-full mt-2 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="semua">Semua Aktivitas</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                    <option value="status_updated">Status Updated</option>
                    <option value="claim_pending">Claim Pending</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">
                    Sort
                  </label>

                  <select
                    name="sortBy"
                    value={this.state.sortBy}
                    onChange={this.handleChange}
                    className="w-full mt-2 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={this.handleFilter}
                    className="w-full bg-[#002B5B] text-white rounded-xl px-5 py-3 text-sm font-bold hover:bg-[#001f42] transition-all"
                  >
                    Terapkan Filter
                  </button>
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
                <p className="text-gray-400 text-sm">Loading logs...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="text-left py-4">Item ID</th>
                        <th className="text-left py-4">Item Name</th>
                        <th className="text-left py-4">Action</th>
                        <th className="text-left py-4">Administrator</th>
                        <th className="text-left py-4">Note</th>
                        <th className="text-left py-4">Timestamp</th>
                      </tr>
                    </thead>

                    <tbody>
                      {logs.map((log) => (
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
                              {log.action_type}
                            </span>
                          </td>

                          <td className="py-5 text-gray-500">
                            {log.administrator || "System"}
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
                </div>
              )}

              <div className="flex justify-between items-center mt-8 text-xs text-gray-500">
                <p>Showing {logs.length} logs</p>
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
