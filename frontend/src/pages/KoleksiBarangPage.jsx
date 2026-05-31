import React, { Component } from "react";
import { API_BASE_URL } from "../config/api";
import AuthService from "../services/AuthService";
import BarangService from "../services/BarangService";
import ModalDetail from "../components/ModalDetail";
import UserPageLayout from "../components/UserPageLayout";
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
      allItems: [],
      items: [],
      loading: true,
      error: null,
      selectedBarang: null,
      isModalOpen: false,
      
      // State tambahan untuk Pagination
      currentPage: 1,
      itemsPerPage: 6, // Mengatur jumlah kartu per halaman (misal: 6 barang)
    };
  }

  async componentDidMount() {
    window.addEventListener("focus", this.handleRefresh);
    await this.fetchBarang();
  }

  componentWillUnmount() {
    window.removeEventListener("focus", this.handleRefresh);
  }

  handleRefresh = () => {
    this.fetchBarang();
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

  getVerifiedItems(items) {
    return (Array.isArray(items) ? items : []).filter(
      (item) => {
        const allowedStatus = ["hilang", "ditemukan", "selesai"].includes(
          item.status_barang
        );

        if (!allowedStatus || item.status_verifikasi !== "terverifikasi") {
          return false;
        }

        if (item.jenis_laporan === "penemuan") {
          return item.status_laporan === "selesai";
        }

        return ["disetujui", "selesai"].includes(
          item.status_laporan
        );
      }
    );
  }

  sortCollectionItems(items) {
    return [...items].sort((a, b) => {
      const getJenisPriority = (item) => {
        const status = this.getDisplayStatus(item);

        if (status === "ditemukan") return 0;
        if (status === "hilang") return 1;
        if (status === "selesai") return 2;
        return 3;
      };

      const getSortDate = (item) => {
        const rawDate =
          item.tanggal_kejadian ||
          item.updated_at ||
          item.created_time ||
          item.created_at ||
          "";
        const timestamp = new Date(rawDate).getTime();

        return Number.isNaN(timestamp) ? 0 : timestamp;
      };

      const jenisDiff = getJenisPriority(a) - getJenisPriority(b);

      if (jenisDiff !== 0) {
        return jenisDiff;
      }

      const dateDiff = getSortDate(b) - getSortDate(a);

      if (dateDiff !== 0) {
        return dateDiff;
      }

      return (
        Number(b.laporan_id || b.barang_id || 0) -
        Number(a.laporan_id || a.barang_id || 0)
      );
    });
  }

  getDisplayStatus(item) {
    if (item.status_laporan === "selesai" && item.jenis_laporan !== "penemuan") {
      return "selesai";
    }
    if (item.status_barang === "ditemukan") return "ditemukan";
    if (item.status_barang === "hilang") return "hilang";
    return "selesai";
  }

  getDisplayStatusClass(status) {
    if (status === "hilang") return "bg-blue-500";
    if (status === "ditemukan") return "bg-cyan-600";
    if (status === "selesai") return "bg-green-600";
    return "bg-yellow-500";
  }

  getDisplayDateLabel(item) {
    if (item.jenis_laporan === "penemuan") {
      return "Penemuan";
    }

    if (item.jenis_laporan === "kehilangan") {
      return "Hilang";
    }

    if (item.status_barang === "hilang") return "Hilang";
    return "Tanggal";
  }

  getVisibleItems(items, keyword = this.state.searchKeyword) {
    const {
      filterStatus,
      filterKategori,
      filterLokasi,
      startDate,
      endDate,
    } = this.state;

    const normalizedKeyword = keyword.trim().toLowerCase();

    const visibleItems = this.getVerifiedItems(items).filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        item.nama_barang?.toLowerCase().includes(normalizedKeyword) ||
        item.deskripsi?.toLowerCase().includes(normalizedKeyword) ||
        item.kategori?.toLowerCase().includes(normalizedKeyword) ||
        item.lokasi?.toLowerCase().includes(normalizedKeyword);

      const matchesStatus =
        filterStatus === "semua" || item.status_barang === filterStatus;

      const matchesKategori =
        filterKategori === "semua" ||
        item.kategori?.toLowerCase().includes(filterKategori);

      const matchesLokasi =
        filterLokasi === "semua" ||
        item.lokasi?.toLowerCase().includes(filterLokasi.toLowerCase());

      const itemDate = item.tanggal_kejadian || "";
      const matchesStartDate = !startDate || itemDate >= startDate;
      const matchesEndDate = !endDate || itemDate <= endDate;

      return (
        matchesKeyword &&
        matchesStatus &&
        matchesKategori &&
        matchesLokasi &&
        matchesStartDate &&
        matchesEndDate
      );
    });

    return this.sortCollectionItems(visibleItems);
  }

  fetchBarang = async () => {
    this.setState({ loading: true, error: null });

    try {
      const data = await BarangService.getAllBarang();
      const allItems = Array.isArray(data) ? data : [];

      this.setState({
        allItems,
        items: this.getVisibleItems(allItems, this.state.searchKeyword),
        loading: false,
        currentPage: 1, // Reset ke halaman pertama setiap kali filter berubah
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
    const keyword = this.state.searchKeyword;

    this.setState({
      items: this.getVisibleItems(this.state.allItems, keyword),
      currentPage: 1,
    });
  };

  handleSearchChange = (event) => {
    const keyword = event.target.value;

    this.setState({
      searchKeyword: keyword,
      items: this.getVisibleItems(this.state.allItems, keyword),
      currentPage: 1,
    });
  };

  updateFilter = (key, value) => {
    this.setState(
      {
        [key]: value,
      },
      () =>
        this.setState({
          items: this.getVisibleItems(this.state.allItems),
          currentPage: 1,
        })
    );
  };

  // Fungsi navigasi halaman
  handlePageChange = (pageNumber) => {
    this.setState({ currentPage: pageNumber });
    // Scroll otomatis ke atas area hasil penelusuran saat ganti halaman
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  getItemImage(item) {
    if (item.foto_url) return item.foto_url;
    if (item.dokumentasi?.startsWith("data:image/")) return item.dokumentasi;
    if (item.dokumentasi?.startsWith("https")) return item.dokumentasi;
    if (item.dokumentasi?.startsWith("/")) return item.dokumentasi;
    if (item.dokumentasi) return `/images/${item.dokumentasi}`;

    return "/images/logo-ipb.png";
  }

  normalizeBarang(item) {
    return {
      ...item,
      id: item.barang_id || item.id,
      foto_url: this.getItemImage(item),
    };
  }

  renderPagination(totalPages) {
    const { currentPage } = this.state;
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-10 mb-6">
        {/* Tombol Sebelumnya */}
        <button
          onClick={() => this.handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#002B5B] bg-white border border-gray-100 hover:bg-gray-50"
          }`}
        >
          <i className="fas fa-chevron-left text-xs"></i>
        </button>

        {/* Nomor Halaman */}
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => this.handlePageChange(number)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
              currentPage === number
                ? "bg-[#002B5B] text-white shadow-md shadow-blue-900/10"
                : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
            }`}
          >
            {number}
          </button>
        ))}

        {/* Tombol Selanjutnya */}
        <button
          onClick={() => this.handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#002B5B] bg-white border border-gray-100 hover:bg-gray-50"
          }`}
        >
          <i className="fas fa-chevron-right text-xs"></i>
        </button>
      </div>
    );
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
      currentPage,
      itemsPerPage,
    } = this.state;

    // Kalkulasi Data Halaman Aktif
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    return (
      <>
      <UserPageLayout
        currentPath="/koleksi"
        isSidebarExpanded={isSidebarExpanded}
        onToggleSidebar={this.toggleSidebar}
        onLogout={this.handleLogout}
        navigate={this.props.navigate}
        userRole={user.role}
        userName={user.username}
      >

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
                    onChange={this.handleSearchChange}
                  />
                </div>
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
                    {["Semua", "Elektronik", "Alat Tulis", "Barang Pribadi", "Lainnya"].map((category) => {
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
                    Menampilkan {items.length} barang di sistem
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
                <>
                  {/* Gunakan data 'currentItems' hasil potongan per halaman */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {currentItems.map((item) => {
                      const normalizedItem = this.normalizeBarang(item);
                      const itemId = normalizedItem.id;
                      const displayStatus = this.getDisplayStatus(normalizedItem);

                      return (
                        <div
                          key={itemId}
                          className="bg-white rounded-[28px] p-3 border border-gray-50 shadow-sm hover:shadow-xl transition-all group h-full flex flex-col"
                        >
                          <div className="relative aspect-square rounded-[22px] overflow-hidden bg-gray-100 shrink-0">
                            <img
                              src={normalizedItem.foto_url}
                              alt={normalizedItem.nama_barang}
                              onError={(event) => {
                                event.currentTarget.src = "/images/logo-ipb.png";
                              }}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />

                            <div
                              className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[8px] font-black text-white uppercase shadow-lg shadow-black/10 ${this.getDisplayStatusClass(displayStatus)}`}
                            >
                              {displayStatus}
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col">
                            <p className="text-[9px] font-black text-yellow-600 uppercase mb-1">
                              {normalizedItem.kategori || "Kategori"}
                            </p>

                            <h4 className="font-bold text-[#002B5B] text-base mb-1 min-h-[24px] truncate">
                              {normalizedItem.nama_barang}
                            </h4>

                            <div className="flex items-center gap-2 text-gray-500 text-[11px] mb-4 font-medium min-h-[18px]">
                              <i className="fas fa-map-marker-alt text-yellow-600"></i>
                              <span className="truncate">{normalizedItem.lokasi || "-"}</span>
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-50 pt-4 mt-auto gap-3">
                              <span className="text-[12px] text-gray-600 font-bold">
                                <i className="far fa-calendar-alt text-yellow-600 mr-1"></i>
                                {this.getDisplayDateLabel(normalizedItem)}
                                : {normalizedItem.tanggal_kejadian || "-"}
                              </span>

                              <button
                                type="button"
                                onClick={() => this.openModal(normalizedItem)}
                                className="bg-[#002B5B] text-white text-[10px] font-black px-4 py-2 rounded-lg hover:bg-[#001F42] transition-colors shadow-sm"
                              >
                                DETAIL
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Render Tombol Navigasi Halaman */}
                  {this.renderPagination(totalPages)}
                </>
              )}
            </section>
          </div>

      </UserPageLayout>

        {this.state.isModalOpen && (
          <ModalDetail
            data={this.state.selectedBarang}
            onClose={this.closeModal}
            navigate={this.props.navigate}
            compact
          />
        )}
      </>
    );
  }
}

export default KoleksiBarangPage;
