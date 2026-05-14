import React, { Component } from "react";
import AuthService from "../services/AuthService";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminBarangService from "../services/AdminBarangService";

class AdminBarangPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      logs: [],
      kategori: "semua",
      status: "semua",
      lokasi: "",
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

    await this.loadBarang();
  }

  goToUserMode = () => {
    if (this.props.navigate) {
      this.props.navigate("/dashboard");
    } else {
      window.location.href = "/dashboard";
    }
  };

  toggleSidebar = () => {
    this.setState({
      isSidebarExpanded: !this.state.isSidebarExpanded,
    });
  };

  loadBarang = async () => {
    try {
      const data = await AdminBarangService.getLogs();

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
    try {
      this.setState({ isLoading: true });

      const params = {
        kategori: this.state.kategori,
        status: this.state.status,
      };

      if (this.state.lokasi.trim() !== "") {
        params.lokasi = this.state.lokasi;
      }

      const data = await AdminBarangService.filterBarang(params);

      this.setState({
        logs: data,
        isLoading: false,
      });
    } catch (error) {
      this.setState({
        error: error.message,
        isLoading: false,
      });
    }
  };

  convertToCSV = (data) => {
    if (!data || data.length === 0) return "";

    const headers = [
      "barang_id",
      "nama_barang",
      "kategori",
      "deskripsi",
      "tanggal_kejadian",
      "lokasi",
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

  handleExport = () => {
    const csv = this.convertToCSV(this.state.barang);

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
    link.download = "koleksi-barang-nemuipb.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  getStatusClass(status) {
    if (status === "ditemukan") return "bg-[#006D8F] text-white";
    if (status === "hilang") return "bg-blue-100 text-[#002B5B]";
    if (status === "selesai" || status === "dikembalikan") {
      return "bg-[#F4D35E] text-[#5C4A00]";
    }

    return "bg-gray-100 text-gray-500";
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

              <div className="flex items-center gap-3">
                <button
                  onClick={this.handleExport}
                  className="bg-gray-100 text-[#002B5B] px-5 py-3 rounded-xl text-xs font-bold"
                >
                  <i className="fas fa-download mr-2"></i>
                  Export CSV
                </button>

                <button className="bg-[#002B5B] text-white px-5 py-3 rounded-xl text-xs font-bold">
                  <i className="fas fa-plus-square mr-2"></i>
                  Report Item
                </button>
              </div>
            </header>

            <section className="mb-8">
              <h2 className="text-4xl font-extrabold mb-2">Koleksi Barang</h2>
              <p className="text-gray-500 text-sm max-w-xl">
                Daftar seluruh barang hilang, ditemukan, diklaim, dan
                dikembalikan dalam sistem NEMU IPB.
              </p>
            </section>

            <section className="bg-white rounded-[24px] p-6 mb-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">
                    Kategori
                  </label>
                  <select
                    name="kategori"
                    value={this.state.kategori}
                    onChange={this.handleChange}
                    className="w-full mt-2 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="semua">Semua Kategori</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Alat Tulis">Alat Tulis</option>
                    <option value="Barang Pribadi">Barang Pribadi</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">
                    Status
                  </label>
                  <select
                    name="status"
                    value={this.state.status}
                    onChange={this.handleChange}
                    className="w-full mt-2 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="semua">Semua Status</option>
                    <option value="hilang">Hilang</option>
                    <option value="ditemukan">Ditemukan</option>
                    <option value="diklaim">Diklaim</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">
                    Lokasi
                  </label>
                  <input
                    name="lokasi"
                    value={this.state.lokasi}
                    onChange={this.handleChange}
                    placeholder="Semua lokasi"
                    className="w-full mt-2 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={this.handleFilter}
                    className="w-full bg-[#002B5B] text-white rounded-xl px-5 py-3 text-sm font-bold"
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
                <p className="text-gray-400 text-sm">Loading barang...</p>
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
                                {log.item_id}
                            </td>

                            <td className="py-5 font-bold">
                                {log.item_name}
                            </td>

                            <td className="py-5 text-gray-500">
                                {log.action_type}
                            </td>

                            <td className="py-5 text-gray-500">
                                {log.administrator}
                            </td>

                            <td className="py-5 text-gray-500">
                                {log.note}
                            </td>

                            <td className="py-5 text-gray-500">
                                {new Date(log.timestamp).toLocaleString()}
                            </td>
                            </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center mt-8 text-xs text-gray-500">
                <p>Showing {logs.length} items</p>
              </div>
            </section>

            <footer className="mt-16 border-t border-gray-200 py-8 text-xs text-gray-400 flex gap-4">
              <span className="font-black text-[#002B5B]">NEMU IPB</span>
              <span>|</span>
              <span>© 2026 IPB University. All rights reserved.</span>
            </footer>
          </main>
        </div>
      </div>
    );
  }
}

export default AdminBarangPage;