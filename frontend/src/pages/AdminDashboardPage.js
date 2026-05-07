import React, { Component } from "react";
import AuthService from "../services/AuthService";

const SidebarItem = ({ icon, label, active = false }) => (
  <div
    className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
      active
        ? "bg-white text-[#002B5B] shadow-sm"
        : "text-[#002B5B]/70 hover:bg-white hover:text-[#002B5B]"
    }`}
  >
    <i className={`fas ${icon}`}></i>
  </div>
);

class AdminDashboardPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      reports: [
        {
          id: "#IPB-8821",
          item: "MacBook Air M2 (Space Grey)",
          reporter: "Budi Santoso",
          status: "FOUND",
          date: "24 Okt, 2024",
        },
        {
          id: "#IPB-8819",
          item: "Canvas Tote Bag (IPB Logo)",
          reporter: "Siti Aminah",
          status: "VERIFYING",
          date: "23 Okt, 2024",
        },
        {
          id: "#IPB-8815",
          item: "Casio Scientific Calculator",
          reporter: "Andi Wijaya",
          status: "RETURNED",
          date: "22 Okt, 2024",
        },
        {
          id: "#IPB-8812",
          item: "Hydration Flask (Blue)",
          reporter: "Aina Sari",
          status: "FOUND",
          date: "21 Okt, 2024",
        },
      ],
    };
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user || user.role !== "admin") {
      alert("Akses ditolak. Halaman ini hanya untuk admin.");
      window.location.href = "/";
    }
  }

  handleBackToUserMode = () => {
    window.location.href = "/";
  };

  handleLogout = () => {
    AuthService.logout();
    window.location.href = "/";
  };

  getStatusClass(status) {
    if (status === "FOUND") {
      return "bg-[#006D8F] text-white";
    }

    if (status === "VERIFYING") {
      return "bg-blue-100 text-[#002B5B]";
    }

    if (status === "RETURNED") {
      return "bg-[#F4D35E] text-[#5C4A00]";
    }

    return "bg-gray-100 text-gray-500";
  }

  render() {
    const { reports } = this.state;

    return (
      <div className="min-h-screen bg-[#F6F7FB] font-['Plus_Jakarta_Sans'] text-[#002B5B]">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-24 bg-[#F8FAFC] border-r border-gray-100 flex flex-col items-center py-8 hidden md:flex">
            <div className="w-12 h-12 bg-[#002B5B] rounded-xl flex items-center justify-center shadow-lg mb-10">
              <img
                src="/assets/images/logo-ipb.png"
                alt="Logo"
                className="w-8 h-8 object-contain invert"
              />
            </div>

            <nav className="flex flex-col gap-4">
              <SidebarItem icon="fa-th-large" active />
              <SidebarItem icon="fa-box" />
              <SidebarItem icon="fa-shield-alt" />
              <SidebarItem icon="fa-chart-bar" />
              <SidebarItem icon="fa-users" />
            </nav>

            <div className="mt-auto flex flex-col gap-4">
              <SidebarItem icon="fa-question-circle" />

              <button
                onClick={this.handleLogout}
                className="w-12 h-12 bg-[#002B5B] text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 p-6 md:p-10 overflow-y-auto">
            {/* Header */}
            <header className="bg-white rounded-2xl px-8 py-5 flex items-center justify-between mb-8 shadow-sm">
              <div className="flex items-center gap-4">
                <h1 className="font-extrabold text-[#002B5B] text-xl">
                  NEMUIPB
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={this.handleBackToUserMode}
                  className="bg-[#002B5B] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#001f42] transition-all"
                >
                  User Mode
                </button>

                <div className="w-11 h-11 bg-[#002B5B]/10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-user-shield text-[#002B5B]"></i>
                </div>
              </div>
            </header>

            {/* Welcome + Stats */}
            <section className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
              <div>
                <h2 className="text-4xl font-extrabold text-[#002B5B] mb-2">
                  Welcome Admin’s
                </h2>
                <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
                  A view of lost and found assets across IPB University
                  campuses. High-priority verifications are highlighted.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="bg-gray-200 px-7 py-4 rounded-xl text-center">
                  <p className="text-[10px] font-black tracking-widest text-gray-500">
                    ACTIVE LOST
                  </p>
                  <p className="text-2xl font-black text-[#002B5B]">142</p>
                </div>

                <div className="bg-[#002B5B] px-7 py-4 rounded-xl text-center">
                  <p className="text-[10px] font-black tracking-widest text-white/70">
                    TOTAL FOUND
                  </p>
                  <p className="text-2xl font-black text-white">285</p>
                </div>
              </div>
            </section>

            {/* Metrics + Verification */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-[30px] p-8 shadow-sm">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-extrabold">Trends & Metrics</h3>
                    <p className="text-xs text-gray-400">
                      Lost vs Found volume (Last 30 days)
                    </p>
                  </div>

                  <div className="flex gap-4 text-xs font-bold">
                    <span>
                      <i className="fas fa-circle text-[#002B5B] mr-1"></i>
                      Lost
                    </span>
                    <span>
                      <i className="fas fa-circle text-[#F4D35E] mr-1"></i>
                      Found
                    </span>
                  </div>
                </div>

                <div className="h-64 flex items-end gap-8 px-6">
                  {[70, 85, 58, 92].map((height, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full h-48 flex items-end">
                        <div
                          className="w-full bg-[#002B5B] rounded-t-sm"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div
                          className="w-full bg-[#F7E7AA] rounded-t-sm"
                          style={{ height: `${Math.max(height - 20, 30)}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-4">
                        WK {index + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#002B5B] text-white rounded-[30px] p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-white text-[#002B5B] rounded-xl flex items-center justify-center mb-6">
                    <i className="fas fa-certificate"></i>
                  </div>

                  <h3 className="text-2xl font-medium leading-tight mb-3">
                    Identity Verification Pending
                  </h3>

                  <p className="text-sm text-white/60 leading-relaxed">
                    There are 12 claimants waiting for identity verification.
                    Quick approval keeps the system fluid.
                  </p>
                </div>

                <button className="mt-8 w-full bg-[#F4D35E] text-[#5C4A00] py-4 rounded-2xl text-xs font-black tracking-widest hover:scale-105 transition-all">
                  VERIFY CLAIMANTS
                </button>
              </div>
            </section>

            {/* Recent Reports */}
            <section className="bg-white rounded-[30px] p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-extrabold">Recent Reports</h3>

                <div className="flex gap-3">
                  <button className="w-10 h-10 bg-gray-100 rounded-xl">
                    <i className="fas fa-filter"></i>
                  </button>
                  <button className="w-10 h-10 bg-gray-100 rounded-xl">
                    <i className="fas fa-download"></i>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] text-gray-400 uppercase tracking-widest">
                      <th className="text-left py-4">ID</th>
                      <th className="text-left py-4">Item Name</th>
                      <th className="text-left py-4">Reporter</th>
                      <th className="text-left py-4">Status</th>
                      <th className="text-left py-4">Date</th>
                      <th className="text-left py-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-t border-gray-50 hover:bg-gray-50 transition-all"
                      >
                        <td className="py-5 text-xs font-bold text-gray-400">
                          {report.id}
                        </td>
                        <td className="py-5 font-bold text-[#002B5B]">
                          {report.item}
                        </td>
                        <td className="py-5 text-gray-500">
                          <span className="inline-block w-7 h-7 bg-gray-200 rounded-full mr-2 align-middle"></span>
                          {report.reporter}
                        </td>
                        <td className="py-5">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black ${this.getStatusClass(
                              report.status
                            )}`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="py-5 text-gray-500">{report.date}</td>
                        <td className="py-5">
                          <button className="bg-[#002B5B] text-white px-4 py-2 rounded-lg text-xs font-bold mr-2">
                            Verify
                          </button>
                          <button className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-xs font-bold">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-8 text-xs text-gray-500">
                <p>Showing 4 of 124 reports</p>

                <div className="flex gap-2">
                  <button className="px-5 py-3 bg-gray-100 rounded-xl font-bold">
                    Previous
                  </button>
                  <button className="px-5 py-3 bg-gray-100 rounded-xl font-bold">
                    Next
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }
}

export default AdminDashboardPage;