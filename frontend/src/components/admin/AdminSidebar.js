import React, { Component } from "react";
import AuthService from "../../services/AuthService";

class AdminSidebar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hoverExpanded: false,
      verificationOpen: false,
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

  toggleVerificationMenu = () => {
    if (!this.getExpanded()) {
      this.handleNavigate("/admin/verifikasi");
      return;
    }

    this.setState((prevState) => ({
      verificationOpen: !prevState.verificationOpen,
    }));
  };

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
        <div
          className={`flex items-center ${
            expanded ? "" : "justify-center w-full"
          }`}
        >
          <div className="w-5 flex justify-center flex-shrink-0">
            <i className={`fas ${icon}`}></i>
          </div>

          <span
            className={`
              font-bold
              text-sm
              whitespace-nowrap
              overflow-hidden
              ${
                expanded
                  ? "ml-4 max-w-40 opacity-100"
                  : "ml-0 max-w-0 opacity-0"
              }
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

  renderVerificationMenu() {
    const { activeMenu } = this.props;
    const expanded = this.getExpanded();
    const isActive = activeMenu === "verification";
    const activeView =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("view") || "laporan"
        : "laporan";
    const isOpen = expanded && (this.state.verificationOpen || isActive);

    const subItems = [
      { label: "Laporan", view: "laporan", path: "/admin/verifikasi?view=laporan" },
      { label: "Klaim Barang", view: "klaim", path: "/admin/verifikasi?view=klaim" },
    ];

    return (
      <div>
        <button
          type="button"
          onClick={this.toggleVerificationMenu}
          className={`
            flex
            items-center
            ${expanded ? "justify-between" : "justify-center"}
            h-14
            w-full
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
          <div
            className={`flex items-center ${
              expanded ? "" : "justify-center w-full"
            }`}
          >
            <div className="w-5 flex justify-center flex-shrink-0">
              <i className="fas fa-check-circle"></i>
            </div>

            <span
              className={`
                font-bold
                text-sm
                whitespace-nowrap
                overflow-hidden
                ${
                  expanded
                    ? "ml-4 max-w-40 opacity-100"
                    : "ml-0 max-w-0 opacity-0"
                }
                transition-all duration-150
              `}
            >
              Verifikasi
            </span>
          </div>

          {expanded && (
            <i
              className={`fas fa-chevron-down text-[10px] transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            ></i>
          )}
        </button>

        {isOpen && (
          <div className="mt-2 ml-9 flex flex-col gap-2">
            {subItems.map((item) => {
              const isSubActive = activeView === item.view;

              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => this.handleNavigate(item.path)}
                  className={`text-left rounded-xl px-4 py-3 min-h-11 text-sm font-bold leading-tight transition-colors ${
                    isSubActive
                      ? "bg-[#EAF2FF] text-[#163A70]"
                      : "text-gray-500 hover:bg-[#F5F7FB] hover:text-[#163A70]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
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
        <div className="grid grid-cols-[48px_1fr] items-center gap-3 mb-12 px-1 h-12">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden flex-shrink-0 translate-y-[10px]">
            <img
              src="/images/logo-nemuipb.png"
              alt="Logo"
              className="w-12 h-12 object-contain block"
            />
          </div>

          <div
            className={`
              min-w-0 flex h-10 flex-col justify-center
              transition-opacity duration-200
              ${expanded ? "opacity-100" : "opacity-0"}
            `}
          >
            <h1 className="font-extrabold text-[#002B5B] text-[18px] leading-[1.05] whitespace-nowrap">
              NEMU IPB
            </h1>

            <p className="text-[9px] text-[#56708F] font-extrabold uppercase tracking-wide mt-1 leading-[1.05] whitespace-nowrap">
              Lost and Found
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {this.renderItem(
            "fa-th-large",
            "Beranda",
            "dashboard",
            "/admin"
          )}

          {this.renderItem(
            "fa-box",
            "Koleksi Barang",
            "barang",
            "/admin/barang"
          )}

          {this.renderVerificationMenu()}

          {this.renderItem(
            "fa-chart-bar",
            "Analitik",
            "analitik",
            "/admin/analytics"
          )}

          {this.renderItem(
            "fa-users",
            "Daftar Admin",
            "users",
            "/admin/users"
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={this.handleLogout}
            className={`flex items-center h-12 w-full bg-[#1D3557] text-white rounded-2xl hover:bg-red-800 transition-colors ${
              expanded ? "px-4" : "justify-center px-0"
            }`}
          >
            <div className="w-5 flex justify-center flex-shrink-0">
              <i className="fas fa-sign-out-alt text-[14px]"></i>
            </div>

            <span
              className={`
                font-bold text-sm whitespace-nowrap overflow-hidden
                transition-all duration-200
                ${
                  expanded
                    ? "ml-3 max-w-32 opacity-100"
                    : "ml-0 max-w-0 opacity-0"
                }
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
