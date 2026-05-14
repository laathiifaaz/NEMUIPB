import React, { Component } from "react";
import AuthService from "../../services/AuthService";

class AdminSidebar extends Component {
  handleLogout = () => {
    AuthService.logout();
    window.location.href = "/";
  };

  renderItem(icon, label, activeKey, path) {
    const { activeMenu, expanded, navigate } = this.props;
    const isActive = activeMenu === activeKey;

    return (
      <div
        onClick={() => navigate && navigate(path)}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all ${
          isActive
            ? "bg-white text-[#002B5B] font-extrabold shadow-sm"
            : "text-[#4B5F7A] hover:bg-white hover:text-[#002B5B]"
        } ${!expanded && "justify-center px-0"}`}
      >
        <i className={`fas ${icon} text-lg w-6 text-center`}></i>
        {expanded && <span className="text-sm font-bold">{label}</span>}
      </div>
    );
  }

  render() {
    const { expanded = true } = this.props;

    return (
      <aside
        className={`${
          expanded ? "w-72 px-6" : "w-24 px-4"
        } min-h-screen bg-[#F3F7FB] border-r border-gray-100 flex flex-col py-8 transition-all duration-300 hidden md:flex`}
      >
        <div
          className={`flex items-center gap-4 mb-10 ${
            !expanded && "justify-center"
          }`}
        >
          <div className="min-w-[48px] h-12 bg-[#002B5B] rounded-xl flex items-center justify-center shadow-lg">
            <img
              src="/assets/images/logo-ipb.png"
              alt="Logo"
              className="w-8 h-8 object-contain invert"
            />
          </div>

          {expanded && (
            <div className="truncate">
              <h1 className="font-extrabold text-[#002B5B] text-lg leading-none">
                NEMU IPB
              </h1>
              <p className="text-[10px] text-gray-400 font-bold">
                IPB LOST & FOUND
              </p>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-2">
          {this.renderItem("fa-th-large", "Beranda", "dashboard", "/admin")}
          {this.renderItem("fa-box", "Koleksi Barang", "barang", "/admin/barang")}
          {this.renderItem("fa-check-circle", "Verifikasi", "verifikasi", "/admin")}
          {this.renderItem("fa-chart-bar", "Analitik", "analitik", "/admin")}
          {this.renderItem("fa-users", "User Management", "users", "/admin")}
        </nav>

        <div className="mt-auto border-t border-gray-200 pt-6 flex flex-col gap-4">
          <div
            className={`flex items-center gap-4 px-4 py-3 text-[#4B5F7A] ${
              !expanded && "justify-center px-0"
            }`}
          >
            <i className="far fa-question-circle text-lg w-6 text-center"></i>
            {expanded && <span className="text-sm font-bold">Panduan</span>}
          </div>

          <button
            onClick={this.handleLogout}
            className={`bg-[#002B5B] text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-all ${
              !expanded && "px-0"
            }`}
          >
            <i className="fas fa-sign-out-alt"></i>
            {expanded && <span className="ml-2">Keluar</span>}
          </button>
        </div>
      </aside>
    );
  }
}

export default AdminSidebar;