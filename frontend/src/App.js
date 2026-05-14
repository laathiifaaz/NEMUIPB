import React, { Component } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import LostReportPage from "./pages/LostReportPage";
import VerificationReportPage from "./pages/VerificationReportPage";
import AuthService from "./services/AuthService";


class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoggedIn: AuthService.isLoggedIn(),
      currentPath: window.location.pathname,
    };
  }

  componentDidMount() {
    const token = AuthService.getToken();

    this.setState({
      loading: true,
    });

    if (token) {
      fetch("http://127.0.0.1:8000/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            AuthService.logout();
            this.setState({ isLoggedIn: false });
          }
        })
        .catch(() => {
          AuthService.logout();
          this.setState({ isLoggedIn: false });
        });
    }
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
      currentPath: window.location.pathname,
    });
  };

  renderPage() {
    const { isLoggedIn, currentPath } = this.state;
    const user = AuthService.getCurrentUser();

    if (!isLoggedIn) {
      return <LoginPage onLoginSuccess={this.handleLoginSuccess} />;
    }

    if (currentPath === "/admin") {
      if (user.role !== "admin") {
        return <DashboardPage navigate={this.navigate} />;
      }

      return <AdminDashboardPage navigate={this.navigate} />;
    }

    if (currentPath === "/verifikasi") {
      return (
        <VerificationReportPage
          navigate={this.navigate}
          handleLogout={this.handleLogout}
        />
      );
    }

    if (currentPath === "/lapor-kehilangan") {
      return <LostReportPage navigate={this.navigate}
      handleLogout={this.handleLogout}
       />;
    }

    return <DashboardPage navigate={this.navigate} />;
  }

  render() {
    return <div>{this.renderPage()}</div>;
  }
}

export default App;