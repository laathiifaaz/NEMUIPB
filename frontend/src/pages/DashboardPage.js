import React, { Component } from 'react';

class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recentItems: [
        { id: 1, nama: "Brown Leather Wallet", lokasi: "Fakultas Ekonomi (Library)", tgl: "Oct 24, 2024", img: "/assets/images/wallet.jpg" },
        { id: 2, nama: "MacBook Air M2", lokasi: "Auditorium Andi Hakim Nasution", tgl: "Oct 23, 2024", img: "/assets/images/macbook.jpg" },
        { id: 3, nama: "Seiko Wristwatch", lokasi: "Gymnasium IPB", tgl: "Oct 22, 2024", img: "/assets/images/watch.jpg" },
      ]
    };
  }

  render() {
    return (
      <div className="flex min-h-screen bg-white font-['Plus_Jakarta_Sans']">
        
        {/* SIDEBAR (Kiri) */}
        <aside className="w-20 border-r border-gray-100 flex flex-col items-center py-8 gap-10">
          <img src="/assets/images/logo-ipb.png" alt="Logo" className="w-10 h-10 object-contain" />
          
          <nav className="flex flex-col gap-8 text-gray-400">
            <button className="text-[#002B5B] bg-blue-50 p-3 rounded-xl"><i className="fas fa-th-large text-xl"></i></button>
            <button className="hover:text-[#002B5B]"><i className="fas fa-box text-xl"></i></button>
            <button className="hover:text-[#002B5B]"><i className="fas fa-check-circle text-xl"></i></button>
            <button className="hover:text-[#002B5B]"><i className="fas fa-chart-bar text-xl"></i></button>
            <button className="hover:text-[#002B5B]"><i className="fas fa-cog text-xl"></i></button>
          </nav>

          <div className="mt-auto flex flex-col gap-6 text-gray-400">
            <button className="hover:text-[#002B5B]"><i className="fas fa-question-circle text-xl"></i></button>
            <button className="text-red-400 hover:text-red-600"><i className="fas fa-sign-out-alt text-xl"></i></button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto px-12 py-8">
          
          {/* Top Bar */}
          <header className="flex justify-between items-center mb-10">
            <h2 className="font-bold text-[#002B5B] text-xl">NEMU IPB</h2>
            <div className="flex items-center gap-4">
              <button className="bg-[#1D3557] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md">Mode Admin</button>
              <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-gray-100 flex items-center justify-center overflow-hidden">
                <i className="fas fa-user text-gray-500"></i>
              </div>
            </div>
          </header>

          {/* HERO SECTION */}
          <section className="relative bg-white rounded-[40px] border border-gray-50 p-12 flex items-center mb-16 overflow-hidden shadow-sm">
            <div className="w-1/2 z-10">
              <span className="bg-[#F4E3A1] text-[#9A7D0A] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest mb-6 inline-block">
                Digital Custodian System
              </span>
              <h1 className="text-5xl font-extrabold text-[#002B5B] leading-tight mb-4">
                NEMU IPB, <br/>
                <span className="text-[#9A7D0A] italic font-medium">restore your peace.</span>
              </h1>
              <p className="text-gray-500 max-w-sm mb-10 text-sm leading-relaxed">
                Tempat resmi untuk mencari dan melaporkan barang hilang di IPB University. Kami bantu kamu menemukan kembali barangmu.
              </p>
              
              <div className="flex gap-4">
                <button className="bg-[#002B5B] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm">
                   <i className="fas fa-search text-xs"></i> Laporkan Barang Hilang
                </button>
                <button className="bg-[#E5E7EB] text-[#002B5B] px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm">
                   <i className="fas fa-plus text-xs"></i> Laporkan Barang Penemuan
                </button>
              </div>
            </div>

            <div className="w-1/2 relative">
               <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl transform translate-x-10">
                  <img src="/assets/images/ipb-rect.jpg" alt="Rektorat IPB" className="w-full h-80 object-cover" />
                  {/* Stats Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-4">
                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-sm">
                      <p className="text-2xl font-black text-[#002B5B]">1,284</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Barang Ditemukan</p>
                    </div>
                    <div className="bg-[#F4E3A1]/90 backdrop-blur-sm p-3 rounded-2xl shadow-sm">
                      <p className="text-2xl font-black text-[#9A7D0A]">942</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Barang Dikembalikan</p>
                    </div>
                  </div>
               </div>
            </div>
          </section>

          {/* SECTION: Penemuan Terbaru */}
          <section>
            <div className="flex justify-between items-end mb-8">
              <h3 className="text-3xl font-extrabold text-[#002B5B]">Penemuan Terbaru</h3>
              <button className="text-[#002B5B] text-sm font-bold flex items-center gap-2 hover:underline">
                Lihat Semua Barang <i className="fas fa-arrow-right"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {this.state.recentItems.map(item => (
                <div key={item.id} className="group cursor-pointer">
                  <div className="rounded-[30px] overflow-hidden mb-4 shadow-md bg-gray-100 aspect-square">
                    <img src={item.img} alt={item.nama} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <h4 className="font-bold text-lg text-[#002B5B] mb-1">{item.nama}</h4>
                  <p className="text-gray-400 text-xs flex items-center gap-1 mb-1">
                    <i className="fas fa-map-marker-alt"></i> {item.lokasi}
                  </p>
                  <p className="text-gray-400 text-[10px] flex items-center gap-1 mb-4">
                    <i className="fas fa-calendar"></i> Oct 24, 2024
                  </p>
                  <button className="w-full border border-gray-100 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-[#002B5B] hover:text-white transition-all">
                    Lihat Detail
                  </button>
                </div>
              ))}
            </div>
          </section>

          <footer className="mt-20 pt-8 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-gray-300">
            <span className="text-[#002B5B]">NEMU IPB</span>
            <span>© 2026 IPB University. All rights reserved.</span>
          </footer>
        </main>
      </div>
    );
  }
}

export default DashboardPage;