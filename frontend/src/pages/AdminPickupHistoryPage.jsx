import React, { Component } from "react";
import AuthService from "../services/AuthService";
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
      pickupHistory: this.getStoredPickupHistory(),
      isSidebarExpanded: getStoredSidebarExpanded(),
    };
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user || user.role !== "admin") {
      window.location.href = "/dashboard";
      return;
    }

    window.addEventListener("storage", this.handleStorageChange);
  }

  componentWillUnmount() {
    window.removeEventListener("storage", this.handleStorageChange);
  }

  handleStorageChange = (event) => {
    if (event.key === "nemuipb_admin_pickup_history") {
      this.setState({
        pickupHistory: this.getStoredPickupHistory(),
      });
    }
  };

  toggleSidebar = () => {
    this.setState((prevState) => {
      const isSidebarExpanded = !prevState.isSidebarExpanded;
      setStoredSidebarExpanded(isSidebarExpanded);

      return { isSidebarExpanded };
    });
  };

  goToDashboard = () => {
    if (this.props.navigate) {
      this.props.navigate("/admin");
      return;
    }

    window.location.href = "/admin";
  };

  getStoredPickupHistory() {
    try {
      const history = JSON.parse(
        localStorage.getItem("nemuipb_admin_pickup_history") || "[]"
      );

      return Array.isArray(history) ? history : [];
    } catch (error) {
      return [];
    }
  }

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

  render() {
    const { pickupHistory, isSidebarExpanded } = this.state;
    const sortedHistory = [...pickupHistory].sort((a, b) => {
      const left = new Date(b.verified_at || 0).getTime();
      const right = new Date(a.verified_at || 0).getTime();

      return left - right;
    });

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

            {sortedHistory.length === 0 ? (
              <div className="bg-white rounded-[28px] p-16 text-center border border-[#E7ECF3]">
                <i className="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-400 font-semibold">
                  Belum ada riwayat serah terima pickup.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedHistory.map((item, index) => (
                  <div
                    key={`${item.code}-${item.verified_at || index}`}
                    className="bg-white border border-[#E7ECF3] rounded-[22px] p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:min-w-[420px]">
                      <div className="bg-[#F8FAFC] rounded-2xl px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                          Status Barang
                        </p>
                        <p className="text-sm font-bold text-[#102348]">
                          {item.status_barang || "-"}
                        </p>
                      </div>

                      <div className="bg-[#F8FAFC] rounded-2xl px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                          Diverifikasi
                        </p>
                        <p className="text-sm font-bold text-[#102348]">
                          {this.formatDateTime(item.verified_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }
}

export default AdminPickupHistoryPage;
