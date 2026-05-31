import React, { Component } from 'react';
import { API_BASE_URL } from "../config/api";
import AuthService from '../services/AuthService';
import UserPageLayout from '../components/UserPageLayout';
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
      const verifiedItems = this.getVisibleUserItems(items);
      const activeRecentItems = this.getActiveRecentItems(items);

      const sortedItems = activeRecentItems
        .sort(
          (a, b) => {
            const priorityDiff =
              this.getRecentItemPriority(a) - this.getRecentItemPriority(b);

            if (priorityDiff !== 0) {
              return priorityDiff;
            }

            return (
              Number(b.laporan_id || b.barang_id || 0) -
              Number(a.laporan_id || a.barang_id || 0)
            );
          }
        )
        .slice(0, 3);

      this.setState({
        recentItems: sortedItems,
        totalLostItems: verifiedItems.filter((item) => item.status_barang === "ditemukan")
          .length,
        totalReturnedItems: this.getReturnedItemsCount(verifiedItems),
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

  getRecentItemPriority(item) {
    if (item.status_barang === "ditemukan") return 0;
    if (item.status_barang === "hilang") return 1;
    if (["selesai", "dikembalikan"].includes(item.status_barang)) return 2;
    return 3;
  }

  fetchRecentItems = async () => {
    try {
      const data = await BarangService.getAllBarang();
      const items = Array.isArray(data) ? data : [];
      const verifiedItems = this.getVisibleUserItems(items);
      const activeRecentItems = this.getActiveRecentItems(items);

      const sortedItems = [...activeRecentItems]
        .sort((a, b) => {
          const priorityDiff = this.getRecentItemPriority(a) - this.getRecentItemPriority(b);

          if (priorityDiff !== 0) {
            return priorityDiff;
          }

          return (
            Number(b.laporan_id || b.barang_id || 0) -  
            Number(a.laporan_id || a.barang_id || 0)
          );
        })
        .slice(0, 3);

      this.setState({
        recentItems: sortedItems,
        totalLostItems: verifiedItems.filter((item) => item.status_barang === "ditemukan")
          .length,
        totalReturnedItems: this.getReturnedItemsCount(verifiedItems),
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

  getVisibleUserItems(items) {
    return (Array.isArray(items) ? items : []).filter((item) => {
      const allowedStatus = ["hilang", "ditemukan", "selesai", "dikembalikan"].includes(
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
    });
  }

  getActiveRecentItems(items) {
    return (Array.isArray(items) ? items : []).filter((item) => {
      if (item.status_verifikasi !== "terverifikasi") {
        return false;
      }

      if (item.jenis_laporan === "penemuan") {
        return (
          item.status_laporan === "selesai" &&
          item.status_barang === "ditemukan"
        );
      }

      if (item.jenis_laporan === "kehilangan") {
        return (
          item.status_laporan === "disetujui" &&
          item.status_barang === "hilang"
        );
      }

      return false;
    });
  }

  getReturnedItemsCount(items) {
    const returnedGroups = new Set();

    (Array.isArray(items) ? items : []).forEach((item) => {
      if (!["selesai", "dikembalikan"].includes(item.status_barang)) {
        return;
      }

      returnedGroups.add(
        item.returned_group_id || item.klaim_id || item.barang_id
      );
    });

    return returnedGroups.size;
  }

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
            Barang Terbaru
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
          ) : recentItems.length === 0 ? (
            <div className="col-span-3 rounded-[24px] border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
              <p className="text-lg font-bold text-[#002B5B] mb-2">
                Belum ada barang terbaru
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Barang penemuan atau kehilangan yang sudah diverifikasi admin akan tampil di sini.
              </p>
            </div>
          ) : (
            recentItems.map((item) => (
              <div
                key={item.barang_id || item.id}
                className="
                  bg-white
                  rounded-[24px]
                  p-3.5
                  border
                  border-gray-50
                  shadow-sm
                  hover:shadow-lg
                  transition-all
                  group
                  w-full
                "
              >
                <div className="rounded-[18px] overflow-hidden mb-3 aspect-[2.4/2.1] bg-gray-50 relative">
                  <img
                    src={this.getItemImage(item)}
                    alt={item.nama_barang}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  <div
                    className={`
                      absolute top-4 left-4 px-3 py-1 rounded-full shadow-lg shadow-black/10
                      text-[9px] font-black uppercase text-white
                      ${
                        item.status_barang === "hilang"
                          ? "bg-blue-500"
                          : item.status_barang === "ditemukan"
                          ? "bg-cyan-600"
                          : "bg-yellow-500"
                      }
                    `}
                  >
                    {item.status_barang}
                  </div>
                </div>

                <div className="px-3 pb-4">
                  <h4 className="font-bold text-[#002B5B] text-lg mb-1 truncate">
                    {item.nama_barang}
                  </h4>

                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-1 font-medium">
                    <i className="fas fa-map-marker-alt text-[#9A7D0A]"></i>
                    <span className="truncate">{item.lokasi || "-"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 text-[11px] mb-4 font-bold">
                    <i className="far fa-calendar-alt text-[#9A7D0A]"></i>
                    <span>
                      {item.jenis_laporan === "penemuan"
                        ? "Penemuan"
                        : "Hilang"}
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

        </div>
      </section>
    );
  }

  renderPickupLocation() {
    return (
      <section className="bg-[#F8FAFC] border border-gray-100 rounded-[28px] p-6 md:p-8 mb-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A7D0A] mb-2">
              Tempat Pengambilan & Penyerahan Barang
            </p>
            <h3 className="text-2xl font-extrabold text-[#002B5B] mb-2">
              Pos Keamanan Nemu IPB
            </h3>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Kampus%20IPB%20Dramaga%20Bogor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 leading-relaxed hover:text-[#002B5B] hover:underline"
            >
              Kampus IPB Dramaga, Bogor
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Kampus%20IPB%20Dramaga%20Bogor"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl px-4 py-4 border border-gray-100 hover:border-[#002B5B] transition-all"
            >
              <i className="fas fa-map-marker-alt text-[#002B5B] mb-3"></i>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Alamat
              </p>
              <p className="text-sm font-bold text-[#002B5B]">
                Kampus IPB Dramaga, Bogor
              </p>
            </a>

            <div className="bg-white rounded-2xl px-4 py-4 border border-gray-100">
              <i className="far fa-clock text-[#9A7D0A] mb-3"></i>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Jam Operasional
              </p>
              <p className="text-sm font-bold text-[#002B5B]">
                Senin - Jumat, 08.00 - 17.00 WIB
              </p>
            </div>

            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl px-4 py-4 border border-gray-100 hover:border-[#002B5B] transition-all"
            >
              <i className="fas fa-phone-alt text-[#002B5B] mb-3"></i>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                WhatsApp
              </p>
              <p className="text-sm font-bold text-[#002B5B]">
                +62 812-3456-7890
              </p>
            </a>
          </div>
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
      <>
      <UserPageLayout
        currentPath="/dashboard"
        isSidebarExpanded={isSidebarExpanded}
        onToggleSidebar={this.toggleSidebar}
        onLogout={this.handleLogout}
        navigate={this.props.navigate}
        userRole={userRole}
        userName={userName}
        backgroundClass="bg-white"
      >

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
                  temukan kembali barang anda
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
                  Lapor Kehilangan
                </button>

                <button
                  onClick={() => this.props.navigate("/lapor-penemuan")}
                  className="bg-[#F8FAFC] text-[#002B5B] px-8 py-4 rounded-2xl font-bold flex items-center gap-3 text-sm border border-gray-100 hover:scale-105 transition-colors"
                >

                  <i className="fas fa-plus-circle"></i>
                  Lapor Penemuan

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
                        Barang Penemuan
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

          {this.renderPickupLocation()}
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

export default DashboardPage;
