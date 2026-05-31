import React, { Component } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import PageFooter from "../components/PageFooter";
import AuthService from "../services/AuthService";
import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

class PanduanPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSidebarExpanded: getStoredSidebarExpanded(),
    };
  }

  handleLogout = () => {
    AuthService.logout();
    window.location.reload();
  };

  toggleSidebar = () => {
    this.setState((prevState) => {
      const isSidebarExpanded = !prevState.isSidebarExpanded;
      setStoredSidebarExpanded(isSidebarExpanded);

      return { isSidebarExpanded };
    });
  };

  renderGuideCard = (icon, title, description, steps, color) => {
    return (
      <div className="bg-white rounded-[30px] border border-[#E7ECF3] p-8 shadow-sm hover:shadow-xl transition-all duration-300">

        <div className="flex items-start gap-5 mb-6">

          <div
            className={`
              w-16 h-16 rounded-3xl flex items-center justify-center text-2xl
              ${color}
            `}
          >
            <i className={`fas ${icon}`}></i>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-[#002B5B] mb-2">
              {title}
            </h2>

            <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
              {description}
            </p>
          </div>

        </div>

        <div className="flex flex-col gap-4 mt-8">

          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-4 bg-[#F8FAFC] border border-[#EEF2F7] rounded-2xl p-5"
            >

              <div className="w-9 h-9 rounded-full bg-[#002B5B] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>

              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {step}
              </p>

            </div>
          ))}

        </div>

      </div>
    );
  };

  render() {
    const { isSidebarExpanded } = this.state;

    return (
      <div className="flex min-h-screen bg-[#F5F7FB] font-['Plus_Jakarta_Sans'] overflow-hidden">

        {/* SIDEBAR */}
        <Sidebar
          expanded={isSidebarExpanded}
          currentPath="/panduan"
          handleLogout={this.handleLogout}
          navigate={this.props.navigate}
        />

        {/* MAIN */}
        <main
          className={`
            flex-1 overflow-y-auto px-6 md:px-10 py-8
            transition-[margin] duration-300
            ${isSidebarExpanded ? "ml-64" : "ml-16"}
          `}
        >

          <PageHeader
            onToggleSidebar={this.toggleSidebar}
            navigate={this.props.navigate}
          />

          {/* HERO */}
          <section className="bg-white rounded-[40px] border border-gray-100 p-10 md:p-14 shadow-sm mb-10 overflow-hidden relative">

            <div className="absolute right-0 top-0 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-60"></div>

            <div className="relative z-10 max-w-4xl">

              <span className="bg-[#F4E3A1] text-[#9A7D0A] text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 inline-block">
                Panduan Pengguna
              </span>

              <h1 className="text-5xl font-extrabold text-[#002B5B] leading-tight mb-5">
                Panduan Penggunaan
                <br />
                <span className="text-[#9A7D0A] italic font-medium text-4xl">
                  Sistem NEMU IPB
                </span>
              </h1>

              <p className="text-gray-500 max-w-2xl leading-relaxed text-sm md:text-base font-medium">
                Halaman ini membantu pengguna memahami cara menggunakan fitur
                pelaporan kehilangan dan penemuan barang secara mudah, cepat,
                dan terintegrasi di lingkungan IPB University.
              </p>

            </div>

          </section>

          {/* GUIDE GRID */}
          <div className="grid grid-cols-1 gap-8 mb-10">

            {this.renderGuideCard(
              "fa-user-circle",
              "Masuk ke Sistem",
              "Masuk menggunakan akun yang sudah terdaftar untuk mengakses seluruh fitur sistem.",
              [
                "Buka halaman login NEMU IPB.",
                "Masukkan email dan password akun Anda.",
                "Tekan tombol Masuk untuk masuk ke dashboard sistem.",
                "Jika login berhasil, Anda akan diarahkan ke halaman dashboard user.",
              ],
              "bg-[#EDF4FF] text-[#1B4D9B]"
            )}

            {this.renderGuideCard(
              "fa-search-minus",
              "Membuat Laporan Kehilangan",
              "Gunakan fitur ini ketika Anda kehilangan barang di lingkungan IPB.",
              [
                "Buka menu Laporan pada sidebar.",
                "Pilih submenu Kehilangan.",
                "Isi detail barang seperti nama, kategori, deskripsi, lokasi, dan tanggal kehilangan.",
                "Unggah foto atau bukti visual jika tersedia.",
                "Tekan tombol Kirim Laporan lalu tunggu verifikasi admin.",
                "Pantau status laporan hingga disetujui atau ditolak.",
              ],
              "bg-[#FFF1F1] text-[#D1495B]"
            )}

            {this.renderGuideCard(
              "fa-search-plus",
              "Membuat Laporan Penemuan",
              "Gunakan fitur ini ketika Anda menemukan barang milik orang lain.",
              [
                "Buka menu Laporan pada sidebar.",
                "Pilih submenu Penemuan.",
                "Isi detail barang yang ditemukan dengan informasi yang jelas.",
                "Tambahkan lokasi serta tanggal barang ditemukan.",
                "Unggah foto barang agar mudah dikenali.",
                "Kirim laporan lalu tunggu verifikasi admin.",
                "Setelah laporan disetujui admin, buka detail laporan untuk melihat kode dropoff dan gunakan saat menyerahkan barang ke Pos Keamanan NEMU IPB.",
              ],
              "bg-[#EEFCEB] text-[#2D9C44]"
            )}

            {this.renderGuideCard(
              "fa-hand-holding",
              "Klaim Barang",
              "Gunakan klaim jika barang ditemukan di koleksi sesuai dengan barang hilang milikmu.",
              [
                "Pastikan kamu sudah punya laporan kehilangan yang disetujui admin.",
                "Buka Koleksi Barang lalu pilih barang berstatus ditemukan.",
                "Buka detail barang dan pilih laporan kehilangan yang sesuai.",
                "Klik Ajukan Klaim untuk mengirim permohonan ke admin.",
                "Kirim klaim dan tunggu verifikasi admin.",
                "Jika klaim disetujui, kamu akan menerima kode pickup untuk pengambilan barang di Pos Keamanan NEMU IPB.",
              ],
              "bg-[#FFF8E5] text-[#C89B00]"
            )}

          </div>

          {/* TIPS */}
          <section className="bg-[#002B5B] rounded-[35px] p-10 text-white mb-10 relative overflow-hidden shadow-xl shadow-blue-900/20">

            <div className="absolute -right-10 -top-10 w-52 h-52 bg-white/10 rounded-full"></div>
            <div className="absolute right-32 bottom-0 w-24 h-24 bg-white/10 rounded-full"></div>

            <div className="relative z-10">

              <div className="flex items-center gap-4 mb-6">

                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                  <i className="fas fa-lightbulb"></i>
                </div>

                <div>
                  <h2 className="text-3xl font-extrabold">
                    Tips Penggunaan
                  </h2>

                  <p className="text-blue-100 text-sm mt-1">
                    Tingkatkan kemungkinan barang ditemukan kembali.
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <i className="fas fa-camera text-2xl mb-4"></i>

                  <h3 className="font-bold text-lg mb-2">
                    Foto Jelas
                  </h3>

                  <p className="text-sm text-blue-100 leading-relaxed">
                    Gunakan foto barang yang jelas dan mudah dikenali.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <i className="fas fa-map-marker-alt text-2xl mb-4"></i>

                  <h3 className="font-bold text-lg mb-2">
                    Lokasi Rinci
                  </h3>

                  <p className="text-sm text-blue-100 leading-relaxed">
                    Tambahkan lokasi yang spesifik agar pencarian lebih mudah.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <i className="fas fa-file-alt text-2xl mb-4"></i>

                  <h3 className="font-bold text-lg mb-2">
                    Informasi Lengkap
                  </h3>

                  <p className="text-sm text-blue-100 leading-relaxed">
                    Isi deskripsi barang dengan detail ciri-ciri unik.
                  </p>
                </div>

              </div>

            </div>

          </section>

          <PageFooter />

        </main>

      </div>
    );
  }
}

export default PanduanPage;
