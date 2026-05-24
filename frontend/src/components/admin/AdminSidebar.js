import React, { Component } from "react";
import AuthService from "../../services/AuthService";
import GuidePopup from "../GuidePopup";

class AdminSidebar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hoverExpanded: false,
      showGuidePopup: false,
    };
  }

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
    const { activeMenu } = this.props;
    const expanded = this.getExpanded();
    const isActive = activeMenu === activeKey;

    return (
      <div
        onClick={() => this.handleNavigate(path)}
        className={`
      flex
      items-center
      ${expanded ? "justify-between" : "justify-center"}
      h-14
      ${expanded ? "px-4" : "px-0"}
      rounded-2xl
          cursor-pointer
          relative
          overflow-hidden
          transition-colors duration-200
          ${
          isActive
            ? "bg-[#163A70] text-white shadow-sm"
            : "text-gray-500 hover:bg-[#EEF4FB] hover:text-[#002B5B]"
          }
        `}
      >
        <div className={`flex items-center ${expanded ? "" : "justify-center w-full"}`}>
          <div className="w-5 flex justify-center flex-shrink-0">
            <i className={`fas ${icon}`}></i>
          </div>

          <span
            className={`
              font-bold
              text-sm
              whitespace-nowrap
              overflow-hidden
              ${expanded ? "ml-4 max-w-40 opacity-100" : "ml-0 max-w-0 opacity-0"}
              transition-all duration-150
            `}
          >
            {label}
          </span>
        </div>
      </div>
    );
  }

  getExpanded() {
    return Boolean(this.props.expanded || this.state.hoverExpanded);
  }

  render() {
    const expanded = this.getExpanded();

    return (
      <aside
        aria-hidden={!expanded}
        onMouseEnter={() => this.setState({ hoverExpanded: true })}
        onMouseLeave={() => this.setState({ hoverExpanded: false })}
        className={`
          fixed
          top-0
          left-0
          h-screen
          z-50
          ${expanded ? "w-64 px-4" : "w-16 px-2"}
          bg-white
          border-r
          border-[#D9E2EF]
          flex
          flex-col
          py-8
          shadow-[4px_0_24px_rgba(15,39,71,0.06)]
          overflow-x-hidden
          pointer-events-auto
          transition-[width,padding] duration-300
        `}
      >
        <div className="flex items-center gap-4 mb-12 px-1">
          <img
            src="/images/logo-nemuipb.png"
            alt="Logo"
            className="w-14 h-14 object-contain transition-all duration-300 flex-shrink-0"
          />

          <div
            className={`
              truncate
              transition-opacity duration-200
              ${expanded ? "opacity-100" : "opacity-0"}
            `}
          >
            <h1 className="font-extrabold text-[#002B5B] text-xl leading-none">
              NEMU IPB
            </h1>
            <p className="text-xs text-[#56708F] font-extrabold tracking-tight mt-1">
              IPB LOST & FOUND
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {this.renderItem("fa-th-large", "Beranda", "dashboard", "/admin")}
          {this.renderItem("fa-box", "Koleksi Barang", "barang", "/admin/barang")}
          {this.renderItem(
            "fa-check-circle",
            "Verifikasi",
            "verification",
            "/admin/verifikasi"
          )}
          {this.renderItem("fa-chart-bar", "Analitik", "analitik", "/admin")}
          {this.renderItem(
            "fa-users",
            "Daftar Admin",
            "users",
            "/admin/users"
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <div
            onClick={() => this.setState({ showGuidePopup: true })}
            className={`flex items-center h-12 rounded-2xl text-gray-500 hover:text-[#002B5B] hover:bg-[#EEF4FB] cursor-pointer transition-colors ${expanded ? "px-4" : "justify-center px-0"}`}
          >
            <div className="w-5 flex justify-center flex-shrink-0">
              <i className="far fa-question-circle text-xl"></i>
            </div>

            <span
              className={`
                font-bold text-sm whitespace-nowrap overflow-hidden
                transition-all duration-200
                ${expanded ? "ml-3 max-w-32 opacity-100" : "ml-0 max-w-0 opacity-0"}
              `}
            >
              Panduan
            </span>
          </div>

          <button
            onClick={this.handleLogout}
            className={`flex items-center h-12 w-full bg-[#1D3557] text-white rounded-2xl hover:bg-red-800 transition-colors ${expanded ? "px-4" : "justify-center px-0"}`}
          >
            <div className="w-5 flex justify-center flex-shrink-0">
              <i className="fas fa-sign-out-alt text-[14px]"></i>
            </div>

            <span
              className={`
                font-bold text-sm whitespace-nowrap overflow-hidden
                transition-all duration-200
                ${expanded ? "ml-3 max-w-32 opacity-100" : "ml-0 max-w-0 opacity-0"}
              `}
            >
              Keluar
            </span>
          </button>
        </div>

        <GuidePopup
          open={this.state.showGuidePopup}
          variant="admin"
          onClose={() => this.setState({ showGuidePopup: false })}
        />
      </aside>
    );
  }
}

export default AdminSidebar;
