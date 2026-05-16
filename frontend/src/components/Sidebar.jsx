import React, { Component } from "react";

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
      justify-between
      h-14
      px-4
      rounded-2xl
      cursor-pointer
      relative
      overflow-hidden
      transition-colors duration-200

      ${
        active
          ? "bg-[#163A70] text-white shadow-md shadow-blue-100"
          : "text-gray-400 hover:bg-gray-50 hover:text-[#002B5B]"
      }
    `}
  >
    <div className="flex items-center">
      {/* ICON */}
      <div className="w-4 flex justify-center flex-shrink-0">
        <i className={`fas ${icon}`}></i>
      </div>

      {/* TEXT */}
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
      laporanDropdown: false,
    };
  }

  isControlledExpanded() {
    return (
      typeof this.props.expanded === "boolean" ||
      typeof this.props.isSidebarExpanded === "boolean"
    );
  }

  getExpanded() {
    if (typeof this.props.expanded === "boolean") {
      return this.props.expanded;
    }

    if (typeof this.props.isSidebarExpanded === "boolean") {
      return this.props.isSidebarExpanded;
    }

    return this.state.expanded;
  }

  setHoverExpanded(expanded) {
    if (!this.isControlledExpanded()) {
      this.setState({ expanded });
    }
  }

  handleNavigate(path) {
    if (this.props.navigate) {
      this.props.navigate(path);
    }
  }

  render() {
    const expanded = this.getExpanded();
    const { laporanDropdown } = this.state;
    const currentPath = this.props.currentPath || window.location.pathname;

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
        {/* LOGO */}
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
            <h1
              onClick={() => this.handleNavigate("/dashboard")}
              className="font-bold text-[#002B5B] text-lg leading-none cursor-pointer"
            >
              NEMU IPB
            </h1>

            <p className="text-[10px] text-gray-400 font-bold tracking-tight">
              IPB LOST & FOUND
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
          <SidebarItem
            icon="fa-box"
            label="Koleksi Barang"
            expanded={expanded}
          />

          {/* VERIFIKASI */}
          <div onClick={() => this.handleNavigate("/verifikasi")}>
            <SidebarItem
              icon="fa-check-circle"
              label="Verifikasi"
              expanded={expanded}
              active={currentPath === "/verifikasi"}
            />
          </div>

          {/* ANALITIK */}
          <SidebarItem
            icon="fa-chart-bar"
            label="Analitik"
            expanded={expanded}
          />

          {/* DROPDOWN LAPORAN */}
          <SidebarItem
            icon="fa-file-alt"
            label="Laporan"
            expanded={expanded}
            hasDropdown={true}
            dropdownOpen={laporanDropdown}
            active={
              currentPath === "/lapor-kehilangan" ||
              currentPath === "/laporan-penemuan"
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
                      ? "bg-[#163A70] text-white shadow-md shadow-blue-100"
                      : "text-gray-500 hover:bg-gray-100 hover:text-[#002B5B]"
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
                      ? "bg-[#163A70] text-white shadow-md shadow-blue-100"
                      : "text-gray-500 hover:bg-gray-100 hover:text-[#002B5B]"
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
          <div className="flex items-center h-12 px-4 text-gray-400 hover:text-[#002B5B] cursor-pointer">
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


          {/* LOGOUT */}
          <button
            onClick={this.props.handleLogout}
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

export default Sidebar;
