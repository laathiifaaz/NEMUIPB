import React, { Component } from 'react';
import AuthService from '../services/AuthService';

// Komponen Kecil untuk Item Menu Sidebar
const SidebarItem = ({ icon, label, active = false, expanded }) => (
  <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
    active ? 'text-[#002B5B] bg-blue-50/80' : 'text-gray-400 hover:bg-gray-50 hover:text-[#002B5B]'
  } ${!expanded && 'justify-center'}`}>
    <i className={`fas ${icon} text-xl`}></i>
    {expanded && <span className="font-bold text-sm">{label}</span>}
  </div>
);

class DashboardPage extends Component {
  constructor(props) {
    super(props);
        this.state = {
            
    recentItems: [
        { id: 1, nama: "Brown Leather Wallet", lokasi: "Fakultas Ekonomi (Library)", tgl: "24 Okt 2024", img: "/assets/images/wallet.jpg" },
        { id: 2, nama: "MacBook Air M2", lokasi: "Auditorium Andi Hakim Nasution", tgl: "23 Okt 2024", img: "/assets/images/macbook.jpg" },
        { id: 3, nama: "Seiko Wristwatch", lokasi: "Gymnasium IPB", tgl: "22 Okt 2024", img: "/assets/images/watch.jpg" },
    ]
    };
  }

  componentDidMount() {
    // Ambil data user yang login dari database (via AuthService)
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

  toggleSidebar = () => {
    this.setState({ isSidebarExpanded: !this.state.isSidebarExpanded });
  };

  render() {
    const { isSidebarExpanded, userRole, userName, recentItems } = this.state;

    return (
      <div className="flex min-h-screen bg-white font-['Plus_Jakarta_Sans'] overflow-hidden">
        
        {/* --- SIDEBAR --- */}
        <aside className={`${isSidebarExpanded ? 'w-72' : 'w-24'} bg-[#F8FAFC] border-r border-gray-100 flex flex-col py-8 px-4 transition-all duration-300 hidden md:flex relative`}>
          
          {/* Logo Section */}
          <div className="flex items-center gap-4 mb-12 px-2">
            <div className="min-w-[48px] h-12 bg-[#002B5B] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
               <img src="/assets/images/logo-ipb.png" alt="Logo" className="w-8 h-8 object-contain invert" />
            </div>
            {isSidebarExpanded && (
              <div className="truncate">
                <h1 className="font-bold text-[#002B5B] text-lg leading-none">NEMU IPB</h1>
                <p className="text-[10px] text-gray-400 font-bold tracking-tight">IPB LOST & FOUND</p>
              </div>
            )}
          </div>

          {/* Menu Navigasi */}
          <nav className="flex flex-col gap-2">
            <SidebarItem icon="fa-th-large" label="Beranda" active expanded={isSidebarExpanded} />
            <SidebarItem icon="fa-box" label="Koleksi Barang" expanded={isSidebarExpanded} />
            <SidebarItem icon="fa-check-circle" label="Verifikasi" expanded={isSidebarExpanded} />
            <SidebarItem icon="fa-chart-bar" label="Analitik" expanded={isSidebarExpanded} />
            
            {/* Menu Laporan Spesial */}
            <div className={`mt-4 p-4 rounded-2xl bg-white shadow-sm flex items-center justify-between border border-gray-50 cursor-pointer ${!isSidebarExpanded && 'justify-center p-3'}`}>
              <div className="flex items-center gap-4 text-[#002B5B]">
                <i className="fas fa-edit text-xl"></i>
                {isSidebarExpanded && <span className="font-bold text-sm">Laporan</span>}
              </div>
              {isSidebarExpanded && <i className="fas fa-chevron-right text-[10px] text-gray-300"></i>}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="mt-auto flex flex-col gap-4">
            <div className={`flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-[#002B5B] cursor-pointer ${!isSidebarExpanded && 'justify-center'}`}>
              <i className="far fa-question-circle text-xl"></i>
              {isSidebarExpanded && <span className="font-bold text-sm">Panduan</span>}
            </div>

            <button 
              onClick={this.handleLogout}
              className="bg-[#1D3557] text-white p-4 rounded-2xl flex items-center gap-3 justify-center font-bold hover:bg-red-800 transition-all shadow-lg shadow-blue-900/10"
            >
              <i className="fas fa-sign-out-alt"></i>
              {isSidebarExpanded && <span>Keluar</span>}
            </button>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 overflow-y-auto px-6 md:px-12 py-8">
          
          {/* Header Bar */}
          <header className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              {/* Tombol toggle sidebar untuk Tablet */}
              <button onClick={this.toggleSidebar} className="text-[#002B5B] hover:bg-gray-100 p-2 rounded-lg transition-colors">
                <i className="fas fa-bars text-xl"></i>
              </button>
              <h2 className="font-bold text-[#002B5B] text-xl hidden sm:block">DASHBOARD</h2>
            </div>

            <div className="flex items-center gap-4">
              {/* MODE ADMIN: Hanya muncul jika role dari DB adalah 'admin' */}
              {userRole === 'admin' && (
                <button onClick={() => this.props.navigate("/admin")} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-200 transition-all">
                  <i className="fas fa-user-shield mr-2"></i> MODE ADMIN
                </button>
              )}
              
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-[#002B5B] hidden md:block">{userName}</span>
                <div className="w-8 h-8 bg-[#002B5B]/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-[#002B5B] text-xs"></i>
                </div>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="bg-white rounded-[40px] border border-gray-100 p-8 md:p-12 flex flex-col lg:flex-row items-center mb-16 shadow-sm">
            <div className="w-full lg:w-1/2 mb-10 lg:mb-0">
              <span className="bg-[#F4E3A1] text-[#9A7D0A] text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 inline-block">
                Digital Custodian
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#002B5B] leading-[1.1] mb-6">
                NEMU IPB, <br/>
                <span className="text-[#9A7D0A] italic font-medium text-3xl md:text-4xl">restore your peace.</span>
              </h1>
              <p className="text-gray-400 max-w-sm mb-10 text-sm leading-relaxed font-medium">
                Sistem informasi penemuan dan kehilangan barang terpadu di lingkungan IPB University.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button className="bg-[#002B5B] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 text-sm hover:scale-105 transition-transform shadow-xl shadow-blue-900/20">
                  <i className="fas fa-search-plus"></i> Lapor Kehilangan
                </button>
                <button className="bg-[#F8FAFC] text-[#002B5B] px-8 py-4 rounded-2xl font-bold flex items-center gap-3 text-sm border border-gray-100 hover:scale-105 transition-colors">
                  <i className="fas fa-plus-circle"></i> Lapor Temuan
                </button>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative">
               <div className="rounded-3xl overflow-hidden shadow-2xl border-[8px] border-white relative group">
                  <img src="/assets/images/ipb-rect.jpg" alt="IPB" className="w-full h-72 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002B5B]/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-4">
                    <div className="bg-white/95 backdrop-blur p-4 rounded-2xl">
                      <p className="text-2xl font-black text-[#002B5B]">1.2K+</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Ditemukan</p>
                    </div>
                    <div className="bg-[#F4E3A1]/95 backdrop-blur p-4 rounded-2xl">
                      <p className="text-2xl font-black text-[#9A7D0A]">900+</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Kembali</p>
                    </div>
                  </div>
               </div>
            </div>
          </section>

                {recentItems.map(item => (
        <div key={item.id} className="bg-white rounded-[35px] p-3 border border-gray-50 shadow-sm hover:shadow-xl transition-all group">
            <div className="rounded-[30px] overflow-hidden mb-5 aspect-square bg-gray-50 relative">
            <img src={item.img} alt={item.nama} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            {/* Badge Tanggal di atas Gambar (Opsional agar lebih keren) */}
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                <p className="text-[9px] font-black text-[#002B5B] uppercase">{item.tgl}</p>
            </div>
            </div>
            
            <div className="px-3 pb-3">
            <h4 className="font-bold text-[#002B5B] text-lg mb-1 truncate">{item.nama}</h4>
            
            <div className="flex flex-col gap-1 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                <i className="fas fa-map-marker-alt text-[#9A7D0A] w-3"></i>
                <span>{item.lokasi}</span>
                </div>
                {/* Keterangan Tanggal di bawah Lokasi */}
                <div className="flex items-center gap-2 text-gray-300 text-[10px] font-medium">
                <i className="far fa-calendar-alt w-3"></i>
                <span>Dilaporkan pada {item.tgl}</span>
                </div>
            </div>

        <button className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl text-sm font-bold group-hover:bg-[#002B5B] group-hover:text-white transition-colors">
            Detail Barang
        </button>
        </div>
    </div>
    ))}

                    {/* Grid Barang Dinamis */}
            <section>
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-[#002B5B]">Penemuan Terbaru</h3>
                <button className="text-[#9A7D0A] font-bold text-sm hover:underline">Lihat Semua</button>
            </div>

            {/* Ubah baris di bawah ini: md:grid-cols-3 akan memaksa 3 kolom mulai dari layar ukuran tablet/laptop kecil */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentItems.map(item => (
                <div key={item.id} className="bg-white rounded-[35px] p-3 border border-gray-50 shadow-sm hover:shadow-xl transition-all group">
                    <div className="rounded-[30px] overflow-hidden mb-5 aspect-square bg-gray-50 relative">
                    <img src={item.img} alt={item.nama} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    
                    {/* Tambahan Keterangan Tanggal di atas gambar */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                        <p className="text-[10px] font-bold text-[#002B5B]">{item.tgl}</p>
                    </div>
                    </div>

                    <div className="px-3 pb-3">
                    <h4 className="font-bold text-[#002B5B] text-lg mb-1 truncate">{item.nama}</h4>
                    
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <i className="fas fa-map-marker-alt text-[#9A7D0A]"></i>
                        <span>{item.lokasi}</span>
                    </div>

                    {/* Tambahan Keterangan Tanggal di bawah lokasi */}
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