import React, { Component } from 'react';
import AuthService from '../services/AuthService';
import ModalDetail from '../components/ModalDetail';

const SidebarItem = ({ icon, label, active = false, expanded }) => (
  <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
    active ? 'text-[#002B5B] bg-blue-50/80' : 'text-gray-400 hover:bg-gray-50 hover:text-[#002B5B]'
  } ${!expanded && 'justify-center'}`}>
    <i className={`fas ${icon} text-xl`}></i>
    {expanded && <span className="font-bold text-sm">{label}</span>}
  </div>
);

const FilterOption = ({ label, selected, onClick }) => (
  <label className="flex items-center gap-3 cursor-pointer group mb-3" onClick={onClick}>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
      selected ? 'border-[#002B5B]' : 'border-gray-300 group-hover:border-[#002B5B]'
    }`}>
      {selected && <div className="w-2.5 h-2.5 bg-[#002B5B] rounded-full"></div>}
    </div>
    <span className={`text-sm font-medium ${selected ? 'text-[#002B5B]' : 'text-gray-500'}`}>{label}</span>
  </label>
);

class KoleksiBarangPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
    user: { username: '', role: '' },

    isSidebarExpanded: true,
    userRole: '',
    userName: '',

    filterStatus: 'semua',
    filterKategori: 'semua',
    searchKeyword: '',
    items: [],
    loading: true,

    filterLokasi: 'semua',
    startDate: '',
    endDate: '',

    selectedBarang: null,
    isModalOpen: false
  };
  }

  openModal = (item) => {
    this.setState({
      selectedBarang: item,
      isModalOpen: true
    });
  };

  closeModal = () => {
    this.setState({
      selectedBarang: null,
      isModalOpen: false
    });
  };

  async componentDidMount() {
    const currentUser = AuthService.getCurrentUser();
    this.setState({ user: currentUser });
    
    // Ambil data pertama kali
    await this.fetchBarang();
  }

  // FUNGSI UTAMA: Ambil data dari FastAPI
  fetchBarang = async (customParams = {}) => {
    this.setState({ loading: true });
    try {
      // Menggabungkan filter dari state dengan params tambahan
      const params = {
        status: this.state.filterStatus,
        kategori: this.state.filterKategori,
        ...customParams
      };
      
      const data = await AuthService.filterBarang(params);
      this.setState({ items: data, loading: false });
    } catch (err) {
      console.error("Gagal load barang:", err);
      this.setState({ loading: false });
    }
  }

  // Handler Pencarian
  handleSearch = async (e) => {
    if (e.key === 'Enter') {
      this.setState({ loading: true });
      try {
        const data = await AuthService.searchBarang(this.state.searchKeyword);
        this.setState({ items: data, loading: false });
      } catch (err) {
        console.error("Search error:", err);
      }
    }
  }

  handleLogout = () => {
    AuthService.logout();
    window.location.reload();
  };

  toggleSidebar = () => {
    this.setState({
      isSidebarExpanded: !this.state.isSidebarExpanded
    });
  };
  render() {
    const { 
      user,
      userRole,
      userName,
      isSidebarExpanded,
      filterStatus,
      filterKategori,
      items,
      loading
    } = this.state;

    return (
      <div className="flex min-h-screen bg-[#F8FAFC] font-['Plus_Jakarta_Sans']">
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
            <div onClick={() => this.props.navigate('koleksi')}>
              <SidebarItem 
                icon="fa-box" 
                label="Koleksi Barang" 
                expanded={isSidebarExpanded} 
              />
            </div>
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

        {/* --- MAIN --- */}
        <main className="flex-1 flex flex-col">
          <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-50">
            <div className="flex items-center gap-8">
              <h1 className="font-bold text-[#002B5B] text-lg uppercase tracking-tight">Koleksi Barang</h1>
              <div className="relative w-96">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input 
                  type="text" 
                  placeholder="Cari barang" 
                  className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-12 pr-4 text-sm outline-none"
                  value={this.state.searchKeyword}
                  onChange={(e) => this.setState({ searchKeyword: e.target.value })}
                  onKeyPress={this.handleSearch}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
                {user.role === 'admin' && (
                    <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Admin Mode</span>
                )}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#002B5B]">{user.username}</span>
                    <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-[#002B5B] border border-blue-100">
                        <i className="fas fa-user text-xs"></i>
                    </div>
                </div>
            </div>
          </header>

          <div className="p-8 flex gap-10">
            {/* PANEL FILTER */}
            <aside className="w-64 space-y-8">
                <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Kategori</h3>
                    <div className="space-y-2">
                        {['Semua', 'Elektronik', 'Alat Tulis', 'Barang Pribadi'].map(cat => (
                            <div 
                                key={cat}
                                onClick={() => {
                                    this.setState({ filterKategori: cat.toLowerCase() }, () => this.fetchBarang());
                                }}
                                className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all ${
                                    filterKategori === cat.toLowerCase() ? 'bg-[#002B5B] text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-50 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-xs font-bold">{cat}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                          Lokasi
                      </h3>

                      <select
                          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium text-gray-600 outline-none focus:border-[#002B5B]"
                          onChange={(e) => {
                              this.setState(
                                  { filterLokasi: e.target.value },
                                  () => this.fetchBarang()
                              );
                          }}
                      >
                          <option value="semua">Semua Lokasi</option>
                          <option value="Fakultas Ekonomi">Fakultas Ekonomi</option>
                          <option value="Gymnasium">Gymnasium</option>
                          <option value="Perpustakaan">Perpustakaan</option>
                          <option value="Asrama">Asrama</option>
                      </select>
                  </div>

                  <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 mt-8">
                          Rentang Tanggal
                      </h3>

                      <div className="space-y-1">
                          <input
                              type="date"
                              className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#002B5B]"
                              onChange={(e) => {
                                  this.setState({ startDate: e.target.value });
                              }}
                          />

                          <input
                              type="date"
                              className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#002B5B]"
                              onChange={(e) => {
                                  this.setState({ endDate: e.target.value });
                              }}
                          />
                      </div>
                  </div>
                <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Status</h3>
                    <FilterOption label="Semua" selected={filterStatus === 'semua'} onClick={() => this.setState({ filterStatus: 'semua' }, () => this.fetchBarang())} />
                    <FilterOption label="Dilaporkan" selected={filterStatus === 'dilaporkan'} onClick={() => this.setState({ filterStatus: 'dilaporkan' }, () => this.fetchBarang())} />
                    <FilterOption label="Ditemukan" selected={filterStatus === 'ditemukan'} onClick={() => this.setState({ filterStatus: 'ditemukan' }, () => this.fetchBarang())} />
                    <FilterOption label="Dikembalikan" selected={filterStatus === 'dikembalikan'} onClick={() => this.setState({ filterStatus: 'dikembalikan' }, () => this.fetchBarang())} />
                </div>
            </aside>

            {/* GRID BARANG */}
            <section className="flex-1">
              <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-[#002B5B]">Hasil Penelusuran</h2>
                    <p className="text-xs text-gray-400 font-medium">Ditemukan {items.length} barang di sistem</p>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><i className="fas fa-spinner fa-spin text-3xl text-[#002B5B]"></i></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-[32px] p-2 border border-gray-50 shadow-sm hover:shadow-xl transition-all group">
                      <div className="relative aspect-square rounded-[28px] overflow-hidden bg-gray-100">
                        {/* Jika ada kolom foto di DB, ganti src-nya */}
                        <img 
                            src={item.foto_url || "/assets/images/placeholder.jpg"} 
                            alt={item.nama_barang} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[8px] font-black text-white uppercase ${
                            item.status_barang === 'dilaporkan' ? 'bg-blue-500' : 
                            item.status_barang === 'ditemukan' ? 'bg-cyan-600' : 'bg-yellow-500'
                        }`}>
                          {item.status_barang}
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-[9px] font-black text-yellow-600 uppercase mb-1">{item.kategori}</p>
                        <h4 className="font-bold text-[#002B5B] text-base mb-1 truncate">{item.nama_barang}</h4>
                        <div className="flex items-center gap-2 text-gray-400 text-[10px] mb-4">
                          <i className="fas fa-map-marker-alt text-yellow-600"></i>
                          <span className="truncate">{item.lokasi}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                          <span className="text-[9px] text-gray-300 font-bold tracking-tighter">ID: #{item.id}</span>
                          <button
                            onClick={() => this.openModal(item)}
                            className="text-[10px] font-black text-[#002B5B] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            DETAIL
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
        {this.state.isModalOpen && (
          <ModalDetail
            data={this.state.selectedBarang}
            onClose={this.closeModal}
          />
        )}
          </div>
        </main>
      </div>
    );
  }
}

export default KoleksiBarangPage;