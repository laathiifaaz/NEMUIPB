import React, { Component } from "react";

import AuthService from "../services/AuthService";
import AdminSidebar from "../components/admin/AdminSidebar";
import PageHeader from "../components/PageHeader";
import PageFooter from "../components/PageFooter";

import {
  getStoredSidebarExpanded,
  setStoredSidebarExpanded,
} from "../utils/sidebarState";

import { API_BASE_URL } from "../config/api";

class UserManagementPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSidebarExpanded: getStoredSidebarExpanded(),
      admins: [],
      filteredAdmins: [],
      currentAdmin: null,
      loadingAdmins: true,
      search: "",
      error: null,
    };
  }

  async componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user || user.role !== "admin") {
      this.goToUserMode();
      return;
    }

    this.setState({
      currentAdmin: user,
    });

    await this.fetchAdmins();
  }

  goToUserMode = () => {
    if (this.props.navigate) {
      this.props.navigate("/dashboard");
    } else {
      window.location.href = "/dashboard";
    }
  };

  fetchAdmins = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`);
      const data = await response.json();
      const admins = Array.isArray(data)
        ? data.filter((item) => item.role === "admin")
        : [];

      this.setState({
        admins,
        filteredAdmins: admins,
        loadingAdmins: false,
      });
    } catch (error) {
      console.error(error);

      this.setState({
        error: "Tidak dapat memuat data admin",
        loadingAdmins: false,
      });
    }
  };

  toggleSidebar = () => {
    this.setState((prevState) => {
      const isSidebarExpanded = !prevState.isSidebarExpanded;

      setStoredSidebarExpanded(isSidebarExpanded);

      return {
        isSidebarExpanded,
      };
    });
  };

  handleSearch = (event) => {
    const search = event.target.value;
    const keyword = search.toLowerCase();

    const filteredAdmins = this.state.admins.filter(
      (admin) =>
        admin.nama?.toLowerCase().includes(keyword) ||
        admin.email?.toLowerCase().includes(keyword) ||
        String(admin.user_id).includes(keyword)
    );

    this.setState({
      search,
      filteredAdmins,
    });
  };

  getStatusBadge(status) {
    return status
      ? "bg-[#EEFDF3] text-[#0F9F4B]"
      : "bg-[#FFF1F1] text-[#D92D20]";
  }

  formatLoginTime(value) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  render() {
    const {
      isSidebarExpanded,
      filteredAdmins,
      currentAdmin,
      loadingAdmins,
      error,
    } = this.state;

    const currentAdminRecord = filteredAdmins.find(
      (admin) => String(admin.user_id) === String(currentAdmin?.user_id)
    );

    return (
      <div className="min-h-screen bg-[#F6F7FB] font-['Plus_Jakarta_Sans'] text-[#002B5B]">
        <div className="flex min-h-screen">
          <AdminSidebar
            activeMenu="users"
            expanded={isSidebarExpanded}
            navigate={this.props.navigate}
          />

          <main
            className={`
              flex-1 p-6 md:p-10 overflow-y-auto
              transition-[margin] duration-300
              ${isSidebarExpanded ? "ml-64" : "ml-16"}
            `}
          >
            <PageHeader
              onToggleSidebar={this.toggleSidebar}
              navigate={this.props.navigate}
              profileIcon="fa-user-shield"
              actions={
                <button
                  type="button"
                  onClick={this.goToUserMode}
                  className="bg-[#002B5B] hover:bg-[#001f42] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 transition-all"
                >
                  <i className="fas fa-user mr-2"></i>
                  Mode Pengguna
                </button>
              }
            />

            <section className="mb-8">
              <h2 className="text-4xl font-extrabold mb-2">
                Daftar Admin
              </h2>

              <p className="text-gray-500 text-sm max-w-xl">
                Menampilkan daftar admin pada sistem NEMU IPB.
              </p>
            </section>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold">
                {error}
              </div>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div className="bg-white rounded-[24px] p-6 border border-[#E7ECF3] shadow-sm">
                <p className="text-sm text-gray-400 mb-2">Total Admin</p>

                <h2 className="text-3xl font-bold text-[#1B4D9B]">
                  {filteredAdmins.length}
                </h2>
              </div>

              <div className="bg-white rounded-[24px] p-6 border border-[#E7ECF3] shadow-sm">
                <p className="text-sm text-gray-400 mb-2">Hak Akses</p>

                <h2 className="text-3xl font-bold text-[#102348]">
                  Admin
                </h2>
              </div>
            </section>

            <section className="bg-white rounded-[28px] border border-[#E7ECF3] shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-[#EEF2F6]">
                <h3 className="text-xl font-bold text-[#102348]">
                  Log Akun Admin Masuk
                </h3>

                <p className="text-sm text-gray-400 mt-1">
                  Menampilkan akun admin yang sedang aktif pada sesi ini.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F9FBFD] text-left">
                    <tr className="text-sm text-gray-500">
                      <th className="px-6 py-4 font-semibold">Admin</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Peran</th>
                      <th className="px-6 py-4 font-semibold">Waktu Masuk</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="border-t border-[#F1F4F8]">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-[#EAF2FF] flex items-center justify-center text-[#1B4D9B] font-bold">
                            {(currentAdminRecord?.nama || currentAdmin?.username || "A").charAt(0)}
                          </div>

                          <div>
                            <p className="font-bold text-[#102348]">
                              {currentAdminRecord?.nama || currentAdmin?.username || "-"}
                            </p>
                            <p className="text-xs text-gray-400">
                              ID: {currentAdmin?.user_id || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {currentAdminRecord?.email || currentAdmin?.email || "-"}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600 capitalize">
                        {currentAdmin?.role || "-"}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {this.formatLoginTime(currentAdmin?.admin_login_time)}
                      </td>

                      <td className="px-6 py-5">
                        <span className="px-4 py-2 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB]">
                          Sedang Masuk
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-[28px] border border-[#E7ECF3] shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-[#EEF2F6] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-[#102348]">
                    Daftar Admin
                  </h3>

                  <p className="text-sm text-gray-400 mt-1">
                    Akun admin yang terdaftar.
                  </p>
                </div>

                <div className="relative w-full md:w-[320px]">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>

                  <input
                    type="text"
                    placeholder="Cari admin..."
                    value={this.state.search}
                    onChange={this.handleSearch}
                    className="w-full border border-[#E5EAF2] rounded-2xl px-4 py-3 pl-11 outline-none focus:border-[#163A70]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F9FBFD] text-left">
                    <tr className="text-sm text-gray-500">
                      <th className="px-6 py-4 font-semibold">Nama</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">No HP</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loadingAdmins ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center py-10 text-gray-400"
                        >
                          Memuat admin...
                        </td>
                      </tr>
                    ) : filteredAdmins.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center py-10 text-gray-400"
                        >
                          Tidak ada admin
                        </td>
                      </tr>
                    ) : (
                      filteredAdmins.map((admin) => (
                        <tr
                          key={admin.user_id}
                          className="border-t border-[#F1F4F8] hover:bg-[#FAFCFF] transition-all"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-[#EAF2FF] flex items-center justify-center text-[#1B4D9B] font-bold">
                                {admin.nama?.charAt(0)}
                              </div>

                              <div>
                                <p className="font-bold text-[#102348]">
                                  {admin.nama}
                                </p>

                                <p className="text-xs text-gray-400">
                                  ID: {admin.user_id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-600">
                            {admin.email}
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-600">
                            {admin.no_hp || "-"}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`
                                px-4 py-2 rounded-full text-xs font-bold
                                ${this.getStatusBadge(admin.status_akun)}
                              `}
                            >
                              {admin.status_akun ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <PageFooter />
          </main>
        </div>
      </div>
    );
  }
}

export default UserManagementPage;
