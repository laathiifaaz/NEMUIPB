import React, { Component } from "react";
import AuthService from "../../services/AuthService";

class AdminSidebar extends Component {
  handleLogout = () => {
    AuthService.logout();
    window.location.href = "/";
  };

  handleNavigate(path) {
    const { navigate } = this.props;

    if (navigate) {
      navigate(path);
    }
  }

  renderItem(icon, label, activeKey, path) {
    const { activeMenu, expanded } = this.props;
    const isActive = activeMenu === activeKey;

    return (
      <div
        onClick={() => this.handleNavigate(path)}
        className={`
          flex
          items-center
          justify-between
          h-14
          px-4
          rounded-2xl
          cursor-pointer
          relative
          overflow-hidden
          transition-colors duration-200
          ${
          isActive
            ? "bg-[#163A70] text-white shadow-md shadow-blue-100"
            : "text-gray-400 hover:bg-gray-50 hover:text-[#002B5B]"
          }
        `}
      >
        <div className="flex items-center">
          <div className="w-4 flex justify-center flex-shrink-0">
            <i className={`fas ${icon}`}></i>
          </div>

          <span
            className={`
              ml-4
              font-bold
              text-sm
              whitespace-nowrap
              ${expanded ? "opacity-100" : "opacity-0"}
              transition-opacity duration-150
            `}
          >
            {label}
          </span>
        </div>
      </div>
    );
  }

  render() {
    const { expanded = true } = this.props;

    return (
      <aside
        aria-hidden={!expanded}
        className={`
          fixed
          top-0
          left-0
          h-screen
          z-50
          ${expanded ? "w-64 px-4" : "w-0 px-0"}
          bg-[#F8FAFC]
          ${expanded ? "border-r" : "border-r-0"}
          border-gray-100
          flex
          flex-col
          py-8
          shadow-sm
          overflow-x-hidden
          ${expanded ? "pointer-events-auto" : "pointer-events-none"}
          transition-[width,padding] duration-300
        `}
      >
        <div className="flex items-center gap-4 mb-12 px-2">
          <img
            src="/images/logo-nemuipb.png"
            alt="Logo"
            className="w-12 h-12 object-contain transition-all duration-300 flex-shrink-0"
          />

          <div
            className={`
              truncate
              transition-opacity duration-200
              ${expanded ? "opacity-100" : "opacity-0"}
            `}
          >
            <h1 className="font-bold text-[#002B5B] text-lg leading-none">
              NEMU IPB
            </h1>
            <p className="text-[10px] text-gray-400 font-bold tracking-tight">
              IPB LOST & FOUND
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {this.renderItem("fa-th-large", "Beranda", "dashboard", "/admin")}
          {this.renderItem("fa-box", "Koleksi Barang", "barang", "/admin/barang")}
          {this.renderItem("fa-check-circle", "Verifikasi", "verifikasi", "/admin")}
          {this.renderItem("fa-chart-bar", "Analitik", "analitik", "/admin")}
          {this.renderItem("fa-users", "User Management", "users", "/admin")}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <div
            className="flex items-center h-12 px-4 text-gray-400 hover:text-[#002B5B] cursor-pointer"
          >
            <div className="w-4 flex justify-center flex-shrink-0">
              <i className="far fa-question-circle text-xl"></i>
            </div>

            <span
              className={`
                font-bold text-sm ml-3
                transition-opacity duration-200
                ${expanded ? "opacity-100" : "opacity-0"}
              `}
            >
              Panduan
            </span>
          </div>

          <button
            onClick={this.handleLogout}
            className="flex items-center h-12 w-full px-4 bg-[#1D3557] text-white rounded-2xl hover:bg-red-800 transition-colors"
          >
            <div className="w-4 flex justify-center flex-shrink-0">
              <i className="fas fa-sign-out-alt text-[14px]"></i>
            </div>

            <span
              className={`
                font-bold text-sm ml-3
                transition-opacity duration-200
                ${expanded ? "opacity-100" : "opacity-0"}
              `}
            >
              Keluar
            </span>
          </button>
        </div>
      </aside>
    );
  }
}

export default AdminSidebar;
