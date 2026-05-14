// src/pages/DashboardPage.js

import React, { Component } from 'react';
import AuthService from '../services/AuthService';
import Sidebar from '../components/Sidebar';

class DashboardPage extends Component {
  constructor(props) {
    super(props);

    this.state = {

      // TAMBAHAN
      isSidebarExpanded: true,

      userRole: "",
      userName: "",

      recentItems: [
        {
          id: 1,
          nama: "Brown Leather Wallet",
          lokasi: "Fakultas Ekonomi (Library)",
          tgl: "24 Okt 2024",
          img: "/assets/images/wallet.jpg"
        },
        {
          id: 2,
          nama: "MacBook Air M2",
          lokasi: "Auditorium Andi Hakim Nasution",
          tgl: "23 Okt 2024",
          img: "/assets/images/macbook.jpg"
        },
        {
          id: 3,
          nama: "Seiko Wristwatch",
          lokasi: "Gymnasium IPB",
          tgl: "22 Okt 2024",
          img: "/assets/images/watch.jpg"
        },
      ]
    };
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (user) {
      this.setState({
        userRole: user.role,
        userName: user.nama || user.username
      });
    }
  }

  handleLogout = () => {
    AuthService.logout();
    window.location.reload();
  };

  // TAMBAHAN
  toggleSidebar = () => {
    this.setState({
      isSidebarExpanded: !this.state.isSidebarExpanded
    });
  };

  render() {

    const {
      isSidebarExpanded,
      userRole,
      userName,
      recentItems
    } = this.state;

    return (
      <div className="flex min-h-screen bg-white font-['Plus_Jakarta_Sans'] overflow-hidden">

        {/* SIDEBAR COMPONENT */}
        <Sidebar
          isSidebarExpanded={isSidebarExpanded}
          handleLogout={this.handleLogout}
          navigate={this.props.navigate}
        />

        {/* MAIN CONTENT */}
        <main className="flex-1 ml-20 overflow-y-auto px-6 md:px-12 py-8">

          {/* HEADER */}
          <header className="flex justify-between items-center mb-10">

            <div className="flex items-center gap-4">

              {/* Toggle */}
              <button
                onClick={this.toggleSidebar}
                className="text-[#002B5B] hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>

              <h2 className="font-bold text-[#002B5B] text-xl hidden sm:block">
                DASHBOARD
              </h2>
            </div>

            <div className="flex items-center gap-4">

              {userRole === 'admin' && (
                <button
                  onClick={() => this.props.navigate("/admin")}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-200 transition-all"
                >
                  <i className="fas fa-user-shield mr-2"></i>
                  MODE ADMIN
                </button>
              )}

              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">

                <span className="text-xs font-bold text-[#002B5B] hidden md:block">
                  {userName}
                </span>

                <div className="w-8 h-8 bg-[#002B5B]/10 rounded-full flex items-center justify-center">

                  <i className="fas fa-user text-[#002B5B] text-xs"></i>
                </div>
              </div>
            </div>
          </header>

          {/* HERO */}
          <section className="bg-white rounded-[40px] border border-gray-100 p-8 md:p-12 flex flex-col lg:flex-row items-center mb-16 shadow-sm">

            <div className="w-full lg:w-1/2 mb-10 lg:mb-0">

              <span className="bg-[#F4E3A1] text-[#9A7D0A] text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 inline-block">
                Digital Custodian
              </span>

              <h1 className="text-4xl md:text-5xl font-extrabold text-[#002B5B] leading-[1.1] mb-6">
                NEMU IPB,
                <br />

                <span className="text-[#9A7D0A] italic font-medium text-3xl md:text-4xl">
                  restore your peace.
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

                <button className="bg-[#F8FAFC] text-[#002B5B] px-8 py-4 rounded-2xl font-bold flex items-center gap-3 text-sm border border-gray-100 hover:scale-105 transition-colors">

                  <i className="fas fa-plus-circle"></i>
                  Lapor Temuan
                </button>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative">

              <div className="rounded-3xl overflow-hidden shadow-2xl">

                <img
                  src="/images/logo-ipb.png"
                  alt="IPB"
                  className="w-full h-80 object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#002B5B]/60 to-transparent"></div>
              </div>
            </div>
          </section>

          {/* ITEMS */}
          <section>

            <div className="flex justify-between items-center mb-8">

              <h3 className="text-2xl font-bold text-[#002B5B]">
                Penemuan Terbaru
              </h3>

              <button className="text-[#9A7D0A] font-bold text-sm hover:underline">
                Lihat Semua
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {recentItems.map(item => (

                <div
                  key={item.id}
                  className="bg-white rounded-[35px] p-3 border border-gray-50 shadow-sm hover:shadow-xl transition-all group"
                >

                  <div className="rounded-[30px] overflow-hidden mb-5 aspect-square bg-gray-50 relative">

                    <img
                      src={item.img}
                      alt={item.nama}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">

                      <p className="text-[10px] font-bold text-[#002B5B]">
                        {item.tgl}
                      </p>
                    </div>
                  </div>

                  <div className="px-3 pb-3">

                    <h4 className="font-bold text-[#002B5B] text-lg mb-1 truncate">
                      {item.nama}
                    </h4>

                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">

                      <i className="fas fa-map-marker-alt text-[#9A7D0A]"></i>

                      <span>{item.lokasi}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-300 text-[10px] mb-4">

                      <i className="far fa-calendar-alt text-[#9A7D0A]"></i>

                      <span>Ditemukan: {item.tgl}</span>
                    </div>

                    <button className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl text-sm font-bold group-hover:bg-[#002B5B] group-hover:text-white transition-colors">

                      Detail Barang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }
}

export default DashboardPage;