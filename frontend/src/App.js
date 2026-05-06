// src/App.js
import React, { Component } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

class App extends Component {
  state = { isLoggedIn: false };

  // Fungsi ini WAJIB ada dan dikirim ke LoginPage
  handleLoginSuccess = () => {
    this.setState({ isLoggedIn: true });
  };

  render() {
    return (
      <div>
        {this.state.isLoggedIn ? (
          <DashboardPage />
        ) : (
          <LoginPage onLoginSuccess={this.handleLoginSuccess} />
        )}
      </div>
    );
  }
}
export default App;