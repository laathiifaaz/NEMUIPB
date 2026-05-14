// src/App.js
import React, { Component } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KoleksiBarangPage from './pages/KoleksiBarangPage';

class App extends Component {
  state = {
    isLoggedIn: false,
    currentPage: 'dashboard'
  };

  handleLoginSuccess = () => {
    this.setState({ isLoggedIn: true });
  };

  changePage = (page) => {
    this.setState({ currentPage: page });
  };

  renderPage = () => {
    switch (this.state.currentPage) {
      case 'koleksi':
        return <KoleksiBarangPage navigate={this.changePage} />;

      case 'dashboard':
      default:
        return <DashboardPage navigate={this.changePage} />;
    }
  };

  render() {
    return (
      <div>
        {this.state.isLoggedIn ? (
          this.renderPage()
        ) : (
          <LoginPage onLoginSuccess={this.handleLoginSuccess} />
        )}
      </div>
    );
  }
}

export default App;