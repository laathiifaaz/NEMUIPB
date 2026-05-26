import React, { Component } from "react";
import GuidePopup from "./GuidePopup";

const SidebarItem = ({
  icon,
  label,
  active = false,
  expanded,
  onClick,
  hasDropdown = false,
  dropdownOpen = false,
}) => (
  <div
    onClick={onClick}
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
        active
          ? "bg-[#163A70] text-white shadow-sm"
          : "text-gray-500 hover:bg-[#EEF4FB] hover:text-[#002B5B]"
      }
    `}
  >
    <div className={`flex items-center ${expanded ? "" : "justify-center w-full"}`}>
      {/* ICON */}
      <div className="w-5 flex justify-center flex-shrink-0">
        <i className={`fas ${icon}`}></i>
      </div>

      {/* TEXT */}
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

    {/* DROPDOWN ICON */}
    {hasDropdown && expanded && (
      <i
        className={`
          fas
          ${dropdownOpen ? "fa-chevron-up" : "fa-chevron-down"}
          text-xs
          transition-all
        `}
      ></i>
    )}
  </div>
);

class Sidebar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      hoverExpanded: false,
      laporanDropdown: false,
      showGuidePopup: false,
    };
  }

  isControlledExpanded() {
    return (
      typeof this.props.expanded === "boolean" ||
      typeof this.props.isSidebarExpanded === "boolean"
    );
  }

  getExpanded() {
    const hoverExpanded = this.state.hoverExpanded;

    if (typeof this.props.expanded === "boolean") {
      return this.props.expanded || hoverExpanded;
    }

    if (typeof this.props.isSidebarExpanded === "boolean") {
      return this.props.isSidebarExpanded || hoverExpanded;
    }

    return this.state.expanded || hoverExpanded;
  }

  setHoverExpanded(expanded) {
    this.setState({
      hoverExpanded: expanded,
      expanded: this.isControlledExpanded() ? this.state.expanded : expanded,
    });
  }

  handleNavigate(path) {
    if (this.props.navigate) {
      this.props.navigate(path);
    }
  }

  render() {
  const expanded = this.getExpanded();

  const currentPath =
    this.props.currentPath || window.location.pathname;

  const autoOpenLaporan =
    currentPath === "/lapor-kehilangan" ||
    currentPath === "/lapor-penemuan";

  const laporanDropdown =
    this.state.laporanDropdown || autoOpenLaporan;

    return (
      <aside
        aria-hidden={!expanded}
        onMouseEnter={() => this.setHoverExpanded(true)}
        onMouseLeave={() => this.setHoverExpanded(false)}
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
        {/* LOGO */}
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
            <h1
              onClick={() => this.handleNavigate("/dashboard")}
              className="font-extrabold text-[#002B5B] text-[18px] leading-[1.05] cursor-pointer whitespace-nowrap"
            >
              NEMU IPB
            </h1>

            <p className="text-[9px] text-[#56708F] font-extrabold uppercase tracking-wide mt-1 leading-[1.05] whitespace-nowrap">
              Lost and Found
            </p>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex flex-col gap-2">
          {/* BERANDA */}
          <div onClick={() => this.handleNavigate("/dashboard")}>
            <SidebarItem
              icon="fa-th-large"
              label="Beranda"
              expanded={expanded}
              active={currentPath === "/dashboard"}
            />
          </div>

          {/* KOLEKSI */}
          <div onClick={() => this.handleNavigate("/koleksi")}>
            <SidebarItem
              icon="fa-box"
              label="Koleksi Barang"
              expanded={expanded}
              active={currentPath === "/koleksi"}
            />
          </div>

          {/* VERIFIKASI */}
          <div onClick={() => this.handleNavigate("/verifikasi")}>
            <SidebarItem
              icon="fa-check-circle"
              label="Verifikasi"
              expanded={expanded}
              active={currentPath === "/verifikasi"}
            />
          </div>

          {/* DROPDOWN LAPORAN */}
          <SidebarItem
            icon="fa-file-alt"
            label="Laporan"
            expanded={expanded}
            hasDropdown={true}
            dropdownOpen={laporanDropdown}
            active={
              currentPath === "/lapor-kehilangan" ||
              currentPath === "/lapor-penemuan"
            }
            onClick={() =>
              this.setState({
                laporanDropdown: !laporanDropdown,
              })
            }
          />

          {/* DROPDOWN CONTENT */}
          {laporanDropdown && expanded && (
            <div className="ml-6 flex flex-col gap-1 mt-1">

              <div
                onClick={() => this.handleNavigate("/lapor-kehilangan")}
                className={`
                  flex items-center px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all
                  ${
                    currentPath === "/lapor-kehilangan"
                      ? "bg-[#163A70] text-white shadow-sm"
                      : "text-gray-500 hover:bg-[#EEF4FB] hover:text-[#002B5B]"
                  }
                `}
              >
                <i className="fas fa-search-minus w-4 mr-3"></i>
                Kehilangan
              </div>

              <div
                onClick={() => this.handleNavigate("/lapor-penemuan")}
                className={`
                  flex items-center px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all
                  ${
                    currentPath === "/lapor-penemuan"
                      ? "bg-[#163A70] text-white shadow-sm"
                      : "text-gray-500 hover:bg-[#EEF4FB] hover:text-[#002B5B]"
                  }
                `}
              >
                <i className="fas fa-search-plus w-4 mr-3"></i>
                Penemuan
              </div>

            </div>
          )}
        </nav>

        {/* FOOTER */}
        <div className="mt-auto flex flex-col gap-2">
          {/* PANDUAN */}
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


          {/* LOGOUT */}
          <button
            onClick={this.props.handleLogout}
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
          onClose={() => this.setState({ showGuidePopup: false })}
        />
      </aside>
    );
  }
}

export default Sidebar;
