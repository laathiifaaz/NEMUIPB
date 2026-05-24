import React, { Component } from "react";
import AuthService from "../services/AuthService";
import AdminService from "../services/AdminService"; // Asumsi service analitik tersedia di sini
import AdminSidebar from "../components/admin/AdminSidebar";
import PageHeader from "../components/PageHeader";
import PageFooter from "../components/PageFooter";
import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

class AdminAnalyticsPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      timeRange: "Last 30 Days",
      showTimeRangeMenu: false,
      stats: {
        total_found: 0,
        found_trend: "0%",
        success_rate: "0%",
        success_status: "-",
        avg_return_time: "0 hrs",
        return_trend: "-",
      },
      monthlyTrends: [],
      categories: [],
      hotspots: [],
      locationFilter: "high", // high atau low
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
    
    // AKTIFKAN FUNGSI INI KALO API UDAH SIAPPPP
    // await this.loadAnalyticsData(); 
  }

  loadAnalyticsData = async () => {
    this.setState({ isLoading: true, error: null });
    
    try {
      // Ambil parameter rentang waktu dan filter lokasi dari state saat ini
      const { timeRange, locationFilter } = this.state;
      
      // Mengirimkan request ke AdminService (ganti metode ini sesuai endpoint backend Anda)
      const analyticsData = await AdminService.getAnalytics({
        range: timeRange,
        filter: locationFilter
      });

      // Petakan data dari backend ke dalam state komponen
      this.setState({
        stats: analyticsData.stats || this.state.stats,
        monthlyTrends: analyticsData.monthlyTrends || [],
        categories: analyticsData.categories || [],
        hotspots: analyticsData.hotspots || [],
        isLoading: false,
      });
    } catch (error) {
      this.setState({
        error: error.message || "Gagal memuat data analitik dari server.",
        isLoading: false,
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

  goToUserMode = () => {
    if (this.props.navigate) {
      this.props.navigate("/dashboard");
    } else {
      window.location.href = "/dashboard";
    }
  };

  handleExportPDF = () => {
    alert("Memulai ekspor laporan analitik ke PDF...");
    // Tambahkan logika integrasi jsPDF atau window.print() di sini jika diperlukan
  };

  toggleTimeRangeMenu = () => {
    this.setState({ showTimeRangeMenu: !this.state.showTimeRangeMenu });
  };

  // Fungsi pemicu ketika user mengubah rentang waktu atau filter lokasi
  handleTimeRangeChange = (range) => {
    this.setState(
      { timeRange: range, showTimeRangeMenu: false },
      () => this.loadAnalyticsData() // Panggil ulang API setelah state ter-update
    );
  };

  handleLocationFilterChange = (filter) => {
    this.setState(
      { locationFilter: filter },
      () => this.loadAnalyticsData() // Panggil ulang API setelah state ter-update
    );
  };

  renderMonthlyTrendsChart() {
    const { monthlyTrends } = this.state;
    const maxVal = Math.max(...monthlyTrends.map(d => Math.max(d.reported, d.returned)), 1);

    return (
      <div className="h-72 flex items-end gap-6 pt-6 px-2 relative border-b border-gray-100">
        {/* Garis Grid Horizontal Statis */}
        <div className="absolute inset-x-0 top-1/4 border-t border-gray-100 pointer-events-none"></div>
        <div className="absolute inset-x-0 top-2/4 border-t border-gray-100 pointer-events-none"></div>
        <div className="absolute inset-x-0 top-3/4 border-t border-gray-100 pointer-events-none"></div>

        {monthlyTrends.map((data, idx) => {
          const reportedHeight = (data.reported / maxVal) * 100;
          const returnedHeight = (data.returned / maxVal) * 100;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center z-10">
              <div className="w-full flex items-end gap-1.5 h-56">
                {/* Bar Terlaporkan (Reported) */}
                <div 
                  className="w-full bg-[#A2B4C7] rounded-t-sm transition-all duration-500 hover:opacity-90"
                  style={{ height: `${reportedHeight}%` }}
                  title={`Reported: ${data.reported}`}
                ></div>
                {/* Bar Dikembalikan (Returned) */}
                <div 
                  className="w-full bg-[#8E793E] rounded-t-sm transition-all duration-500 hover:opacity-90"
                  style={{ height: `${returnedHeight}%` }}
                  title={`Returned: ${data.returned}`}
                ></div>
              </div>
              <p className="text-[11px] font-bold text-gray-400 mt-3 tracking-wider">{data.month}</p>
            </div>
          );
        })}
      </div>
    );
  }

  render() {
    const { stats, categories, hotspots, locationFilter, isSidebarExpanded, error } = this.state;

    return (
      <div className="min-h-screen bg-[#F6F7FB] font-['Plus_Jakarta_Sans'] text-[#002B5B]">
        <div className="flex min-h-screen">
          <AdminSidebar 
            activeMenu="analytics" // Sesuai navigasi analitik
            expanded={isSidebarExpanded} 
            navigate={this.props.navigate}
          />

          <main
            className={`
              flex-1 p-6 md:p-10 overflow-y-auto
              transition-[margin] duration-300
              ${isSidebarExpanded ? "ml-64" : "ml-0"}
            `}
          >
            <PageHeader
              onToggleSidebar={this.toggleSidebar}
              profileIcon="fa-user-shield"
              actions={
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={this.goToUserMode}
                    className="bg-[#002B5B] hover:bg-[#001f42] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 transition-all"
                  >
                    <i className="fas fa-user mr-2"></i>
                    Mode User
                  </button>
                </div>
              }
            />

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold">
                {error}
              </div>
            )}

            {/* Header Judul Analitik & Aksi Kontrol Atas */}
            <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-4xl font-extrabold text-[#002B5B]">
                  Analytical Overview
                </h2>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Dropdown Pilihan Rentang Waktu */}
                <div className="relative flex-1 sm:flex-none">
                  <button
                    onClick={this.toggleTimeRangeMenu}
                    className="w-full sm:w-auto flex items-center justify-between gap-3 bg-white border border-gray-100 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
                  >
                    <span className="flex items-center gap-2 text-gray-500">
                      <i className="far fa-calendar-alt text-[#002B5B]"></i>
                      {this.state.timeRange}
                    </span>
                    <i className="fas fa-chevron-down text-gray-400 text-[10px]"></i>
                  </button>

                  {this.state.showTimeRangeMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-50 z-30 p-1.5">
                      {["Last 7 Days", "Last 30 Days", "This Month", "This Year"].map((range) => (
                        <button
                          key={range}
                          onClick={() => this.handleTimeRangeChange(range)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold ${
                            this.state.timeRange === range
                              ? "bg-blue-50 text-[#002B5B]"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tombol Cetak/Ekspor PDF */}
                <button
                  onClick={this.handleExportPDF}
                  className="flex items-center gap-2 bg-white border border-gray-100 text-[#002B5B] px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50 transition-all"
                >
                  <i className="fas fa-download"></i>
                  <span>Export PDF</span>
                </button>
              </div>
            </section>

            {/* BARIS 1: Ringkasan Kartu Metrik Utama */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Items Found */}
              <div className="bg-white rounded-[20px] p-6 shadow-sm border-l-4 border-[#002B5B] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 bg-blue-50 text-[#002B5B] rounded-xl flex items-center justify-center">
                    <i className="fas fa-boxes text-sm"></i>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold">
                    <i className="fas fa-trending-up mr-1"></i> {stats.found_trend}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Items Found</p>
                  <p className="text-4xl font-black text-[#002B5B]">{stats.total_found.toLocaleString()}</p>
                </div>
              </div>

              {/* Success Rate */}
              <div className="bg-white rounded-[20px] p-6 shadow-sm border-l-4 border-[#8E793E] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 bg-amber-50 text-[#8E793E] rounded-xl flex items-center justify-center">
                    <i className="fas fa-check-circle text-sm"></i>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold">
                    ✓ {stats.success_status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Success Rate</p>
                  <p className="text-4xl font-black text-[#002B5B]">{stats.success_rate}</p>
                </div>
              </div>

              {/* Avg. Return Time */}
              <div className="bg-white rounded-[20px] p-6 shadow-sm border-l-4 border-sky-600 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                    <i className="far fa-clock text-sm"></i>
                  </div>
                  <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[10px] font-bold">
                    {stats.return_trend}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Avg. Return Time</p>
                  <p className="text-4xl font-black text-[#002B5B]">{stats.avg_return_time}</p>
                </div>
              </div>
            </section>

            {/* BARIS 2: Tren Bulanan vs Distribusi Kategori */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Tren Bulanan Grafik */}
              <div className="lg:col-span-2 bg-white rounded-[24px] p-6 md:p-8 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#002B5B]">Monthly Trends</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Total volume of items reported vs returned</p>
                  </div>
                  {/* Legenda Indikator Warna */}
                  <div className="flex gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-[#002B5B]">
                      <span className="w-3 h-3 rounded-sm bg-[#A2B4C7]"></span> Reported
                    </span>
                    <span className="flex items-center gap-1.5 text-[#002B5B]">
                      <span className="w-3 h-3 rounded-sm bg-[#8E793E]"></span> Returned
                    </span>
                  </div>
                </div>
                {this.renderMonthlyTrendsChart()}
              </div>

              {/* Distribusi Komposisi Kategori */}
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-[#002B5B]">Category Distribution</h3>
                  <p className="text-xs text-gray-400 mt-0.5 mb-8">Most frequent item types</p>

                  {/* Replika Visual Chart Center Box dari Mockup */}
                  <div className="flex justify-center items-center py-4 mb-6">
                    <div className="w-36 h-36 border-[14px] border-[#002B5B] rounded-2xl relative flex flex-col justify-center items-center shadow-inner">
                      {/* Dekorasi aksen pita diagonal tiruan */}
                      <div className="absolute top-0 left-0 w-full h-3 bg-sky-400/40 rotate-12 origin-top-left"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-12 bg-amber-600/40 rotate-45 origin-bottom-right"></div>
                      <span className="text-2xl font-black text-[#002B5B]">821</span>
                      <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase mt-0.5">Electronics</span>
                    </div>
                  </div>
                </div>

                {/* List Data Distribusi */}
                <div className="space-y-3.5 pt-4">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold">
                      <span className="flex items-center gap-2 text-gray-600">
                        <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`}></span>
                        {cat.name}
                      </span>
                      <span className="text-[#002B5B]">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* BARIS 3: Hotspot Lokasi Kampus */}
            <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-extrabold text-[#002B5B]">Hotspot Locations</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Faculties and areas with the highest incidence rates</p>
                </div>

                {/* Saklar Filter Keaktifan Lokasi */}
                <div className="bg-[#F0F4F8] p-1 rounded-xl flex gap-1 self-stretch sm:self-auto">
                  <button
                    onClick={() => this.setState({ locationFilter: "high" })}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black tracking-wide transition-all ${
                      locationFilter === "high"
                        ? "bg-white text-[#002B5B] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    High Activity
                  </button>
                  <button
                    onClick={() => this.setState({ locationFilter: "low" })}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black tracking-wide transition-all ${
                      locationFilter === "low"
                        ? "bg-white text-[#002B5B] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Low Activity
                  </button>
                </div>
              </div>

              {/* Progress Bar Indikator Volume Lokasi */}
              <div className="space-y-6">
                {hotspots.map((loc, idx) => {
                  const maxCount = Math.max(...hotspots.map(h => h.count), 1);
                  const barWidth = (loc.count / maxCount) * 100;

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[#002B5B]">{loc.name}</span>
                        <span className="text-gray-400 font-extrabold">{loc.count} Items</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#002B5B] rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <PageFooter />
          </main>
        </div>
      </div>
    );
  }
}

export default AdminAnalyticsPage;