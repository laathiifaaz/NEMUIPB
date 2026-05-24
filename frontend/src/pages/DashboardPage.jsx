

import React, { Component } from 'react';
import AuthService from '../services/AuthService';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import PageFooter from '../components/PageFooter';
import BarangService from "../services/BarangService";
import ModalDetail from "../components/ModalDetail";

import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from '../utils/sidebarState';

class DashboardPage extends Component {
  constructor(props) {
    super(props);

    this.state = {

      // TAMBAHAN
      isSidebarExpanded: getStoredSidebarExpanded(),

      userRole: "",
      userName: "",
      loadingRecent: true,
      recentItems: [],
      totalLostItems: 0,
      totalReturnedItems: 0,
      selectedBarang: null,
      isModalOpen: false,
    };
  }

  async componentDidMount() {

    const user = AuthService.getCurrentUser();

    if (user) {
      this.setState({
        userRole: user.role,
        userName: user.nama || user.username
      });
    }

    try {

      const data = await BarangService.getAllBarang();
      const items = Array.isArray(data) ? data : [];

      const sortedItems = items
        .filter(
          (item) =>
            item.jenis_laporan === "penemuan" &&
            item.status_barang !== "selesai"
        )
        .sort(
          (a, b) =>
            Number(b.laporan_id || b.barang_id || 0) -
            Number(a.laporan_id || a.barang_id || 0)
        )
        .slice(0, 3);

      this.setState({
        recentItems: sortedItems,
        totalLostItems: items.filter((item) => item.status_barang === "hilang")
          .length,
        totalReturnedItems: items.filter((item) =>
          ["selesai", "dikembalikan"].includes(item.status_barang)
        ).length,
        loadingRecent: false,
      });

    } catch (error) {

      console.error(error);

      this.setState({
        loadingRecent: false,
      });
    }
  }

  handleLogout = () => {
    AuthService.logout();
    window.location.reload();
  };

  fetchRecentItems = async () => {
    try {
      const data = await BarangService.getAllBarang();
      const items = Array.isArray(data) ? data : [];

      const sortedItems = [...items]
        .filter(
          (item) =>
            item.jenis_laporan === "penemuan" &&
            item.status_barang !== "selesai"
        )
        .sort((a, b) => {
          return (
            Number(b.laporan_id || b.barang_id || 0) -
            Number(a.laporan_id || a.barang_id || 0)
          );
        })
        .slice(0, 3);

      this.setState({
        recentItems: sortedItems,
        totalLostItems: items.filter((item) => item.status_barang === "hilang")
          .length,
        totalReturnedItems: items.filter((item) =>
          ["selesai", "dikembalikan"].includes(item.status_barang)
        ).length,
        loadingRecent: false,
      });

    } catch (error) {
      console.error(error);

      this.setState({
        loadingRecent: false,
      });
    }
  };

  // TAMBAHAN
  toggleSidebar = () => {
    this.setState((prevState) => {
      const isSidebarExpanded = !prevState.isSidebarExpanded;
      setStoredSidebarExpanded(isSidebarExpanded);

      return { isSidebarExpanded };
    });
  };

  getItemImage(item) {
    const value = item?.foto_url || item?.dokumentasi || "";

    if (!value) return "/images/logo-ipb.png";
    if (value.startsWith("data:image/")) return value;
    if (value.startsWith("http")) return value;
    if (value.startsWith("/")) return value;

    return `/images/${value}`;
  }

    openModal = (item) => {
    this.setState({
      selectedBarang: item,
      isModalOpen: true,
    });
  };

  closeModal = () => {
    this.setState({
      selectedBarang: null,
      isModalOpen: false,
    });
  };

  renderRecentItems(loadingRecent, recentItems) {
    return (
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-[#002B5B]">
            Penemuan Terbaru
          </h3>

          <button
            onClick={() => this.props.navigate("/koleksi")}
            className="text-[#9A7D0A] font-bold text-sm hover:underline"
          >
            Lihat Semua
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {loadingRecent ? (
            <div className="col-span-3 flex justify-center py-16">
              <i className="fas fa-spinner fa-spin text-3xl text-[#002B5B]"></i>
            </div>
          ) : (
            recentItems.map((item) => (
              <div
                key={item.barang_id || item.id}
                className="
                  bg-white
                  rounded-[24px]
                  p-2.5
                  border
                  border-gray-50
                  shadow-sm
                  hover:shadow-lg
                  transition-all
                  group
                  w-full
                "
              >
                <div className="rounded-[18px] overflow-hidden mb-3 aspect-[2.5/2.2] bg-gray-50 relative">
                  <img
                    src={this.getItemImage(item)}
                    alt={item.nama_barang}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  <div
                    className={`
                      absolute top-4 left-4 px-3 py-1 rounded-full
                      text-[9px] font-black uppercase text-white
                      ${item.status_barang === "hilang" ? "bg-blue-500" : "bg-cyan-600"}
                    `}
                  >
                    {item.status_barang}
                  </div>

                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                    <p className="text-[10px] font-bold text-[#002B5B]">
                      {item.tanggal_kejadian}
                    </p>
                  </div>
                </div>

                <div className="px-3 pb-3">
                  <h4 className="font-bold text-[#002B5B] text-lg mb-1 truncate">
                    {item.nama_barang}
                  </h4>

                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <i className="fas fa-map-marker-alt text-[#9A7D0A]"></i>
                    <span>{item.lokasi}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300 text-[10px] mb-4">
                    <i className="far fa-calendar-alt text-[#9A7D0A]"></i>
                    <span>
                      {item.status_barang === "hilang"
                        ? "Tanggal Hilang"
                        : "Tanggal Ditemukan"}
                      : {item.tanggal_kejadian}
                    </span>
                  </div>

                  <button
                    onClick={() => this.openModal(item)}
                    className="
                      w-full
                      py-4
                      bg-[#002B5B]
                      text-white
                      rounded-2xl
                      text-sm
                      font-bold
                      hover:bg-[#001F42]
                      transition-colors
                    "
                  >
                    Detail Barang
                  </button>
                </div>
              </div>
            ))
          )}

          {this.state.isModalOpen && (
            <ModalDetail
              data={this.state.selectedBarang}
              onClose={this.closeModal}
            />
          )}
        </div>
      </section>
    );
  }

  render() {

  const {
    isSidebarExpanded,
    userRole,
    userName,
    recentItems,
    totalLostItems,
    totalReturnedItems,
    loadingRecent
  } = this.state;

    return (
      <div className="flex min-h-screen bg-white font-['Plus_Jakarta_Sans'] overflow-hidden">

        {/* SIDEBAR COMPONENT */}
        <Sidebar
          expanded={isSidebarExpanded}
          handleLogout={this.handleLogout}
          navigate={this.props.navigate}
        />

        {/* MAIN CONTENT */}
        <main
          className={`
            flex-1 overflow-y-auto px-6 md:px-12 py-8
            transition-[margin] duration-300
            ${isSidebarExpanded ? "ml-64" : "ml-16"}
          `}
        >

          <PageHeader
            onToggleSidebar={this.toggleSidebar}
            navigate={this.props.navigate}
            showAdminModeButton={true}
            userRole={userRole}
            userName={userName}
          />

          {/* HERO */}
          <section className="bg-white rounded-[40px] border border-gray-100 p-8 md:p-12 flex flex-col lg:flex-row items-center mb-16 shadow-sm">

            <div className="w-full lg:w-1/2 mb-10 lg:mb-0">

              <span className="bg-[#F4E3A1] text-[#9A7D0A] text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 inline-block">
                Sistem Barang Hilang & Ditemukan
              </span>

              <h1 className="text-4xl md:text-5xl font-extrabold text-[#002B5B] leading-[1.1] mb-6">
                NEMU IPB,
                <br />

                <span className="text-[#9A7D0A] italic font-medium text-3xl md:text-4xl">
                  temukan kembali dengan tenang.
                </span>
              </h1>

              <p className="text-gray-400 max-w-sm mb-10 text-sm leading-relaxed font-medium">
                Sistem informasi penemuan dan kehilangan barang terpadu di lingkungan IPB University.
              </p>

              <div className="flex flex-wrap gap-4">

                <button
                  onClick={() => this.props.navigate("/lapor-kehilangan")}
                  className="bg-[#002B5B] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 text-sm hover:scale-105 transition-transform shadow-xl shadow-blue-900/20"
                >
                  <i className="fas fa-search-plus"></i>
                  Laporkan Barang Hilang
                </button>

                <button
                  onClick={() => this.props.navigate("/lapor-penemuan")}
                  className="bg-[#F8FAFC] text-[#002B5B] px-8 py-4 rounded-2xl font-bold flex items-center gap-3 text-sm border border-gray-100 hover:scale-105 transition-colors"
                >

                  <i className="fas fa-plus-circle"></i>
                  Laporkan Barang Penemuan

                </button>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative flex justify-center lg:justify-end">
              <div className="w-full max-w-[380px]">
              <div className="relative rounded-[28px] overflow-hidden border border-gray-100 shadow-sm bg-gray-50">

                <img
                  src="/images/logo-ipb.png"
                  alt="IPB"
                  className="w-full aspect-square object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#002B5B]/55 via-[#002B5B]/10 to-transparent"></div>

                <div className="absolute left-4 right-4 bottom-4 grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-lg shadow-blue-950/10 border border-white">
                    <p className="text-2xl font-black text-[#002B5B] leading-none">
                      {totalLostItems}
                    </p>
                    <div className="flex items-center gap-2 text-[#002B5B] mt-2">
                      <i className="fas fa-search text-xs"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Barang Ditemukan
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#F8E9A8] rounded-2xl px-4 py-3 shadow-lg shadow-blue-950/10 border border-[#F8E9A8]">
                    <p className="text-2xl font-black text-[#5C4A00] leading-none">
                      {totalReturnedItems}
                    </p>
                    <div className="flex items-center gap-2 text-[#5C4A00] mt-2">
                      <i className="fas fa-check text-xs"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Barang Dikembalikan
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </section>

          {this.renderRecentItems(loadingRecent, recentItems)}

          <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
            <button
              type="button"
              onClick={() => this.props.navigate("/lapor-kehilangan")}
              className="bg-[#F8FAFC] border border-gray-100 rounded-[24px] p-6 text-left hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <span className="w-12 h-12 rounded-2xl bg-[#002B5B] text-white flex items-center justify-center mb-5">
                <i className="fas fa-search"></i>
              </span>
              <h3 className="text-lg font-extrabold text-[#002B5B] mb-2">
                Buat Laporan Hilang
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Catat detail barang dan lokasi terakhir agar mudah diverifikasi.
              </p>
            </button>

            <button
              type="button"
              onClick={() => this.props.navigate("/lapor-penemuan")}
              className="bg-[#F8FAFC] border border-gray-100 rounded-[24px] p-6 text-left hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <span className="w-12 h-12 rounded-2xl bg-[#F8E9A8] text-[#5C4A00] flex items-center justify-center mb-5">
                <i className="fas fa-box-open"></i>
              </span>
              <h3 className="text-lg font-extrabold text-[#002B5B] mb-2">
                Laporkan Temuan
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Bantu pemilik menemukan barangnya lewat data temuan yang jelas.
              </p>
            </button>

            <button
              type="button"
              onClick={() => this.props.navigate("/verifikasi")}
              className="bg-[#F8FAFC] border border-gray-100 rounded-[24px] p-6 text-left hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <span className="w-12 h-12 rounded-2xl bg-[#EAF2FF] text-[#002B5B] flex items-center justify-center mb-5">
                <i className="fas fa-list-check"></i>
              </span>
              <h3 className="text-lg font-extrabold text-[#002B5B] mb-2">
                Pantau Status
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Lihat proses verifikasi dan status laporan yang sudah dibuat.
              </p>
            </button>
          </section>

          <section className="bg-[#F8FAFC] border border-gray-100 rounded-[28px] p-6 md:p-8 mb-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9A7D0A] mb-2">
                  Tips Cepat
                </p>
                <h3 className="text-2xl font-extrabold text-[#002B5B] mb-2">
                  Buat laporan lebih mudah diverifikasi
                </h3>
                <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
                  Gunakan foto yang jelas, lokasi spesifik, dan tanggal kejadian yang akurat agar admin bisa memproses laporan lebih cepat.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 min-w-full lg:min-w-[330px]">
                <div className="bg-white rounded-2xl px-4 py-4 text-center border border-gray-100">
                  <i className="fas fa-camera text-[#002B5B] mb-2"></i>
                  <p className="text-[11px] font-extrabold text-gray-500">
                    Foto jelas
                  </p>
                </div>

                <div className="bg-white rounded-2xl px-4 py-4 text-center border border-gray-100">
                  <i className="fas fa-map-marker-alt text-[#9A7D0A] mb-2"></i>
                  <p className="text-[11px] font-extrabold text-gray-500">
                    Lokasi detail
                  </p>
                </div>

                <div className="bg-white rounded-2xl px-4 py-4 text-center border border-gray-100">
                  <i className="far fa-calendar-alt text-[#002B5B] mb-2"></i>
                  <p className="text-[11px] font-extrabold text-gray-500">
                    Tanggal tepat
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9A7D0A] mb-2">
                  Proses Laporan
                </p>
                <h3 className="text-2xl font-extrabold text-[#002B5B]">
                  Setelah laporan dikirim
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-100 rounded-[22px] p-5">
                <span className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#002B5B] flex items-center justify-center mb-4 font-black">
                  1
                </span>
                <h4 className="font-extrabold text-[#002B5B] mb-2">
                  Laporan Masuk
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Data barang tersimpan dan masuk ke antrean verifikasi.
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-[22px] p-5">
                <span className="w-10 h-10 rounded-xl bg-[#F8E9A8] text-[#5C4A00] flex items-center justify-center mb-4 font-black">
                  2
                </span>
                <h4 className="font-extrabold text-[#002B5B] mb-2">
                  Dicek Admin
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Admin memeriksa foto, lokasi, dan detail laporan.
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-[22px] p-5">
                <span className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#002B5B] flex items-center justify-center mb-4 font-black">
                  3
                </span>
                <h4 className="font-extrabold text-[#002B5B] mb-2">
                  Status Diperbarui
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Kamu bisa melihat hasil verifikasi di halaman laporan.
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-[22px] p-5">
                <span className="w-10 h-10 rounded-xl bg-[#F8E9A8] text-[#5C4A00] flex items-center justify-center mb-4 font-black">
                  4
                </span>
                <h4 className="font-extrabold text-[#002B5B] mb-2">
                  Barang Diproses
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Barang yang cocok akan diarahkan untuk proses pengembalian.
                </p>
              </div>
            </div>
          </section>

          <PageFooter />
        </main>
      </div>
    );
  }
}

export default DashboardPage;
