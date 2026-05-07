import React, { Component } from 'react';
import AuthService from '../services/AuthService';

class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = { username: '', password: '', loading: false, error: null };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

    // Di dalam handleLogin di LoginPage.js
    handleLogin = async (e) => {
      e.preventDefault();
      try {
        const result = await AuthService.login(this.state.username, this.state.password);
        
        // Kalau ini tidak dipanggil, halaman tidak akan pindah!
        this.props.onLoginSuccess(); 
        
      } catch (err) {
        alert("Login Gagal: " + err.message);
      }
    };

  render() {
    return (
      <div className="flex min-h-screen font-sans">
          {/* SISI KIRI: BACKGROUND HERO */}
          <div className="hidden lg:flex w-[60%] relative p-20 flex-col justify-end overflow-hidden">
            {/* Gambar Background */}
            <img 
              src="/assets/images/ipb-background.jpg" 
              alt="IPB Campus" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay agar teks tetap kontras */}
            <div className="absolute inset-0 bg-[#002B5B]/40"></div>
            
            {/* Container Teks - Diubah jadi text-left dan items-start */}
            <div className="relative z-10 text-white flex flex-col items-start text-left w-full">
              <h1 className="text-6xl font-extrabold leading-[1.1] mb-6 drop-shadow-lg font-['Plus_Jakarta_Sans']">
                Selamat Datang<br/>di NEMU IPB
              </h1>
              <p className="text-xl opacity-90 max-w-xl font-medium leading-relaxed font-['Plus_Jakarta_Sans']">
                Platform terpusat untuk sistem barang hilang dan ditemukan di Universitas IPB. Aman, efisien, dan andal.
              </p>
            </div>
          </div>

        {/* SISI KANAN: LOGIN AREA */}
        <div className="w-full lg:w-[40%] bg-white flex flex-col p-12 relative">
          
          {/* Header Logo */}
          <div className="flex items-center gap-3 mb-20">
            <div className="w-12 h-12 bg-[#002B5B] rounded-lg flex items-center justify-center p-2">
              <img src="/assets/images/logo-ipb.png" alt="IPB" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-extrabold text-[#002B5B] text-lg leading-none">NEMU IPB</h2>
              <p className="text-[10px] font-bold text-gray-400 tracking-tighter">IPB LOST & FOUND</p>
            </div>
          </div>

          {/* Form Utama */}
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <h3 className="text-3xl font-extrabold text-[#002B5B] text-center mb-10">Login NEMU IPB</h3>
            
            <form onSubmit={this.handleLogin} className="space-y-6">
                {/* Input Username - Label dipaksa ke kiri */}
                <div className="space-y-2 text-left"> 
                  <label className="text-sm font-semibold text-gray-600 block ml-1 font-['Plus_Jakarta_Sans']">
                    ID Pengguna
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input 
                      name="username" 
                      type="text" 
                      onChange={this.handleChange}
                      className="w-full bg-gray-50 border border-gray-100 py-3 pl-12 pr-4 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all font-['Plus_Jakarta_Sans']"
                      placeholder="Username"
                    />
                  </div>
                </div>

              {/* Input Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-600">Password</label>
                  <a href="#" className="text-[10px] font-bold text-gray-400 hover:text-blue-900">Lupa kata sandi?</a>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input 
                    name="password" type="password" onChange={this.handleChange}
                    className="w-full bg-gray-50 border border-gray-100 py-3 pl-12 pr-4 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 text-blue-900 focus:ring-blue-900" />
                <label className="text-sm text-gray-400 font-medium">Remember me</label>
              </div>

              {/* Submit Button */}
              <button 
                  type="submit"
                  disabled={this.state.loading}
                  className="w-full bg-[#003366] hover:bg-[#002244] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-lg disabled:opacity-50 font-['Plus_Jakarta_Sans']"
                >
                  {this.state.loading ? (
                    "Memproses..."
                  ) : (
                    <>
                      <span>Masuk</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
            </form>
          </div>

          {/* Footer Copyright */}
          <div className="text-center text-[10px] font-medium text-gray-400 mt-auto">
            © 2026 IPB University. All rights reserved.
          </div>
        </div>
      </div>
    );
  }
}

export default LoginPage;