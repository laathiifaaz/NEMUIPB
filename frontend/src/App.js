import React, { Component } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import LostReportPage from "./pages/LostReportPage.jsx";
import VerificationReportPage from "./pages/VerificationReportPage.jsx";
import AdminBarangPage from "./pages/AdminBarangPage.jsx";
import KoleksiBarangPage from "./pages/KoleksiBarangPage.js";
import AuthService from "./services/AuthService";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoggedIn: AuthService.isLoggedIn(),
      currentPath: window.location.pathname,
    };
  }

  handleLoginSuccess = () => {
    this.setState({
      isLoggedIn: true,
      currentPath: "/dashboard",
    });

    window.history.pushState({}, "", "/dashboard");
  };

  handleLogout = () => {
    AuthService.logout();

    this.setState({
      isLoggedIn: false,
      currentPath: "/login",
    });

    window.history.pushState({}, "", "/login");
  };

  navigate = (path) => {
    window.history.pushState({}, "", path);

    this.setState({
      currentPath: path,
    });
  };

  renderPage() {
    const { isLoggedIn, currentPath } = this.state;
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

    // Admin dashboard
    if (currentPath === "/admin") {
      if (user.role !== "admin") {
        return <DashboardPage navigate={this.navigate} />;
      }

      return <AdminDashboardPage navigate={this.navigate} />;
    }

    // Verifikasi laporan
    if (currentPath === "/verifikasi") {
      return (
        <VerificationReportPage
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

    // Admin barang
    if (currentPath === "/admin/barang") {
      if (user.role !== "admin") {
        return <DashboardPage navigate={this.navigate} />;
      }

      return <AdminBarangPage navigate={this.navigate} />;
    }

    // fallback
    return <DashboardPage navigate={this.navigate} />;
  }

  render() {
    return <div>{this.renderPage()}</div>;
  }
}

export default App;
