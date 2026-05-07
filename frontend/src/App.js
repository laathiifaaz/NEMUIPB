import React, { Component } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
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

  navigate = (path) => {
    this.setState({ currentPath: path });
    window.history.pushState({}, "", path);
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

    return <DashboardPage navigate={this.navigate} />;
  }

  render() {
    return <div>{this.renderPage()}</div>;
  }
}

export default App;