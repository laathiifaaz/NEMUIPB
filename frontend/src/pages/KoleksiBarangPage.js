import React, { Component } from "react";
import AuthService from "../services/AuthService";
import BarangService from "../services/BarangService";
import ModalDetail from "../components/ModalDetail";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import PageFooter from "../components/PageFooter";
import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

const FilterOption = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-3 cursor-pointer group mb-3"
  >
    <span
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
        selected ? "border-[#002B5B]" : "border-gray-300 group-hover:border-[#002B5B]"
      }`}
    >
      {selected && <span className="w-2.5 h-2.5 bg-[#002B5B] rounded-full"></span>}
    </span>
    <span className={`text-sm font-medium ${selected ? "text-[#002B5B]" : "text-gray-500"}`}>
      {label}
    </span>
  </button>
);

class KoleksiBarangPage extends Component {
  constructor(props) {
    super(props);

    const currentUser = AuthService.getCurrentUser();

    this.state = {
      user: currentUser,
      isSidebarExpanded: getStoredSidebarExpanded(),
      filterStatus: "semua",
      filterKategori: "semua",
      filterLokasi: "semua",
      startDate: "",
      endDate: "",
      searchKeyword: "",
      items: [],
      loading: true,
      error: null,
      selectedBarang: null,
      isModalOpen: false,
    };
  }

  async componentDidMount() {
    await this.fetchBarang();
  }

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

  openModal = (item) => {
    this.setState({
      selectedBarang: this.normalizeBarang(item),
      isModalOpen: true,
    });
  };

  closeModal = () => {
    this.setState({
      selectedBarang: null,
      isModalOpen: false,
    });
  };

  getFilterParams() {
    const {
      filterStatus,
      filterKategori,
      filterLokasi,
      startDate,
      endDate,
    } = this.state;

    return {
      status: filterStatus,
      kategori: filterKategori,
      lokasi: filterLokasi,
      tanggal_awal: startDate,
      tanggal_akhir: endDate,
    };
  }

  hasActiveFilter() {
    const {
      filterStatus,
      filterKategori,
      filterLokasi,
      startDate,
      endDate,
    } = this.state;

    return (
      filterStatus !== "semua" ||
      filterKategori !== "semua" ||
      filterLokasi !== "semua" ||
      Boolean(startDate) ||
      Boolean(endDate)
    );
  }

  fetchBarang = async () => {
    this.setState({ loading: true, error: null });

    try {
      const data = this.hasActiveFilter()
        ? await BarangService.filterBarang(this.getFilterParams())
        : await BarangService.getAllBarang();

      this.setState({
        items: Array.isArray(data) ? data : [],
        loading: false,
      });
    } catch (error) {
      this.setState({
        items: [],
        loading: false,
        error: error.message,
      });
    }
  };

  handleSearch = async () => {
    const keyword = this.state.searchKeyword.trim();

    if (!keyword) {
      await this.fetchBarang();
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const data = await BarangService.searchBarang(keyword);

      this.setState({
        items: Array.isArray(data) ? data : [],
        loading: false,
      });
    } catch (error) {
      this.setState({
        items: [],
        loading: false,
        error: error.message,
      });
    }
  };

  handleSearchKeyDown = async (event) => {
    if (event.key === "Enter") {
      await this.handleSearch();
    }
  };

  updateFilter = (key, value) => {
    this.setState(
      {
        [key]: value,
        searchKeyword: "",
      },
      this.fetchBarang
    );
  };

  getItemImage(item) {
    if (item.foto_url) return item.foto_url;
    if (item.dokumentasi?.startsWith("http")) return item.dokumentasi;
    if (item.dokumentasi?.startsWith("/")) return item.dokumentasi;
    if (item.dokumentasi) return `/assets/images/${item.dokumentasi}`;

    return "/images/logo-ipb.png";
  }

  normalizeBarang(item) {
    return {
      ...item,
      id: item.barang_id || item.id,
      foto_url: this.getItemImage(item),
    };
  }

  render() {
    const {
      user,
      isSidebarExpanded,
      filterStatus,
      filterKategori,
      filterLokasi,
      startDate,
      endDate,
      items,
      loading,
      error,
    } = this.state;

    return (
      <div className="flex min-h-screen bg-[#F8FAFC] font-['Plus_Jakarta_Sans']">
        <Sidebar
          expanded={isSidebarExpanded}
          currentPath="/koleksi"
          handleLogout={this.handleLogout}
          navigate={this.props.navigate}
        />

        <main
          className={`
            flex-1 px-6 md:px-12 py-8 overflow-y-auto
            transition-[margin] duration-300
            ${isSidebarExpanded ? "ml-64" : "ml-0"}
          `}
        >
          <PageHeader
            onToggleSidebar={this.toggleSidebar}
            navigate={this.props.navigate}
            showAdminModeButton={true}
            userRole={user.role}
            userName={user.username}
          />

          <section className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div>
                <h2 className="text-4xl font-extrabold text-[#002B5B] mb-2">
                  Koleksi Barang
                </h2>
                <p className="text-gray-500 text-sm max-w-xl">
                  Data barang hilang dan ditemukan yang tersimpan di sistem NEMU IPB.
                </p>
              </div>

              <div className="flex w-full lg:w-[420px] gap-3">
                <div className="relative flex-1">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="text"
                    placeholder="Cari barang"
                    className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-12 pr-4 text-sm outline-none focus:border-[#002B5B]"
                    value={this.state.searchKeyword}
                    onChange={(event) =>
                      this.setState({ searchKeyword: event.target.value })
                    }
                    onKeyDown={this.handleSearchKeyDown}
                  />
                </div>

                <button
                  type="button"
                  onClick={this.handleSearch}
                  className="w-12 h-12 rounded-xl bg-[#002B5B] text-white hover:bg-[#001f42] transition-colors"
                  aria-label="Cari barang"
                >
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>
          </section>

          <div className="flex flex-col xl:flex-row gap-8">
            <aside className="w-full xl:w-64 shrink-0">
              <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm">
                <div className="mb-7">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    Kategori
                  </h3>

                  <div className="space-y-2">
                    {["Semua", "Elektronik", "Alat Tulis", "Barang Pribadi"].map((category) => {
                      const value = category.toLowerCase();

                      return (
                        <button
                          type="button"
                          key={category}
                          onClick={() => this.updateFilter("filterKategori", value)}
                          className={`w-full flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all ${
                            filterKategori === value
                              ? "bg-[#002B5B] text-white shadow-lg"
                              : "bg-[#F8FAFC] text-gray-600 border border-gray-50 hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-xs font-bold">{category}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-7">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    Lokasi
                  </h3>

                  <select
                    value={filterLokasi}
                    onChange={(event) =>
                      this.updateFilter("filterLokasi", event.target.value)
                    }
                    className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium text-gray-600 outline-none focus:border-[#002B5B]"
                  >
                    <option value="semua">Semua Lokasi</option>
                    <option value="Fakultas Ekonomi">Fakultas Ekonomi</option>
                    <option value="Gymnasium">Gymnasium</option>
                    <option value="Perpustakaan">Perpustakaan</option>
                    <option value="Asrama">Asrama</option>
                  </select>
                </div>

                <div className="mb-7">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    Rentang Tanggal
                  </h3>

                  <div className="space-y-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) =>
                        this.updateFilter("startDate", event.target.value)
                      }
                      className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#002B5B]"
                    />

                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) =>
                        this.updateFilter("endDate", event.target.value)
                      }
                      className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#002B5B]"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    Status
                  </h3>

                  <FilterOption
                    label="Semua"
                    selected={filterStatus === "semua"}
                    onClick={() => this.updateFilter("filterStatus", "semua")}
                  />
                  <FilterOption
                    label="Hilang"
                    selected={filterStatus === "hilang"}
                    onClick={() => this.updateFilter("filterStatus", "hilang")}
                  />
                  <FilterOption
                    label="Ditemukan"
                    selected={filterStatus === "ditemukan"}
                    onClick={() => this.updateFilter("filterStatus", "ditemukan")}
                  />
                  <FilterOption
                    label="Selesai"
                    selected={filterStatus === "selesai"}
                    onClick={() => this.updateFilter("filterStatus", "selesai")}
                  />
                </div>
              </div>
            </aside>

            <section className="flex-1 min-w-0">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-[#002B5B]">
                    Hasil Penelusuran
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    Ditemukan {items.length} barang di sistem
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-20">
                  <i className="fas fa-spinner fa-spin text-3xl text-[#002B5B]"></i>
                </div>
              ) : items.length === 0 ? (
                <div className="bg-white rounded-[24px] border border-gray-100 p-10 text-center text-gray-400 text-sm">
                  Tidak ada barang yang cocok dengan filter saat ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {items.map((item) => {
                    const normalizedItem = this.normalizeBarang(item);
                    const itemId = normalizedItem.id;

                    return (
                      <div
                        key={itemId}
                        className="bg-white rounded-[28px] p-3 border border-gray-50 shadow-sm hover:shadow-xl transition-all group"
                      >
                        <div className="relative aspect-square rounded-[22px] overflow-hidden bg-gray-100">
                          <img
                            src={normalizedItem.foto_url}
                            alt={normalizedItem.nama_barang}
                            onError={(event) => {
                              event.currentTarget.src = "/images/logo-ipb.png";
                            }}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />

                          <div
                            className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[8px] font-black text-white uppercase ${
                              normalizedItem.status_barang === "hilang"
                                ? "bg-blue-500"
                                : normalizedItem.status_barang === "ditemukan"
                                  ? "bg-cyan-600"
                                  : "bg-yellow-500"
                            }`}
                          >
                            {normalizedItem.status_barang || "tidak diketahui"}
                          </div>
                        </div>

                        <div className="p-4">
                          <p className="text-[9px] font-black text-yellow-600 uppercase mb-1">
                            {normalizedItem.kategori || "Kategori"}
                          </p>

                          <h4 className="font-bold text-[#002B5B] text-base mb-1 truncate">
                            {normalizedItem.nama_barang}
                          </h4>

                          <div className="flex items-center gap-2 text-gray-400 text-[10px] mb-4">
                            <i className="fas fa-map-marker-alt text-yellow-600"></i>
                            <span className="truncate">{normalizedItem.lokasi}</span>
                          </div>

                          <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                            <span className="text-[9px] text-gray-300 font-bold tracking-tighter">
                              ID: #{itemId}
                            </span>

                            <button
                              type="button"
                              onClick={() => this.openModal(normalizedItem)}
                              className="text-[10px] font-black text-[#002B5B] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              DETAIL
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <PageFooter />
        </main>

        {this.state.isModalOpen && (
          <ModalDetail
            data={this.state.selectedBarang}
            onClose={this.closeModal}
          />
        )}
      </div>
    );
  }
}

export default KoleksiBarangPage;
