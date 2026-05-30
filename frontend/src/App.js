import React, { Component } from "react";

import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import LostReportPage from "./pages/LostReportPage.jsx";
import FindReportPage from "./pages/FindReportPage";
import VerificationReportPage from "./pages/VerificationReportPage.jsx";
import AdminBarangPage from "./pages/AdminBarangPage.jsx";
import AdminVerificationPage from "./pages/AdminVerificationPage";
import KoleksiBarangPage from "./pages/KoleksiBarangPage.jsx";
import UserManagementPage from "./pages/UserManagementPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticPage.jsx";
import ClaimBarangPage from "./pages/ClaimBarangPage.jsx";
import AdminPickupHistoryPage from "./pages/AdminPickupHistoryPage.jsx";

import AuthService from "./services/AuthService";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoggedIn: AuthService.isLoggedIn(),
      currentPath: window.location.pathname,
      currentSearch: window.location.search,
      sessionExpired: false,
      sessionMessage: "",
    };
  }

  componentDidMount() {
    window.addEventListener("session-expired", this.handleSessionExpired);
    this.originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await this.originalFetch.apply(window, args);
      const requestUrl = String(args[0] || "");
      const isLoginRequest = requestUrl.includes("/auth/login");

      if (response.status === 401 && !isLoginRequest) {
        window.dispatchEvent(
          new CustomEvent("session-expired", {
            detail: "Sesi Anda sudah berakhir. Silakan login ulang.",
          })
        );
      }

      return response;
    };
  }

  componentWillUnmount() {
    window.removeEventListener("session-expired", this.handleSessionExpired);
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
  }

  handleLoginSuccess = () => {
    this.setState({
      isLoggedIn: true,
      currentPath: "/dashboard",
      currentSearch: "",
    });

    window.history.pushState({}, "", "/dashboard");
  };

  handleLogout = () => {
    AuthService.logout();

    this.setState({
      isLoggedIn: false,
      currentPath: "/login",
      currentSearch: "",
      sessionExpired: false,
      sessionMessage: "",
    });

    window.history.pushState({}, "", "/login");
  };

  handleSessionExpired = (event) => {
    AuthService.logout();

    this.setState({
      isLoggedIn: false,
      currentPath: "/login",
      currentSearch: "",
      sessionExpired: true,
      sessionMessage:
        event.detail ||
        "Sesi Anda sudah berakhir. Silakan login ulang.",
    });

    window.history.pushState({}, "", "/login");
  };

  navigate = (path) => {
    window.history.pushState({}, "", path);

    this.setState({
      currentPath: window.location.pathname,
      currentSearch: window.location.search,
    });
  };

  renderPage() {
    const { isLoggedIn, currentPath, currentSearch } = this.state;
    const user = AuthService.getCurrentUser();

    if (!isLoggedIn) {
      return <LoginPage onLoginSuccess={this.handleLoginSuccess} />;
    }

    // Dashboard utama
    if (
      currentPath === "/" ||
      currentPath === "/dashboard"
    ) {
      return <DashboardPage navigate={this.navigate} />;
    }

    // Koleksi barang
    if (currentPath === "/koleksi") {
      return <KoleksiBarangPage navigate={this.navigate} />;
    }

    if (currentPath.startsWith("/klaim/")) {
      const barangId = currentPath.split("/")[2];

      return (
        <ClaimBarangPage
          navigate={this.navigate}
          barangId={barangId}
        />
      );
    }

    // Admin dashboard
    if (currentPath === "/admin") {
      if (user.role !== "admin") {
        return <DashboardPage navigate={this.navigate} />;
      }

      return <AdminDashboardPage navigate={this.navigate} />;
    }

    // Riwayat serah terima admin
    if (currentPath === "/admin/serah-terima") {
      if (user.role !== "admin") {
        return <DashboardPage navigate={this.navigate} />;
      }

      return <AdminPickupHistoryPage navigate={this.navigate} />;
    }

    // Verifikasi laporan
    if (currentPath === "/verifikasi") {
      return (
        <VerificationReportPage
          key={`verifikasi${currentSearch}`}
          navigate={this.navigate}
          handleLogout={this.handleLogout}
        />
      );
    }

    // Lapor kehilangan
    if (currentPath === "/lapor-kehilangan") {
      return (
        <LostReportPage
          navigate={this.navigate}
          handleLogout={this.handleLogout}
        />
      );
    }

    // Lapor penemuan
    if (currentPath === "/lapor-penemuan") {
      return <FindReportPage navigate={this.navigate} />;
    }

    // Admin barang
    if (currentPath === "/admin/barang") {
      if (user.role !== "admin") {
        return <DashboardPage navigate={this.navigate} />;
      }

      return <AdminBarangPage navigate={this.navigate} />;
    }

    // User management
    if (currentPath === "/admin/users") {
      if (user.role !== "admin") {
        return <DashboardPage navigate={this.navigate} />;
      }

      return <UserManagementPage navigate={this.navigate} />;
    }

    // Admin verification
    if (currentPath === "/admin/verifikasi") {
      if (user.role !== "admin") {
        return <DashboardPage navigate={this.navigate} />;
      }

      return (
        <AdminVerificationPage
          key={`admin-verifikasi${currentSearch}`}
          navigate={this.navigate}
        />
      );
    }

    // Admin analytics
    if (currentPath === "/admin/analytics") {
      if (user.role !== "admin") {
        return <DashboardPage navigate={this.navigate} />;
      }

      return <AdminAnalyticsPage navigate={this.navigate} />;
    }

    // fallback
    return <DashboardPage navigate={this.navigate} />;
  }

  render() {
    return (
      <div>
        {this.renderPage()}

        {this.state.sessionExpired && (
          <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center px-4">
            <div className="bg-white rounded-[28px] w-full max-w-sm p-7 text-center shadow-2xl">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 text-[#002B5B] flex items-center justify-center">
                <i className="fas fa-lock text-xl"></i>
              </div>

              <h2 className="text-2xl font-extrabold text-[#002B5B] mb-2">
                Sesi Berakhir
              </h2>

              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                {this.state.sessionMessage}
              </p>

              <button
                type="button"
                onClick={() =>
                  this.setState({
                    sessionExpired: false,
                    sessionMessage: "",
                  })
                }
                className="w-full bg-[#002B5B] text-white rounded-xl px-5 py-3 text-sm font-black hover:bg-[#001f42] transition-colors"
              >
                Login Ulang
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default App;
